#!/usr/bin/env node
// Collect design measurements from reference sites (e.g. data/ja-reference/sites.tsv).
// Usage: node scripts/collect-reference.mjs <sites.tsv> <raw-dir> <data-dir> [--concurrency 2] [--delay 1500] [--attempts 3]
//   sites.tsv: "category<TAB>url" per line; # starts a comment.
//   raw-dir:   full scan.json with raw collector output (contains page text) and screenshots. Keep it local.
//   data-dir:  sites.json (compact numeric measurements only) and summary.json/SUMMARY.md.
// Politeness: robots.txt is checked before a site is opened (this collector's own group, else "*"); blocked sites
// are skipped, and a site whose robots.txt could not be read (network error, 429, 5xx) is not scanned.
// Each result is appended to <raw-dir>/checkpoint.jsonl as it comes in, so a stopped run resumes where it left off.
// Sites that failed to load or to answer for robots.txt are tried again on the next run, up to --attempts tries.
// Each site gets a fixed split (tune 70% / holdout 30%) from a hash of its host, so later runs keep it.
import fs from 'node:fs/promises';
import path from 'node:path';
import {scanUrl} from '../src/scan.mjs';
import {summarizeReference,renderReferenceSummary,compactSite,robotsPolicy,pendingRows,splitOf,mergeOutputSites} from '../src/reference.mjs';

const [listPath,rawDir,dataDir]=process.argv.slice(2);
if(!listPath||!rawDir||!dataDir){console.error('usage: collect-reference.mjs <sites.tsv> <raw-dir> <data-dir> [--concurrency 2] [--delay 1500]');process.exit(2);}
const opt=(name,d)=>{const i=process.argv.indexOf(name);return i>0?Number(process.argv[i+1])||d:d;};
const concurrency=opt('--concurrency',2),delay=opt('--delay',1500),attempts=opt('--attempts',3);
const AGENT='ui-refiner-reference',UA=`${AGENT}/0.6 (design measurement; robots-aware)`;
const rows=(await fs.readFile(listPath,'utf8')).split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>{const [category,url]=l.split('\t');return {category,url};}).filter(r=>r.url?.startsWith('http'));

const toggleWww=u=>{const x=new URL(u);x.hostname=x.hostname.startsWith('www.')?x.hostname.slice(4):'www.'+x.hostname;return x.href;};
const slug=u=>{const x=new URL(u);return (x.hostname.replace(/^www\./,'')+x.pathname).replace(/[^a-z0-9.-]+/gi,'_').replace(/_$/,'');};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function robotsCheck(u){
 const x=new URL(u);
 try{const res=await fetch(`${x.origin}/robots.txt`,{headers:{'user-agent':UA},signal:AbortSignal.timeout(10000),redirect:'follow'});
  const policy=robotsPolicy(res.status,res.status<400?await res.text():'',x.pathname,AGENT);
  return policy==='retry'?{allowed:null,reached:true,error:`robots.txt HTTP ${res.status}`}:{allowed:policy==='allow',robots:res.status};}
 catch(e){return {allowed:null,error:e.cause?.code||e.message};}
}

async function resolve(u){
 // Prefer the URL as written; fall back to the www/no-www twin when it does not resolve.
 let held=null;
 for(const cand of [u,toggleWww(u)]){const r=await robotsCheck(cand);if(r.allowed!==null)return {url:cand,...r};if(r.reached)held??=r.error;}
 return {url:u,allowed:null,error:held||'unreachable'};
}

{
 await fs.mkdir(dataDir,{recursive:true});await fs.mkdir(rawDir,{recursive:true});
 // The checkpoint holds one line per try: {key: the URL as listed, rec: the result}. The latest line per site wins.
 const logPath=path.join(rawDir,'checkpoint.jsonl');
 const records=(await fs.readFile(logPath,'utf8').catch(()=>'')).split('\n').filter(Boolean).map(l=>JSON.parse(l));
 const todo=pendingRows(rows,records,{rowKey:r=>r.url,recKey:r=>r.key,done:r=>r.rec.status!=='error',attempts});
 console.log(`${new Set(records.map(r=>r.key)).size} tried before, ${todo.length} to go`);
 const results={push:rec=>fs.appendFile(logPath,JSON.stringify({key:rec.listed,rec:{...rec,listed:undefined}})+'\n')};let next=0;
 async function worker(){
  while(next<todo.length){
   const r0=todo[next++],r={...r0,listed:r0.url},host=new URL(r.url).hostname,split=splitOf(host),t=Date.now();
   const res=await resolve(r.url);
   if(res.allowed===false){await results.push({...r,split,status:'robots'});console.log(`robots\t${r.url}`);continue;}
   if(res.allowed===null){await results.push({...r,split,status:'error',error:res.error});console.log(`ERR\t${r.url}\t${res.error}`);continue;}
   try{
    const {result}=await scanUrl(res.url,{out:path.join(rawDir,r.category,slug(res.url)),compare:false,keepRaw:true});
    await results.push({...r,url:res.url,split,status:'ok',...compactSite(result)});
    console.log(`${r.category}\t${result.aiLook.score}\t${res.url}\t${((Date.now()-t)/1000).toFixed(0)}s`);
   }catch(e){await results.push({...r,split,status:'error',error:e.message.split('\n')[0].slice(0,160)});console.log(`ERR\t${r.url}\t${e.message.split('\n')[0]}`);}
   await sleep(delay);
  }
 }
 await Promise.all(Array.from({length:concurrency},worker));
 // The output is rebuilt for the sites still on the list: from the whole checkpoint, keeping the records already in
 // sites.json for sites this checkpoint has no line for (an earlier batch measured them with another checkpoint).
 const checkpoint=(await fs.readFile(logPath,'utf8').catch(()=>'')).split('\n').filter(Boolean).map(l=>JSON.parse(l));
 const existing=JSON.parse(await fs.readFile(path.join(dataDir,'sites.json'),'utf8').catch(()=>'{"sites":[]}')).sites||[];
 const sites=mergeOutputSites(rows,checkpoint,existing);
 const summary=summarizeReference(sites);
 await fs.writeFile(path.join(dataDir,'sites.json'),JSON.stringify({collectedAt:new Date().toISOString(),sites},null,1)+'\n');
 await fs.writeFile(path.join(dataDir,'summary.json'),JSON.stringify(summary,null,2)+'\n');
 await fs.writeFile(path.join(dataDir,'SUMMARY.md'),renderReferenceSummary(summary));
 console.log(`\n${sites.filter(r=>r.status==='ok').length}/${sites.length} ok → ${dataDir}`);
}
