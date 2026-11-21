// Assigns sites added after the k=8 run to its archetypes without moving them: the standardization and centroids
// come from the base sites of that run (clusters.json "base", the 1761 sites of November 2026), and every other
// site goes to its nearest centroid. Rewrites data/archetypes/clusters.json (assign, n, countries, near, mix).
//   node scripts/archetypes/assign.mjs
import {readFeatures,readJson,writeJson} from './lib.mjs';
import {raw,standardizer,d2} from './cluster.mjs';

const K=readJson('clusters.json');
const rows=readFeatures();
const inBase=new Set(K.base);
const base=rows.filter(r=>inBase.has(r.id));
if(base.length!==K.base.length)console.warn(`warning: ${K.base.length-base.length} base sites have no feature row`);
const z=standardizer(base);
const Z=new Map(rows.map(r=>[r.id,z(raw(r))]));
const C=[...Array(K.k).keys()].map(c=>{const m=base.filter(r=>K.assign[r.id]===c).map(r=>Z.get(r.id));return m[0].map((_,j)=>m.reduce((s,x)=>s+x[j],0)/m.length);});

let added=0;const per={};
for(const r of rows){
 if(r.id in K.assign)continue;
 const x=Z.get(r.id);let bi=0,bd=Infinity;for(let c=0;c<K.k;c++){const d=d2(x,C[c]);if(d<bd){bd=d;bi=c;}}
 K.assign[r.id]=bi;added++;const t=r.country+'-'+r.trade;(per[t]||=new Array(K.k).fill(0))[bi]++;
}
for(const cl of K.clusters){
 const mem=rows.filter(r=>K.assign[r.id]===cl.cluster);cl.n=mem.length;
 cl.countries={KR:mem.filter(r=>r.country==='KR').length,JP:mem.filter(r=>r.country==='JP').length};
 cl.near=mem.map(r=>r.id).sort((a,b)=>d2(Z.get(a),C[cl.cluster])-d2(Z.get(b),C[cl.cluster]));
 const mix={};for(const r of mem){const t=r.country+'-'+r.trade;mix[t]=(mix[t]||0)+1;}cl.mix=Object.entries(mix).sort((a,b)=>b[1]-a[1]);
}
writeJson('clusters.json',K);
console.log(`base ${base.length}, assigned ${Object.keys(K.assign).length}, added now ${added}`);
for(const [t,a] of Object.entries(per).sort())console.log(t.padEnd(18),a.join(' '));
