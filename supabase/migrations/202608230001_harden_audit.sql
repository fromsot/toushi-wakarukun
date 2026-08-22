-- Keep balance-changing audit rows authoritative by allowing writes only
-- through the validated RPC functions. Legacy v1 imports remain available.

drop policy if exists medal_transactions_insert_own
  on public.medal_transactions;

drop policy if exists play_records_insert_own
  on public.play_records;

create policy play_records_insert_legacy_own
on public.play_records
for insert
to authenticated
with check (
  auth.uid() = user_id
  and record_version = 1
);

drop policy if exists play_records_update_own
  on public.play_records;

drop policy if exists play_records_delete_own
  on public.play_records;

alter function public.create_play_record_v2(
  bigint, text, date, text, bigint, bigint, bigint, numeric, bigint,
  numeric, numeric, numeric, bigint, bigint, bigint, numeric, bigint, boolean
) security definer;

alter function public.adjust_shop_medal(
  bigint, bigint, text, text
) security definer;

alter function public.delete_play_record(uuid)
  security definer;

notify pgrst, 'reload schema';
