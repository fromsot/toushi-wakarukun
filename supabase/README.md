# Supabase setup

The SQL files in `supabase/migrations` are linked to the current Supabase
project and have been applied in filename order.

The migration adds:

- per-user RLS policies for `shops`
- the per-user `play_records` table
- the append-only `medal_transactions` balance ledger
- the per-user `counter_settings` table
- atomic functions for creating/deleting play records and adjusting balances
- shop URL, event-day, reset-trend, and memo fields
- start/end medal totals and immutable rental/exchange/replay/prize snapshots

The `create_play_record_v2` function checks that the current shop medal balance
still matches the start-of-play snapshot before replacing it with the entered
end balance. This prevents a second device or stale session from silently
overwriting a newer balance.

The existing `shops.id` column is a `bigint` identity. `play_records.shop_id`
and `medal_transactions.shop_id` intentionally use the same type.

The migrations were transaction-tested for shop CRUD, normalized duplicate
names, play balance updates/rollback, ledger write protection, asset-value
calculation, and cross-user RLS isolation.
