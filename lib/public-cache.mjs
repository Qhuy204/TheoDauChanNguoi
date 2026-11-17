const entries=new Map(),pending=new Map();
let generation=0;
export function clearPublicMemory(){generation++;entries.clear();pending.clear();}
export async function cachedValue(key,load,{fresh=false,ttl=30000}={}){
 const hit=entries.get(key);if(!fresh&&hit&&hit.expires>Date.now())return hit.value;
 if(pending.has(key))return pending.get(key);
 const epoch=generation;
 const operation=Promise.resolve().then(load).then(value=>{if(epoch===generation){if(entries.size>=128)entries.delete(entries.keys().next().value);entries.set(key,{value,expires:Date.now()+ttl});}return value;}).finally(()=>{if(pending.get(key)===operation)pending.delete(key);});pending.set(key,operation);return operation;
}
const publicKeys=new Set();
const isPublicPath=p=>p==='/api/cms/posts'||p==='/api/cms/site-content'||/^\/api\/cms\/assets\/[0-9a-f-]+$/i.test(p);
const bypass=r=>r.headers.get('X-Cms-Refresh')==='1';
function edgeCache(){try{return globalThis.caches?.default;}catch{return null;}}
function notModified(request,response){const tag=response.headers.get('ETag'),values=(request.headers.get('If-None-Match')||'').split(',').map(v=>v.trim().replace(/^W\//,''));if(tag&&(values.includes(tag)||values.includes('*')))return new Response(null,{status:304,headers:{ETag:tag,'Cache-Control':response.headers.get('Cache-Control')||'public, max-age=30'}});return response;}
export async function publicCachedRequest(request,load,ctx){
 const epoch=generation;
 const url=new URL(request.url);let cache=edgeCache();
 const publicGet=request.method==='GET'&&isPublicPath(url.pathname);
 const key=new Request(url.href,{method:'GET'});
 if(publicGet&&cache&&!bypass(request)){try{const hit=await cache.match(key);if(hit){const copy=new Response(hit.body,hit);copy.headers.set('X-Content-Cache','HIT');return notModified(request,copy);}}catch{cache=null;}}
 const response=await load();const changed=response.headers.get('X-Cms-Invalidate');response.headers.delete('X-Cms-Invalidate');
 if(changed){clearPublicMemory();if(cache){const keys=[...publicKeys,new URL('/api/cms/posts',url).href,new URL('/api/cms/site-content',url).href];const cleanup=Promise.all(keys.map(k=>cache.delete(new Request(k)))).catch(()=>{});if(ctx?.waitUntil)ctx.waitUntil(cleanup);else await cleanup;}}
 if(!publicGet||response.status!==200||response.headers.has('Set-Cookie')||response.headers.get('Cache-Control')?.startsWith('private'))return response;
 response.headers.set('Cache-Control',url.pathname.includes('/assets/')?'public, max-age=3600, s-maxage=86400':'public, max-age=30, s-maxage=30, stale-while-revalidate=60');
 if(!response.headers.has('ETag')){const bytes=await response.clone().arrayBuffer(),hash=await crypto.subtle.digest('SHA-256',bytes);response.headers.set('ETag','"'+[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('')+'"');}
 response.headers.set('X-Content-Cache',cache?'MISS':'MEMORY');
 if(cache&&epoch===generation){if(publicKeys.size>=128)publicKeys.delete(publicKeys.values().next().value);publicKeys.add(url.href);const write=cache.put(key,response.clone()).catch(()=>{});if(ctx?.waitUntil)ctx.waitUntil(write);else await write;}
 return notModified(request,response);
}
