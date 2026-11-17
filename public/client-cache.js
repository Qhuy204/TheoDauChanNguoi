const memory=new Map(),pending=new Map(),prefix='cms:public:v1:';
function read(key){if(memory.has(key))return memory.get(key);try{const value=JSON.parse(localStorage.getItem(prefix+key)||'null');if(value&&value.at&&value.data){memory.set(key,value);return value;}}catch{}return null;}
function write(key,value){memory.set(key,value);try{localStorage.setItem(prefix+key,JSON.stringify(value));}catch{}}
async function refresh(path,stored,force){
 if(pending.has(path))return pending.get(path);
 const operation=(async()=>{
  const headers={};if(stored?.etag&&!force)headers['If-None-Match']=stored.etag;if(force)headers['X-Cms-Refresh']='1';
  const response=await fetch(path,{credentials:'omit',cache:force?'reload':'default',headers,signal:AbortSignal.timeout(15000)});
  if(response.status===304&&stored){write(path,{...stored,at:Date.now()});return stored.data;}
  if(!response.ok)throw new Error('Public content unavailable');const data=await response.json(),etag=response.headers.get('ETag');
  write(path,{data,etag,at:Date.now()});if(stored&&stored.etag!==etag)dispatchEvent(new CustomEvent('cms:public-updated',{detail:{path}}));return data;
 })().finally(()=>pending.delete(path));pending.set(path,operation);return operation;
}
export async function publicJSON(path,{force=false}={}){
 const stored=read(path);let invalidated=0;try{invalidated=Number(localStorage.getItem('cms:invalidate'))||0;}catch{}
 const needsFresh=force||!!stored&&invalidated>stored.at;
 if(stored&&!needsFresh){if(Date.now()-stored.at>30000)refresh(path,stored,false).catch(()=>{});return stored.data;}
 try{return await refresh(path,stored,needsFresh);}catch(error){if(stored&&!needsFresh)return stored.data;throw error;}
}
