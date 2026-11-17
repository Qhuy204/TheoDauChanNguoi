import {cookies} from 'next/headers';
import {HeaderControls} from './header-controls';
export async function SiteHeader({active=''}:{active?:string}){
 const jar=await cookies();
 const initialStatus=jar.get('cms-access')?.value||jar.get('cms-refresh')?.value?'authenticated':'anonymous';
 return <HeaderControls active={active} initialStatus={initialStatus}/>;
}
export function SiteFooter(){return <footer className="cms-footer cms-wrap"><span>Chi bộ 2 – Đảng bộ Trường Tiểu học Gia Lâm</span><a href="/">Về trang hành trình →</a></footer>;}
