grant select, insert on table public.play_records to authenticated;
grant select on table public.medal_transactions to authenticated;
grant select, insert, update on table public.counter_settings to authenticated;
grant select on table public.shop_asset_details to authenticated;

revoke update, delete on table public.play_records from authenticated;
revoke insert, update, delete on table public.medal_transactions from authenticated;
revoke delete on table public.counter_settings from authenticated;

notify pgrst, 'reload schema';
