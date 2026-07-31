begin;

-- Roles are deliberately text + CHECK rather than an enum so a later additive
-- role can be rolled out without replacing a shared database type.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 120),
  role text not null default 'viewer'
    check (role in ('viewer', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Authorization profile. Only service-role/admin workflows may change role.';

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger create_profile_after_auth_user
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Existing accounts start as viewers. Promoting the first admin is an explicit,
-- audited service-role/SQL operation documented in SUPABASE.md.
insert into public.profiles (id, display_name)
select
  users.id,
  nullif(left(coalesce(users.raw_user_meta_data ->> 'full_name', ''), 120), '')
from auth.users as users
on conflict (id) do nothing;

create function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  );
$$;

create function public.can_manage_site_content()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('editor', 'admin')
  );
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.is_site_admin() from public;
revoke all on function public.can_manage_site_content() from public;

grant execute on function public.is_site_admin() to authenticated, service_role;
grant execute on function public.can_manage_site_content() to authenticated, service_role;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy profiles_admin_select
on public.profiles
for select
to authenticated
using ((select public.is_site_admin()));

create policy profiles_admin_insert
on public.profiles
for insert
to authenticated
with check ((select public.is_site_admin()));

create policy profiles_admin_update
on public.profiles
for update
to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));

create policy profiles_admin_delete
on public.profiles
for delete
to authenticated
using ((select public.is_site_admin()));

create table public.availability_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254),
  phone text check (phone is null or char_length(phone) <= 40),
  guests smallint not null check (guests between 1 and 20),
  check_in date not null,
  check_out date not null,
  message text check (message is null or char_length(message) <= 2000),
  locale text not null check (locale in ('en', 'it')),
  consent boolean not null check (consent),
  consent_recorded_at timestamptz not null default now(),
  source text not null default 'website' check (char_length(source) between 1 and 40),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'closed', 'spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_inquiries_valid_stay check (check_out > check_in)
);

comment on table public.availability_inquiries is
  'PII-bearing availability requests. Browser clients cannot insert or read rows.';

create index availability_inquiries_created_at_idx
on public.availability_inquiries (created_at desc);

create index availability_inquiries_status_created_at_idx
on public.availability_inquiries (status, created_at desc);

create trigger set_availability_inquiries_updated_at
before update on public.availability_inquiries
for each row execute function public.set_updated_at();

alter table public.availability_inquiries enable row level security;

revoke all on table public.availability_inquiries from anon, authenticated;
grant select, update, delete on table public.availability_inquiries to authenticated;
grant all on table public.availability_inquiries to service_role;

create policy inquiries_admin_select
on public.availability_inquiries
for select
to authenticated
using ((select public.is_site_admin()));

create policy inquiries_admin_update
on public.availability_inquiries
for update
to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));

create policy inquiries_admin_delete
on public.availability_inquiries
for delete
to authenticated
using ((select public.is_site_admin()));

create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('en', 'it')),
  path text not null check (path ~ '^/[a-z0-9/_-]*$'),
  section text not null default 'page'
    check (section ~ '^[a-z0-9_-]+$'),
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (locale, path, section)
);

create index site_content_publication_idx
on public.site_content (locale, path, status, published_at);

create trigger set_site_content_updated_at
before update on public.site_content
for each row execute function public.set_updated_at();

alter table public.site_content enable row level security;

revoke all on table public.site_content from anon, authenticated;
grant select (
  id,
  locale,
  path,
  section,
  payload,
  status,
  published_at,
  created_at,
  updated_at
) on public.site_content to anon;
grant select, insert, update, delete on table public.site_content to authenticated;
grant all on table public.site_content to service_role;

create policy site_content_public_select
on public.site_content
for select
to anon, authenticated
using (
  status = 'published'
  and (published_at is null or published_at <= now())
);

create policy site_content_manager_select
on public.site_content
for select
to authenticated
using ((select public.can_manage_site_content()));

create policy site_content_manager_insert
on public.site_content
for insert
to authenticated
with check ((select public.can_manage_site_content()));

create policy site_content_manager_update
on public.site_content
for update
to authenticated
using ((select public.can_manage_site_content()))
with check ((select public.can_manage_site_content()));

create policy site_content_manager_delete
on public.site_content
for delete
to authenticated
using ((select public.can_manage_site_content()));

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_bucket text not null default 'site-media'
    check (storage_bucket = 'site-media'),
  storage_path text not null
    check (char_length(storage_path) between 1 and 500),
  mime_type text not null
    check (mime_type in ('image/avif', 'image/jpeg', 'image/png', 'image/webp')),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  alt_text jsonb not null default '{}'::jsonb
    check (jsonb_typeof(alt_text) = 'object'),
  caption jsonb not null default '{}'::jsonb
    check (jsonb_typeof(caption) = 'object'),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create index media_assets_publication_idx
on public.media_assets (status, published_at);

create trigger set_media_assets_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

alter table public.media_assets enable row level security;

revoke all on table public.media_assets from anon, authenticated;
grant select (
  id,
  storage_bucket,
  storage_path,
  mime_type,
  width,
  height,
  alt_text,
  caption,
  status,
  published_at,
  created_at,
  updated_at
) on public.media_assets to anon;
grant select, insert, update, delete on table public.media_assets to authenticated;
grant all on table public.media_assets to service_role;

create policy media_assets_public_select
on public.media_assets
for select
to anon, authenticated
using (
  status = 'published'
  and (published_at is null or published_at <= now())
);

create policy media_assets_manager_select
on public.media_assets
for select
to authenticated
using ((select public.can_manage_site_content()));

create policy media_assets_manager_insert
on public.media_assets
for insert
to authenticated
with check ((select public.can_manage_site_content()));

create policy media_assets_manager_update
on public.media_assets
for update
to authenticated
using ((select public.can_manage_site_content()))
with check ((select public.can_manage_site_content()));

create policy media_assets_manager_delete
on public.media_assets
for delete
to authenticated
using ((select public.can_manage_site_content()));

-- The bucket is private. Public reads are granted per object only after the
-- corresponding media_assets row is published; drafts never become URL-public.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'site-media',
  'site-media',
  false,
  15728640,
  array['image/avif', 'image/jpeg', 'image/png', 'image/webp']
);

create policy site_media_public_select
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'site-media'
  and exists (
    select 1
    from public.media_assets
    where media_assets.storage_bucket = storage.objects.bucket_id
      and media_assets.storage_path = storage.objects.name
      and media_assets.status = 'published'
      and (
        media_assets.published_at is null
        or media_assets.published_at <= now()
      )
  )
);

create policy site_media_manager_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-media'
  and (select public.can_manage_site_content())
);

create policy site_media_manager_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-media'
  and (select public.can_manage_site_content())
)
with check (
  bucket_id = 'site-media'
  and (select public.can_manage_site_content())
);

create policy site_media_manager_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-media'
  and (select public.can_manage_site_content())
);

commit;
