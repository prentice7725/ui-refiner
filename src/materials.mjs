// Materials: finished looks (ground, colours, faces, surfaces, controls) that `directions deal` hands out whole,
// one per direction. Each is a Markdown file with front matter in skills/ui-refiner-agent/reference/materials/.
// Until November 2026 the deal handed out a surface and a colour family separately; over benchmark rounds 5–17
// the pages built from those parts were called plain or "wireframe-like", and every habit that was ruled out
// was replaced by the next comfortable one.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const MATERIALS_DIR=fileURLToPath(new URL('../skills/ui-refiner-agent/reference/materials/',import.meta.url));
const list=v=>String(v||'').split(',').map(s=>s.trim()).filter(Boolean);
const faces=v=>{const [display,text]=String(v||'').split('+').map(s=>s.trim());return display?{display,text:text||display}:null;};

/** Parses one material file's front matter. Returns null when it has none or lacks a slug. */
export function parseMaterial(src,file=null){
 const m=/^---\r?\n([\s\S]*?)\r?\n---/.exec(String(src));if(!m)return null;
 const f={};for(const line of m[1].split(/\r?\n/)){const i=line.indexOf(':');if(i>0)f[line.slice(0,i).trim()]=line.slice(i+1).trim();}
 if(!f.slug)return null;
 return {slug:f.slug,name:f.name||f.slug,tones:list(f.tones),kinds:list(f.kinds),ground:f.ground||'white',accent:f.accent||null,photo:f.photo||null,
  faces:{latin:faces(f.latin),ko:faces(f.ko),ja:faces(f.ja)},brief:f.brief||'',file};
}

/** Reads every material in the folder, sorted by slug. */
export async function loadMaterials(dir=MATERIALS_DIR){
 let names;try{names=await fs.readdir(dir);}catch{return [];}
 const out=[];
 for(const n of names.filter(n=>n.endsWith('.md')&&n!=='README.md').sort()){
  const mat=parseMaterial(await fs.readFile(path.join(dir,n),'utf8'),path.join(dir,n));if(mat)out.push(mat);
 }
 return out;
}

const hash=(seed,k)=>{let h=seed+7;for(const c of String(k))h=(h*31+c.charCodeAt(0))>>>0;return h%997;};

/**
 * Picks `n` different materials. Those that fit the tone come first, then those that fit the page kind; materials
 * picked recently for other projects go last; `seed` breaks ties so a re-deal can differ. A material whose ground
 * is dark is never dealt to a software page (in benchmark round 12 all three judges read dark software pages as
 * crypto or dev-tool pages), and one that needs photographs is left out when there are none.
 */
export function dealMaterials(materials,entries=[],project=null,{n=3,seed=0,kind,tone,noPhoto=false}={}){
 const recent=entries.filter(e=>e.project!==project&&e.material).slice(-8).map(e=>e.material);
 const pool=materials.filter(m=>!(kind==='software'&&m.ground==='dark')&&!(noPhoto&&m.photo==='required'));
 const rank=m=>{
  const age=recent.lastIndexOf(m.slug);
  return [tone&&!m.tones.includes(tone)?1:0,kind&&!m.kinds.includes(kind)?1:0,age<0?0:age+1,hash(seed,m.slug)];
 };
 const sorted=pool.map(m=>({m,r:rank(m)})).sort((a,b)=>{for(let i=0;i<4;i++)if(a.r[i]!==b.r[i])return a.r[i]-b.r[i];return 0;}).map(x=>x.m);
 // Spread over grounds where the fit allows: take the best of each ground first among those that fit tone and kind.
 const fits=sorted.filter(m=>(!tone||m.tones.includes(tone))&&(!kind||m.kinds.includes(kind))),picked=[];
 for(const m of fits)if(picked.length<n&&!picked.some(p=>p.ground===m.ground))picked.push(m);
 for(const m of sorted)if(picked.length<n&&!picked.includes(m))picked.push(m);
 return picked;
}
