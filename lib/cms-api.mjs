import { normalizeBody,bodyAssets } from './rich-text.mjs';
import {validateSiteContent,siteAssetIds} from './site-content.mjs';
import {cachedValue,publicCachedRequest} from './public-cache.mjs';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const listFields = 'id,title,slug,summary,author_name,cover_path,cover_alt,status,published_at,updated_at,created_at';
export class CmsError extends Error { constructor(status, message) { super(message); this.status = status; } }
export function config(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new CmsError(503, 'Chưa kết nối được kho bài viết. Vui lòng thử lại sau.');
  return { url: url.replace(/\/$/, ''), key };
}
async function call(settings, path, { token, method = 'GET', body, headers = {}, raw = false } = {}) {
  const response = await fetch(settings.url + path, { method, headers: { apikey: settings.key, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body && typeof body === 'string' ? { 'Content-Type': 'application/json' } : {}), ...headers }, body, signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    if(globalThis.process?.env?.NODE_ENV==='development'){const info=await response.clone().json().catch(()=>null);console.warn('CMS upstream response',{path:path.split('?')[0],status:response.status,code:info?.code,message:info?.message});}
    if (response.status === 401) throw new CmsError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    if (response.status === 403) throw new CmsError(403, 'Tài khoản chưa được cấp quyền thực hiện thao tác này.');
    if (response.status === 409) throw new CmsError(409, 'Nội dung vừa được sửa ở nơi khác. Hãy tải lại trước khi lưu.');
    if (response.status === 429) throw new CmsError(429, 'Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại.');
    if (response.status === 400 || response.status === 422) throw new CmsError(400, 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại các trường.');
    throw new CmsError(503, 'Chưa kết nối được kho bài viết. Vui lòng thử lại sau.');
  }
  if(raw)return response;
  if(response.status===204)return null;
  const content=await response.text();return content?JSON.parse(content):null;
}
/** @param {{url:string,key:string}} settings @param {{slug?:string,page?:number,fresh?:boolean}} [options] */
export async function publicPosts(settings, options = {}) {
  const { slug, page = 1 } = options;
  const q = new URLSearchParams({ select: slug ? '*' : listFields, status: 'eq.published', order: 'published_at.desc,id.desc', limit: slug ? '1' : '13', offset: String((page - 1) * 12) });
  if (slug) q.set('slug', `eq.${slug}`);
  return cachedValue(settings.url+'/posts?'+q,()=>call(settings, '/rest/v1/cms_posts?' + q),{fresh:options.fresh});
}
function cookies(request) { return Object.fromEntries((request.headers.get('cookie') || '').split(';').map(v => v.trim().split(/=(.*)/s).slice(0,2)).filter(v => v.length === 2)); }
function sessionCookies(request, session) {
  const flags = `; Path=/; HttpOnly; SameSite=Lax${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
  return [`cms-access=${session.access_token || ''}; Max-Age=${session.access_token ? Math.max(1, session.expires_in || 3600) : 0}${flags}`, `cms-refresh=${session.refresh_token || ''}; Max-Age=${session.refresh_token ? 2592000 : 0}${flags}`];
}
export async function identity(request, settings) {
  const jar = cookies(request); let token = jar['cms-access']; let setCookies = [];
  let user;
  if (token) { try { user = await call(settings, '/auth/v1/user', { token }); } catch(error) { if (error.status !== 401) throw error; } }
  if (!user && jar['cms-refresh']) {
    try {
      const s = await call(settings, '/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: jar['cms-refresh'] }) });
      token = s.access_token; user = s.user; setCookies = sessionCookies(request, s);
    } catch(error) { if (![400,401].includes(error.status)) throw error; }
  }
  if (!user) throw new CmsError(401, 'Vui lòng đăng nhập để quản lý bài viết.');
  const rows = await call(settings, '/rest/v1/cms_profiles?' + new URLSearchParams({ select: 'id,display_name,role,active', id: `eq.${user.id}`, limit: '1' }), { token });
  const profile = rows[0];
  if (!profile?.active) throw new CmsError(403, 'Tài khoản này chưa được cấp quyền đăng bài. Vui lòng liên hệ quản trị viên.');
  return { token, profile, email: user.email, setCookies };
}
async function readBody(request, maximum = 1000000) {
  const reader = request.body?.getReader(); if (!reader) throw new CmsError(400, 'Chưa có dữ liệu gửi lên.');
  const chunks = []; let size = 0;
  for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > maximum) { await reader.cancel(); throw new CmsError(413, 'Tệp hoặc nội dung vượt quá dung lượng cho phép.'); } chunks.push(value); }
  const result = new Uint8Array(size); let at = 0; for (const chunk of chunks) { result.set(chunk, at); at += chunk.byteLength; } return result;
}
async function jsonBody(request) { try { return JSON.parse(new TextDecoder().decode(await readBody(request))); } catch(error) { if (error instanceof CmsError) throw error; throw new CmsError(400, 'Dữ liệu gửi lên chưa hợp lệ.'); } }
export function postSlug(title) { return String(title).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').slice(0,180).replace(/^-+|-+$/g,'')||'bai-viet'; }
export function validatePost(value) {
  const text = (key, min, max) => { const v = typeof value[key] === 'string' ? value[key].trim() : ''; if (v.length < min || v.length > max) throw new CmsError(400, `Vui lòng kiểm tra ${key === 'title' ? 'tiêu đề (1–180 ký tự)' : key === 'body' ? 'nội dung (tối đa 60.000 ký tự)' : key === 'summary' ? 'mô tả (tối đa 360 ký tự)' : 'chú thích ảnh (tối đa 240 ký tự)'}.`); return v; };
  const result = { title: text('title',1,180), summary: text('summary',0,360), body: text('body',0,60000), cover_alt: '', slug: '', status: value.status || 'draft' };
  result.slug=postSlug(result.title);
  if (!['draft','published'].includes(result.status)) throw new CmsError(400, 'Trạng thái bài viết không hợp lệ.');
  let normalized;
  try { normalized = normalizeBody(result.body); } catch { throw new CmsError(400, 'Nội dung có định dạng chưa hợp lệ hoặc quá dài. Vui lòng kiểm tra lại.'); }
  result.body = normalized.body;
  if (result.body.length > 60000) throw new CmsError(400, 'Nội dung bài viết vượt quá dung lượng cho phép.');
  if (result.status === 'published' && normalized.text.length < 50) throw new CmsError(400, 'Nội dung cần ít nhất 50 ký tự trước khi đăng bài.');
  return result;
}
function json(value, status = 200) { return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
function applyCookies(response, values) { values.forEach(value => response.headers.append('Set-Cookie', value)); return response; }
async function postById(settings, id, token) {
  if (!uuid.test(id)) throw new CmsError(404, 'Không tìm thấy bài viết.');
  const rows = await call(settings, '/rest/v1/cms_posts?' + new URLSearchParams({ select:'*', id:`eq.${id}`, limit:'1' }), { token });
  if (!rows.length) throw new CmsError(404, 'Không tìm thấy bài viết.'); return rows[0];
}
function invalidate(response,resource){response.headers.set('X-Cms-Invalidate',resource);return response;}
export async function handleCms(request,env,ctx){return publicCachedRequest(request,()=>handleCmsInner(request,env),ctx);}
async function handleCmsInner(request, env) {
  let setCookies = [];
  try {
    const settings = config(env), url = new URL(request.url), path = url.pathname.replace('/api/cms/', '');
    if (!['GET','HEAD'].includes(request.method) && (request.headers.get('Origin') !== url.origin || request.headers.get('X-Requested-With') !== 'cms')) throw new CmsError(403, 'Yêu cầu không hợp lệ. Vui lòng tải lại trang.');
    if (path === 'posts' && request.method === 'GET') {
      const rows = await publicPosts(settings, { page: Math.min(1000, Math.max(1, Math.trunc(Number(url.searchParams.get('page')) || 1))),fresh:request.headers.get('X-Cms-Refresh')==='1' });
      return json({ posts: rows.slice(0,12), hasMore: rows.length > 12 });
    }
    if(path==='site-content'&&request.method==='GET') {
      const rows=await cachedValue(settings.url+'/site-content',()=>call(settings,"/rest/v1/cms_content_documents?id=eq.published&select=content,revision,updated_at&limit=1"),{fresh:request.headers.get('X-Cms-Refresh')==='1'});
      if(!rows[0])throw new CmsError(503,'Nội dung website chưa sẵn sàng.');return json(rows[0]);
    }
    if (path === 'login' && request.method === 'POST') {
      const body = await jsonBody(request);
      if (typeof body.email !== 'string' || typeof body.password !== 'string' || body.email.length > 254 || body.password.length > 256) throw new CmsError(400, 'Vui lòng nhập email và mật khẩu.');
      let s;
      try { s = await call(settings, '/auth/v1/token?grant_type=password', { method:'POST', body:JSON.stringify({ email:body.email.trim(), password:body.password }) }); }
      catch(error) { if ([400,401].includes(error.status)) throw new CmsError(401, 'Email hoặc mật khẩu chưa đúng.'); throw error; }
      const cookieRequest = new Request(request.url, { headers: { cookie: `cms-access=${s.access_token}` } });
      const who = await identity(cookieRequest, settings);
      return applyCookies(json({ user:who.profile, email:who.email }), sessionCookies(request,s));
    }
    if (path === 'logout' && request.method === 'POST') {
      const token = cookies(request)['cms-access'];
      if (token) try { await call(settings, '/auth/v1/logout?scope=local', { method:'POST',token }); } catch {}
      return applyCookies(json({ok:true}), sessionCookies(request,{}));
    }
    if (path.startsWith('media/') && request.method === 'GET') {
      let token;
      if (cookies(request)['cms-access'] || cookies(request)['cms-refresh']) { try { const who=await identity(request, settings); token=who.token; setCookies=who.setCookies; } catch(error) { if (![401,403].includes(error.status)) throw error; } }
      const post = await postById(settings,path.split('/')[1],token);
      if (!post.cover_path) throw new CmsError(404,'Không tìm thấy ảnh.');
      const image = await call(settings,'/storage/v1/object/authenticated/cms-media/'+post.cover_path,{token,raw:true});
      const response=new Response(image.body,{headers:{'Content-Type':image.headers.get('Content-Type')||'image/jpeg','X-Content-Type-Options':'nosniff','Cache-Control':post.status==='published'?'public, max-age=300':'private, no-store'}});
      return applyCookies(response,setCookies);
    }
    if(path.startsWith('assets/')&&request.method==='GET') {
      const id=path.split('/')[1];if(!uuid.test(id))throw new CmsError(404,'Không tìm thấy ảnh.');
      const query='/rest/v1/cms_assets?'+new URLSearchParams({select:'id,storage_path,mime_type',id:`eq.${id}`,limit:'1'});
      let rows=await call(settings,query),token;
      const isPublic=rows.length>0;
      if(!isPublic){token=cookies(request)['cms-access'];if(token){try{rows=await call(settings,query,{token});}catch(error){if(error.status!==401)throw error;token=null;}}if(!token){const who=await identity(request,settings);token=who.token;setCookies=who.setCookies;rows=await call(settings,query,{token});}}
      if(!rows.length)throw new CmsError(404,'Không tìm thấy ảnh.');
      const image=await call(settings,'/storage/v1/object/authenticated/cms-media/'+rows[0].storage_path,{token,raw:true});
      return applyCookies(new Response(image.body,{headers:{'Content-Type':rows[0].mime_type,'X-Content-Type-Options':'nosniff','Cache-Control':isPublic?'public, max-age=3600, s-maxage=86400':'private, no-store'}}),setCookies);
    }
    const who = await identity(request, settings); setCookies = who.setCookies;
    const {token,profile}=who;
    if (path === 'session' && request.method === 'GET') return applyCookies(json({user:profile,email:who.email}),setCookies);
    if(path==='content'&&request.method==='GET'){const rows=await call(settings,'/rest/v1/cms_content_documents?select=id,content,revision,updated_at&order=id.asc',{token});return applyCookies(json({documents:rows}),setCookies);}
    if(path==='content'&&request.method==='PATCH'){
      const value=await jsonBody(request);let content;try{content=validateSiteContent(value.content);}catch(e){throw new CmsError(400,e.message);}
      if(!Number.isInteger(value.revision))throw new CmsError(400,'Vui lòng tải lại nội dung trước khi lưu.');
      const q=new URLSearchParams({id:'eq.draft',revision:`eq.${value.revision}`});const rows=await call(settings,'/rest/v1/cms_content_documents?'+q,{token,method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({content,revision:value.revision+1,updated_at:new Date().toISOString(),updated_by:profile.id})});if(!rows.length)throw new CmsError(409,'Nội dung vừa được người khác sửa. Hãy tải lại trước khi lưu.');return applyCookies(json({document:rows[0]}),setCookies);
    }
    if(path==='content/publish'&&request.method==='POST'){
      const value=await jsonBody(request),rows=await call(settings,'/rest/v1/cms_content_documents?id=eq.draft&select=content,revision&limit=1',{token});if(!rows[0]||rows[0].revision!==value.revision)throw new CmsError(409,'Nội dung đã thay đổi. Hãy tải lại trước khi xuất bản.');let content;try{content=validateSiteContent(rows[0].content);}catch(e){throw new CmsError(400,e.message);}
      const result=await call(settings,'/rest/v1/rpc/cms_publish_content',{token,method:'POST',body:JSON.stringify({p_revision:value.revision,p_asset_ids:siteAssetIds(content)})});return invalidate(applyCookies(json({document:Array.isArray(result)?result[0]:result}),setCookies),'site');
    }
    if(path==='uploads'&&request.method==='POST') {
      const bytes=await readBody(request,5242880);let type,extension;
      if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255){type='image/jpeg';extension='jpg';}
      else if([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)){type='image/png';extension='png';}
      else if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'){type='image/webp';extension='webp';}
      else throw new CmsError(400,'Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MB.');
      const id=crypto.randomUUID(),scope=url.searchParams.get('scope')==='site'?'site':'post',key=`${profile.id}/inline/${id}.${extension}`;
      await call(settings,'/storage/v1/object/cms-media/'+key,{method:'POST',token,body:bytes,headers:{'Content-Type':type},raw:true});
      try{await call(settings,'/rest/v1/cms_assets',{method:'POST',token,headers:{Prefer:'return=minimal'},body:JSON.stringify({id,owner_id:profile.id,scope,storage_path:key,mime_type:type,size_bytes:bytes.length})});}
      catch(error){try{await call(settings,'/storage/v1/object/cms-media',{method:'DELETE',token,body:JSON.stringify({prefixes:[key]})});}catch{}throw error;}
      return applyCookies(json({asset:{id,src:'/api/cms/assets/'+id}},201),setCookies);
    }
    if (path === 'manage' && request.method === 'GET') {
      const q = new URLSearchParams({select:listFields,order:'updated_at.desc,id.desc',limit:'21',offset:String(Math.max(0,Math.min(999,Number(url.searchParams.get('page'))||1)-1)*20)});
      if(profile.role!=='admin') q.set('author_id',`eq.${profile.id}`);
      const rows=await call(settings,'/rest/v1/cms_posts?'+q,{token});
      return applyCookies(json({posts:rows.slice(0,20),hasMore:rows.length>20}),setCookies);
    }
    if (path === 'manage' && request.method === 'POST') {
      const fields=validatePost(await jsonBody(request));
      const saved=await call(settings,'/rest/v1/rpc/cms_save_post',{method:'POST',token,body:JSON.stringify({p_id:null,p_updated_at:null,p_title:fields.title,p_summary:fields.summary,p_body:fields.body,p_status:fields.status,p_slug_base:fields.slug,p_asset_ids:bodyAssets(fields.body)})});
      const response=applyCookies(json({post:Array.isArray(saved)?saved[0]:saved},201),setCookies);return fields.status==='published'?invalidate(response,'posts'):response;
    }
    if (path === 'members' && profile.role === 'admin' && request.method==='GET') return applyCookies(json({members:await call(settings,'/rest/v1/cms_profiles?select=id,display_name,role,active&order=created_at.asc',{token})}),setCookies);
    if (path.startsWith('members/') && profile.role === 'admin' && request.method==='PATCH') {
      const id=path.split('/')[1], value=await jsonBody(request);
      if(!uuid.test(id)||id===profile.id||!['admin','teacher'].includes(value.role)||typeof value.active!=='boolean') throw new CmsError(400,'Không thể cập nhật quyền tài khoản này.');
      const rows=await call(settings,'/rest/v1/cms_profiles?id=eq.'+id,{method:'PATCH',token,headers:{Prefer:'return=representation'},body:JSON.stringify({role:value.role,active:value.active})});
      if(!rows.length) throw new CmsError(404,'Không tìm thấy tài khoản.');
      return applyCookies(json({member:rows[0]}),setCookies);
    }
    if (path.startsWith('manage/')) {
      const [,id,action]=path.split('/'); const post=await postById(settings,id,token);
      if(profile.role!=='admin'&&post.author_id!==profile.id) throw new CmsError(403,'Bạn chỉ có thể sửa bài viết của mình.');
      if(!action&&request.method==='GET') return applyCookies(json({post}),setCookies);
      if(!action&&request.method==='PATCH') {
        const value=await jsonBody(request), fields=validatePost(value);
        if(typeof value.updated_at!=='string') throw new CmsError(400,'Vui lòng tải lại bài viết trước khi lưu.');
        const saved=await call(settings,'/rest/v1/rpc/cms_save_post',{method:'POST',token,body:JSON.stringify({p_id:id,p_updated_at:value.updated_at,p_title:fields.title,p_summary:fields.summary,p_body:fields.body,p_status:fields.status,p_slug_base:fields.slug,p_asset_ids:bodyAssets(fields.body)})});
        const response=applyCookies(json({post:Array.isArray(saved)?saved[0]:saved}),setCookies);return fields.status==='published'||post.status==='published'?invalidate(response,'posts'):response;
      }
      if(action==='image'&&request.method==='POST') {
        const bytes=await readBody(request,5242880); let type,extension;
        if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255){type='image/jpeg';extension='jpg';}
        else if([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)){type='image/png';extension='png';}
        else if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'){type='image/webp';extension='webp';}
        else throw new CmsError(400,'Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MB.');
        const key=`${profile.id}/${id}/${crypto.randomUUID()}.${extension}`;
        await call(settings,'/storage/v1/object/cms-media/'+key,{method:'POST',token,body:bytes,headers:{'Content-Type':type},raw:true});
        const rows=await call(settings,'/rest/v1/cms_posts?id=eq.'+id,{method:'PATCH',token,headers:{Prefer:'return=representation'},body:JSON.stringify({cover_path:key})});
        return applyCookies(json({post:rows[0]}),setCookies);
      }
      if(action==='image'&&request.method==='DELETE') {
        const rows=await call(settings,'/rest/v1/cms_posts?id=eq.'+id,{method:'PATCH',token,headers:{Prefer:'return=representation'},body:JSON.stringify({cover_path:null,cover_alt:''})});
        if(post.cover_path) try{await call(settings,'/storage/v1/object/cms-media',{method:'DELETE',token,body:JSON.stringify({prefixes:[post.cover_path]})});}catch{}
        return applyCookies(json({post:rows[0]}),setCookies);
      }
    }
    throw new CmsError(404,'Không tìm thấy nội dung.');
  } catch(error) { return applyCookies(json({error:error instanceof CmsError?error.message:'Chưa hoàn thành được thao tác. Vui lòng thử lại.',code:error instanceof CmsError?error.status:503},error instanceof CmsError?error.status:503),setCookies); }
}
