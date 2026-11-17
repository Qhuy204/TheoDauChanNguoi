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
    if (response.status === 401) throw new CmsError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    if (response.status === 403) throw new CmsError(403, 'Tài khoản chưa được cấp quyền thực hiện thao tác này.');
    if (response.status === 409) throw new CmsError(409, 'Đường dẫn bài viết đã tồn tại. Vui lòng đổi đường dẫn.');
    if (response.status === 429) throw new CmsError(429, 'Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại.');
    if (response.status === 400 || response.status === 422) throw new CmsError(400, 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại các trường.');
    throw new CmsError(503, 'Chưa kết nối được kho bài viết. Vui lòng thử lại sau.');
  }
  return raw ? response : response.status === 204 ? null : response.json();
}
/** @param {{url:string,key:string}} settings @param {{slug?:string,page?:number}} [options] */
export async function publicPosts(settings, options = {}) {
  const { slug, page = 1 } = options;
  const q = new URLSearchParams({ select: slug ? '*' : listFields, status: 'eq.published', order: 'published_at.desc,id.desc', limit: slug ? '1' : '13', offset: String((page - 1) * 12) });
  if (slug) q.set('slug', `eq.${slug}`);
  return call(settings, '/rest/v1/cms_posts?' + q);
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
export function validatePost(value) {
  const text = (key, min, max) => { const v = typeof value[key] === 'string' ? value[key].trim() : ''; if (v.length < min || v.length > max) throw new CmsError(400, `Vui lòng kiểm tra ${key === 'title' ? 'tiêu đề (1–180 ký tự)' : key === 'body' ? 'nội dung (tối đa 60.000 ký tự)' : key === 'summary' ? 'mô tả (tối đa 360 ký tự)' : 'chú thích ảnh (tối đa 240 ký tự)'}.`); return v; };
  const result = { title: text('title',1,180), summary: text('summary',0,360), body: text('body',0,60000), cover_alt: text('cover_alt',0,240), slug: typeof value.slug === 'string' ? value.slug.trim() : '', status: value.status || 'draft' };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(result.slug) || result.slug.length > 200) throw new CmsError(400, 'Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang.');
  if (!['draft','published'].includes(result.status)) throw new CmsError(400, 'Trạng thái bài viết không hợp lệ.');
  if (result.status === 'published' && result.body.length < 50) throw new CmsError(400, 'Nội dung cần ít nhất 50 ký tự trước khi đăng bài.');
  return result;
}
function json(value, status = 200) { return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
function applyCookies(response, values) { values.forEach(value => response.headers.append('Set-Cookie', value)); return response; }
async function postById(settings, id, token) {
  if (!uuid.test(id)) throw new CmsError(404, 'Không tìm thấy bài viết.');
  const rows = await call(settings, '/rest/v1/cms_posts?' + new URLSearchParams({ select:'*', id:`eq.${id}`, limit:'1' }), { token });
  if (!rows.length) throw new CmsError(404, 'Không tìm thấy bài viết.'); return rows[0];
}
export async function handleCms(request, env) {
  let setCookies = [];
  try {
    const settings = config(env), url = new URL(request.url), path = url.pathname.replace('/api/cms/', '');
    if (!['GET','HEAD'].includes(request.method) && (request.headers.get('Origin') !== url.origin || request.headers.get('X-Requested-With') !== 'cms')) throw new CmsError(403, 'Yêu cầu không hợp lệ. Vui lòng tải lại trang.');
    if (path === 'posts' && request.method === 'GET') {
      const rows = await publicPosts(settings, { page: Math.min(1000, Math.max(1, Number(url.searchParams.get('page')) || 1)) });
      return json({ posts: rows.slice(0,12), hasMore: rows.length > 12 });
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
    const who = await identity(request, settings); setCookies = who.setCookies;
    const {token,profile}=who;
    if (path === 'session' && request.method === 'GET') return applyCookies(json({user:profile,email:who.email}),setCookies);
    if (path === 'manage' && request.method === 'GET') {
      const q = new URLSearchParams({select:listFields,order:'updated_at.desc,id.desc',limit:'21',offset:String(Math.max(0,Math.min(999,Number(url.searchParams.get('page'))||1)-1)*20)});
      if(profile.role!=='admin') q.set('author_id',`eq.${profile.id}`);
      const rows=await call(settings,'/rest/v1/cms_posts?'+q,{token});
      return applyCookies(json({posts:rows.slice(0,20),hasMore:rows.length>20}),setCookies);
    }
    if (path === 'manage' && request.method === 'POST') {
      const fields=validatePost(await jsonBody(request));
      const rows=await call(settings,'/rest/v1/cms_posts',{method:'POST',token,headers:{Prefer:'return=representation'},body:JSON.stringify({...fields,author_id:profile.id,author_name:profile.display_name})});
      return applyCookies(json({post:rows[0]},201),setCookies);
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
        const q=new URLSearchParams({id:`eq.${id}`,updated_at:`eq.${value.updated_at}`});
        const rows=await call(settings,'/rest/v1/cms_posts?'+q,{method:'PATCH',token,headers:{Prefer:'return=representation'},body:JSON.stringify(fields)});
        if(!rows.length) throw new CmsError(409,'Bài viết vừa được sửa ở nơi khác. Hãy sao chép phần đang viết rồi tải lại bài.');
        return applyCookies(json({post:rows[0]}),setCookies);
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
