import test from 'node:test';import assert from 'node:assert/strict';
import {createSessionStore} from '../public/auth-session.js';
test('header and manager share one session request; logout clears the display immediately',async()=>{
 let calls=0,time=1;const signedIn={user:{id:'teacher',role:'teacher'}};
 const store=createSessionStore(async()=>{calls++;return signedIn;},()=>time),values=[];
 const unsubscribe=store.subscribe(value=>values.push(value));
 const result=await Promise.all([store.get(),store.get(),store.get()]);assert.equal(calls,1);assert(result.every(v=>v===signedIn));
 await store.get();assert.equal(calls,1);time+=60001;await store.get();assert.equal(calls,2);
 store.reset(null);assert.equal(values.at(-1),null);assert.equal(await store.get(),null);unsubscribe();
});
test('a session check started before logout cannot restore the old authenticated header',async()=>{
 let finish;const store=createSessionStore(()=>new Promise(resolve=>{finish=resolve;}));const first=store.get();await Promise.resolve();store.reset(null);finish({user:{id:'old'}});assert.equal(await first,null);assert.equal(await store.get(),null);
});
test('failed session requests can be retried and forced refresh sees an expired session',async()=>{
 let count=0;const store=createSessionStore(async()=>{if(++count===1)throw Error('offline');return count===2?{user:{id:'teacher'}}:null;});
 await assert.rejects(store.get());assert((await store.get()).user);assert.equal(await store.get(true),null);
});
