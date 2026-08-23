alter table public.play_records
alter column hours drop not null;

notify pgrst, 'reload schema';
