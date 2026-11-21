// k-means on standardized impression features.
//   node scripts/archetypes/cluster.mjs [k...]   prints silhouette and sizes per k (default 5–12)
//   node scripts/archetypes/cluster.mjs 8 --write  also writes data/archetypes/clusters-k8-candidate.json
// The themes rest on data/archetypes/clusters.json, the k=8 run of November 2026; a new run is only a candidate,
// because its archetype indices and names would not match the themes. New sites join that run with assign.mjs.
import fs from 'node:fs';
import {readFeatures,file} from './lib.mjs';

const rows=readFeatures();
const lg=v=>Math.log1p(Math.max(0,v||0));
// Feature, extractor, weight. Groups: imagery, colour, density, type, shape.
export const F=[
 ['photo first screen',r=>r.px1.photo,1.2],['photo 4 screens',r=>r.px4.photo,1],['full-bleed hero',r=>r.heroFull,.8],['photos (log)',r=>lg(r.photos),.6],
 ['white',r=>r.px4.white,1],['dark',r=>r.px4.dark,1],['lightness',r=>r.px4.lum,.6],['colourful',r=>r.px4.colorful,1],['saturation',r=>r.px4.sat,.6],['hue bins',r=>r.px4.hueBins,.6],
 ['edges',r=>r.px4.edge,1],['elements (log)',r=>lg(r.elements),.8],['text (log)',r=>lg(r.textLen),.8],['nav items',r=>r.navCount,.5],['card groups',r=>Math.min(6,r.cardGroups),.5],['screens',r=>Math.min(20,r.screens||0),.7],
 ['display/body',r=>Math.min(8,r.ratio||1),.8],['display px (log)',r=>lg(r.display),.6],['serif display',r=>r.serif||0,.7],['centred',r=>r.centeredRatio||0,.6],
 ['radius',r=>Math.min(24,r.radius||0),.4],['rounded',r=>r.roundedRatio||0,.4],['hairlines (log)',r=>lg(r.hairlines),.4]
];
export const raw=r=>F.map(([,f])=>{const v=f(r);return Number.isFinite(v)?v:0;});
/** Standardizes on the given base rows: values clipped at ±3 sd and weighted. */
export function standardizer(base){
 const X0=base.map(raw);
 const mean=F.map((_,j)=>X0.reduce((s,x)=>s+x[j],0)/X0.length),sd=F.map((_,j)=>Math.sqrt(X0.reduce((s,x)=>s+(x[j]-mean[j])**2,0)/X0.length)||1);
 return x=>x.map((v,j)=>Math.max(-3,Math.min(3,(v-mean[j])/sd[j]))*F[j][2]);
}
export const d2=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)s+=(a[i]-b[i])**2;return s;};

const run=process.argv[1]?.replace(/\\/g,'/').endsWith('archetypes/cluster.mjs');
if(run){
 const X0=rows.map(raw),z=standardizer(rows),X=X0.map(z);
 let seed=1;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const kmeans=(k,inits=12)=>{let best=null;
  for(let t=0;t<inits;t++){// k-means++
   const C=[X[Math.floor(rnd()*X.length)]];while(C.length<k){const ds=X.map(x=>Math.min(...C.map(c=>d2(x,c))));const tot=ds.reduce((a,b)=>a+b,0);let r=rnd()*tot,i=0;while((r-=ds[i])>0)i++;C.push(X[i]);}
   const A=new Array(X.length).fill(0);
   for(let it=0;it<60;it++){let moved=0;for(let i=0;i<X.length;i++){let bi=0,bd=Infinity;for(let c=0;c<k;c++){const d=d2(X[i],C[c]);if(d<bd){bd=d;bi=c;}}if(A[i]!==bi){A[i]=bi;moved++;}}
    for(let c=0;c<k;c++){const m=X.filter((_,i)=>A[i]===c);if(m.length)C[c]=m[0].map((_,j)=>m.reduce((s,x)=>s+x[j],0)/m.length);}if(!moved)break;}
   const sse=X.reduce((s,x,i)=>s+d2(x,C[A[i]]),0);if(!best||sse<best.sse)best={A,C,sse};}
  return best;};
 const silhouette=(A,k,n=600)=>{const idx=[...X.keys()].sort(()=>rnd()-.5).slice(0,n);let s=0;
  for(const i of idx){const by=new Array(k).fill(0),cnt=new Array(k).fill(0);for(const j of idx){if(i===j)continue;by[A[j]]+=Math.sqrt(d2(X[i],X[j]));cnt[A[j]]++;}
   const a=by[A[i]]/Math.max(1,cnt[A[i]]);let b=Infinity;for(let c=0;c<k;c++)if(c!==A[i]&&cnt[c])b=Math.min(b,by[c]/cnt[c]);s+=(b-a)/Math.max(a,b);}return s/idx.length;};
 const ks=process.argv.slice(2).filter(a=>/^\d+$/.test(a)).map(Number),write=process.argv.includes('--write');
 for(const k of ks.length?ks:[5,6,7,8,9,10,11,12]){
  seed=k*101;const r=kmeans(k);const sizes=new Array(k).fill(0);r.A.forEach(a=>sizes[a]++);
  console.log(`k=${k} silhouette=${silhouette(r.A,k).toFixed(3)} sizes=${sizes.sort((a,b)=>b-a).join(',')}`);
  if(write&&ks.length===1){
   const out=[...Array(k).keys()].map(c=>({cluster:c,n:r.A.filter(a=>a===c).length,profile:Object.fromEntries(F.map(([name],j)=>{const m=rows.map((_,i)=>i).filter(i=>r.A[i]===c);return [name,+(m.reduce((s,i)=>s+X0[i][j],0)/m.length).toFixed(3)];}))}));
   fs.writeFileSync(file(`clusters-k${k}-candidate.json`),JSON.stringify({k,features:F.map(f=>f[0]),base:rows.map(r=>r.id),assign:Object.fromEntries(rows.map((row,i)=>[row.id,r.A[i]])),clusters:out},null,1)+'\n');
  }
 }
}
