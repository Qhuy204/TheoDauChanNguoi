export const RICH_PREFIX = 'richtext:v1:';
const blockTypes = new Set(['paragraph','heading','bulletList','orderedList','blockquote','image']);
const inlineTypes = new Set(['text','hardBreak']);
const simpleMarks = new Set(['bold','italic','underline','strike']);
export function safeLink(value) {
  if(typeof value !== 'string' || value.length > 2000 || /[\u0000-\u0020\u007f]/.test(value)) return null;
  if(value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value;
  try { const url = new URL(value); return ['https:','http:','mailto:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function normalizeDoc(value) {
  let count=0,characters=0;
  const clean=(node,depth=0)=>{
    if(!node || typeof node!=='object' || ++count>5000 || depth>16) throw new Error('Nội dung quá phức tạp. Vui lòng chia nhỏ bài viết.');
    if(node.type==='text') {
      if(typeof node.text!=='string') throw new Error('Nội dung văn bản chưa hợp lệ.');
      characters+=node.text.length; if(characters>50000) throw new Error('Nội dung tối đa 50.000 ký tự.');
      const marks=[];
      for(const mark of Array.isArray(node.marks)?node.marks:[]) {
        if(simpleMarks.has(mark?.type) && !marks.some(m=>m.type===mark.type)) marks.push({type:mark.type});
        if(mark?.type==='link') { const href=safeLink(mark.attrs?.href); if(href&&!marks.some(m=>m.type==='link')) marks.push({type:'link',attrs:{href}}); }
      }
      return {type:'text',text:node.text,...(marks.length?{marks}: {})};
    }
    if(node.type==='hardBreak') return {type:'hardBreak'};
    if(node.type==='image') {
      const id=node.attrs?.assetId||String(node.attrs?.src||'').split('/').pop();
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('Ảnh chưa được tải lên kho tư liệu.');
      return {type:'image',attrs:{assetId:id,src:'/api/cms/assets/'+id,alt:String(node.attrs?.alt||'').slice(0,240),caption:String(node.attrs?.caption||'').slice(0,500)}};
    }
    if(!['doc','listItem',...blockTypes].includes(node.type)) throw new Error('Định dạng nội dung chưa được hỗ trợ.');
    const raw=node.content??[]; if(!Array.isArray(raw)||raw.length>5000) throw new Error('Cấu trúc bài viết chưa hợp lệ.');
    const content=raw.map(child=>clean(child,depth+1));
    const allowed=node.type==='paragraph'||node.type==='heading'?inlineTypes:node.type==='bulletList'||node.type==='orderedList'?new Set(['listItem']):blockTypes;
    if(content.some(child=>!allowed.has(child.type))) throw new Error('Cấu trúc đoạn văn chưa hợp lệ.');
    if(node.type==='listItem'&&content[0]?.type!=='paragraph') content.unshift({type:'paragraph'});
    const result={type:node.type,...(content.length?{content}:{})};
    if(node.type==='heading') result.attrs={level:node.attrs?.level===3?3:2};
    if(node.type==='orderedList') result.attrs={start:Math.min(999,Math.max(1,Math.trunc(Number(node.attrs?.start)||1)))};
    return result;
  };
  const doc=clean(value); if(doc.type!=='doc') throw new Error('Bài viết cần có phần nội dung.');
  if(!doc.content?.length) doc.content=[{type:'paragraph'}];
  return doc;
}
export function legacyDoc(body='') {
  const textNode=text=>text?[{type:'text',text}]:[];
  return {type:'doc',content:body.split(/\n\s*\n/).filter(Boolean).map(block=>{
    if(block.startsWith('## ')) return {type:'heading',attrs:{level:2},content:textNode(block.slice(3))};
    if(block.split('\n').every(line=>line.startsWith('- '))) return {type:'bulletList',content:block.split('\n').map(line=>({type:'listItem',content:[{type:'paragraph',content:textNode(line.slice(2))}]}))};
    return {type:'paragraph',content:block.split('\n').flatMap((line,i)=>[...(i?[{type:'hardBreak'}]:[]),...textNode(line)])};
  }).concat(body.trim()?[]:[{type:'paragraph'}])};
}
export function readBodyDoc(body='') { return normalizeDoc(body.startsWith(RICH_PREFIX)?JSON.parse(body.slice(RICH_PREFIX.length)):legacyDoc(body)); }
export function docText(doc) {
  if(doc.type==='text') return doc.text;
  if(doc.type==='hardBreak') return '\n';
  return (doc.content||[]).map(docText).join(['paragraph','heading'].includes(doc.type)?'':'\n');
}
export function encodeDoc(doc) { return RICH_PREFIX+JSON.stringify(normalizeDoc(doc)); }
export function normalizeBody(body) {
  if(!body.startsWith(RICH_PREFIX)) return {body,text:body};
  const doc=readBodyDoc(body); return {body:encodeDoc(doc),text:docText(doc).trim()};
}
export function bodyAssets(body) { if(!body?.startsWith(RICH_PREFIX))return [];const ids=[];const walk=n=>{if(n.type==='image')ids.push(n.attrs.assetId);for(const child of n.content||[])walk(child);};walk(readBodyDoc(body));return [...new Set(ids)]; }
