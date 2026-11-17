import {watchAuth} from './auth-session.js';
export function startPublicHeader(){
 const header=document.querySelector('.school-header'),login=header.querySelector('.school-login'),menu=header.querySelector('.school-menu'),nav=header.querySelector('.school-nav');
 const editing=[['.hero-copy','site','Sửa giới thiệu'],['.overview-heading>div','stages','Thêm, sửa hành trình'],['.section-heading>div','images','Thêm, sửa tư liệu'],['.activities-heading','activities','Thêm, sửa việc làm'],['.home-posts-heading>div','posts','Quản lý bài viết']].map(([selector,group,label])=>{
  const parent=document.querySelector(selector);if(!parent)return null;const link=document.createElement('a');link.className='staff-edit-link';link.href=group==='posts'?'/quan-ly':'/noi-dung?muc='+group;link.textContent=label+' →';link.hidden=true;const heading=parent.querySelector('h1,h2');if(heading)heading.after(link);else parent.append(link);return link;
 }).filter(Boolean);
 watchAuth(state=>{const signedIn=state.status==='authenticated',label=signedIn?'Quản lý':'Đăng nhập';header.dataset.authState=state.status;login.href=signedIn?'/noi-dung':'/dang-nhap';if(login.querySelector('span').textContent!==label)login.querySelector('span').textContent=label;login.setAttribute('aria-label',signedIn?'Quản lý nội dung website':'Đăng nhập');editing.forEach(link=>{link.hidden=!signedIn;});},header.dataset.authState||'anonymous');
 const close=()=>{menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Mở menu điều hướng');nav.classList.remove('is-open');};
 menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Đóng menu điều hướng':'Mở menu điều hướng');nav.classList.toggle('is-open',open);});
 document.addEventListener('click',event=>{if(event.target.closest('.school-nav a')||!event.target.closest('.school-header'))close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){close();menu.focus();}});
 addEventListener('resize',()=>{if(innerWidth>1180)close();});
}
