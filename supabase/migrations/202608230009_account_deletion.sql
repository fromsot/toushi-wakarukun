create or replace function public.delete_current_user_account()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid := auth.uid();
begin
  if target_user_id is null then
    raise exception 'ログインが必要です';
  end if;

  delete from public.memory_tags where user_id = target_user_id;
  delete from public.memory_images where user_id = target_user_id;
  delete from public.memories where user_id = target_user_id;
  delete from public.medal_transactions where user_id = target_user_id;
  delete from public.play_records where user_id = target_user_id;
  delete from public.counter_settings where user_id = target_user_id;
  delete from public.shops where user_id = target_user_id;
  delete from auth.users where id = target_user_id;

  if not found then
    raise exception 'アカウントが見つかりません';
  end if;

  return true;
end;
$$;

revoke all on function public.delete_current_user_account() from public;
grant execute on function public.delete_current_user_account() to authenticated;

comment on function public.delete_current_user_account() is
  'Deletes the authenticated user and all application rows after Storage objects have been removed by the client.';

notify pgrst, 'reload schema';
