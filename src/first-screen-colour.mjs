// What covers a page's first screen and which colour its links and buttons use. Shared by
// scripts/collect-colours.mjs (human-made sites) and scripts/refine-bench/trade-fit.mjs (refined mocks).
import {accentFamily} from './refine-log.mjs';

// Runs in the page: what covers the first screen (sampled on a grid) and which colour its links and buttons use.
export function colourProbe(){
 const W=innerWidth,H=innerHeight,rgba=v=>{const m=String(v).match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(/[ ,/]+/).filter(Boolean).map(Number);return [p[0],p[1],p[2],p.length>3?p[3]:1];};
 const media=el=>['IMG','VIDEO','CANVAS','PICTURE','IFRAME'].includes(el.tagName)||(el.tagName==='svg'&&el.getBoundingClientRect().width*el.getBoundingClientRect().height>40000)||/url\(/.test(getComputedStyle(el).backgroundImage);
 // A transparent body and html show the browser's white canvas.
 const solid=v=>{const c=rgba(v);return c&&c[3]>.5?c.slice(0,3):null;};
 const rootBg=solid(getComputedStyle(document.body).backgroundColor)||solid(getComputedStyle(document.documentElement).backgroundColor)||[255,255,255];
 const cells=[];
 for(let y=0;y<14;y++)for(let x=0;x<24;x++){
  // Every element stacked at the point, top first, not only the topmost one and its parents: a photo often sits
  // beside its text overlay rather than under it in the tree, and a ::after overlay makes the photo's own box the
  // topmost element. A box's background paints under its descendants, so it hides a photo only when it does not
  // contain it (a fallback colour behind a cover photo is not the ground).
  let hit=null;const stack=document.elementsFromPoint((x+.5)*W/24,(y+.5)*H/14).filter(e=>e!==document.documentElement);
  for(const e of stack){if(media(e)){hit='image';break;}const c=rgba(getComputedStyle(e).backgroundColor);if(c&&c[3]>.5){hit=stack.some(d=>d!==e&&e.contains(d)&&media(d))?'image':c.slice(0,3);break;}}
  cells.push(hit||rootBg);
 }
 const acc=[];
 for(const el of document.querySelectorAll('a[href],button,[role=button],input[type=submit]')){
  const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;const s=getComputedStyle(el);
  for(const v of [s.backgroundColor,s.color,s.borderTopColor]){const c=rgba(v);if(c&&c[3]>.5)acc.push(c.slice(0,3));}
  if(acc.length>400)break;
 }
 return {rootBg,cells,acc};
}

const hsl=([r,g,b])=>{r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;return {s:d?d/(1-Math.abs(2*l-1)):0,l};};
// What a ground cell reads as: white, a faint tint, dark, a clear colour family, or an image.
export function cellClass(c){
 if(c==='image')return 'image';
 const {s,l}=hsl(c);
 if(l<.18)return 'dark';
 if(Math.min(...c)>=247&&Math.max(...c)-Math.min(...c)<=8)return 'white';
 if(s<.2||l>.9)return 'tint';
 const f=accentFamily(c);return f==='ink'?'dark':f;
}
export function measureColours(m){
 const n=m.cells.length,share={};
 for(const c of m.cells){const k=cellClass(c);share[k]=(share[k]||0)+1/n;}
 const colour=Object.entries(share).filter(([k])=>!['white','tint','dark','image'].includes(k)).sort((a,b)=>b[1]-a[1])[0];
 const counts=new Map();for(const c of m.acc){const {s,l}=hsl(c);if(s<.25||l<.1||l>.88)continue;const f=accentFamily(c);if(!f||f==='ink')continue;counts.set(f,(counts.get(f)||0)+1);}
 const accent=[...counts].sort((a,b)=>b[1]-a[1])[0]?.[0]??'ink';
 // The ground is a clear colour when one family covers a quarter of the first screen or more.
 const ground=colour&&colour[1]>=.25?colour[0]:(share.dark||0)>=.5?'dark':(share.image||0)>=.5?'image':'light';
 const r=x=>Math.round(x*1000)/1000;
 return {ground,accent,share:Object.fromEntries(Object.entries(share).map(([k,v])=>[k,r(v)])),rootBg:m.rootBg};
}
