// Session state stays in memory; only an invalidation signal is shared across tabs.
export function createSessionStore(load,now=()=>Date.now()){
 let value,checkedAt=0,pending=null,generation=0;const listeners=new Set();
 const emit=()=>listeners.forEach(listener=>listener(value));
 function reset(next){generation++;pending=null;value=next;checkedAt=next===undefined?0:now();emit();}
 function get(force=false){
  if(pending)return pending;
  if(!force&&value!==undefined&&now()-checkedAt<60000)return Promise.resolve(value);
  const epoch=generation;
  const operation=Promise.resolve().then(load).then(next=>{if(epoch===generation){value=next;checkedAt=now();emit();}return value;}).finally(()=>{if(pending===operation)pending=null;});
  pending=operation;return operation;
 }
 return {get,reset,subscribe(listener){listeners.add(listener);listener(value);return()=>{listeners.delete(listener);};}};
}
const session=createSessionStore(async()=>{
 const response=await fetch('/api/cms/session',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(response.status===401||response.status===403)return null;
 if(!response.ok)throw Error('Chưa kiểm tra được phiên đăng nhập.');
 return response.json();
});
let observing=false;
export const getSession=(force=false)=>session.get(force);
/** @param {any} value */
export function announceAuthChange(value=null){session.reset(value);try{localStorage.setItem('cms:auth-change',JSON.stringify({at:Date.now(),kind:value?.user?'login':'logout'}));}catch{}}
export function watchSession(listener){
 if(!observing){
  observing=true;
  addEventListener('storage',event=>{if(event.key==='cms:auth-change'){session.reset(undefined);session.get(true).catch(()=>{});}});
  addEventListener('pageshow',event=>{if(event.persisted)session.get(true).catch(()=>{});});
  addEventListener('focus',()=>session.get().catch(()=>{}));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')session.get().catch(()=>{});});
 }
 const unsubscribe=session.subscribe(listener);session.get().catch(()=>{});return unsubscribe;
}
