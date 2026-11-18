import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';
import {validateSiteContent,siteAssetIds,removeSiteItem} from '../lib/site-content.mjs';
import {cachedValue,clearPublicMemory,publicCachedRequest} from '../lib/public-cache.mjs';
const seed=JSON.parse(await readFile(new URL('../public/data/content.json',import.meta.url),'utf8'));
test('initial website content is editable without losing source information',()=>{const next=validateSiteContent(seed);assert.equal(next.stages.length,7);assert.equal(next.images.tours.kind,'archive');assert(next.videos.every(v=>v.shortTitle));assert.equal(seed.videos[1].shortTitle,undefined);});
test('broken cross-references and unsafe image/video URLs cannot be published',()=>{const d=structuredClone(seed);d.stages[0].image='missing';assert.throws(()=>validateSiteContent(d));const e=structuredClone(seed);e.site.heroImage='javascript:alert(1)';assert.throws(()=>validateSiteContent(e));const f=structuredClone(seed);f.videos[0].src='data:text/html,bad';assert.throws(()=>validateSiteContent(f));});
test('dynamic stages and associated media are supported',()=>{const d=structuredClone(seed);d.stages.push({...structuredClone(d.stages[0]),id:'chang-moi',storyId:''});assert.equal(validateSiteContent(d).stages.length,8);d.videos=[];assert.equal(validateSiteContent(d).videos.length,0);});
test('published content tracks uploaded images',()=>{const d=structuredClone(seed),id='11111111-1111-4111-8111-111111111111';d.site.heroImage='/api/cms/assets/'+id;d.images.village.src='/api/cms/assets/'+id;assert.deepEqual(siteAssetIds(validateSiteContent(d)),[id]);});

test('archive links start from the supplied reference and staff edits or an empty list are preserved',()=>{
 const d=validateSiteContent(seed);assert.deepEqual(d.resourceLinks.map(link=>new URL(link.url).hostname),['hochiminh.vn','baotanghochiminh.vn','tulieuvankien.dangcongsan.vn']);
 d.resourceLinks[0].title='Tư liệu của nhà trường';assert.equal(validateSiteContent(d).resourceLinks[0].title,'Tư liệu của nhà trường');
 d.resourceLinks=[];assert.deepEqual(validateSiteContent(d).resourceLinks,[]);assert.equal(seed.resourceLinks,undefined);
});
test('archive-link publication rejects unsafe addresses, duplicate IDs and incomplete entries',()=>{
 const d=validateSiteContent(seed);for(const url of ['javascript:alert(1)','data:text/html,test','//evil.test','']){const changed=structuredClone(d);changed.resourceLinks[0].url=url;assert.throws(()=>validateSiteContent(changed));}
 const duplicate=structuredClone(d);duplicate.resourceLinks.push({...duplicate.resourceLinks[0]});assert.throws(()=>validateSiteContent(duplicate));
 const draft=structuredClone(d);draft.resourceLinks.push({id:'trang-moi',title:'Trang mới',description:'',url:''});assert.equal(validateSiteContent(draft,{draft:true}).resourceLinks.length,4);
});

test('new media can be saved as unfinished drafts while publication still requires valid content',()=>{
 const d=structuredClone(seed);d.videos.push({...d.videos[0],id:'phim-moi',title:'',url:'',src:''});d.sources.nguonMoi={name:'Nguồn mới',url:''};
 assert.equal(validateSiteContent(d,{draft:true}).videos.length,seed.videos.length+1);assert.throws(()=>validateSiteContent(d));
 d.videos.at(-1).src='javascript:alert(1)';assert.throws(()=>validateSiteContent(d,{draft:true}));
});
test('removing referenced content is blocked before it can leave the draft impossible to save',()=>{
 assert.throws(()=>removeSiteItem(seed,'images','village'),/đang được dùng/);assert.throws(()=>removeSiteItem(seed,'stages',0),/đang được dùng/);assert.throws(()=>removeSiteItem(seed,'stories',0),/đang được dùng/);
 const d=structuredClone(seed);d.stages.push({...d.stages[0],id:'chang-moi',storyId:''});const next=removeSiteItem(d,'stages',7);assert.equal(next.stages.length,7);assert.equal(d.stages.length,8);assert.doesNotThrow(()=>validateSiteContent(next));
});
test('server cache coalesces concurrent reads and invalidates after publication',async()=>{clearPublicMemory();let count=0;const load=async()=>{count++;await new Promise(r=>setTimeout(r,5));return {revision:count};};const values=await Promise.all(Array.from({length:20},()=>cachedValue('test-content',load)));assert.equal(count,1);assert(values.every(v=>v.revision===1));await cachedValue('test-content',load);assert.equal(count,1);clearPublicMemory();assert.equal((await cachedValue('test-content',load)).revision,2);});
test('an in-flight old response cannot repopulate the invalidated cache',async()=>{clearPublicMemory();let finish;const old=cachedValue('race',()=>new Promise(r=>{finish=r;}));await Promise.resolve();clearPublicMemory();await cachedValue('race',async()=>({revision:2}));finish({revision:1});await old;assert.equal((await cachedValue('race',async()=>({revision:3}))).revision,2);});
test('public JSON uses ETags while authenticated session responses remain uncacheable',async()=>{const request=new Request('https://school.test/api/cms/site-content'),load=()=>new Response(JSON.stringify({revision:1}),{headers:{'Content-Type':'application/json'}});const first=await publicCachedRequest(request,load);const tag=first.headers.get('ETag');assert(tag);assert(first.headers.get('Cache-Control').includes('max-age=30'));const next=await publicCachedRequest(new Request(request,{headers:{'If-None-Match':tag}}),load);assert.equal(next.status,304);const privateResponse=await publicCachedRequest(new Request('https://school.test/api/cms/session'),()=>new Response('{}',{headers:{'Cache-Control':'no-store','Set-Cookie':'test=1'}}));assert.equal(privateResponse.headers.get('ETag'),null);assert.equal(privateResponse.headers.get('Cache-Control'),'no-store');});

test('restricted Worker cache access falls back without breaking public content',async()=>{
 const prior=Object.getOwnPropertyDescriptor(globalThis,'caches');
 try{
  Object.defineProperty(globalThis,'caches',{configurable:true,value:{get default(){throw Error('This Worker is not permitted to access the default cache.');}}});
  const r=await publicCachedRequest(new Request('https://school.test/api/cms/site-content'),()=>new Response('{"revision":3}'));
  assert.equal(r.status,200);assert.equal(r.headers.get('X-Content-Cache'),'MEMORY');assert.equal((await r.json()).revision,3);
  Object.defineProperty(globalThis,'caches',{configurable:true,value:{default:{async match(){throw Error('Cache unavailable');}}}});
  assert.equal((await publicCachedRequest(new Request('https://school.test/api/cms/posts'),()=>new Response('{}'))).status,200);
 }finally{if(prior)Object.defineProperty(globalThis,'caches',prior);else delete globalThis.caches;}
});
