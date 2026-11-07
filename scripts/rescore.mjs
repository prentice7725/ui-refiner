#!/usr/bin/env node
// Re-score saved scans with the current signal rules, without reopening any page.
// Usage: node scripts/rescore.mjs <label>=<dir> [<label>=<dir> ...] [--json out.json]
//   Each <dir> is searched recursively for scan.json files that carry raw collector output
//   (written by calibrate-scan.mjs or collect-reference.mjs with keepRaw).
// Prints score distribution, share at each threshold and per-signal hit rate per label.
import fs from 'node:fs/promises';
import path from 'node:path';
import {mergeTells} from '../src/scan.mjs';

const args=process.argv.slice(2),ji=args.indexOf('--json'),jsonOut=ji>=0?args.splice(ji,2)[1]:null;
const sets=args.map(a=>{const i=a.indexOf('=');return {label:a.slice(0,i),dir:a.slice(i+1)};});
if(!sets.length||sets.some(s=>!s.label||!s.dir)){console.error('usage: rescore.mjs <label>=<dir> ... [--json out.json]');process.exit(2);}

async function* scans(dir){
 for(const e of await fs.readdir(dir,{withFileTypes:true}).catch(()=>[])){
  const p=path.join(dir,e.name);
  if(e.isDirectory())yield* scans(p);else if(e.name==='scan.json')yield p;
 }
}

const rows=[];
for(const {label,dir} of sets)for await(const file of scans(dir)){
 const r=JSON.parse(await fs.readFile(file,'utf8'));
 if(!r.raw?.length)continue;
 const t=mergeTells(r.raw,r.lang||'en');
 rows.push({label,url:r.url,score:t.score,signals:t.signals.filter(s=>s.weight>0).map(s=>s.id)});
}
const labels=sets.map(s=>s.label).filter((l,i,a)=>a.indexOf(l)===i);
const q=(xs,p)=>xs.length?xs[Math.min(xs.length-1,Math.floor(p*xs.length))]:null;
const out={};
for(const l of labels){
 const g=rows.filter(r=>r.label===l),s=g.map(r=>r.score).sort((a,b)=>a-b);
 const ids=[...new Set(g.flatMap(r=>r.signals))];
 out[l]={n:g.length,p50:q(s,.5),p75:q(s,.75),p90:q(s,.9),at:Object.fromEntries([10,20,30].map(t=>[t,+(g.filter(r=>r.score>=t).length/Math.max(1,g.length)).toFixed(2)])),
  signals:Object.fromEntries(ids.map(id=>[id,+(g.filter(r=>r.signals.includes(id)).length/g.length).toFixed(2)]).sort((a,b)=>b[1]-a[1])),
  top:g.sort((a,b)=>b.score-a.score).slice(0,8).map(r=>`${r.score} ${r.url} [${r.signals.join(', ')}]`)};
}
console.log('| label | n | p50 | p75 | p90 | ≥10 | ≥20 | ≥30 |\n|---|---:|---:|---:|---:|---:|---:|---:|');
for(const l of labels){const o=out[l];console.log(`| ${l} | ${o.n} | ${o.p50} | ${o.p75} | ${o.p90} | ${o.at[10]} | ${o.at[20]} | ${o.at[30]} |`);}
if(jsonOut)await fs.writeFile(jsonOut,JSON.stringify(out,null,2)+'\n');
