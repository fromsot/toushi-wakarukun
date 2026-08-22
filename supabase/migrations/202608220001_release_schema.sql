create extension if not exists pgcrypto;

alter table public.shops add column if not exists official_url text;
alter table public.shops add column if not exists pworld_url text;
alter table public.shops add column if not exists x_url text;
alter table public.shops add column if not exists event_days jsonb not null default '[]'::jsonb;
alter table public.shops add column if not exists reset_tendency text;
alter table public.shops add column if not exists carryover_tendency text;
alter table public.shops add column if not exists updated_at timestamptz not null default now();

update public.shops set rental = 1000 / rate where rental is null and rate > 0;
update public.shops set exchange = 1000 / rate
where exchange is null and exchange_type = 'equal' and rate > 0;
update public.shops set medal = 0 where medal is null;
update public.shops set prize_unit = 200 where prize_unit is null;

alter table public.shops alter column name set not null;
alter table public.shops alter column medal set not null;
alter table public.shops alter column rate set not null;
alter table public.shops alter column rental set not null;
alter table public.shops alter column exchange set not null;
alter table public.shops alter column prize_unit set not null;

alter table public.shops add constraint shops_medal_nonnegative check (medal >= 0);
alter table public.shops add constraint shops_rate_positive check (rate > 0);
alter table public.shops add constraint shops_rental_positive check (rental > 0);
alter table public.shops add constraint shops_exchange_positive check (exchange > 0);
alter table public.shops add constraint shops_prize_unit_positive check (prize_unit > 0);
alter table public.shops add constraint shops_replay_limit_nonnegative
check (replay_limit is null or replay_limit >= 0);
alter table public.shops add constraint shops_event_days_array
check (jsonb_typeof(event_days) = 'array');

create unique index shops_user_normalized_name_uidx
on public.shops (user_id, lower(btrim(name)));

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger shops_set_updated_at before update on public.shops
for each row execute function public.set_updated_at();

alter table public.shops enable row level security;
drop policy if exists "Users can view own shops" on public.shops;
drop policy if exists "Users can insert own shops" on public.shops;
drop policy if exists "Users can update own shops" on public.shops;
drop policy if exists "Users can delete own shops" on public.shops;
create policy shops_select_own on public.shops
for select to authenticated using ((select auth.uid()) = user_id);
create policy shops_insert_own on public.shops
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy shops_update_own on public.shops for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy shops_delete_own on public.shops
for delete to authenticated using ((select auth.uid()) = user_id);

create table public.play_records (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    shop_id bigint references public.shops(id) on delete set null,
    shop_name_snapshot text not null,
    played_on date not null,
    machine text not null,
    record_version smallint not null default 2 check (record_version in (1, 2)),
    start_medal bigint check (start_medal >= 0),
    end_medal bigint check (end_medal >= 0),
    medal_delta bigint generated always as (end_medal - start_medal) stored,
    cash_investment bigint not null default 0 check (cash_investment >= 0),
    cash_lent_medal numeric(14, 2) not null default 0 check (cash_lent_medal >= 0),
    cashable_delta_yen bigint not null default 0,
    rate_snapshot numeric check (rate_snapshot > 0),
    rental_snapshot numeric check (rental_snapshot > 0),
    exchange_snapshot numeric check (exchange_snapshot > 0),
    prize_unit_snapshot bigint check (prize_unit_snapshot > 0),
    replay_limit_snapshot bigint check (replay_limit_snapshot is null or replay_limit_snapshot >= 0),
    profit bigint not null,
    hours numeric(8, 2) not null default 0 check (hours >= 0),
    expected bigint,
    legacy_payload jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint play_records_v2_required_fields check (
        record_version = 1 or (
            start_medal is not null and end_medal is not null and
            rate_snapshot is not null and rental_snapshot is not null and
            exchange_snapshot is not null and prize_unit_snapshot is not null
        )
    )
);

create index play_records_user_played_on_idx
on public.play_records (user_id, played_on desc);
create index play_records_shop_id_idx on public.play_records (shop_id);
create trigger play_records_set_updated_at before update on public.play_records
for each row execute function public.set_updated_at();

