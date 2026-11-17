import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeDoc,readBodyDoc,docText,safeLink,RICH_PREFIX,normalizeBody} from '../lib/rich-text.mjs';
import {validatePost} from '../lib/cms-api.mjs';
const text=(value,marks=[])=>({type:'text',text:value,marks});
const paragraph=(value,marks)=>({type:'paragraph',content:[text(value,marks)]});
test('formatted documents survive save/reload with headings, lists, links and marks',()=>{
 const original={type:'doc',content:[{type:'heading',attrs:{level:2},content:[text('Hoạt động của trường')]},paragraph('Đọc sách cùng bạn',[{type:'bold'},{type:'italic'},{type:'underline'}]),{type:'orderedList',attrs:{start:3},content:[{type:'listItem',content:[paragraph('Giữ gìn sách vở')]}]},paragraph('Tư liệu',[{type:'link',attrs:{href:'https://hochiminh.vn/'}}])]};
 const saved=encodeDoc(original),doc=readBodyDoc(saved);
 assert.equal(encodeDoc(doc),saved);assert(docText(doc).includes('Đọc sách cùng bạn'));assert.equal(doc.content[0].attrs.level,2);assert.equal(doc.content[2].attrs.start,3);assert.equal(doc.content[1].content[0].marks.length,3);
});
test('legacy paragraphs, headings and bullet lists remain editable without losing text',()=>{
 const doc=readBodyDoc('Một đoạn cũ.\nDòng tiếp theo.\n\n## Tiêu đề cũ\n\n- Ý thứ nhất\n- Ý thứ hai');
 assert.deepEqual(doc.content.map(n=>n.type),['paragraph','heading','bulletList']);assert.equal(doc.content[0].content[1].type,'hardBreak');assert(docText(readBodyDoc(encodeDoc(doc))).includes('Ý thứ hai'));
});
test('unsafe links and arbitrary HTML attributes are not persisted',()=>{
 const doc=readBodyDoc(encodeDoc({type:'doc',content:[{type:'paragraph',attrs:{onclick:'alert(1)',style:'color:red'},content:[text('<script>text</script>',[{type:'link',attrs:{href:'javascript:alert(1)'}},{type:'bold',attrs:{onclick:'bad'}}])]}]}));
 assert.equal(doc.content[0].attrs,undefined);assert.deepEqual(doc.content[0].content[0].marks,[{type:'bold'}]);assert.equal(doc.content[0].content[0].text,'<script>text</script>');
 for(const url of ['javascript:alert(1)','data:text/html,boom','//evil.test','/\\evil.test','java\nscript:alert(1)'])assert.equal(safeLink(url),null);
 assert.equal(safeLink('/bai-viet'),'/bai-viet');assert.equal(safeLink('https://hochiminh.vn'),'https://hochiminh.vn/');
});
test('malformed or unsupported embedded nodes are rejected',()=>{
 assert.throws(()=>normalizeBody(RICH_PREFIX+'not-json'));assert.throws(()=>encodeDoc({type:'doc',content:[{type:'iframe',attrs:{src:'https://evil.test'}}]}));assert.throws(()=>encodeDoc({type:'doc',content:[{type:'paragraph',content:[{type:'heading',content:[]}]}]}));
});
test('publication checks visible text rather than serialized JSON length',()=>{
 const draft={title:'Bài thử',slug:'bai-thu',summary:'',cover_alt:'',body:encodeDoc({type:'doc',content:[paragraph('Ngắn',[{type:'bold'},{type:'italic'},{type:'underline'}])]}),status:'published'};
 assert(draft.body.length>50);assert.throws(()=>validatePost(draft),/ít nhất 50/);
 const body=encodeDoc({type:'doc',content:[paragraph('Nội dung bài viết đủ dài để được xuất bản trên website và có định dạng in đậm.',[{type:'bold'}])]});
 assert.equal(validatePost({...draft,body}).body,body);
});
test('oversized and deeply nested documents cannot exhaust rendering',()=>{
 assert.throws(()=>encodeDoc({type:'doc',content:[paragraph('a'.repeat(50001))]}));let node=paragraph('x');for(let i=0;i<20;i++)node={type:'blockquote',content:[node]};assert.throws(()=>encodeDoc({type:'doc',content:[node]}));
});
