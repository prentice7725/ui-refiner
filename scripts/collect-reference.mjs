#!/usr/bin/env node
// Collect design measurements from reference sites (e.g. data/ja-reference/sites.tsv).
// Usage: node scripts/collect-reference.mjs <sites.tsv> <raw-dir> <data-dir> [--concurrency 2] [--delay 1500]
//   sites.tsv: "category<TAB>url" per line; # starts a comment.
//   raw-dir:   full scan.json with raw collector output (contains page text) and screenshots. Keep it local.
//   data-dir:  sites.json (compact numeric measurements only) and summary.json/SUMMARY.md.
// Politeness: robots.txt is checked for the "*" group before a site is opened; blocked sites are skipped.
// Each site gets a fixed split (tune 70% / holdout 30%) from a hash of its host, so later runs keep it.
import fs from 'node:fs/promises';
import path from 'node:path';
import {scanUrl} from '../src/scan.mjs';
import {summarizeReference,renderReferenceSummary,compactSite,robotsAllows,splitOf} from '../src/reference.mjs';

const [listPath,rawDir,dataDir]=process.argv.slice(2);
if(!listPath||!rawDir||!dataDir){console.error('usage: collect-reference.mjs <sites.tsv> <raw-dir> <data-dir> [--concurrency 2] [--delay 1500]');process.exit(2);}
const opt=(name,d)=>{const i=process.argv.indexOf(name);return i>0?Number(process.argv[i+1])||d:d;};
const concurrency=opt('--concurrency',2),delay=opt('--delay',1500);
const UA='ui-refiner-reference/0.6 (design measurement; robots-aware)';
const rows=(await fs.readFile(listPath,'utf8')).split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>{const [category,url]=l.split('\t');return {category,url};}).filter(r=>r.url?.startsWith('http'));

const toggleWww=u=>{const x=new URL(u);x.hostname=x.hostname.startsWith('www.')?x.hostname.slice(4):'www.'+x.hostname;return x.href;};
const slug=u=>{const x=new URL(u);return (x.hostname.replace(/^www\./,'')+x.pathname).replace(/[^a-z0-9.-]+/gi,'_').replace(/_$/,'');};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function robotsCheck(u){
 const x=new URL(u);
 try{const res=await fetch(`${x.origin}/robots.txt`,{headers:{'user-agent':UA},signal:AbortSignal.timeout(10000),redirect:'follow'});
  if(res.status>=400)return {allowed:true,robots:res.status};
  return {allowed:robotsAllows(await res.text(),x.pathname),robots:res.status};}
 catch(e){return {allowed:null,error:e.cause?.code||e.message};}
}

async function resolve(u){
 // Prefer the URL as written; fall back to the www/no-www twin when it does not resolve.
 for(const cand of [u,toggleWww(u)]){const r=await robotsCheck(cand);if(r.allowed!==null)return {url:cand,...r};}
 return {url:u,allowed:null,error:'unreachable'};
}

{
 await fs.mkdir(dataDir,{recursive:true});
 const results=[];let next=0;
 async function worker(){
  while(next<rows.length){
   const r=rows[next++],host=new URL(r.url).hostname,split=splitOf(host),t=Date.now();
   const res=await resolve(r.url);
   if(res.allowed===false){results.push({...r,split,status:'robots'});console.log(`robots\t${r.url}`);continue;}
   if(res.allowed===null){results.push({...r,split,status:'error',error:res.error});console.log(`ERR\t${r.url}\t${res.error}`);continue;}
   try{
    const {result}=await scanUrl(res.url,{out:path.join(rawDir,r.category,slug(res.url)),compare:false,keepRaw:true});
    results.push({...r,url:res.url,split,status:'ok',...compactSite(result)});
    console.log(`${r.category}\t${result.aiLook.score}\t${res.url}\t${((Date.now()-t)/1000).toFixed(0)}s`);
   }catch(e){results.push({...r,split,status:'error',error:e.message.split('\n')[0].slice(0,160)});console.log(`ERR\t${r.url}\t${e.message.split('\n')[0]}`);}
   await sleep(delay);
  }
 }
 await Promise.all(Array.from({length:concurrency},worker));
 results.sort((a,b)=>a.category.localeCompare(b.category)||a.url.localeCompare(b.url));
 const summary=summarizeReference(results);
 await fs.writeFile(path.join(dataDir,'sites.json'),JSON.stringify({collectedAt:new Date().toISOString(),sites:results},null,1)+'\n');
 await fs.writeFile(path.join(dataDir,'summary.json'),JSON.stringify(summary,null,2)+'\n');
 await fs.writeFile(path.join(dataDir,'SUMMARY.md'),renderReferenceSummary(summary));
 console.log(`\n${results.filter(r=>r.status==='ok').length}/${results.length} ok → ${dataDir}`);
}
