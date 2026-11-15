#!/usr/bin/env node
// Build data/genre-reference/human.json: what human-made Korean and Japanese sites of one trade do
// (hero structure, first-screen ground, accent family, type), for `directions deal --trade`.
// Usage: node scripts/build-genre-reference.mjs [data/genre-reference] [raw-scan-dir]
//   Reads <data>/sites.json (collect-reference), <data>/colour/sites.json (collect-colours) and, for the hero
//   structure, the raw scans under <raw-scan-dir>/<COUNTRY-trade>/<host>/scan.json (kept local, not committed).
// A site counts only when its page declares the country's language, so foreign sites from galleries drop out.
import fs from 'node:fs/promises';
import path from 'node:path';
import {heroSkeleton} from '../src/directions.mjs';

const dir=process.argv[2]||'data/genre-reference',raw=process.argv[3];
const MIN=8,LANG={KR:'ko',JP:'ja'};
// One line per trade, for the agent that picks it.
const TRADES={
 academy:'cram schools, language schools, courses, universities\' admission pages',
 beauty:'beauty salons, aesthetic and nail studios, beauty brands',
 builder:'house builders, renovation, building materials, architects',
 car:'car makers, dealers, car services',
 care:'nursing care, welfare services',
 cosmetics:'cosmetics and skincare brands',
 ec:'online shops and marketplaces',
 event:'festivals, exhibitions, conferences, campaigns',
 farm:'farms, breweries, distilleries, tea and local produce',
 fashion:'clothing and accessory brands',
 finance:'banks, insurers, investment and payment firms',
 fitness:'gyms, yoga and pilates studios, sports clubs',
 food:'food and drink manufacturers',
 game:'games, entertainment and media companies',
 inn:'hotels, inns, resorts, private stays',
 interior:'furniture and interior brands',
 kids:'nurseries, children\'s services and products',
 maker:'manufacturers of goods and equipment',
 realestate:'estate agents, property listings, developers',
 restaurant:'restaurants, cafes, bars',
 salon:'hair salons',
 skin:'dermatology and cosmetic clinics',
 tax:'tax accountants, accounting and law offices',
 tourism:'tourist boards, regional and city guides',
 wedding:'wedding halls and planners',
 wellness:'health care products and wellness services'
};
const med=a=>{a=a.filter(v=>v!=null&&isFinite(v)).sort((x,y)=>x-y);return a.length?a[Math.floor((a.length-1)/2)]:null;};
const r3=x=>Math.round(x*1000)/1000;
const share=(list,f)=>{const c={};for(const r of list){const k=f(r);if(k!=null)c[k]=(c[k]||0)+1;}const n=Object.values(c).reduce((a,b)=>a+b,0);return {sites:n,share:Object.fromEntries(Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,r3(v/n)]))};};
const host=u=>new URL(u).hostname.replace(/^www\./,'');

{
 const scans=JSON.parse(await fs.readFile(path.join(dir,'sites.json'),'utf8')).sites.filter(s=>s.status==='ok');
 const colours=new Map(JSON.parse(await fs.readFile(path.join(dir,'colour','sites.json'),'utf8')).map(c=>[c.host,c]));
 const rows=[];let foreign=0;
 for(const s of scans){
  const [country,trade]=s.category.split('-');
  if(!String(s.lang||'').startsWith(LANG[country])){foreign++;continue;}
  const h=host(s.url);let hero=null;
  if(raw)for(const d of [h,'www.'+h]){try{const m=JSON.parse(await fs.readFile(path.join(raw,s.category,d,'scan.json'),'utf8')).raw.find(r=>r.viewport==='desktop')?.metrics;hero=heroSkeleton(m.hero)??'below-fold';break;}catch{}}
  rows.push({country,trade,hero,colour:colours.get(h),body:s.type?.body,ratio:s.type?.ratio,lineHeight:s.ja?.lineHeight,serif:s.measures?.serifDisplay>0});
 }
 const byTrade={};
 for(const [k,list] of Object.entries(Object.groupBy(rows,r=>`${r.trade}/${r.country}`)).sort()){
  if(list.length<MIN)continue;
  const col=list.filter(r=>r.colour),hero=share(list,r=>r.hero);
  byTrade[k]={sites:list.length,hero:hero.sites>=MIN?hero:null,
   colour:col.length>=MIN?{sites:col.length,ground:share(col,r=>r.colour.ground).share,accent:share(col,r=>r.colour.accent).share}:null,
   type:{body:med(list.map(r=>r.body)),displayRatio:med(list.map(r=>r.ratio)),lineHeight:med(list.map(r=>r.lineHeight)),serifDisplay:r3(list.filter(r=>r.serif).length/list.length)}};
 }
 const out={schemaVersion:1,measured:new Date().toISOString().slice(0,10),sites:rows.length,droppedForLanguage:foreign,minSites:MIN,
  source:'Human-made Korean and Japanese sites by trade (scripts/genre-sites.tsv), first desktop screen at 1440x900. robots.txt respected; measurements only. A trade/country appears only with 8 or more sites; hero and colour each need 8 of their own. lineHeight is measured on Japanese pages only.',
  trades:TRADES,byTrade};
 await fs.writeFile(path.join(dir,'human.json'),JSON.stringify(out,null,1)+'\n');
 console.log(`${rows.length} sites, ${foreign} dropped for language, ${Object.keys(byTrade).length} trade/country groups`);
}
