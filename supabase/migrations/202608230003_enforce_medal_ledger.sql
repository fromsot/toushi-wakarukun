drop policy if exists shops_insert_own on public.shops;
create policy shops_insert_own on public.shops
for insert to authenticated
with check ((select auth.uid()) = user_id and medal = 0);

revoke update on table public.shops from authenticated;
grant update (
  name, address, memo, rate, exchange_type, rental, exchange,
  prize_unit, replay_limit, official_url, pworld_url, x_url,
  event_days, reset_tendency, carryover_tendency
) on table public.shops to authenticated;

create or replace function public.validate_play_record_shop_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.shop_id is not null and not exists (
    select 1 from public.shops
    where id = new.shop_id and user_id = new.user_id
  ) then
    raise exception '稼働履歴の店舗所有者が一致しません';
  end if;
  return new;
end;
$$;

create trigger play_records_validate_shop_owner
before insert or update of shop_id, user_id on public.play_records
for each row execute function public.validate_play_record_shop_owner();

notify pgrst, 'reload schema';
