begin;
create table if not exists public.cms_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  role text not null check (role in ('admin', 'teacher')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.cms_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id),
  author_name text not null check (char_length(author_name) between 1 and 120),
  title text not null check (char_length(title) between 1 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text not null default '' check (char_length(summary) <= 360),
  body text not null default '' check (char_length(body) <= 60000),
  cover_path text,
  cover_alt text not null default '' check (char_length(cover_alt) <= 240),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or (char_length(trim(body)) >= 50 and published_at is not null))
);
create index if not exists cms_posts_public_date on public.cms_posts(published_at desc) where status = 'published';
create index if not exists cms_posts_author on public.cms_posts(author_id, updated_at desc);
create or replace function public.cms_role() returns text language sql stable security definer set search_path = '' as $$
  select role from public.cms_profiles where id = (select auth.uid()) and active = true;
$$;
revoke all on function public.cms_role() from public;
grant execute on function public.cms_role() to anon, authenticated;
create or replace function public.cms_post_guard() returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' then
    if new.author_id <> old.author_id or new.id <> old.id or new.created_at <> old.created_at then
      raise exception 'Post identity cannot be changed';
    end if;
    new.updated_at := clock_timestamp();
  end if;
  if new.status = 'published' then
    new.published_at := coalesce(case when TG_OP = 'UPDATE' then old.published_at else null end, now());
  end if;
  return new;
end $$;
drop trigger if exists cms_post_guard on public.cms_posts;
create trigger cms_post_guard before insert or update on public.cms_posts for each row execute function public.cms_post_guard();
alter table public.cms_profiles enable row level security;
alter table public.cms_posts enable row level security;
revoke all on public.cms_profiles, public.cms_posts from anon, authenticated;
grant select on public.cms_posts to anon;
grant select, insert, update on public.cms_posts to authenticated;
grant select, update on public.cms_profiles to authenticated;
drop policy if exists cms_profiles_read on public.cms_profiles;
create policy cms_profiles_read on public.cms_profiles for select to authenticated using (id = (select auth.uid()) or public.cms_role() = 'admin');
drop policy if exists cms_profiles_manage on public.cms_profiles;
create policy cms_profiles_manage on public.cms_profiles for update to authenticated using (public.cms_role() = 'admin' and id <> (select auth.uid())) with check (public.cms_role() = 'admin' and id <> (select auth.uid()));
drop policy if exists cms_posts_read on public.cms_posts;
create policy cms_posts_read on public.cms_posts for select to anon, authenticated using (status = 'published' or (public.cms_role() is not null and (author_id = (select auth.uid()) or public.cms_role() = 'admin')));
drop policy if exists cms_posts_create on public.cms_posts;
create policy cms_posts_create on public.cms_posts for insert to authenticated with check (public.cms_role() is not null and author_id = (select auth.uid()));
drop policy if exists cms_posts_update on public.cms_posts;
create policy cms_posts_update on public.cms_posts for update to authenticated using (public.cms_role() is not null and (author_id = (select auth.uid()) or public.cms_role() = 'admin')) with check (public.cms_role() is not null and (author_id = (select auth.uid()) or public.cms_role() = 'admin'));
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cms-media', 'cms-media', false, 5242880, array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
drop policy if exists cms_media_read on storage.objects;
create policy cms_media_read on storage.objects for select to anon, authenticated using (bucket_id = 'cms-media' and exists (select 1 from public.cms_posts p where p.cover_path = name and (p.status = 'published' or (public.cms_role() is not null and (p.author_id = (select auth.uid()) or public.cms_role() = 'admin')))));
drop policy if exists cms_media_upload on storage.objects;
create policy cms_media_upload on storage.objects for insert to authenticated with check (bucket_id = 'cms-media' and public.cms_role() is not null and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists cms_media_delete on storage.objects;
create policy cms_media_delete on storage.objects for delete to authenticated using (bucket_id = 'cms-media' and public.cms_role() is not null and ((storage.foldername(name))[1] = (select auth.uid())::text or public.cms_role() = 'admin'));
commit;
