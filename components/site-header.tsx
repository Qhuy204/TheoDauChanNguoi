export function SiteHeader({active=''}:{active?:string}) {
  return <header className="cms-header"><div className="cms-wrap cms-header-inner"><a className="cms-brand" href="/"><img src="/assets/gia-lam-logo.png" width="64" height="64" alt="Logo Trường Tiểu học Gia Lâm"/><span>Chi bộ 2 – Đảng bộ<br/>Trường Tiểu học Gia Lâm</span></a><nav aria-label="Điều hướng chính"><a href="/">Hành trình của Bác</a><a href="/bai-viet" aria-current={active==='posts'?'page':undefined}>Bài viết</a><a href="/quan-ly" aria-current={active==='manage'?'page':undefined}>Quản lý bài viết</a></nav></div></header>;
}
export function SiteFooter(){return <footer className="cms-footer cms-wrap"><span>Chi bộ 2 – Đảng bộ Trường Tiểu học Gia Lâm</span><a href="/">Về trang hành trình →</a></footer>;}
