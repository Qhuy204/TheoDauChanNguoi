import home from './home.html?raw';
import {homeWithAuthView} from '../lib/auth-view.mjs';
export function GET(request:Request) {return homeWithAuthView(home,request);}
