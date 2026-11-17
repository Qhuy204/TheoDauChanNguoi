import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';
import {createSessionStore} from '../public/auth-session.js';
import {authViewFromCookie,homeWithAuthView} from '../lib/auth-view.mjs';
const teacher={user:{id:'teacher',role:'teacher'}};
test('initial authenticated label survives pending checks and repeated background refreshes',async()=>{
 let calls=0,time=1;const store=createSessionStore(async()=>{calls++;return teacher;},()=>time);store.seed('authenticated');
 const states=[];store.subscribe(state=>states.push(state.status));
 const result=await Promise.all([store.get(),store.get(),store.get(true)]);assert.equal(calls,1);assert(result.every(v=>v===teacher));
 await store.get();assert.equal(calls,1);time+=60001;await store.get();assert.equal(calls,2);store.invalidate();await store.get(true);
 assert(states.every(status=>status==='authenticated'));assert.equal(store.getSnapshot().refreshing,false);
});
test('logout wins over an old session response and changes the label only once',async()=>{
 let finish;const store=createSessionStore(()=>new Promise(resolve=>{finish=resolve;}));store.seed('authenticated');const labels=[];store.subscribe(state=>{if(labels.at(-1)!==state.status)labels.push(state.status);});
 const old=store.get();await Promise.resolve();store.setSession(null);finish(teacher);assert.equal(await old,null);assert.equal(await store.get(),null);assert.deepEqual(labels,['authenticated','anonymous']);
});
test('network errors preserve the last visible state; a confirmed expired session signs out',async()=>{
 let calls=0;const store=createSessionStore(async()=>{if(++calls===1)throw Error('offline');return null;});store.seed('authenticated');
 await assert.rejects(store.get());assert.equal(store.getSnapshot().status,'authenticated');assert.equal(store.getSnapshot().error,true);
 await store.get(true);assert.equal(store.getSnapshot().status,'anonymous');
});
test('login followed by navigation keeps its confirmed state when a header subscribes again',async()=>{
 const store=createSessionStore(async()=>teacher);store.seed('anonymous');store.setSession(teacher);store.seed('anonymous');const states=[];store.subscribe(state=>states.push(state.status));assert.equal(await store.get(),teacher);assert.deepEqual(states,['authenticated']);
});
test('invalidation during a pending old check cannot replace a newer session',async()=>{
 let finish;let count=0;const store=createSessionStore(()=>++count===1?new Promise(resolve=>{finish=resolve;}):Promise.resolve(teacher));store.seed('anonymous');const old=store.get();await Promise.resolve();store.invalidate();await store.get(true);finish(null);await old;assert.equal(store.getSnapshot().status,'authenticated');
});
test('callers of a superseded check wait for the replacement instead of receiving an unknown session',async()=>{
 const finishes=[];const store=createSessionStore(()=>new Promise(resolve=>finishes.push(resolve)));store.seed('authenticated');const first=store.get();await Promise.resolve();store.invalidate();const second=store.get(true);await Promise.resolve();finishes[0](null);await Promise.resolve();finishes[1](teacher);assert.equal(await first,teacher);assert.equal(await second,teacher);assert.equal(store.getSnapshot().status,'authenticated');
});
test('homepage HTML already has the correct label before client scripts execute',async()=>{
 const html=await readFile(new URL('../app/home.html',import.meta.url),'utf8');
 for(const [cookie,status,label]of [['','anonymous','Đăng nhập'],['cms-access=example','authenticated','Quản lý'],['cms-refresh=example','authenticated','Quản lý'],['cms-access=; cms-refresh=','anonymous','Đăng nhập']]){
  assert.equal(authViewFromCookie(cookie),status);const response=homeWithAuthView(html,new Request('https://school.test/',{headers:{cookie}}));const body=await response.text();assert(body.includes('data-auth-state="'+status+'"'));assert(body.includes('<span data-auth-label>'+label+'</span>'));assert.equal(response.headers.get('Vary'),'Cookie');if(status==='authenticated')assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert(!body.includes('Tài khoản'));
 }
});
