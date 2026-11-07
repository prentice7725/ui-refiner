#!/usr/bin/env node
// Calibration: scan labelled URLs (ai / human) and compare score and per-signal hit rates.
// Usage: node scripts/calibrate-scan.mjs <list.tsv> <out-dir> [--concurrency 3]
// list.tsv: one "label<TAB>url[<TAB>note]" per line; # starts a comment. Labels: ai, human.
// Stores only measurements (scan.json, summary). Screenshots stay in <out-dir> and are not for redistribution.
import fs from 'node:fs/promises';
import path from 'node:path';
import {scanUrl} from '../src/scan.mjs';

const [listPath,outDir]=process.argv.slice(2);
if(!listPath||!outDir){console.error('usage: calibrate-scan.mjs <list.tsv> <out-dir> [--concurrency N]');process.exit(2);}
const ci=process.argv.indexOf('--concurrency'),concurrency=ci>0?Number(process.argv[ci+1])||3:3;
const rows=(await fs.readFile(listPath,'utf8')).split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>{const [label,url,note='']=l.split('\t');return {label,url,note};}).filter(r=>r.label==='ai'||r.label==='human');
const slug=u=>new URL(u).hostname.replace(/^www\./,'').replace(/[^a-z0-9.-]/gi,'_')+new URL(u).pathname.replace(/[^a-z0-9]+/gi,'_').replace(/_$/,'');

const results=[];let next=0;
async function worker(){
 while(next<rows.length){
  const r=rows[next++],dir=path.join(outDir,r.label,slug(r.url));
  const t=Date.now();
  try{
   const {result}=await scanUrl(r.url,{out:dir,compare:false,keepRaw:true});
   results.push({...r,score:result.aiLook.score,band:result.aiLook.band,signals:result.aiLook.signals.map(s=>s.id),craft:result.aiLook.craft||[],measures:result.aiLook.measures,
    quality:Object.fromEntries(result.quality.map(q=>[q.rule,q.count])),ja:result.japanese?.japanese?result.japanese.issues.map(i=>i.id):null,lang:result.lang});
   console.log(`${r.label}\t${result.aiLook.score}\t${r.url}\t${((Date.now()-t)/1000).toFixed(0)}s`);
  }catch(e){results.push({...r,error:e.message.split('\n')[0]});console.log(`${r.label}\tERR\t${r.url}\t${e.message.split('\n')[0]}`);}
 }
}
await Promise.all(Array.from({length:concurrency},worker));

const ok=results.filter(r=>!r.error),labels=['ai','human'];
const stats=l=>{const s=ok.filter(r=>r.label===l).map(r=>r.score).sort((a,b)=>a-b);const q=p=>s.length?s[Math.min(s.length-1,Math.floor(p*s.length))]:null;return {n:s.length,min:s[0]??null,median:q(.5),p75:q(.75),max:s.at(-1)??null,mean:s.length?+(s.reduce((a,b)=>a+b,0)/s.length).toFixed(1):null};};
const ids=[...new Set(ok.flatMap(r=>r.signals))].sort();
const rate=(l,id)=>{const g=ok.filter(r=>r.label===l);return g.length?+(g.filter(r=>r.signals.includes(id)).length/g.length).toFixed(2):0;};
const signals=ids.map(id=>({id,ai:rate('ai',id),human:rate('human',id)})).sort((a,b)=>(b.ai-b.human)-(a.ai-a.human));
// Threshold sweep: share of each label at or above a score.
const sweep=[10,20,30,40,50].map(t=>({threshold:t,aiFlagged:+(ok.filter(r=>r.label==='ai'&&r.score>=t).length/Math.max(1,stats('ai').n)).toFixed(2),humanFlagged:+(ok.filter(r=>r.label==='human'&&r.score>=t).length/Math.max(1,stats('human').n)).toFixed(2)}));
const summary={scannedAt:new Date().toISOString(),scores:Object.fromEntries(labels.map(l=>[l,stats(l)])),signals,sweep,errors:results.filter(r=>r.error).map(r=>({url:r.url,error:r.error})),results};
await fs.writeFile(path.join(outDir,'calibration.json'),JSON.stringify(summary,null,2)+'\n');
const md=['# Scan calibration','',`| label | n | min | median | p75 | max | mean |`,'|---|---:|---:|---:|---:|---:|---:|',...labels.map(l=>{const s=stats(l);return `| ${l} | ${s.n} | ${s.min} | ${s.median} | ${s.p75} | ${s.max} | ${s.mean} |`;}),'',
 '## Signal hit rate (ai vs human)','','| signal | ai | human |','|---|---:|---:|',...signals.map(s=>`| ${s.id} | ${s.ai} | ${s.human} |`),'',
 '## Flagged at threshold','','| score ≥ | ai flagged | human flagged |','|---:|---:|---:|',...sweep.map(s=>`| ${s.threshold} | ${s.aiFlagged} | ${s.humanFlagged} |`),'',
 '## Per site','','| label | score | signals | url |','|---|---:|---|---|',...results.sort((a,b)=>a.label.localeCompare(b.label)||(b.score??-1)-(a.score??-1)).map(r=>`| ${r.label} | ${r.error?'ERR':r.score} | ${r.error?r.error.slice(0,60):r.signals.join(', ')} | ${r.url} |`),''];
await fs.writeFile(path.join(outDir,'CALIBRATION.md'),md.join('\n'));
console.log(`\n${path.join(outDir,'CALIBRATION.md')}`);
