'use client';
import {useEffect,useRef,useState} from 'react';
import {watchAuth} from '../public/auth-session.js';
const navigation=[['/#gioi-thieu','Giới thiệu'],['/#hanh-trinh','Hành trình'],['/#tu-lieu','Tư liệu'],['/#lam-theo-bac','Làm theo Bác'],['/bai-viet','Bài viết']];
export function HeaderControls({active='',initialStatus}:{active?:string;initialStatus:string}){
 const [open,setOpen]=useState(false),[status,setStatus]=useState(initialStatus),toggle=useRef<HTMLButtonElement>(null);
 useEffect(()=>watchAuth(state=>setStatus(state.status),initialStatus),[initialStatus]);
 useEffect(()=>{if(!open)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);toggle.current?.focus();}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[open]);
 const signedIn=status==='authenticated';
 return <header className="school-header" data-auth-state={status}><div className="school-header-inner"><a className="school-brand" href="/" aria-label="Chi bộ 2 – Đảng bộ Trường Tiểu học Gia Lâm – về đầu trang"><img src="/assets/gia-lam-logo.png" width="76" height="76" alt="Logo Trường Tiểu học Gia Lâm"/><span className="school-brand-copy">Chi bộ 2 – Đảng bộ Trường Tiểu học Gia Lâm</span></a><div className="school-header-actions"><nav id="school-navigation" className={'school-nav'+(open?' is-open':'')} aria-label="Điều hướng chính">{navigation.map(([href,label])=><a key={href} href={href} className={active==='posts'&&href==='/bai-viet'?'is-active':undefined} aria-current={active==='posts'&&href==='/bai-viet'?'page':undefined} onClick={()=>setOpen(false)}>{label}</a>)}</nav><a className="school-login" href={signedIn?'/noi-dung':'/dang-nhap'} aria-label={signedIn?'Quản lý nội dung website':'Đăng nhập'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v16h-6M4 12h11m-4-4 4 4-4 4"/></svg><span>{signedIn?'Quản lý':'Đăng nhập'}</span></a><button ref={toggle} type="button" className="school-menu" aria-expanded={open} aria-controls="school-navigation" aria-label={open?'Đóng menu điều hướng':'Mở menu điều hướng'} onClick={()=>setOpen(!open)}><span/><span/><span/></button></div></div></header>;
}
