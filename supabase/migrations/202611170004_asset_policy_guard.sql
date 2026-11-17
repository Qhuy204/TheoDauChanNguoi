begin;
create function public.cms_can_use_asset(p_asset uuid,p_scope text) returns boolean language sql stable security definer set search_path='' as $$
 select public.cms_role() is not null and exists(select 1 from public.cms_assets a where a.id=p_asset and a.scope=p_scope and (a.owner_id=(select auth.uid()) or p_scope='site' or public.cms_role()='admin'));
$$;
revoke all on function public.cms_can_use_asset(uuid,text) from public;
grant execute on function public.cms_can_use_asset(uuid,text) to authenticated;
drop policy cms_post_assets_add on public.cms_post_assets;
create policy cms_post_assets_add on public.cms_post_assets for insert to authenticated with check(public.cms_role() is not null and exists(select 1 from public.cms_posts p where p.id=post_id and (p.author_id=(select auth.uid()) or public.cms_role()='admin')) and public.cms_can_use_asset(asset_id,'post'));
drop policy cms_site_assets_write on public.cms_site_assets;
create policy cms_site_assets_write on public.cms_site_assets for all to authenticated using(public.cms_role() is not null) with check(public.cms_can_use_asset(asset_id,'site'));
commit;
