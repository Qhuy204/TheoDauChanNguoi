import {Fragment,type ReactNode} from 'react';
import {readBodyDoc} from '../lib/rich-text.mjs';
type Node={type:string;text?:string;attrs?:{href?:string;level?:number;start?:number;src?:string;alt?:string;caption?:string};marks?:{type:string;attrs?:{href?:string}}[];content?:Node[]};
function render(node:Node,key:number):ReactNode {
  const children=node.content?.map(render);
  switch(node.type){
    case 'text': {let value:ReactNode=node.text;for(const [i,mark] of (node.marks||[]).entries()){
      if(mark.type==='bold') value=<strong key={i}>{value}</strong>;
      if(mark.type==='italic') value=<em key={i}>{value}</em>;
      if(mark.type==='underline') value=<u key={i}>{value}</u>;
      if(mark.type==='strike') value=<s key={i}>{value}</s>;
      if(mark.type==='link') value=<a key={i} href={mark.attrs?.href} target={mark.attrs?.href?.startsWith('/')?undefined:'_blank'} rel="noopener noreferrer">{value}</a>;
    }return <Fragment key={key}>{value}</Fragment>;}
    case 'hardBreak': return <br key={key}/>;
    case 'image': return <figure className="inline-article-image" key={key}><img src={node.attrs?.src} alt={node.attrs?.alt||node.attrs?.caption||'Ảnh trong bài viết'} loading="lazy"/>{node.attrs?.caption&&<figcaption>{node.attrs.caption}</figcaption>}</figure>;
    case 'paragraph': return <p key={key}>{children?.length?children:<br/>}</p>;
    case 'heading': return node.attrs?.level===3?<h3 key={key}>{children}</h3>:<h2 key={key}>{children}</h2>;
    case 'bulletList': return <ul key={key}>{children}</ul>;
    case 'orderedList': return <ol key={key} start={node.attrs?.start}>{children}</ol>;
    case 'listItem': return <li key={key}>{children}</li>;
    case 'blockquote': return <blockquote key={key}>{children}</blockquote>;
    default:return <Fragment key={key}>{children}</Fragment>;
  }
}
export function ArticleBody({body}:{body:string}) {
  try{return <div className="article-body">{(readBodyDoc(body) as Node).content?.map(render)}</div>;}catch{return <p className="article-body">Chưa hiển thị được nội dung bài viết.</p>;}
}
