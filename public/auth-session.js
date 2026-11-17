// The visible state and the session request are separate: revalidation never resets the label.
export function createSessionStore(load,now=()=>Date.now()){
 let value,checkedAt=-Infinity,pending=null,generation=0;
 let state={status:'unknown',refreshing:false,error:false};const listeners=new Set();
 const publish=patch=>{const next={...state,...patch};if(next.status===state.status&&next.refreshing===state.refreshing&&next.error===state.error)return;state=next;listeners.forEach(listener=>listener(state));};
 function seed(status){if(state.status==='unknown'&&['authenticated','anonymous'].includes(status))publish({status});}
 function invalidate(){generation++;pending=null;checkedAt=-Infinity;publish({refreshing:false});}
 function setSession(next){generation++;pending=null;value=next;checkedAt=now();publish({status:next?.user?'authenticated':'anonymous',refreshing:false,error:false});}
 function get(force=false){
  if(pending)return pending;
  if(!force&&value!==undefined&&now()-checkedAt<60000)return Promise.resolve(value);
  const epoch=generation;publish({refreshing:true,error:false});
  const current=operation=>pending&&pending!==operation?pending:Promise.resolve(value);
  const operation=Promise.resolve().then(load).then(next=>{if(epoch!==generation)return current(operation);value=next;checkedAt=now();publish({status:next?.user?'authenticated':'anonymous',refreshing:false,error:false});return value;},error=>{if(epoch!==generation)return current(operation);publish({refreshing:false,error:true});throw error;}).finally(()=>{if(pending===operation)pending=null;});
  pending=operation;return operation;
 }
 return {get,seed,invalidate,setSession,getSnapshot:()=>state,subscribe(listener){listeners.add(listener);listener(state);return()=>{listeners.delete(listener);};}};
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
export function announceAuthChange(value=null){session.setSession(value);try{localStorage.setItem('cms:auth-change',JSON.stringify({at:Date.now(),kind:value?.user?'login':'logout'}));}catch{}}
/** @param {(state:{status:string,refreshing:boolean,error:boolean})=>void} listener */
export function watchAuth(listener,initialStatus='anonymous'){
 session.seed(initialStatus);
 if(!observing){
  observing=true;
  addEventListener('storage',event=>{if(event.key!=='cms:auth-change')return;try{const change=JSON.parse(event.newValue||'null');if(change?.kind==='logout')session.setSession(null);else if(change?.kind==='login'){session.invalidate();session.get(true).catch(()=>{});}}catch{}});
  addEventListener('pageshow',event=>{if(event.persisted)session.get(true).catch(()=>{});});
  addEventListener('focus',()=>session.get().catch(()=>{}));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')session.get().catch(()=>{});});
 }
 const unsubscribe=session.subscribe(listener);session.get().catch(()=>{});return unsubscribe;
}
