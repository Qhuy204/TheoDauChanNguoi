export const managementLinks=[
 {label:'Bài viết',href:'/quan-ly'},
 {label:'Giới thiệu website',href:'/noi-dung?muc=site'},
 {label:'Hành trình',href:'/noi-dung?muc=stages'},
 {label:'Kho ảnh',href:'/noi-dung?muc=images'},
 {label:'Câu chuyện',href:'/noi-dung?muc=stories'},
 {label:'Thước phim',href:'/noi-dung?muc=videos'},
 {label:'Liên kết tư liệu',href:'/noi-dung?muc=resourceLinks'},
 {label:'Làm theo Bác',href:'/noi-dung?muc=activities'},
 {label:'Nguồn tham khảo',href:'/noi-dung?muc=sources'},
];
const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v16h-6M4 12h11m-4-4 4 4-4 4"/></svg>';
export function authControlMarkup(status){
 if(status!=='authenticated')return `<a class="school-login" data-auth-link href="/dang-nhap">${icon}<span data-auth-label>Đăng nhập</span></a>`;
 return `<details class="school-account"><summary class="school-login" aria-label="Quản lý">${icon}<span data-auth-label>Quản lý</span></summary><nav class="school-account-menu" aria-label="Chức năng quản lý"><p>Chọn chức năng</p>${managementLinks.map(item=>`<a href="${item.href}">${item.label}</a>`).join('')}</nav></details>`;
}
export function bindManagementMenu(container){
 const doc=container.ownerDocument;
 const close=()=>{const details=container.querySelector('details');if(details)details.open=false;};
 const outside=event=>{if(!container.contains(event.target))close();};
 const escape=event=>{const details=container.querySelector('details');if(event.key==='Escape'&&details?.open){event.preventDefault();details.open=false;details.querySelector('summary')?.focus();}};
 const navigate=event=>{if(event.target.closest('.school-account-menu a'))close();};
 doc.addEventListener('click',outside);doc.addEventListener('keydown',escape);container.addEventListener('click',navigate);
 return()=>{doc.removeEventListener('click',outside);doc.removeEventListener('keydown',escape);container.removeEventListener('click',navigate);};
}
