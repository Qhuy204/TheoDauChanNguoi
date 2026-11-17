// Guard an equivalent-content publication check; credentials arrive only through hidden stdin.
import {readFile} from 'node:fs/promises';
import {validateSiteContent,siteAssetIds} from '../lib/site-content.mjs';
console.log('Ready for hidden verification settings.');
if(process.stdin.isTTY){process.stdin.setRawMode(true);process.stdin.resume();}
let input='';for await(const c of process.stdin){input+=c.toString();if(/[\r\n]/.test(input))break;}
if(process.stdin.isTTY)process.stdin.setRawMode(false);
const s=JSON.parse(input.trim());
const sort=v=>Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;
try {
 const headers={apikey:s.key,'Content-Type':'application/json'};
 const login=await fetch(s.url+'/auth/v1/token?grant_type=password',{method:'POST',headers,body:JSON.stringify({email:s.email,password:s.password})});
 const session=await login.json();if(!login.ok)throw Error('AUTH_'+login.status);headers.Authorization='Bearer '+session.access_token;
 const read=await fetch(s.url+'/rest/v1/cms_content_documents?select=id,content,revision',{headers});
 if(!read.ok)throw Error('READ_'+read.status);
 const documents=await read.json(),draft=documents.find(d=>d.id==='draft'),live=documents.find(d=>d.id==='published');
 const seed=validateSiteContent(JSON.parse(await readFile(new URL('../public/data/content.json',import.meta.url),'utf8')));
 const canonical=v=>JSON.stringify(sort(validateSiteContent(v)));
 if(canonical(draft.content)!==canonical(seed)||canonical(live.content)!==canonical(seed))throw Error('ABORTED_CONTENT_DIFFERS_FROM_APPROVED_SEED');
 const assetIds=siteAssetIds(validateSiteContent(draft.content)).sort();
 const linkRead=await fetch(s.url+'/rest/v1/cms_site_assets?select=asset_id',{headers});
 if(!linkRead.ok)throw Error('ASSET_READ_'+linkRead.status);
 const linked=(await linkRead.json()).map(v=>v.asset_id).sort();
 if(JSON.stringify(assetIds)!==JSON.stringify(linked))throw Error('ABORTED_PUBLISHED_ASSET_LINKS_WOULD_CHANGE');
 console.log(JSON.stringify({approvedContentUnchanged:true,publishedAssetLinksUnchanged:true,assetCount:assetIds.length}));
 if(s.publish===true){
  const result=await fetch(s.url+'/rest/v1/rpc/cms_publish_content',{method:'POST',headers,body:JSON.stringify({p_revision:draft.revision,p_asset_ids:assetIds})});
  const data=await result.json();console.log(JSON.stringify({status:result.status,...(result.ok?{publishedIdenticalApprovedContent:true}:{error:data})}));
  if(!result.ok)process.exitCode=1;
 }
}catch(error){console.log(JSON.stringify({error:error.message}));process.exitCode=1;}finally{process.stdin.pause();}
