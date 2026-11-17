import {env} from 'cloudflare:workers';
import {notFound} from 'next/navigation';
import {config,publicPosts} from '../../../lib/cms-api.mjs';
import {SiteHeader,SiteFooter} from '../../../components/site-header';
import {ArticleBody} from '../../../components/article-body';
export const dynamic='force-dynamic';
export default async function Post({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; let posts:any[];
  try{posts=await publicPosts(config(env),{slug});}catch{return <><SiteHeader active="posts"/><main className="cms-wrap empty-message"><h1>Chưa tải được bài viết</h1><p>Vui lòng thử lại sau ít phút.</p><a href="/bai-viet">← Về danh sách bài viết</a></main></>;}
  const post=posts[0]; if(!post) notFound();
  return <><SiteHeader active="posts"/><main className="article-page cms-wrap"><a className="quiet-link" href="/bai-viet">← Bài viết</a><article><header className="article-heading"><p className="post-meta">{post.author_name} · {new Date(post.published_at).toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}</p><h1>{post.title}</h1>{post.summary&&<p className="article-summary">{post.summary}</p>}</header>{post.cover_path&&<figure className="article-cover"><img src={'/api/cms/media/'+post.id} alt={post.cover_alt||post.title}/>{post.cover_alt&&<figcaption>{post.cover_alt}</figcaption>}</figure>}<ArticleBody body={post.body}/></article></main><SiteFooter/></>;
}
