import {SiteHeader,SiteFooter} from '../../components/site-header';
import {LoginForm} from '../../components/login-form';
export const metadata={title:'Đăng nhập · Trường Tiểu học Gia Lâm'};
export default function Login(){return <><SiteHeader/><main className="cms-wrap login-page"><a className="quiet-link" href="/bai-viet">← Xem bài viết</a><div className="login-layout"><div><p className="overline">Dành cho giáo viên và quản trị viên</p><h1>Đăng nhập</h1><p>Dùng tài khoản đã được nhà trường cấp để viết và quản lý bài.</p></div><LoginForm/></div></main><SiteFooter/></>;}
