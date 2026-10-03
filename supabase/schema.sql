-- Outlands Build Companion: database setup.
-- Paste this whole file into Supabase → SQL Editor → New query, then Run.
-- Safe to run more than once.

create table if not exists public.templates (
  id          text        not null,
  user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  name        text        not null default '',
  data        jsonb       not null,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  primary key (user_id, id),
  constraint templates_data_size check (pg_column_size(data) < 32768),
  constraint templates_name_len check (char_length(name) <= 80)
);

create index if not exists templates_user_updated_idx
  on public.templates (user_id, updated_at desc);

-- Row-level security: each signed-in person can only see and change their own rows.
alter table public.templates enable row level security;

drop policy if exists "Read own templates" on public.templates;
create policy "Read own templates" on public.templates
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Add own templates" on public.templates;
create policy "Add own templates" on public.templates
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Change own templates" on public.templates;
create policy "Change own templates" on public.templates
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Delete own templates" on public.templates;
create policy "Delete own templates" on public.templates
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Limit how many templates one account can store.
create or replace function public.templates_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.templates where user_id = new.user_id) >= 200 then
    raise exception 'Template limit reached (200 per account)';
  end if;
  return new;
end $$;

drop trigger if exists templates_limit on public.templates;
create trigger templates_limit before insert on public.templates
  for each row execute function public.templates_limit();
