// A rendering hint only. Every protected operation still verifies the session and RLS.
import {authControlMarkup} from '../public/management-menu.js';
export function authViewFromCookie(header=''){
 return /(?:^|;\s*)cms-(?:access|refresh)=[^;\s]+/.test(header)?'authenticated':'anonymous';
}
export function homeWithAuthView(html,request){
 const status=authViewFromCookie(request.headers.get('cookie')||''),signedIn=status==='authenticated';
 const body=html.replace('data-auth-state="anonymous"',`data-auth-state="${status}"`)
  .replace(/<!--auth-control:start-->[\s\S]*?<!--auth-control:end-->/,`<!--auth-control:start-->${authControlMarkup(status)}<!--auth-control:end-->`);
 return new Response(body,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':signedIn?'private, no-store':'public, max-age=0, must-revalidate',Vary:'Cookie'}});
}