alter table public.play_records enable row level security;
create policy play_records_select_own on public.play_records
for select to authenticated using ((select auth.uid()) = user_id);
create policy play_records_insert_own on public.play_records
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy play_records_update_own on public.play_records for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy play_records_delete_own on public.play_records
for delete to authenticated using ((select auth.uid()) = user_id);

create table public.medal_transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    shop_id bigint not null references public.shops(id) on delete restrict,
    type text not null check (type in ('play','withdraw','manual_adjustment','rollback')),
    amount bigint not null,
    balance_before bigint not null check (balance_before >= 0),
    balance_after bigint not null check (balance_after >= 0),
    related_record_id uuid references public.play_records(id) on delete set null,
    note text,
    created_at timestamptz not null default now(),
    constraint medal_transactions_balance_matches
    check (balance_after = balance_before + amount)
);

create index medal_transactions_user_created_at_idx
on public.medal_transactions (user_id, created_at desc);
create index medal_transactions_shop_created_at_idx
on public.medal_transactions (shop_id, created_at desc);
create index medal_transactions_related_record_idx
on public.medal_transactions (related_record_id) where related_record_id is not null;

alter table public.medal_transactions enable row level security;
create policy medal_transactions_select_own on public.medal_transactions
for select to authenticated using ((select auth.uid()) = user_id);
create policy medal_transactions_insert_own on public.medal_transactions
for insert to authenticated with check ((select auth.uid()) = user_id);

create table public.counter_settings (
    user_id uuid primary key references auth.users(id) on delete cascade,
    profiles jsonb not null default '[]'::jsonb,
    active_profile integer not null default 0,
    counter_data jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);
alter table public.counter_settings enable row level security;
create policy counter_settings_select_own on public.counter_settings
for select to authenticated using ((select auth.uid()) = user_id);
create policy counter_settings_insert_own on public.counter_settings
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy counter_settings_update_own on public.counter_settings for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.medal_asset_values(
    p_medal bigint, p_exchange numeric, p_prize_unit bigint
) returns table (cashable_yen bigint, remainder_medals bigint, medals_to_next_prize bigint)
language sql immutable set search_path = public as $$
    with v as (
        select greatest(p_medal, 0) medal,
               ceil(p_exchange * p_prize_unit / 1000)::bigint unit_medals
    ), c as (
        select medal, unit_medals, floor(medal::numeric / unit_medals)::bigint blocks
        from v where p_exchange > 0 and p_prize_unit > 0
    )
    select blocks * p_prize_unit,
           medal - blocks * unit_medals,
           case when medal % unit_medals = 0 then 0
                else unit_medals - (medal % unit_medals) end
    from c
$$;

create view public.shop_asset_details with (security_invoker = true) as
select s.*, a.cashable_yen, a.remainder_medals, a.medals_to_next_prize
from public.shops s
cross join lateral public.medal_asset_values(s.medal, s.exchange, s.prize_unit) a;

create or replace function public.create_play_record_v2(
    p_shop_id bigint, p_shop_name text, p_date date, p_machine text,
    p_start_medal bigint, p_end_medal bigint, p_cash_investment bigint,
    p_cash_lent_medal numeric, p_cashable_delta_yen bigint,
    p_rate_snapshot numeric, p_rental_snapshot numeric, p_exchange_snapshot numeric,
    p_replay_limit_snapshot bigint, p_prize_unit_snapshot bigint,
    p_profit bigint, p_hours numeric, p_expected bigint, p_adjust_medal boolean
) returns public.play_records
language plpgsql security invoker set search_path = public as $$
declare
    result public.play_records;
    calculated_cashable bigint;
