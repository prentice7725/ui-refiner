// Trade families by what a visitor comes to do, checked against the data: pooled archetype mix per family and
// country, and how far each trade sits from its family (cosine distance of mixes). Writes purpose.json.
import fs from 'node:fs';import path from 'node:path';
import {FAMILIES,readJson,writeJson} from './lib.mjs';
const {names,trades}=readJson('trades.json');
const famOf=t=>Object.entries(FAMILIES).find(([,f])=>f.trades.includes(t))?.[0];
const ks=Object.keys(names);
const pool=T=>{const n=T.reduce((s,t)=>s+t.n,0);return ks.map(c=>T.reduce((s,t)=>s+t.n*t.mix.find(m=>m.cluster==+c).share,0)/n);};
const cos=(a,b)=>{let d=0,x=0,y=0;for(let i=0;i<a.length;i++){d+=a[i]*b[i];x+=a[i]**2;y+=b[i]**2;}return 1-d/Math.sqrt(x*y);};
const out=[];
for(const [key,f] of Object.entries(FAMILIES))for(const country of ['KR','JP']){
 const T=trades.filter(t=>t.country===country&&famOf(t.trade)===key);if(!T.length)continue;
 const mix=pool(T),n=T.reduce((s,t)=>s+t.n,0);
 const members=T.map(t=>({trade:t.trade,n:t.n,dist:+cos(ks.map(c=>t.mix.find(m=>m.cluster==+c).share),mix).toFixed(2)})).sort((a,b)=>a.dist-b.dist);
 out.push({family:key,label:f.label,country,sites:n,mix:ks.map((c,i)=>({name:names[c],share:+mix[i].toFixed(2)})).sort((a,b)=>b.share-a.share),members});
}
writeJson('purpose.json',out);
for(const o of out)console.log(`${o.country} ${o.family} (${o.sites}) | ${o.mix.slice(0,4).map(m=>`${m.name} ${Math.round(m.share*100)}%`).join(', ')}\n    ${o.members.map(m=>`${m.trade}(${m.n}) ${m.dist}`).join(', ')}`);
const unassigned=[...new Set(trades.map(t=>t.trade))].filter(t=>!famOf(t));console.log('unassigned',unassigned.join(', ')||'none');
