begin;
create or replace function public.cms_publish_content(p_revision bigint,p_asset_ids uuid[]) returns public.cms_content_documents language plpgsql security invoker set search_path='' as $$
declare draft public.cms_content_documents; result public.cms_content_documents;
begin
 if public.cms_role() is null then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into draft from public.cms_content_documents where id='draft' for update;
 if draft.revision<>p_revision then raise sqlstate 'PT409' using message='Nội dung đã thay đổi. Hãy tải lại trước khi xuất bản.'; end if;
 if p_asset_ids is null then raise exception 'Image list is required' using errcode='22023'; end if;
 if exists(select 1 from unnest(p_asset_ids) x where not exists(select 1 from public.cms_assets a where a.id=x and a.scope='site')) then raise exception 'Image not authorized' using errcode='42501'; end if;
 delete from public.cms_site_assets where not(asset_id=any(p_asset_ids));
 insert into public.cms_site_assets(asset_id) select distinct x from unnest(p_asset_ids) x on conflict(asset_id) do nothing;
 update public.cms_content_documents set content=draft.content,revision=draft.revision,updated_at=now(),updated_by=(select auth.uid()) where id='published' returning * into result;
 return result;
end $$;
commit;