begin
    if p_start_medal < 0 or p_end_medal < 0 or p_cash_investment < 0 then
        raise exception '枚数と投資額は0以上で入力してください';
    end if;
    if p_rate_snapshot <= 0 or p_rental_snapshot <= 0 or
       p_exchange_snapshot <= 0 or p_prize_unit_snapshot <= 0 then
        raise exception '店舗条件が不正です';
    end if;
    calculated_cashable := sign(p_end_medal - p_start_medal) * floor(
        (abs(p_end_medal - p_start_medal)::numeric / p_exchange_snapshot * 1000) /
        p_prize_unit_snapshot
    ) * p_prize_unit_snapshot;
    if calculated_cashable <> p_cashable_delta_yen or
       calculated_cashable - p_cash_investment <> p_profit then
        raise exception '収支計算が一致しません';
    end if;
    if p_adjust_medal then
        update public.shops set medal = p_end_medal
        where id = p_shop_id and user_id = auth.uid() and medal = p_start_medal;
        if not found then raise exception '開始後に店舗残高が変更されています'; end if;
    end if;
    insert into public.play_records (
        user_id, shop_id, shop_name_snapshot, played_on, machine,
        start_medal, end_medal, cash_investment, cash_lent_medal,
        cashable_delta_yen, rate_snapshot, rental_snapshot, exchange_snapshot,
        prize_unit_snapshot, replay_limit_snapshot, profit, hours, expected
    ) values (
        auth.uid(), p_shop_id, p_shop_name, p_date, p_machine,
        p_start_medal, p_end_medal, p_cash_investment, p_cash_lent_medal,
        p_cashable_delta_yen, p_rate_snapshot, p_rental_snapshot, p_exchange_snapshot,
        p_prize_unit_snapshot, p_replay_limit_snapshot, p_profit, p_hours, p_expected
    ) returning * into result;
    if p_adjust_medal and p_end_medal <> p_start_medal then
        insert into public.medal_transactions (
            user_id, shop_id, type, amount, balance_before, balance_after,
            related_record_id, note
        ) values (
            auth.uid(), p_shop_id, 'play', p_end_medal - p_start_medal,
            p_start_medal, p_end_medal, result.id, '稼働終了による残高更新'
        );
    end if;
    return result;
end;
$$;

create or replace function public.adjust_shop_medal(
    p_shop_id bigint, p_new_balance bigint, p_type text, p_note text default null
) returns public.shops
language plpgsql security invoker set search_path = public as $$
declare target public.shops; old_balance bigint;
begin
    if p_new_balance < 0 or p_type not in ('withdraw','manual_adjustment') then
        raise exception '残高または変更種別が不正です';
    end if;
    select * into target from public.shops
    where id = p_shop_id and user_id = auth.uid() for update;
    if not found then raise exception '店舗が見つかりません'; end if;
    old_balance := target.medal;
    update public.shops set medal = p_new_balance
    where id = p_shop_id and user_id = auth.uid() returning * into target;
    if old_balance <> p_new_balance then
        insert into public.medal_transactions (
            user_id, shop_id, type, amount, balance_before, balance_after, note
        ) values (
            auth.uid(), p_shop_id, p_type, p_new_balance - old_balance,
            old_balance, p_new_balance, p_note
        );
    end if;
    return target;
end;
$$;

create or replace function public.delete_play_record(p_record_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare target public.play_records;
begin
    select * into target from public.play_records
    where id = p_record_id and user_id = auth.uid() for update;
    if not found then raise exception '稼働履歴が見つかりません'; end if;
    if target.shop_id is not null and target.start_medal <> target.end_medal then
        update public.shops set medal = target.start_medal
        where id = target.shop_id and user_id = auth.uid() and medal = target.end_medal;
        if not found then raise exception '後続の残高変更があるため安全に巻き戻せません'; end if;
        insert into public.medal_transactions (
            user_id, shop_id, type, amount, balance_before, balance_after,
            related_record_id, note
        ) values (
            auth.uid(), target.shop_id, 'rollback', target.start_medal - target.end_medal,
            target.end_medal, target.start_medal, target.id, '稼働履歴削除による巻き戻し'
        );
    end if;
    delete from public.play_records where id = p_record_id and user_id = auth.uid();
end;
$$;

revoke all on function public.create_play_record_v2(
    bigint, text, date, text, bigint, bigint, bigint, numeric, bigint,
    numeric, numeric, numeric, bigint, bigint, bigint, numeric, bigint, boolean
) from public;
grant execute on function public.create_play_record_v2(
    bigint, text, date, text, bigint, bigint, bigint, numeric, bigint,
    numeric, numeric, numeric, bigint, bigint, bigint, numeric, bigint, boolean
) to authenticated;
revoke all on function public.adjust_shop_medal(bigint, bigint, text, text) from public;
grant execute on function public.adjust_shop_medal(bigint, bigint, text, text) to authenticated;
revoke all on function public.delete_play_record(uuid) from public;
grant execute on function public.delete_play_record(uuid) to authenticated;

notify pgrst, 'reload schema';
