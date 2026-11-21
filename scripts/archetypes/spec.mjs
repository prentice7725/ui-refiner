// Measured spec for one theme target: sites of a country, a purpose family and an archetype.
// node scripts/archetypes/spec.mjs <country> <family> <cluster>  → prints and writes data/archetypes/spec-<country>-<family>-<cluster>.json
import fs from 'node:fs';import path from 'node:path';
import {RAW,FAMILIES,readFeatures,readJson,file,requireRaw} from './lib.mjs';
requireRaw();
const G=RAW;
const [country,family,cluster]=process.argv.slice(2);
const FAM=Object.fromEntries(Object.entries(FAMILIES).map(([k,f])=>[k,f.trades]));
const K=readJson('clusters.json');
const rows=readFeatures()
 .filter(r=>r.country===country&&FAM[family].includes(r.trade)&&K.assign[r.id]==+cluster);
const q=(a,p)=>{a=a.filter(Number.isFinite).sort((x,y)=>x-y);return a.length?+a[Math.min(a.length-1,Math.floor(p*a.length))].toFixed(2):null;};
const qs=a=>({p25:q(a,.25),p50:q(a,.5),p75:q(a,.75)});
const freq=(a,n=8)=>{const m=new Map();for(const v of a.filter(Boolean))m.set(v,(m.get(v)||0)+1);return [...m].sort((x,y)=>y[1]-x[1]).slice(0,n).map(([v,c])=>`${v} ${Math.round(100*c/a.length)}%`);};
const hex=c=>c?'#'+c.slice(0,3).map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''):null;
const hueName=c=>{if(!c)return null;const [r,g,b]=c.map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,l=(mx+mn)/2;if(d<.08)return l<.2?'black':l>.85?'white':'grey';let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360;return h<15||h>=345?'red':h<40?'orange':h<65?'amber':h<160?'green':h<200?'teal':h<250?'blue':h<290?'indigo':'pink';};
const sys=[],nav=[];
for(const r of rows){try{const j=JSON.parse(fs.readFileSync(path.join(G,r.id,'scan.json'),'utf8'));const m=j.raw.find(x=>x.viewport==='desktop').metrics;sys.push({r,m});}catch{}}
const S=sys.map(x=>x.m.system||{});
const spec={country,family,cluster:+cluster,sites:rows.length,trades:freq(rows.map(r=>r.trade),12),
 fonts:{display:freq(S.map(s=>s.fonts?.display)),body:freq(S.map(s=>s.fonts?.body))},
 sizes:{body:qs(S.map(s=>s.sizes?.body)),h1:qs(S.map(s=>s.sizes?.h1)),h2:qs(S.map(s=>s.sizes?.h2)),h3:qs(S.map(s=>s.sizes?.h3)),display:qs(rows.map(r=>r.display)),ratio:qs(rows.map(r=>r.ratio))},
 weights:{h1:qs(S.map(s=>s.weights?.h1)),h2:qs(S.map(s=>s.weights?.h2))},serifShare:+(rows.filter(r=>r.serif>=.5).length/rows.length).toFixed(2),
 colours:{ground:freq(sys.map(x=>hex(x.m.rootBackground?.rgb))),text:freq(S.map(s=>hex(s.colours?.text))),heading:freq(S.map(s=>hex(s.colours?.heading))),buttonHue:freq(S.map(s=>hueName(s.button?.bg))),buttonBg:freq(S.map(s=>hex(s.button?.bg)),10)},
 shape:{radius:qs(S.map(s=>s.radius)),buttonRadius:qs(S.map(s=>s.button?.radius)),buttonHeight:qs(S.map(s=>s.button?.height)),hairlines:qs(S.map(s=>s.hairlines)),content:qs(S.map(s=>s.content))},
 layout:{heroFullBleed:+(rows.filter(r=>r.heroFull).length/rows.length).toFixed(2),heroAlign:freq(rows.map(r=>r.heroAlign)),heroSide:freq(rows.map(r=>r.heroSide||'none')),claimOnFirst:+(rows.filter(r=>r.fsClaim).length/rows.length).toFixed(2),actionOnFirst:+(rows.filter(r=>r.fsAction).length/rows.length).toFixed(2),
  screens:qs(rows.map(r=>r.screens)),photos:qs(rows.map(r=>r.photos)),nav:qs(rows.map(r=>r.navCount)),centred:qs(rows.map(r=>r.centeredRatio))},
 pixels:{white:qs(rows.map(r=>r.px4.white)),dark:qs(rows.map(r=>r.px4.dark)),photo:qs(rows.map(r=>r.px4.photo)),colourful:qs(rows.map(r=>r.px4.colorful))},
 navLabels:freq(sys.flatMap(x=>(x.m.system?.nav||[]).map(l=>l.trim().toLowerCase())),24),
 nearest:K.clusters[+cluster].near.filter(id=>rows.some(r=>r.id===id)).slice(0,16)};
fs.writeFileSync(file(`spec-${country}-${family}-${cluster}.json`),JSON.stringify(spec,null,1)+'\n');
console.log(JSON.stringify(spec,null,1));
