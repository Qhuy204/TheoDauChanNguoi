const id=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
import {withResourceLinks} from '../public/resource-links.js';
export function assetSource(value){return typeof value==='string'&&(/^(?:\/)?assets\/[a-zA-Z0-9._/-]+$/.test(value)&&!value.includes('..')||/^\/api\/cms\/assets\/[0-9a-f-]{36}$/i.test(value));}
export function validateSiteContent(input,{draft=false}={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Nội dung website chưa hợp lệ.');
 const d=withResourceLinks(JSON.parse(JSON.stringify(input)));if(JSON.stringify(d).length>300000)throw Error('Nội dung website vượt quá dung lượng cho phép.');
 const text=(v,label,max=5000,required=true)=>{if(typeof v!=='string'||v.length>max||(required&&!draft&&!v.trim()))throw Error('Vui lòng kiểm tra '+label+'.');};
 const url=(v,label,required=true)=>{if((!required||draft)&&!v)return;try{if(!['http:','https:'].includes(new URL(v).protocol))throw 0;}catch{throw Error('Liên kết '+label+' chưa hợp lệ.');}};
 const list=(v,label,max=100)=>{if(!Array.isArray(v)||v.length>max)throw Error('Danh sách '+label+' chưa hợp lệ.');};
 const ref=(v,set,label)=>{if(!set.has(v))throw Error('Chưa chọn đúng '+label+'.');};
 if(!d.site||!d.images||!d.sources)throw Error('Thiếu thông tin website.');
 for(const k of ['title','subtitle','unit','intro','schoolName'])text(d.site[k],'phần giới thiệu',k==='intro'?3000:200);
 for(const k of ['heroImage','activityImage'])if(!assetSource(d.site[k]))throw Error('Ảnh giới thiệu chưa hợp lệ.');
 if(d.site.labels){if(typeof d.site.labels!=='object'||Array.isArray(d.site.labels))throw Error('Tiêu đề các khu vực chưa hợp lệ.');for(const [k,v]of Object.entries(d.site.labels)){if(!/^[a-zA-Z]+$/.test(k))throw Error('Tên khu vực không hợp lệ.');text(v,'tiêu đề khu vực',300,false);}}
 const images=new Set(Object.keys(d.images));if(!images.size||images.size>150)throw Error('Kho ảnh cần từ 1 đến 150 ảnh.');
 for(const [key,img]of Object.entries(d.images)){if(!id.test(key))throw Error('Mã ảnh chưa hợp lệ.');text(img.title,'tên ảnh',200);text(img.alt,'mô tả ảnh',1000,false);text(img.caption,'chú thích ảnh',1000,false);text(img.credit,'nguồn ảnh',2000,false);if(!assetSource(img.src))throw Error('Ảnh '+img.title+' chưa được tải lên.');if(!['illustration','photo','archive'].includes(img.kind))throw Error('Loại ảnh chưa hợp lệ.');url(img.url,'nguồn ảnh',false);url(img.licenseUrl,'giấy phép ảnh',false);}
 const sourceKeys=new Set(Object.keys(d.sources));if(sourceKeys.size>100)throw Error('Quá nhiều nguồn tham khảo.');for(const [key,s]of Object.entries(d.sources)){if(!id.test(key)&&!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key))throw Error('Mã nguồn chưa hợp lệ.');text(s.name,'tên nguồn',500);url(s.url,'nguồn tham khảo');}
 list(d.stages,'hành trình',32);if(!d.stages.length)throw Error('Hành trình cần có ít nhất một chặng.');list(d.stories,'câu chuyện',100);list(d.videos,'thước phim',100);list(d.activities,'việc làm',30);
 const ids=(items,label)=>{const result=new Set();for(const item of items){if(typeof item.id!=='string'||!id.test(item.id)||result.has(item.id))throw Error('Mã '+label+' bị trùng hoặc chưa hợp lệ.');result.add(item.id);}return result;};
 const stages=ids(d.stages,'chặng'),stories=ids(d.stories,'câu chuyện');ids(d.videos,'phim');
 list(d.resourceLinks,'liên kết tư liệu',30);ids(d.resourceLinks,'liên kết');for(const link of d.resourceLinks){text(link.title,'tên trang tư liệu',200);link.description??='';text(link.description,'giới thiệu trang tư liệu',1000,false);text(link.url,'đường dẫn trang tư liệu',2000,false);url(link.url,'trang tư liệu');}
 const sources=v=>{list(v||[],'nguồn',20);for(const k of v||[])ref(k,sourceKeys,'nguồn tham khảo');};
 for(const s of d.stages){for(const k of ['title','years','shortTitle','place'])text(s[k],'chặng '+s.title,300);text(s.intro,'giới thiệu chặng '+s.title);text(s.lesson,'câu hỏi thảo luận',1000,false);ref(s.image,images,'ảnh cho '+s.title);if(s.storyId)ref(s.storyId,stories,'câu chuyện cho '+s.title);if(!s.word)throw Error('Thiếu từ vựng của chặng.');text(s.word.term,'từ vựng',200,false);text(s.word.meaning,'nghĩa từ',2000,false);list(s.events,'mốc thời gian',30);for(const e of s.events){text(e.date,'thời gian',150);text(e.title,'tên mốc',300);text(e.text,'mô tả mốc',3000);}sources(s.sourceIds);}
 for(const s of d.stories){text(s.title,'tên câu chuyện',300);ref(s.stage,stages,'chặng của câu chuyện');ref(s.image,images,'ảnh câu chuyện');list(s.paragraphs,'đoạn kể',100);for(const p of s.paragraphs)text(p,'nội dung câu chuyện',10000);text(s.question,'câu hỏi',1000,false);sources(s.sourceIds);}
 for(const v of d.videos){v.shortTitle||=v.title;v.description??='';v.summary??='';for(const k of ['title','shortTitle','sourceName'])text(v[k],'thông tin phim',500);text(v.description,'mô tả phim',3000,false);text(v.summary,'câu hỏi phim',3000,false);if(v.stage!=='all')ref(v.stage,stages,'chặng của phim');ref(v.image,images,'ảnh phim');url(v.url,'trang phim');url(v.src,'tệp phim');}
 for(const a of d.activities){if(!['book','heart','leaf'].includes(a.icon))throw Error('Biểu tượng hoạt động chưa hợp lệ.');text(a.title,'tên hoạt động',200);text(a.text,'giới thiệu hoạt động',3000,false);list(a.actions,'việc làm',30);for(const action of a.actions)text(action,'việc làm',1000);}
 return d;
}
export function siteAssetIds(d){const ids=new Set();const visit=v=>{if(typeof v==='string'&&/^\/api\/cms\/assets\/[0-9a-f-]{36}$/i.test(v))ids.add(v.split('/').pop());else if(v&&typeof v==='object')for(const child of Object.values(v))visit(child);};visit(d);return [...ids];}
export function removeSiteItem(content,group,key){
 const d=structuredClone(content),item=Array.isArray(d[group])?d[group][key]:d[group]?.[key];if(!item)throw Error('Không tìm thấy mục cần xóa.');
 const references=[];
 if(group==='stages'){if(d.stages.length===1)throw Error('Hành trình cần ít nhất một chặng.');for(const x of [...d.stories,...d.videos])if(x.stage===item.id)references.push(x.title);}
 if(group==='stories')for(const x of d.stages)if(x.storyId===item.id)references.push(x.title);
 if(group==='images'){
  if(Object.keys(d.images).length===1)throw Error('Kho ảnh cần ít nhất một ảnh.');
  for(const x of [...d.stages,...d.stories,...d.videos])if(x.image===key)references.push(x.title);
  if(d.site.heroImage===item.src)references.push('ảnh giới thiệu đầu trang');if(d.site.activityImage===item.src)references.push('ảnh hoạt động học sinh');
 }
 if(group==='sources')for(const x of [...d.stages,...d.stories])if(x.sourceIds?.includes(key))references.push(x.title);
 if(references.length)throw Error('Mục này đang được dùng tại: '+[...new Set(references)].slice(0,4).join(', ')+'. Hãy bỏ liên kết hoặc chọn mục thay thế trước khi xóa.');
 if(Array.isArray(d[group]))d[group].splice(key,1);else delete d[group][key];return d;
}
