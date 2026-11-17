-- All test records are rolled back.
begin;
select set_config('test.cms_teacher',gen_random_uuid()::text,true);
select set_config('test.cms_other',gen_random_uuid()::text,true);
insert into auth.users(id,email) values(current_setting('test.cms_teacher')::uuid,current_setting('test.cms_teacher')||'@cms-test.invalid'),(current_setting('test.cms_other')::uuid,current_setting('test.cms_other')||'@cms-test.invalid');
insert into public.cms_profiles(id,display_name,role) values(current_setting('test.cms_teacher')::uuid,'Test teacher','teacher'),(current_setting('test.cms_other')::uuid,'Test other','teacher');
insert into public.cms_posts(author_id,author_name,title,slug,body,status) values
(current_setting('test.cms_teacher')::uuid,'Test teacher','Own draft',current_setting('test.cms_teacher')||'-draft','Test draft','draft'),
(current_setting('test.cms_other')::uuid,'Test other','Other draft',current_setting('test.cms_other')||'-draft','Test draft','draft'),
(current_setting('test.cms_other')::uuid,'Test other','Published post',current_setting('test.cms_other')||'-public',repeat('Published content ',5),'published');
set local role anon;
do $$begin if exists(select 1 from public.cms_posts where status='draft') then raise exception 'Anonymous draft exposure'; end if; end $$;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.cms_teacher'),'role','authenticated')::text,true);
do $$declare touched integer; begin
 if exists(select 1 from public.cms_posts where author_id=current_setting('test.cms_other')::uuid and status='draft') then raise exception 'Other draft exposure'; end if;
 if not exists(select 1 from public.cms_posts where author_id=current_setting('test.cms_teacher')::uuid and status='draft') then raise exception 'Own draft unavailable'; end if;
 update public.cms_profiles set role='admin' where id=current_setting('test.cms_teacher')::uuid;
 get diagnostics touched=row_count; if touched<>0 then raise exception 'Teacher self-promotion'; end if;
 update public.cms_posts set title='Forbidden change' where author_id=current_setting('test.cms_other')::uuid;
 get diagnostics touched=row_count; if touched<>0 then raise exception 'Teacher edited another author'; end if;
 update public.cms_posts set body=repeat('Allowed publication ',5),status='published' where author_id=current_setting('test.cms_teacher')::uuid;
 get diagnostics touched=row_count; if touched<>1 then raise exception 'Teacher cannot publish own post'; end if;
end $$;
do $$declare p public.cms_posts;p2 public.cms_posts;changed public.cms_content_documents;original public.cms_content_documents;own_asset uuid:=gen_random_uuid();other_asset uuid:=gen_random_uuid();base text:='kiem-tra-'||substr(gen_random_uuid()::text,1,8);begin
 insert into public.cms_assets(id,owner_id,storage_path,mime_type,size_bytes)values(own_asset,auth.uid(),auth.uid()::text||'/inline/'||own_asset::text||'.jpg','image/jpeg',10);
 p:=public.cms_save_post(null,null,'Bài có ảnh','',repeat('Nội dung kiểm tra ',5),'draft',base,array[own_asset]);
 p2:=public.cms_save_post(null,null,'Trùng tiêu đề','',repeat('Nội dung kiểm tra ',5),'draft',base,'{}');
 if p2.slug<>base||'-2' then raise exception 'Duplicate slug was not resolved'; end if;
 p:=public.cms_save_post(p.id,p.updated_at,'Đổi tiêu đề','',repeat('Nội dung kiểm tra ',5),'published','different-slug',array[own_asset]);
 if p.slug<>base then raise exception 'Existing slug changed'; end if;
 if not exists(select 1 from public.cms_post_assets where post_id=p.id and asset_id=own_asset)then raise exception 'Missing attached image';end if;
 begin perform public.cms_save_post(p.id,'2000-01-01'::timestamptz,p.title,'',p.body,'draft','unused','{}');raise exception 'Stale update accepted';exception when sqlstate 'PT409' then null;end;
 begin perform public.cms_save_post(null,null,'Unauthorized image','',repeat('Text ',20),'draft',base||'-bad',array[other_asset]);raise exception 'Unknown asset accepted';exception when insufficient_privilege then null;end;
 select * into original from public.cms_content_documents where id='draft';
 update public.cms_content_documents set revision=revision+1,content=jsonb_set(content,'{site,title}','"Nội dung thử trong transaction"')where id='draft' returning * into changed;
 perform public.cms_publish_content(changed.revision,'{}');
 if (select content->'site'->>'title' from public.cms_content_documents where id='published')<>'Nội dung thử trong transaction' then raise exception 'Site publish failed';end if;
 begin perform public.cms_publish_content(original.revision,'{}');raise exception 'Stale site publication accepted';exception when sqlstate 'PT409' then null;end;
end $$;
select set_config('request.jwt.claims','{}',true);
set local role anon;
do $$begin
 if (select count(*) from public.cms_content_documents)<>1 then raise exception 'Anonymous access to content draft';end if;
 if exists(select 1 from public.cms_posts where status='draft') then raise exception 'Anonymous draft exposure';end if;
end $$;
reset role;
rollback;
