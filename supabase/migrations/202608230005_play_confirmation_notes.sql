alter table public.play_records
add column if not exists confirmation_type text,
add column if not exists confirmation_note text,
add column if not exists note text;

alter table public.play_records
add constraint play_records_confirmation_type_allowed check (
  confirmation_type is null or confirmation_type in (
    'none',
    'setting_6',
    'setting_5_6',
    'setting_4_5_6',
    'setting_3_plus',
    'setting_2_plus',
    'high_setting_behavior',
    'other'
  )
),
add constraint play_records_confirmation_note_only_for_other check (
  confirmation_type = 'other' or confirmation_note is null
);

create index play_records_user_confirmation_idx
on public.play_records (user_id, confirmation_type, played_on desc)
where confirmation_type is not null and confirmation_type <> 'none';

create or replace function public.create_play_record_v2(
  p_shop_id bigint, p_shop_name text, p_date date, p_machine text,
  p_start_medal bigint, p_end_medal bigint, p_cash_investment bigint,
  p_cash_lent_medal numeric, p_cashable_delta_yen bigint,
  p_rate_snapshot numeric, p_rental_snapshot numeric, p_exchange_snapshot numeric,
  p_replay_limit_snapshot bigint, p_prize_unit_snapshot bigint,
  p_profit bigint, p_hours numeric, p_expected bigint, p_adjust_medal boolean,
  p_confirmation_type text, p_confirmation_note text, p_note text
) returns public.play_records
language plpgsql
security definer
set search_path = public
as $$
declare result public.play_records;
begin
  if p_confirmation_type is null or p_confirmation_type not in (
    'none', 'setting_6', 'setting_5_6', 'setting_4_5_6',
    'setting_3_plus', 'setting_2_plus', 'high_setting_behavior', 'other'
  ) then
    raise exception '確定・示唆の種類が不正です';
  end if;

  if p_confirmation_type <> 'other' then
    p_confirmation_note := null;
  else
    p_confirmation_note := nullif(btrim(p_confirmation_note), '');
  end if;

  result := public.create_play_record_v2(
    p_shop_id, p_shop_name, p_date, p_machine,
    p_start_medal, p_end_medal, p_cash_investment,
    p_cash_lent_medal, p_cashable_delta_yen,
    p_rate_snapshot, p_rental_snapshot, p_exchange_snapshot,
    p_replay_limit_snapshot, p_prize_unit_snapshot,
    p_profit, p_hours, p_expected, p_adjust_medal
  );

  update public.play_records
  set confirmation_type = p_confirmation_type,
      confirmation_note = p_confirmation_note,
      note = nullif(btrim(p_note), '')
  where id = result.id and user_id = auth.uid()
  returning * into result;

  return result;
end;
$$;

revoke all on function public.create_play_record_v2(
  bigint, text, date, text, bigint, bigint, bigint, numeric, bigint,
  numeric, numeric, numeric, bigint, bigint, bigint, numeric, bigint, boolean,
  text, text, text
) from public;
grant execute on function public.create_play_record_v2(
  bigint, text, date, text, bigint, bigint, bigint, numeric, bigint,
  numeric, numeric, numeric, bigint, bigint, bigint, numeric, bigint, boolean,
  text, text, text
) to authenticated;

notify pgrst, 'reload schema';
