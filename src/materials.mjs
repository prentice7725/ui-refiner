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
 * Picks `n` different materials for the bold direction (the first is dealt, the rest are alternates).
 * - A material picked for one of the last four other projects is left out, not just put last: in the round-18 pilot,
 *   pages whose tone and kind fitted only two or three materials were dealt the same one every time and picked it,
 *   and the set judges named the repeated receipt.
 * - A material that fits the tone or the kind stays in the pool; the pool widens only as far as needed to reach n.
 * A dark ground is never dealt to a software page (in benchmark round 12 all three judges read dark software pages as
 * crypto or dev-tool pages), and a material that needs photographs is left out when there are none.
 * `seed` orders the pool, so a re-deal can differ.
 */
export function dealMaterials(materials,entries=[],project=null,{n=3,seed=0,kind,tone,noPhoto=false}={}){
 const recent=new Set(entries.filter(e=>e.project!==project&&e.material).slice(-4).map(e=>e.material));
 const hard=materials.filter(m=>!(kind==='software'&&m.ground==='dark')&&!(noPhoto&&m.photo==='required'));
 const fit=m=>(tone&&m.tones.includes(tone)?1:0)+(kind&&m.kinds.includes(kind)?1:0);
 const byHash=a=>[...a].sort((x,y)=>fit(y)-fit(x)||hash(seed,x.slug)-hash(seed,y.slug));
 const fresh=hard.filter(m=>!recent.has(m.slug)),tiers=[fresh.filter(m=>fit(m)>0||(!tone&&!kind)),fresh,hard],picked=[];
 for(const t of tiers)for(const m of byHash(t))if(picked.length<n&&!picked.includes(m))picked.push(m);
 return picked;
}

