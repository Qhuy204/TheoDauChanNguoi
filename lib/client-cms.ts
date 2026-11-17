'use client';
export function notifyPublicChange(){try{localStorage.setItem('cms:invalidate',String(Date.now()));}catch{}window.dispatchEvent(new Event('cms:published'));}
export async function cmsApi(path:string,options:RequestInit={}):Promise<any>{
 const r=await fetch('/api/cms/'+path,{...options,cache:'no-store',headers:{'X-Requested-With':'cms',...(options.body&&typeof options.body==='string'?{'Content-Type':'application/json'}:{}),...options.headers}});
 const v:any=await r.json();if(r.status===401){location.assign('/dang-nhap');throw new Error('Vui lòng đăng nhập lại.');}if(!r.ok)throw new Error(v.error||'Chưa hoàn thành được thao tác.');return v;
}
export async function prepareImage(file:File):Promise<Blob>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Chọn ảnh JPG, PNG hoặc WebP.');
 if(file.size>20*1024*1024)throw new Error('Ảnh gốc cần nhỏ hơn 20 MB.');
 const bitmap=await createImageBitmap(file);
 try{
  if(Math.max(bitmap.width,bitmap.height)<=1600&&file.size<=1024*1024)return file;
  const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
  canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(new Error('Chưa xử lý được ảnh.')),'image/webp',.86));
  const result=blob.size<file.size?blob:file;if(result.size>5242880)throw new Error('Ảnh sau xử lý cần nhỏ hơn 5 MB.');return result;
 }finally{bitmap.close();}
}
export async function uploadImage(file:File,scope:'post'|'site'='post'){
 const image=await prepareImage(file);return (await cmsApi('uploads?scope='+scope,{method:'POST',body:image,headers:{'Content-Type':image.type}})).asset as {id:string;src:string};
}
