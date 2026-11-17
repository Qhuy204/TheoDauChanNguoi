import {SiteHeader,SiteFooter} from '../../components/site-header';
import {PostManager} from '../../components/post-manager';
export const metadata={title:'Quản lý bài viết · Trường Tiểu học Gia Lâm'};
export default function Manage(){return <><SiteHeader active="manage"/><PostManager/><SiteFooter/></>;}
