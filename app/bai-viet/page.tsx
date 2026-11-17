import {env} from 'cloudflare:workers';
import {publicPosts,config} from '../../lib/cms-api.mjs';
import {SiteHeader,SiteFooter} from '../../components/site-header';
export const dynamic='force-dynamic';
export const metadata={title:'Bài viết · Trường Tiểu học Gia Lâm'};
export default async function Posts({searchParams}:{searchParams:Promise<{page?:string}>}){
  const p=await searchParams; const page=Math.min(1000,Math.max(1,Number(p.page)||1));
  let posts:any[]=[]; let failed=false;
  try{posts=await publicPosts(config(env),{page});}catch{failed=true;}
  return <><SiteHeader active="posts"/><main className="cms-wrap posts-page"><div className="page-heading"><div><p className="overline">Từ nhà trường</p><h1>Bài viết</h1><p>Chuyện học tập, hoạt động của thầy cô và học sinh Trường Tiểu học Gia Lâm.</p></div><a className="quiet-link" href="/quan-ly">Đăng bài →</a></div>{failed?<div className="empty-message"><h2>Chưa tải được bài viết</h2><p>Vui lòng thử lại sau ít phút.</p><a href="/bai-viet">Tải lại</a></div>:posts.length===0?<div className="empty-message"><h2>{page>1?'Đã hết bài viết':'Chưa có bài viết mới'}</h2><p>{page>1?'Quay lại để xem các bài trước.':'Bài viết của thầy cô sẽ xuất hiện tại đây sau khi được đăng.'}</p>{page>1&&<a href="/bai-viet">Về trang đầu</a>}</div>:<div className="post-list">{posts.slice(0,12).map(post=><article className="post-row" key={post.id}>{post.cover_path&&<a className="post-cover" href={'/bai-viet/'+post.slug} tabIndex={-1} aria-hidden="true"><img src={'/api/cms/media/'+post.id} alt=""/></a>}<div><p className="post-meta">{post.author_name} · {new Date(post.published_at).toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}</p><h2><a href={'/bai-viet/'+post.slug}>{post.title}</a></h2>{post.summary&&<p>{post.summary}</p>}<a className="quiet-link" href={'/bai-viet/'+post.slug}>Đọc bài →</a></div></article>)}</div>}<nav className="pagination" aria-label="Trang bài viết">{page>1&&<a href={'/bai-viet?page='+(page-1)}>← Trang trước</a>}{posts.length>12&&<a href={'/bai-viet?page='+(page+1)}>Trang sau →</a>}</nav></main><SiteFooter/></>;
}
