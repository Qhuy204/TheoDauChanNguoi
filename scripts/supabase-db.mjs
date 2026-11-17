// Reads connection credentials through hidden stdin; never writes or prints them.
import pg from 'pg';
import { readFile } from 'node:fs/promises';
import {validateSiteContent} from '../lib/site-content.mjs';
process.stdout.write('Ready for database connection JSON on stdin (input is hidden).\n');
if (process.stdin.isTTY) { process.stdin.setRawMode(true); process.stdin.resume(); }
let input = '';
for await (const chunk of process.stdin) { input += chunk.toString(); if (/[\r\n]/.test(input)) break; }
if (process.stdin.isTTY) process.stdin.setRawMode(false);
const settings = JSON.parse(input.trim());
const ca = settings.caPath ? await readFile(settings.caPath, 'utf8') : undefined;
const db = new pg.Client({ host: settings.host, port: settings.port || 5432, database: 'postgres', user: settings.user || 'postgres', password: settings.password, ssl: { rejectUnauthorized: true, ca }, connectionTimeoutMillis: 12000 });
try {
  await db.connect();
  if (settings.migrate) await db.query(await readFile(new URL('../supabase/migrations/202611170001_cms.sql', import.meta.url), 'utf8'));
  for (const migration of settings.migrations || []) {
    if (!['202611170002_editor_assets.sql','202611170003_editable_site.sql','202611170004_asset_policy_guard.sql','202611170005_bounded_content_publish.sql'].includes(migration)) throw new Error('Unknown migration');
    await db.query(await readFile(new URL('../supabase/migrations/'+migration, import.meta.url),'utf8'));
  }
  if (settings.seedSite) {
    const content=JSON.parse(await readFile(new URL('../public/data/content.json',import.meta.url),'utf8'));
    await db.query("insert into public.cms_content_documents(id,content) values('draft',$1),('published',$1) on conflict(id) do nothing",[JSON.stringify(content)]);
  }
  if (settings.test) { await db.query(await readFile(new URL('../tests/cms-rls.sql', import.meta.url), 'utf8')); console.log(JSON.stringify({ rlsTestsPassed: true })); }
  if (settings.verifyApprovedSite) {
    const approved=validateSiteContent(JSON.parse(await readFile(new URL('../public/data/content.json',import.meta.url),'utf8')));
    const rows=await db.query('select id,content,revision from public.cms_content_documents order by id');
    const same=(a,b)=>JSON.stringify(sort(a))===JSON.stringify(sort(b));
    function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;}
    console.log(JSON.stringify({approvedContent:rows.rows.map(r=>({id:r.id,revision:r.revision,matchesApprovedSeed:same(validateSiteContent(r.content),approved)}))}));
  }
  if (settings.adminEmail) {
    const result = await db.query("insert into public.cms_profiles(id,display_name,role) select id,coalesce(nullif(raw_user_meta_data->>'name',''),split_part(email,'@',1)),'admin' from auth.users where lower(email)=lower($1) on conflict(id) do update set role='admin',active=true returning id", [settings.adminEmail]);
    console.log(JSON.stringify({ adminGranted: result.rowCount === 1 }));
  }
  const tables = await db.query("select tablename from pg_tables where schemaname='public' and tablename in ('cms_posts','cms_profiles') order by tablename");
  console.log(JSON.stringify({ connected: true, tables: tables.rows.map(r => r.tablename) }));
} catch (error) { console.error(JSON.stringify({ connected: false, code: error.code || 'CONNECTION_FAILED',...(settings.test?{testError:error.message}:{}) })); process.exitCode = 1; }
finally { await db.end(); process.stdin.pause(); }
