#!/usr/bin/env node
// Measure the colours human-made sites use on their first screen, by page kind and country.
// Usage: node scripts/collect-colours.mjs [scripts/colour-sites.tsv] [data/colour-reference] [--concurrency 3]
//   sites.tsv: "trade<TAB>kind<TAB>country<TAB>url" per line; # starts a comment.
// Keeps measurements only (host, colours, shares). No page text or screenshots are stored.
// robots.txt is checked for the "*" group before a site is opened; blocked sites are skipped.
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {robotsAllows} from '../src/reference.mjs';
import {accentFamily} from '../src/refine-log.mjs';

const args=process.argv.slice(2).filter(a=>!a.startsWith('--')&&!/^\d+$/.test(a));
const listPath=args[0]||'scripts/colour-sites.tsv',outDir=args[1]||'data/colour-reference';
const opt=(n,d)=>{const i=process.argv.indexOf(n);return i>0?Number(process.argv[i+1])||d:d;};
const concurrency=opt('--concurrency',3);
const UA='ui-refiner-reference/0.7 (design measurement; robots-aware)';
const rows=(await fs.readFile(listPath,'utf8')).split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>{const [trade,kind,country,url]=l.split('\t');return {trade,kind,country,url};}).filter(r=>r.url?.startsWith('http'));

async function allowed(u){
 const x=new URL(u);
 try{const r=await fetch(`${x.origin}/robots.txt`,{headers:{'user-agent':UA},signal:AbortSignal.timeout(10000)});return r.status>=400?true:robotsAllows(await r.text(),x.pathname);}
 catch{return null;}
}

// Runs in the page: what covers the first screen (sampled on a grid) and which colour its links and buttons use.
function probe(){
 const W=innerWidth,H=innerHeight,rgba=v=>{const m=String(v).match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(/[ ,/]+/).filter(Boolean).map(Number);return [p[0],p[1],p[2],p.length>3?p[3]:1];};
 const media=el=>['IMG','VIDEO','CANVAS','PICTURE','IFRAME'].includes(el.tagName)||(el.tagName==='svg'&&el.getBoundingClientRect().width*el.getBoundingClientRect().height>40000)||/url\(/.test(getComputedStyle(el).backgroundImage);
 // A transparent body and html show the browser's white canvas.
 const solid=v=>{const c=rgba(v);return c&&c[3]>.5?c.slice(0,3):null;};
 const rootBg=solid(getComputedStyle(document.body).backgroundColor)||solid(getComputedStyle(document.documentElement).backgroundColor)||[255,255,255];
 const cells=[];
 for(let y=0;y<14;y++)for(let x=0;x<24;x++){
  let el=document.elementFromPoint((x+.5)*W/24,(y+.5)*H/14),hit=null;
  for(let e=el;e&&e!==document.documentElement;e=e.parentElement){if(media(e)){hit='image';break;}const c=rgba(getComputedStyle(e).backgroundColor);if(c&&c[3]>.5){hit=c.slice(0,3);break;}}
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
function cellClass(c){
 if(c==='image')return 'image';
 const {s,l}=hsl(c);
 if(l<.18)return 'dark';
 if(Math.min(...c)>=247&&Math.max(...c)-Math.min(...c)<=8)return 'white';
 if(s<.2||l>.9)return 'tint';
 const f=accentFamily(c);return f==='ink'?'dark':f;
}
function measure(m){
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

await fs.mkdir(outDir,{recursive:true});
// Each result is appended to sites.jsonl as it comes in, so a stopped run resumes where it left off.
const logPath=path.join(outDir,'sites.jsonl');
const prior=await fs.readFile(logPath,'utf8').catch(()=>'');
const seen=new Map();for(const l of prior.split('\n').filter(Boolean)){const r=JSON.parse(l);seen.set(r.host,r);}
const todo=rows.filter(r=>!seen.has(new URL(r.url).hostname.replace(/^www\./,'')));
console.log(`${seen.size} done before, ${todo.length} to go`);
const browser=await chromium.launch();
let i=0,n=0;
const hard=(p,ms)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error('hard timeout')),ms))]);
async function worker(){
 const ctxs={},ctxFor=async c=>ctxs[c]??=await browser.newContext({viewport:{width:1440,height:900},userAgent:UA+' Chrome/130',locale:c==='KR'?'ko-KR':c==='JP'?'ja-JP':'en-US'});
 while(i<todo.length){
  const row=todo[i++],host=new URL(row.url).hostname.replace(/^www\./,'');
  let rec;
  const ok=await hard(allowed(row.url),20000).catch(()=>null);
  if(ok===false)rec={host,skipped:'robots'};
  else{
   let page;
   try{
    page=await hard((await ctxFor(row.country)).newPage(),15000);
    rec=await hard((async()=>{await page.goto(row.url,{waitUntil:'load',timeout:30000});await page.waitForTimeout(2500);return {host,trade:row.trade,kind:row.kind,country:row.country,...measure(await page.evaluate(probe))};})(),60000);
   }catch(e){rec={host,skipped:(e.message||'').split('\n')[0].slice(0,80)};
    // A page that hung may have wedged its context; start a fresh one for the next site.
    const c=ctxs[row.country];delete ctxs[row.country];c?.close().catch(()=>{});}
   finally{page?.close().catch(()=>{});}
  }
  await fs.appendFile(logPath,JSON.stringify(rec)+'\n');
  n++;console.log(`[${n}/${todo.length}] ${rec.skipped?'skip '+host+' ('+rec.skipped+')':host+' '+rec.ground+'/'+rec.accent}`);
 }
 for(const c of Object.values(ctxs))await c.close().catch(()=>{});
}
await Promise.all(Array.from({length:concurrency},worker));
await browser.close();
const all=(await fs.readFile(logPath,'utf8')).split('\n').filter(Boolean).map(l=>JSON.parse(l));
const latest=[...new Map(all.map(r=>[r.host,r])).values()];
const out=latest.filter(r=>!r.skipped),skipped=latest.filter(r=>r.skipped).map(r=>({host:r.host,why:r.skipped}));

// Distributions by kind and country: share of sites per ground and per accent family.
const dist=list=>{const g={},a={};for(const s of list){g[s.ground]=(g[s.ground]||0)+1;a[s.accent]=(a[s.accent]||0)+1;}const norm=o=>Object.fromEntries(Object.entries(o).sort((x,y)=>y[1]-x[1]).map(([k,v])=>[k,Math.round(v/list.length*1000)/1000]));return {sites:list.length,ground:norm(g),accent:norm(a)};};
const byKind={};
for(const s of out){for(const key of [s.kind,`${s.kind}/${s.country}`]){(byKind[key]=byKind[key]||[]).push(s);}}
const summary={schemaVersion:1,measured:new Date().toISOString().slice(0,10),sites:out.length,skipped:skipped.length,all:dist(out),byCountry:Object.fromEntries(['KR','JP','EN'].map(c=>[c,dist(out.filter(s=>s.country===c))])),byKind:Object.fromEntries(Object.entries(byKind).sort().map(([k,v])=>[k,dist(v)]))};
await fs.writeFile(path.join(outDir,'sites.json'),JSON.stringify(out.sort((a,b)=>a.host.localeCompare(b.host)),null,0).replace(/\},\{/g,'},\n{')+'\n');
await fs.writeFile(path.join(outDir,'human.json'),JSON.stringify(summary,null,1)+'\n');
console.log(`\nmeasured ${out.length}, skipped ${skipped.length}`);
console.log(JSON.stringify(skipped));
