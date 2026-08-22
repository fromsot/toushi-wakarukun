alter table public.shops
add column if not exists exchange_is_estimated boolean not null default false;

alter table public.medal_transactions
add column if not exists cash_amount bigint not null default 0,
add column if not exists profit_effect bigint not null default 0,
add column if not exists exchange_snapshot numeric,
add column if not exists prize_unit_snapshot bigint,
add column if not exists inferred_exchange numeric;

alter table public.medal_transactions
add constraint medal_transactions_cash_amount_nonnegative check (cash_amount >= 0),
add constraint medal_transactions_exchange_snapshot_positive
  check (exchange_snapshot is null or exchange_snapshot > 0),
add constraint medal_transactions_prize_snapshot_positive
  check (prize_unit_snapshot is null or prize_unit_snapshot > 0),
add constraint medal_transactions_inferred_exchange_positive
  check (inferred_exchange is null or inferred_exchange > 0);

revoke update on table public.shops from authenticated;
grant update (
  name, address, memo, rate, exchange_type, rental, exchange,
  exchange_is_estimated, prize_unit, replay_limit, official_url,
  pworld_url, x_url, event_days, reset_tendency, carryover_tendency
) on table public.shops to authenticated;

create or replace function public.complete_medal_transaction_snapshot()
returns trigger
language plpgsql
set search_path = public
as $$
declare record_profit bigint;
begin
  if new.exchange_snapshot is null or new.prize_unit_snapshot is null then
    select exchange, prize_unit
    into new.exchange_snapshot, new.prize_unit_snapshot
    from public.shops where id = new.shop_id and user_id = new.user_id;
  end if;
  if new.related_record_id is not null and new.type in ('play', 'rollback') then
    select profit into record_profit
    from public.play_records
    where id = new.related_record_id and user_id = new.user_id;
    if new.type = 'play' then new.profit_effect := coalesce(record_profit, 0); end if;
    if new.type = 'rollback' then new.profit_effect := -coalesce(record_profit, 0); end if;
  end if;
  return new;
end;
$$;

create trigger medal_transactions_complete_snapshot
before insert on public.medal_transactions
for each row execute function public.complete_medal_transaction_snapshot();

create or replace function public.adjust_shop_medal_balance(
  p_shop_id bigint,
  p_new_balance bigint,
  p_note text default null
) returns public.medal_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.shops;
  old_cashable bigint;
  new_cashable bigint;
  result public.medal_transactions;
begin
  if auth.uid() is null then raise exception 'ログインが必要です'; end if;
  if p_new_balance < 0 then raise exception '残高は0以上で入力してください'; end if;

  select * into target from public.shops
  where id = p_shop_id and user_id = auth.uid()
  for update;
  if not found then raise exception '店舗が見つかりません'; end if;
  if target.medal = p_new_balance then raise exception '残高が変更されていません'; end if;

  select cashable_yen into old_cashable
  from public.medal_asset_values(target.medal, target.exchange, target.prize_unit);
  select cashable_yen into new_cashable
  from public.medal_asset_values(p_new_balance, target.exchange, target.prize_unit);

  update public.shops set medal = p_new_balance where id = target.id;

  insert into public.medal_transactions (
    user_id, shop_id, type, amount, balance_before, balance_after,
    cash_amount, profit_effect, exchange_snapshot, prize_unit_snapshot, note
  ) values (
    auth.uid(), target.id, 'manual_adjustment', p_new_balance - target.medal,
    target.medal, p_new_balance, 0, new_cashable - old_cashable,
    target.exchange, target.prize_unit, nullif(btrim(p_note), '')
  ) returning * into result;

  return result;
end;
$$;

create or replace function public.withdraw_shop_medals(
  p_shop_id bigint,
  p_cash_amount bigint,
  p_actual_balance bigint default null,
  p_note text default null
) returns public.medal_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.shops;
  estimated_removed bigint;
  final_balance bigint;
  actual_removed bigint;
  inferred numeric;
  result public.medal_transactions;
begin
  if auth.uid() is null then raise exception 'ログインが必要です'; end if;
  if p_cash_amount <= 0 then raise exception '換金額は0より大きい金額で入力してください'; end if;

  select * into target from public.shops
  where id = p_shop_id and user_id = auth.uid()
  for update;
  if not found then raise exception '店舗が見つかりません'; end if;
  if p_cash_amount % target.prize_unit <> 0 then
    raise exception '換金額は最小景品額の単位で入力してください';
  end if;

  estimated_removed := ceil(target.exchange * p_cash_amount / 1000)::bigint;
  final_balance := coalesce(p_actual_balance, target.medal - estimated_removed);
  if final_balance < 0 or final_balance >= target.medal then
    raise exception '換金後残高が不正です';
  end if;

  actual_removed := target.medal - final_balance;
  inferred := actual_removed::numeric / (p_cash_amount::numeric / 1000);

  update public.shops set medal = final_balance where id = target.id;

  insert into public.medal_transactions (
    user_id, shop_id, type, amount, balance_before, balance_after,
    cash_amount, profit_effect, exchange_snapshot, prize_unit_snapshot,
    inferred_exchange, note
  ) values (
    auth.uid(), target.id, 'withdraw', -actual_removed, target.medal,
    final_balance, p_cash_amount, 0, target.exchange, target.prize_unit,
    inferred, nullif(btrim(p_note), '')
  ) returning * into result;

  return result;
end;
$$;

create or replace function public.confirm_shop_exchange_rate(
  p_shop_id bigint,
  p_exchange numeric
) returns public.shops
language plpgsql
security definer
set search_path = public
as $$
declare result public.shops;
begin
  if auth.uid() is null then raise exception 'ログインが必要です'; end if;
  if p_exchange <= 0 then raise exception '交換枚数が不正です'; end if;
  update public.shops
  set exchange = p_exchange, exchange_is_estimated = false
  where id = p_shop_id and user_id = auth.uid()
  returning * into result;
  if not found then raise exception '店舗が見つかりません'; end if;
  return result;
end;
$$;

revoke all on function public.adjust_shop_medal_balance(bigint, bigint, text) from public;
grant execute on function public.adjust_shop_medal_balance(bigint, bigint, text) to authenticated;
revoke all on function public.withdraw_shop_medals(bigint, bigint, bigint, text) from public;
grant execute on function public.withdraw_shop_medals(bigint, bigint, bigint, text) to authenticated;
revoke all on function public.confirm_shop_exchange_rate(bigint, numeric) from public;
grant execute on function public.confirm_shop_exchange_rate(bigint, numeric) to authenticated;

notify pgrst, 'reload schema';
