export function ArticleBody({body}:{body:string}) {
  return <div className="article-body">{body.split(/\n\s*\n/).filter(Boolean).map((block,i)=> {
    if(block.startsWith('## ')) return <h2 key={i}>{block.slice(3)}</h2>;
    if(block.split('\n').every(line=>line.startsWith('- '))) return <ul key={i}>{block.split('\n').map((line,j)=><li key={j}>{line.slice(2)}</li>)}</ul>;
    return <p key={i}>{block}</p>;
  })}</div>;
}
