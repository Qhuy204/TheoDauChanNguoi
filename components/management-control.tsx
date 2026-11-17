'use client';
import {useEffect,useRef} from 'react';
import {managementLinks,bindManagementMenu} from '../public/management-menu.js';
export function ManagementControl({signedIn,onOpen}:{signedIn:boolean;onOpen?:()=>void}){
 const container=useRef<HTMLDivElement>(null);
 useEffect(()=>bindManagementMenu(container.current!),[]);
 const icon=<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v16h-6M4 12h11m-4-4 4 4-4 4"/></svg>;
 return <div className="school-account-slot" ref={container}>{signedIn?<details className="school-account" onToggle={event=>{if(event.currentTarget.open)onOpen?.();}}><summary className="school-login" aria-label="Quản lý">{icon}<span data-auth-label>Quản lý</span></summary><nav className="school-account-menu" aria-label="Chức năng quản lý"><p>Chọn chức năng</p>{managementLinks.map(item=><a key={item.href} href={item.href}>{item.label}</a>)}</nav></details>:<a className="school-login" href="/dang-nhap">{icon}<span data-auth-label>Đăng nhập</span></a>}</div>;
}
