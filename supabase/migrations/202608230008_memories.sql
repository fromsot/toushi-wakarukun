create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  memory_date date not null default current_date,
  shop_name text,
  machine_name text,
  category text not null default 'other'
    check (category in ('confirmation', 'freeze', 'premium', 'hot', 'payout', 'other')),
  note text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memory_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_id uuid not null references public.memories(id) on delete cascade,
  storage_path text not null unique,
  sort_order smallint not null default 0 check (sort_order between 0 and 4),
  created_at timestamptz not null default now(),
  unique (memory_id, sort_order)
);

create table if not exists public.memory_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_id uuid not null references public.memories(id) on delete cascade,
  tag text not null check (char_length(btrim(tag)) between 1 and 50),
  created_at timestamptz not null default now(),
  unique (memory_id, tag)
);

create index if not exists memories_user_date_idx
  on public.memories(user_id, memory_date desc, created_at desc);
create index if not exists memories_user_category_idx
  on public.memories(user_id, category, memory_date desc);
create index if not exists memories_user_favorite_idx
  on public.memories(user_id, memory_date desc) where is_favorite;
create index if not exists memory_images_memory_order_idx
  on public.memory_images(memory_id, sort_order);
create index if not exists memory_tags_user_tag_idx
  on public.memory_tags(user_id, tag);
create index if not exists memory_tags_memory_idx
  on public.memory_tags(memory_id);

create trigger memories_set_updated_at
before update on public.memories
for each row execute function public.set_updated_at();

create or replace function public.validate_memory_child()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.memories
    where id = new.memory_id and user_id = new.user_id
  ) then
    raise exception '思い出の所有者が一致しません';
  end if;
  if tg_table_name = 'memory_images'
     and (select count(*) from public.memory_images where memory_id = new.memory_id) >= 5 then
    raise exception '画像は1件につき5枚までです';
  end if;
  return new;
end;
$$;

create trigger memory_images_validate_owner
before insert or update on public.memory_images
for each row execute function public.validate_memory_child();
create trigger memory_tags_validate_owner
before insert or update on public.memory_tags
for each row execute function public.validate_memory_child();

alter table public.memories enable row level security;
alter table public.memory_images enable row level security;
alter table public.memory_tags enable row level security;

create policy memories_select_own on public.memories for select to authenticated
  using (auth.uid() = user_id);
create policy memories_insert_own on public.memories for insert to authenticated
  with check (auth.uid() = user_id);
create policy memories_update_own on public.memories for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy memories_delete_own on public.memories for delete to authenticated
  using (auth.uid() = user_id);

create policy memory_images_select_own on public.memory_images for select to authenticated
  using (auth.uid() = user_id);
create policy memory_images_insert_own on public.memory_images for insert to authenticated
  with check (auth.uid() = user_id);
create policy memory_images_update_own on public.memory_images for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy memory_images_delete_own on public.memory_images for delete to authenticated
  using (auth.uid() = user_id);

create policy memory_tags_select_own on public.memory_tags for select to authenticated
  using (auth.uid() = user_id);
create policy memory_tags_insert_own on public.memory_tags for insert to authenticated
  with check (auth.uid() = user_id);
create policy memory_tags_update_own on public.memory_tags for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy memory_tags_delete_own on public.memory_tags for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.memories to authenticated;
grant select, insert, update, delete on public.memory_images to authenticated;
grant select, insert, update, delete on public.memory_tags to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memory-images', 'memory-images', false, 2097152,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy memory_images_storage_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'memory-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy memory_images_storage_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'memory-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy memory_images_storage_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'memory-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'memory-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy memory_images_storage_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'memory-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

notify pgrst, 'reload schema';
