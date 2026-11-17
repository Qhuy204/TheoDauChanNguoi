begin;
create table public.cms_assets (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 scope text not null default 'post' check(scope in ('post','site')),
 storage_path text not null unique, mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
 size_bytes integer not null check(size_bytes between 1 and 5242880), created_at timestamptz not null default now()
);
create table public.cms_post_assets (
 post_id uuid not null references public.cms_posts(id) on delete cascade,
 asset_id uuid not null references public.cms_assets(id) on delete cascade, primary key(post_id,asset_id)
);
alter table public.cms_assets enable row level security;
alter table public.cms_post_assets enable row level security;
grant select on public.cms_assets,public.cms_post_assets to anon;
grant select,insert on public.cms_assets to authenticated;
grant select,insert,delete on public.cms_post_assets to authenticated;
create policy cms_post_assets_read on public.cms_post_assets for select to anon,authenticated using(exists(select 1 from public.cms_posts p where p.id=post_id));
create policy cms_post_assets_add on public.cms_post_assets for insert to authenticated with check (
 public.cms_role() is not null and exists(select 1 from public.cms_posts p where p.id=post_id and (p.author_id=(select auth.uid()) or public.cms_role()='admin'))
 and exists(select 1 from public.cms_assets a where a.id=asset_id and a.scope='post' and (a.owner_id=(select auth.uid()) or public.cms_role()='admin'))
);
create policy cms_post_assets_remove on public.cms_post_assets for delete to authenticated using(public.cms_role() is not null and exists(select 1 from public.cms_posts p where p.id=post_id and (p.author_id=(select auth.uid()) or public.cms_role()='admin')));
create policy cms_assets_read on public.cms_assets for select to anon,authenticated using (
 (public.cms_role() is not null and (owner_id=(select auth.uid()) or scope='site' or public.cms_role()='admin'))
 or exists(select 1 from public.cms_post_assets pa join public.cms_posts p on p.id=pa.post_id where pa.asset_id=id and p.status='published')
);
create policy cms_assets_create on public.cms_assets for insert to authenticated with check(public.cms_role() is not null and owner_id=(select auth.uid()) and split_part(storage_path,'/',1)=(select auth.uid())::text);
create policy cms_media_inline_read on storage.objects for select to anon,authenticated using(bucket_id='cms-media' and exists(select 1 from public.cms_assets a where a.storage_path=name));

create function public.cms_save_post(p_id uuid,p_updated_at timestamptz,p_title text,p_summary text,p_body text,p_status text,p_slug_base text,p_asset_ids uuid[])
returns public.cms_posts language plpgsql security invoker set search_path='' as $$
declare saved public.cms_posts; before_post public.cms_posts; asset uuid; first_path text; next_slug text; suffix integer:=1; who public.cms_profiles;
begin
 select * into who from public.cms_profiles where id=(select auth.uid()) and active;
 if not found then raise exception 'Not authorized' using errcode='42501'; end if;
 if cardinality(p_asset_ids)>50 then raise exception 'Too many images' using errcode='22023'; end if;
 foreach asset in array p_asset_ids loop
  if not exists(select 1 from public.cms_assets a where a.id=asset and a.scope='post' and (a.owner_id=who.id or who.role='admin')) then raise exception 'Image not authorized' using errcode='42501'; end if;
 end loop;
 if cardinality(p_asset_ids)>0 then select storage_path into first_path from public.cms_assets where id=p_asset_ids[1]; end if;
 if p_id is null then
  if p_slug_base !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug_base)>180 then raise exception 'Invalid slug' using errcode='22023'; end if;
  loop
   next_slug:=left(p_slug_base,180)||case when suffix=1 then '' else '-'||suffix::text end;
   insert into public.cms_posts(author_id,author_name,title,slug,summary,body,status,cover_path)
   values(who.id,who.display_name,p_title,next_slug,p_summary,p_body,p_status,first_path)
   on conflict(slug) do nothing returning * into saved;
   exit when saved.id is not null;
   suffix:=suffix+1; if suffix>1000 then next_slug:=left(p_slug_base,160)||'-'||substr(gen_random_uuid()::text,1,8); suffix:=1; p_slug_base:=next_slug; end if;
  end loop;
 else
  select * into before_post from public.cms_posts where id=p_id for update;
  if not found or (before_post.author_id<>who.id and who.role<>'admin') then raise exception 'Not authorized' using errcode='42501'; end if;
  if p_updated_at is null or before_post.updated_at<>p_updated_at then raise sqlstate 'PT409' using message='Bài viết vừa được sửa ở nơi khác. Hãy tải lại trước khi lưu.'; end if;
  update public.cms_posts set title=p_title,summary=p_summary,body=p_body,status=p_status,
   cover_path=case when first_path is not null then first_path when exists(select 1 from public.cms_post_assets where post_id=p_id) then null else before_post.cover_path end,
   cover_alt=case when first_path is not null then '' else before_post.cover_alt end
  where id=p_id returning * into saved;
 end if;
 delete from public.cms_post_assets where post_id=saved.id;
 insert into public.cms_post_assets(post_id,asset_id) select saved.id,x from unnest(p_asset_ids) x on conflict do nothing;
 return saved;
end $$;
revoke all on function public.cms_save_post(uuid,timestamptz,text,text,text,text,text,uuid[]) from public;
grant execute on function public.cms_save_post(uuid,timestamptz,text,text,text,text,text,uuid[]) to authenticated;
commit;
