#!/usr/bin/env node
// Build data/genre-reference/human.json: what human-made Korean and Japanese sites of one trade do
// (hero structure, first-screen ground, accent family, type), for `directions deal --trade`.
// Usage: node scripts/build-genre-reference.mjs [data/genre-reference] [raw-scan-dir] [--prior <earlier human.json>]
//   --prior: the raw scans of sites measured earlier are no longer kept, so their hero shares come from that earlier
//   human.json (weighted by its hero site count) and the raw scans only add the sites measured since. Use it once per
//   batch, always with the human.json from before the batch (git show <commit>:data/genre-reference/human.json).
//   Reads <data>/sites.json (collect-reference), <data>/colour/sites.json (collect-colours) and, for the hero
//   structure, the raw scans under <raw-scan-dir>/<COUNTRY-trade>/<host>/scan.json (kept local, not committed).
// A site counts only when its page declares the country's language, so foreign sites from galleries drop out.
import fs from 'node:fs/promises';
import path from 'node:path';
import {heroSkeleton} from '../src/directions.mjs';

const argv=process.argv.slice(2),pi=argv.indexOf('--prior'),priorPath=pi>=0?argv[pi+1]:null;
if(pi>=0)argv.splice(pi,2);
const dir=argv[0]||'data/genre-reference',raw=argv[1];
const MIN=8,LANG={KR:'ko',JP:'ja'};
// One line per trade, for the agent that picks it.
const TRADES={
 academy:'cram schools, language schools, courses, universities\' admission pages',
 architecture:'architectural design offices (建築設計事務所, 건축사사무소)',
 beauty:'beauty salons, aesthetic and nail studios, beauty brands',
 builder:'house builders, renovation, building materials, architects',
 car:'car makers, dealers, car services',
 care:'nursing care, welfare services',
 corp:'company sites of established firms',
 cosmetics:'cosmetics and skincare brands',
 culture:'museums, galleries, cultural foundations',
 dental:'dental clinics',
 design:'graphic and web design offices',
 ec:'online shops and marketplaces',
 event:'festivals, exhibitions, conferences, campaigns',
 farm:'farms, breweries, distilleries, tea and local produce',
 fashion:'clothing and accessory brands',
 finance:'banks, insurers, investment and payment firms',
 fitness:'gyms, yoga and pilates studios, sports clubs',
 food:'food and drink manufacturers',
 game:'games, entertainment and media companies',
 gov:'local governments, public corporations and agencies',
 hiring:'recruitment sites',
 hospital:'hospitals and medical centres',
 illustration:'illustration and animation studios',
 inn:'hotels, inns, resorts, private stays',
 interior:'furniture and interior brands',
 kids:'nurseries, children\'s services and products',
 kmed:'Korean medicine clinics (한의원)',
 local:'local everyday services: cleaning, moving, opticians, vets',
 logistics:'logistics, warehousing and transport companies',
 maker:'manufacturers of goods and equipment',
 media:'newspapers, broadcasters, publishers',
 org:'chambers of commerce, associations, member bodies',
 photo:'photography studios and video production companies',
 realestate:'estate agents, property listings, developers',
 restaurant:'restaurants, cafes, bars',
 salon:'hair salons',
 skin:'dermatology and cosmetic clinics',
 software:'software and SaaS companies, system developers',
 tax:'tax accountants, accounting and law offices',
 tourism:'tourist boards, regional and city guides',
 university:'universities and colleges',
 wedding:'wedding halls and planners',
 wellness:'health care products and wellness services'
};
const med=a=>{a=a.filter(v=>v!=null&&isFinite(v)).sort((x,y)=>x-y);return a.length?a[Math.floor((a.length-1)/2)]:null;};
const r3=x=>Math.round(x*1000)/1000;
const share=(list,f)=>{const c={};for(const r of list){const k=f(r);if(k!=null)c[k]=(c[k]||0)+1;}const n=Object.values(c).reduce((a,b)=>a+b,0);return {sites:n,share:Object.fromEntries(Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,r3(v/n)]))};};
const host=u=>new URL(u).hostname.replace(/^www\./,'');
// Hero shares of the earlier batch and of the new scans, as one distribution over both batches' sites.
const mergeHero=(prior,now)=>{
 if(!prior)return now;if(!now)return prior;
 const n=prior.sites+now.sites,keys=new Set([...Object.keys(prior.share),...Object.keys(now.share)]);
 return {sites:n,share:Object.fromEntries([...keys].map(k=>[k,((prior.share[k]||0)*prior.sites+(now.share[k]||0)*now.sites)/n]).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,r3(v)]))};
};

{
 const prior=priorPath?JSON.parse(await fs.readFile(priorPath,'utf8')).byTrade:{};
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
  const col=list.filter(r=>r.colour),own=share(list,r=>r.hero),hero=mergeHero(prior[k]?.hero,own.sites?own:null)??own;
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
