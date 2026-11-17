begin;
create table public.cms_content_documents (
 id text primary key check(id in ('draft','published')), content jsonb not null,
 revision bigint not null default 1, updated_at timestamptz not null default now(), updated_by uuid references auth.users(id)
);
create table public.cms_site_assets(asset_id uuid primary key references public.cms_assets(id) on delete cascade);
alter table public.cms_content_documents enable row level security;
alter table public.cms_site_assets enable row level security;
grant select on public.cms_content_documents,public.cms_site_assets to anon;
grant select,update on public.cms_content_documents to authenticated;
grant select,insert,delete on public.cms_site_assets to authenticated;
create policy cms_content_read on public.cms_content_documents for select to anon,authenticated using(id='published' or public.cms_role() is not null);
create policy cms_content_write on public.cms_content_documents for update to authenticated using(public.cms_role() is not null) with check(public.cms_role() is not null);
create policy cms_site_assets_read on public.cms_site_assets for select to anon,authenticated using(true);
create policy cms_site_assets_write on public.cms_site_assets for all to authenticated using(public.cms_role() is not null) with check(public.cms_role() is not null and exists(select 1 from public.cms_assets a where a.id=asset_id and a.scope='site'));
create policy cms_site_asset_public on public.cms_assets for select to anon,authenticated using(exists(select 1 from public.cms_site_assets sa where sa.asset_id=id));
create function public.cms_publish_content(p_revision bigint,p_asset_ids uuid[]) returns public.cms_content_documents language plpgsql security invoker set search_path='' as $$
declare draft public.cms_content_documents; result public.cms_content_documents;
begin
 if public.cms_role() is null then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into draft from public.cms_content_documents where id='draft' for update;
 if draft.revision<>p_revision then raise sqlstate 'PT409' using message='Nội dung đã thay đổi. Hãy tải lại trước khi xuất bản.'; end if;
 if exists(select 1 from unnest(p_asset_ids) x where not exists(select 1 from public.cms_assets a where a.id=x and a.scope='site')) then raise exception 'Image not authorized' using errcode='42501'; end if;
 delete from public.cms_site_assets;
 insert into public.cms_site_assets(asset_id) select distinct x from unnest(p_asset_ids) x;
 update public.cms_content_documents set content=draft.content,revision=draft.revision,updated_at=now(),updated_by=(select auth.uid()) where id='published' returning * into result;
 return result;
end $$;
revoke all on function public.cms_publish_content(bigint,uuid[]) from public;
grant execute on function public.cms_publish_content(bigint,uuid[]) to authenticated;
commit;
