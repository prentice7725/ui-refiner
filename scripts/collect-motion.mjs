#!/usr/bin/env node
// Measure motion (hero video and slides, scroll reveals, header blur, parallax, loops, transitions) on a sample of
// the measured human-made sites: --per sites from each country and archetype of data/archetypes/clusters.json,
// picked by a hash of the site id so later runs keep the same sample.
// Usage: node scripts/collect-motion.mjs [--per 20] [--concurrency 3] [--delay 1500] [--attempts 2] [--watch 8000] [--remeasure <field>]
//   raw:  local/motion-raw/checkpoint.jsonl (git-ignored; one line per try, the latest line per site wins)
//   data: data/motion/sites.json (one compact record per site) and data/motion/summary.json
// Politeness as in collect-reference.mjs: robots.txt is checked first; a blocked or unreadable one skips the site.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {launchBrowser} from '../vendor/lintapple/src/browser.js';
import {robotsPolicy,pendingRows} from '../src/reference.mjs';
import {measureMotion,compactMotion,summarizeMotion} from '../src/motion.mjs';
import {readFeatures,readJson,familyOf,NAMES,REPO} from './archetypes/lib.mjs';

const opt=(name,d)=>{const i=process.argv.indexOf(name);return i>0?Number(process.argv[i+1])||d:d;};
const per=opt('--per',20),concurrency=opt('--concurrency',3),delay=opt('--delay',1500),attempts=opt('--attempts',2),watchMs=opt('--watch',8000);
const rawDir=path.join(REPO,'local','motion-raw'),dataDir=path.join(REPO,'data','motion');
const AGENT='ui-refiner-reference',UA=`${AGENT}/0.6 (design measurement; robots-aware)`;

const K=readJson('clusters.json');
const hash=s=>crypto.createHash('sha1').update(s).digest('hex');
const cells={};
for(const r of readFeatures()){if(!(r.id in K.assign)||!r.url)continue;(cells[`${r.country} ${K.assign[r.id]}`]||=[]).push(r);}
const rows=Object.values(cells).flatMap(rs=>rs.sort((a,b)=>hash(a.id).localeCompare(hash(b.id))).slice(0,per))
 .map(r=>({id:r.id,url:r.url,country:r.country,trade:r.trade,family:familyOf(r.trade),archetype:K.assign[r.id]}));

const toggleWww=u=>{const x=new URL(u);x.hostname=x.hostname.startsWith('www.')?x.hostname.slice(4):'www.'+x.hostname;return x.href;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function robotsCheck(u){
 const x=new URL(u);
 try{const res=await fetch(`${x.origin}/robots.txt`,{headers:{'user-agent':UA},signal:AbortSignal.timeout(10000),redirect:'follow'});
  const policy=robotsPolicy(res.status,res.status<400?await res.text():'',x.pathname,AGENT);
  return policy==='retry'?{allowed:null,error:`robots.txt HTTP ${res.status}`}:{allowed:policy==='allow'};}
 catch(e){return {allowed:null,error:e.cause?.code||e.message};}
}
async function resolve(u){
 let err=null;
 for(const cand of [u,toggleWww(u)]){const r=await robotsCheck(cand);if(r.allowed!==null)return {url:cand,...r};err??=r.error;}
 return {url:u,allowed:null,error:err||'unreachable'};
}

await fs.mkdir(rawDir,{recursive:true});await fs.mkdir(dataDir,{recursive:true});
const logPath=path.join(rawDir,'checkpoint.jsonl');
const readLog=async()=>(await fs.readFile(logPath,'utf8').catch(()=>'')).split('\n').filter(Boolean).map(l=>JSON.parse(l));
// --remeasure <field>: measure again the sites whose latest record has that field set (after a detector changed).
const ri=process.argv.indexOf('--remeasure'),again=ri>0?process.argv[ri+1]:null;
const log0=await readLog(),last=new Map(log0.map(l=>[l.key,l.rec]));
const todo=again?rows.filter(r=>last.get(r.id)?.motion?.[again]):pendingRows(rows,log0,{rowKey:r=>r.id,recKey:r=>r.key,done:r=>r.rec.status!=='error',attempts});
console.log(`${rows.length} sites in the sample (${per} per country and archetype), ${todo.length} to go`);

const browser=await launchBrowser({timeout:30000});
let next=0;
const save=rec=>fs.appendFile(logPath,JSON.stringify({key:rec.id,rec})+'\n');
async function worker(){
 while(next<todo.length){
  const r=todo[next++],t=Date.now();
  const res=await resolve(r.url);
  if(res.allowed===false){await save({...r,status:'robots'});console.log(`robots\t${r.id}`);continue;}
  if(res.allowed===null){await save({...r,status:'error',error:res.error});console.log(`ERR\t${r.id}\t${res.error}`);continue;}
  const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference',locale:r.country==='JP'?'ja-JP':'ko-KR',userAgent:undefined,serviceWorkers:'block'});
  try{
   const page=await ctx.newPage();page.setDefaultTimeout(30000);
   const resp=await page.goto(res.url,{waitUntil:'load',timeout:45000});
   if(resp&&!resp.ok())throw Error(`HTTP ${resp.status()}`);
   // A page that sends itself on after load (a script redirect, a language switch) is measured again where it lands.
   const raw=await measureMotion(page,{watchMs}).catch(async e=>{if(!/context was destroyed|navigation/i.test(e.message))throw e;
    await page.waitForLoadState('load',{timeout:30000}).catch(()=>{});return measureMotion(page,{watchMs});});
   const m=compactMotion(raw);
   await save({...r,url:res.url,status:'ok',motion:m,raw});
   console.log(`${r.id}\t${['heroVideo','heroSlides','reveal','headerBlur','parallax','intro'].filter(k=>m[k]).join(',')||'-'}\t${((Date.now()-t)/1000).toFixed(0)}s`);
  }catch(e){await save({...r,status:'error',error:e.message.split('\n')[0].slice(0,160)});console.log(`ERR\t${r.id}\t${e.message.split('\n')[0]}`);}
  finally{await ctx.close().catch(()=>{});}
  await sleep(delay);
 }
}
try{await Promise.all(Array.from({length:concurrency},worker));}finally{await browser.close();}

// Output for the sites in the sample, from the latest line per site.
const ids=new Set(rows.map(r=>r.id)),latest=new Map();
for(const {key,rec} of await readLog())if(ids.has(key))latest.set(key,rec);
const sites=[...latest.values()].filter(r=>r.status==='ok').map(({raw,...r})=>({id:r.id,country:r.country,trade:r.trade,family:r.family,archetype:r.archetype,...r.motion}))
 .sort((a,b)=>a.id.localeCompare(b.id));
const by=f=>summarizeMotion(sites,f);
const summary={measuredAt:new Date().toISOString(),note:`Motion on ${sites.length} human-made Korean and Japanese sites (desktop 1440x900, first screen watched ${watchMs/1000} s), ${per} per country and archetype. Shares are of the sites measured in each group.`,
 archetypes:NAMES,country:by(r=>r.country),archetype:by(r=>`${r.country} ${r.archetype}`),family:by(r=>`${r.country} ${r.family}`)};
await fs.writeFile(path.join(dataDir,'sites.json'),JSON.stringify({sites},null,1)+'\n');
await fs.writeFile(path.join(dataDir,'summary.json'),JSON.stringify(summary,null,1)+'\n');
const tried=[...latest.values()];
console.log(`\n${sites.length} ok, ${tried.filter(r=>r.status==='robots').length} robots, ${tried.filter(r=>r.status==='error').length} errors → data/motion/`);
