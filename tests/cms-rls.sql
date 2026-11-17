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
reset role;
rollback;
