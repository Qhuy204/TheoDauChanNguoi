import {SiteHeader,SiteFooter} from '../../components/site-header';
import {SiteContentManager} from '../../components/site-content-manager';
export const metadata={title:'Nội dung website · Trường Tiểu học Gia Lâm'};
export default function Content(){return <><SiteHeader active="manage"/><SiteContentManager/><SiteFooter/></>;}
