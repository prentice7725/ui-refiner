#!/usr/bin/env node
// Measure the colours human-made sites use on their first screen, by page kind and country.
// Usage: node scripts/collect-colours.mjs [scripts/colour-sites.tsv] [data/colour-reference] [--concurrency 3] [--attempts 3]
//   sites.tsv: "trade<TAB>kind<TAB>country<TAB>url" per line; # starts a comment.
// Keeps measurements only (host, colours, shares). No page text or screenshots are stored.
// robots.txt is checked before a site is opened (this collector's own group, else "*"); blocked sites are skipped.
// A site whose robots.txt could not be read (network error, 429, 5xx) is not measured: it is held and tried again
// on the next run, as are sites that failed to load, up to --attempts tries in all.
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {robotsPolicy,pendingRows} from '../src/reference.mjs';
import {colourProbe,measureColours} from '../src/first-screen-colour.mjs';

const args=process.argv.slice(2).filter(a=>!a.startsWith('--')&&!/^\d+$/.test(a));
const listPath=args[0]||'scripts/colour-sites.tsv',outDir=args[1]||'data/colour-reference';
const opt=(n,d)=>{const i=process.argv.indexOf(n);return i>0?Number(process.argv[i+1])||d:d;};
const concurrency=opt('--concurrency',3),attempts=opt('--attempts',3);
const AGENT='ui-refiner-reference',UA=`${AGENT}/0.7 (design measurement; robots-aware)`;
const rows=(await fs.readFile(listPath,'utf8')).split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>{const [trade,kind,country,url]=l.split('\t');return {trade,kind,country,url};}).filter(r=>r.url?.startsWith('http'));

// 'allow', 'block' or 'retry' (see robotsPolicy): a robots.txt that could not be read is not permission.
async function robots(u){
 const x=new URL(u);
 try{const r=await fetch(`${x.origin}/robots.txt`,{headers:{'user-agent':UA},signal:AbortSignal.timeout(10000)});return robotsPolicy(r.status,r.status<400?await r.text():'',x.pathname,AGENT);}
 catch{return 'retry';}
}

await fs.mkdir(outDir,{recursive:true});
// Each result is appended to sites.jsonl as it comes in, so a stopped run resumes where it left off.
const logPath=path.join(outDir,'sites.jsonl');
const prior=await fs.readFile(logPath,'utf8').catch(()=>'');
const records=prior.split('\n').filter(Boolean).map(l=>JSON.parse(l)),seen=new Map(records.map(r=>[r.host,r]));
const hostOf=r=>new URL(r.url).hostname.replace(/^www\./,'');
// Measured sites and robots blocks are final; a site that failed for a passing reason is tried again.
const todo=pendingRows(rows,records,{rowKey:hostOf,recKey:r=>r.host,done:r=>!r.skipped||r.skipped==='robots',attempts});
console.log(`${seen.size} tried before, ${todo.length} to go (${todo.filter(r=>seen.has(hostOf(r))).length} of them retries)`);
const browser=await chromium.launch();
let i=0,n=0;
const hard=(p,ms)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error('hard timeout')),ms))]);
async function worker(){
 const ctxs={},ctxFor=async c=>ctxs[c]??=await browser.newContext({viewport:{width:1440,height:900},userAgent:UA+' Chrome/130',locale:c==='KR'?'ko-KR':c==='JP'?'ja-JP':'en-US'});
 while(i<todo.length){
  const row=todo[i++],host=new URL(row.url).hostname.replace(/^www\./,'');
  let rec;
  const policy=await hard(robots(row.url),20000).catch(()=>'retry');
  if(policy==='block')rec={host,skipped:'robots'};
  else if(policy==='retry')rec={host,skipped:'robots.txt unreachable'};
  else{
   let page;
   try{
    page=await hard((await ctxFor(row.country)).newPage(),15000);
    rec=await hard((async()=>{await page.goto(row.url,{waitUntil:'load',timeout:30000});await page.waitForTimeout(2500);return {host,trade:row.trade,kind:row.kind,country:row.country,...measureColours(await page.evaluate(colourProbe))};})(),60000);
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
const summary={schemaVersion:1,measured:new Date().toISOString().slice(0,10),sites:out.length,skipped:skipped.length,all:dist(out),byCountry:Object.fromEntries(['KR','JP','EN'].map(c=>[c,dist(out.filter(s=>s.country===c))])),byKind:Object.fromEntries(Object.entries(byKind).sort().map(([k,v])=>[k,dist(v)])),
 // By trade and country (for example "salon/JP"), only where at least eight sites were measured.
 byTrade:Object.fromEntries(Object.entries(Object.groupBy(out,s=>`${s.trade}/${s.country}`)).filter(([,v])=>v.length>=8).sort().map(([k,v])=>[k,dist(v)]))};
await fs.writeFile(path.join(outDir,'sites.json'),JSON.stringify(out.sort((a,b)=>a.host.localeCompare(b.host)),null,0).replace(/\},\{/g,'},\n{')+'\n');
await fs.writeFile(path.join(outDir,'human.json'),JSON.stringify(summary,null,1)+'\n');
console.log(`\nmeasured ${out.length}, skipped ${skipped.length}`);
console.log(JSON.stringify(skipped));
