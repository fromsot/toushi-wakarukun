create or replace view public.shop_asset_details
with (security_invoker = true) as
select
  s.created_at,
  s.user_id,
  s.id,
  s.name,
  s.address,
  s.memo,
  s.medal,
  s.rate,
  s.exchange_type,
  s.rental,
  s.exchange,
  s.prize_unit,
  s.replay_limit,
  s.official_url,
  s.pworld_url,
  s.x_url,
  s.event_days,
  s.reset_tendency,
  s.carryover_tendency,
  s.updated_at,
  a.cashable_yen,
  a.remainder_medals,
  a.medals_to_next_prize,
  s.exchange_is_estimated
from public.shops s
cross join lateral public.medal_asset_values(
  s.medal,
  s.exchange,
  s.prize_unit
) a;

grant select on public.shop_asset_details to authenticated;

notify pgrst, 'reload schema';
