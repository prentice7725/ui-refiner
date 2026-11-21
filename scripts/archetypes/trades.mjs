// Phase 2: per trade and country — archetype mix (k=8), measured traits against the country's sites, and the menu and
// button labels that are much more common in this trade than in others of the same country. Writes trades.json.
import fs from 'node:fs';import path from 'node:path';
import {RAW,NAMES as N,readFeatures,readJson,writeJson,requireRaw} from './lib.mjs';
requireRaw();
const G=RAW;
const rows=readFeatures();
const K=readJson('clusters.json');
const NAMES=N;
const med=a=>{a=a.filter(Number.isFinite).sort((x,y)=>x-y);return a.length?a[a.length>>1]:null;};
const mean=a=>{a=a.filter(Number.isFinite);return a.length?a.reduce((s,v)=>s+v,0)/a.length:null;};
// Labels: header navigation plus link and button labels, normalised; counted once per site.
const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').replace(/[・·\/|>›→＞▶︎]+/g,' ').trim();
const labelsOf=id=>{try{const j=JSON.parse(fs.readFileSync(path.join(G,id,'scan.json'),'utf8'));const m=j.raw.find(r=>r.viewport==='desktop').metrics;
 return new Set([...(m.system?.nav||[]),...(m.labels||[])].map(norm).filter(l=>l.length>=2&&l.length<=14&&!/^\d+$/.test(l)&&!/\d{2,}/.test(l)));}catch{return new Set();}};
for(const r of rows){r.cluster=K.assign[r.id];r.labelSet=labelsOf(r.id);}
const trait={photo:r=>r.px4.photo,white:r=>r.px4.white,dark:r=>r.px4.dark,colourful:r=>r.px4.colorful,edges:r=>r.px4.edge,elements:r=>r.elements,screens:r=>r.screens,ratio:r=>r.ratio,serif:r=>r.serif>=.5?1:0,fullBleed:r=>r.heroFull,photos:r=>r.photos,nav:r=>r.navCount,radius:r=>r.radius};
const out=[];
for(const country of ['KR','JP']){
 const C=rows.filter(r=>r.country===country);
 const base=Object.fromEntries(Object.entries(trait).map(([k,f])=>[k,mean(C.map(f))]));
 const clusterBase=Object.fromEntries(Object.keys(NAMES).map(c=>[c,C.filter(r=>r.cluster==+c).length/C.length]));
 const df=new Map();for(const r of C)for(const l of r.labelSet)df.set(l,(df.get(l)||0)+1);
 for(const trade of [...new Set(C.map(r=>r.trade))].sort()){
  const T=C.filter(r=>r.trade===trade);if(T.length<8)continue;
  const mix=Object.entries(NAMES).map(([c,name])=>{const share=T.filter(r=>r.cluster==+c).length/T.length;return {cluster:+c,name,share:+share.toFixed(2),lift:+(share/(clusterBase[c]||1e-9)).toFixed(2)};}).sort((a,b)=>b.share-a.share);
  const traits=Object.fromEntries(Object.entries(trait).map(([k,f])=>{const v=mean(T.map(f));return [k,{value:+(v??0).toFixed(3),vsCountry:base[k]?+(v/base[k]).toFixed(2):null}];}));
  // Labels at least 3x more common in this trade than in the rest of the country, on 25% or more of its sites.
  const tdf=new Map();for(const r of T)for(const l of r.labelSet)tdf.set(l,(tdf.get(l)||0)+1);
  const labels=[...tdf].map(([l,n])=>{const inT=n/T.length,rest=((df.get(l)||0)-n)/Math.max(1,C.length-T.length);return {label:l,share:+inT.toFixed(2),lift:+(inT/Math.max(rest,.005)).toFixed(1)};})
   .filter(x=>x.share>=.25&&x.lift>=3).sort((a,b)=>b.share*Math.log(b.lift)-a.share*Math.log(a.lift)).slice(0,14);
  out.push({country,trade,n:T.length,mix,traits,labels,examples:T.sort((a,b)=>a.id.localeCompare(b.id)).map(r=>r.id)});
 }
}
writeJson('trades.json',{names:NAMES,trades:out});
// Console summary: top archetypes (share, lift) and the strongest labels.
for(const t of out){const top=t.mix.filter(m=>m.share>=.2||m.lift>=1.8&&m.share>=.12).slice(0,3).map(m=>`${m.name} ${Math.round(m.share*100)}%×${m.lift}`).join(', ');
 const tr=Object.entries(t.traits).filter(([,v])=>v.vsCountry&&(v.vsCountry>=1.35||v.vsCountry<=.7)).map(([k,v])=>`${k} ${v.vsCountry}`).join(' ');
 console.log(`${t.country}-${t.trade} (${t.n}) | ${top} | ${tr} | ${t.labels.slice(0,8).map(l=>l.label).join(', ')}`);}
