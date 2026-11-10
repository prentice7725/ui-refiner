// Memory across refines, so the agent does not hand every client the same page.
// `deal` assigns three different hero structures before the mocks are built, avoiding the ones
// chosen recently for other projects; `record` stores the direction the person picked.
// The log is per user, not per project: pages of one site should share a system, different
// clients should not. Default location: ~/.ui-refiner/refine-log.json (UI_REFINER_HOME overrides).
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const DEAL_FILE='DEAL.json';
export const SHEET_JSON='DIRECTIONS.json';

/** Hero structures the agent can be dealt. Keys match heroSkeleton() so a built mock can be checked against its deal. */
export const HERO_STRUCTURES={
 'left+panel':'Headline on the left, the signature element as a panel beside it.',
 'right+panel':'Mirrored split: the signature element on the left, the headline on the right.',
 'left+media':'Headline on the left beside a real photo or product shot.',
 'full-bleed':'A real photo or product shot fills the first screen; the headline sits on or directly under it. Without client photos, use credited stand-ins from `ui-refiner photos`.',
 'wide+stacked':'One very large headline across the full width; the signature element follows below.',
 'center+stacked':'A short centred headline; the signature element follows below at full width.',
 'left+stacked':'Headline in a narrow left column; the signature element runs full width below it.',
 'below-fold':'Images first: real photos, products or listings with pictures fill most of the first screen, as on human-made sites that open without a headline (most of them are image-led). The one-line claim and the main action still sit on or beside them, and the claim is the largest text on the screen. Not a text, table or dashboard board; without real images, use another structure.'
};

export function logPath(file){return file||path.join(process.env.UI_REFINER_HOME||path.join(os.homedir(),'.ui-refiner'),'refine-log.json');}
export async function readLog(file){try{const j=JSON.parse(await fs.readFile(logPath(file),'utf8'));return Array.isArray(j.entries)?j.entries:[];}catch{return [];}}
async function writeLog(entries,file){const f=logPath(file);await fs.mkdir(path.dirname(f),{recursive:true});await fs.writeFile(f,JSON.stringify({schemaVersion:1,entries},null,1)+'\n');return f;}

/** The project a directions folder belongs to: its parent folder. */
export const projectOf=dir=>path.dirname(path.resolve(dir));
const others=(entries,project)=>entries.filter(e=>e.project!==project);

/**
 * Picks `n` different hero structures, least recently chosen for other projects first.
 * `human` (optional) maps structure keys to their share on human-made sites; among equally fresh
 * structures the more common human ones come first. Ties are broken by `seed` so a re-deal can differ.
 */
export function dealStructures(entries,project,{n=3,seed=0,human=null,noPhoto=false}={}){
 const recent=others(entries,project).slice(-12).reverse();
 const keys=Object.keys(HERO_STRUCTURES).filter(k=>!(noPhoto&&PHOTO.has(k)));
 const age=k=>{const i=recent.findIndex(e=>e.hero===k);return i<0?Infinity:i;};
 const jitter=k=>{let h=seed+7;for(const c of k)h=(h*31+c.charCodeAt(0))>>>0;return h%997;};
 // Among equally fresh structures, ones common on human-made sites come first, with some randomness so deals vary.
 const weight=k=>(human?.[k]??0)*(0.6+0.8*jitter(k)/997);
 const order=keys.sort((a,b)=>(age(b)-age(a))||(weight(b)-weight(a))||(jitter(a)-jitter(b)));
 // Spread the deal over structure families first, so three "headline then signature below" variants are not dealt together.
 const out=[],fams=new Set();
 for(const k of order)if(out.length<n&&!fams.has(FAMILY[k])){out.push(k);fams.add(FAMILY[k]);}
 for(const k of order)if(out.length<n&&!out.includes(k))out.push(k);
 return out;
}
// Structures that need a photo or product shot (human first screens without a headline are mostly image-led). With no client photos, deal them only when stand-ins
// (ui-refiner photos) are acceptable; --no-photo removes them.
const PHOTO=new Set(['full-bleed','left+media','below-fold']);
const FAMILY={'left+panel':'split','right+panel':'split','left+media':'split','full-bleed':'image','wide+stacked':'stacked','center+stacked':'stacked','left+stacked':'stacked','below-fold':'image'};

/** Share of each hero structure on human-made sites (data/hero-reference/human.json), overall or for one page kind. */
export async function humanHeroShare(kind){try{const j=JSON.parse(await fs.readFile(new URL('../data/hero-reference/human.json',import.meta.url),'utf8'));return (kind&&j.byKind?.[kind]?.share)||j.share;}catch{return null;}}
export const PAGE_KINDS=['software','service','place','public','company','studio','media'];
async function typeLibrary(){return JSON.parse(await fs.readFile(new URL('../data/type-pairs.json',import.meta.url),'utf8'));}
const hash=(seed,k)=>{let h=seed+7;for(const c of String(k))h=(h*31+c.charCodeAt(0))>>>0;return h%997;};
const lc=x=>String(x||'').toLowerCase();

/** Hue family of an rgb accent, matching the families in data/type-pairs.json. */
export function accentFamily(rgb){
 if(!rgb)return null;const [r,g,b]=rgb.map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,l=(mx+mn)/2;
 if(d<.08||l<.12)return 'ink';const sat=d/(1-Math.abs(2*l-1));let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360;
 if(sat<.35&&h>=12&&h<45)return 'brown';
 return h<15||h>=345?'red':h<35?'orange':h<62?'amber':h<150?'green':h<192?'teal':h<230?'blue':h<292?'indigo':'pink';
}

/**
 * Type pairings for n directions: one per voice, suited to the page kind and script, avoiding pairings
 * whose faces were picked recently for other projects; overused faces go last.
 */
export function dealType(pairs,entries,project,{n=3,seed=0,kind,script='latin'}={}){
 const recent=new Set(others(entries,project).slice(-8).flatMap(e=>(e.fonts||[]).map(lc)));
 const pool=pairs.filter(p=>p.script===script);
 const score=p=>(p.overused?4:0)+(recent.has(lc(p.display))||recent.has(lc(p.text))?2:0)+(kind&&p.kinds.length&&!p.kinds.includes(kind)?1:0);
 const order=[...pool].sort((x,y)=>score(x)-score(y)||hash(seed,x.id)-hash(seed,y.id));
 const out=[],voices=new Set();
 for(const p of order)if(out.length<n&&!voices.has(p.voice)){out.push(p);voices.add(p.voice);}
 for(const p of order)if(out.length<n&&!out.includes(p))out.push(p);
 return out.map(({id,voice,display,text})=>({id,voice,display,text}));
}

/** Accent hue families for n directions, distinct, avoiding families picked recently elsewhere; indigo last. */
export function dealAccents(families,entries,project,{n=3,seed=0}={}){
 const recent=others(entries,project).slice(-4).map(e=>accentFamily(e.accent)).filter(Boolean);
 const score=k=>(k==='indigo'?4:0)+(recent.includes(k)?2:0);
 return [...families].sort((x,y)=>score(x)-score(y)||hash(seed,x)-hash(seed,y)).slice(0,n);
}

/** Surfaces: plain white for most, as on 82% of human sites; one direction gets a dark, brand or paper ground. */
export function dealSurfaces(n=3,seed=0){
 const odd=['dark','brand','paper'][hash(seed,'surface')%3],at=hash(seed,'slot')%n;
 return Array.from({length:n},(_,i)=>i===at?odd:'white');
}

/** Writes DEAL.json into the directions folder: per direction a hero structure, a type pairing, an accent family and a surface. */
export async function dealDirections(dir,{log,n=3,seed=Date.now()%9973,human,noPhoto=false,kind,lang='en'}={}){
 if(kind&&!PAGE_KINDS.includes(kind))throw new Error(`--kind must be one of ${PAGE_KINDS.join(', ')}`);
 const root=path.resolve(dir);await fs.mkdir(root,{recursive:true});
 const entries=await readLog(log),project=projectOf(root),lib=await typeLibrary();
 const keys=dealStructures(entries,project,{n,seed,human:human===undefined?await humanHeroShare(kind):human,noPhoto});
 const script=lang==='ja'?'ja':lang==='ko'?'ko':'latin';
 const type=dealType(lib.pairs,entries,project,{n,seed,kind,script}),acc=dealAccents(Object.keys(lib.accents),entries,project,{n,seed}),surf=dealSurfaces(n,seed);
 const deal={schemaVersion:2,kind:kind??null,lang,structures:keys.map((key,i)=>({label:String.fromCharCode(65+i),key,brief:HERO_STRUCTURES[key],type:type[i],accent:{family:acc[i],brief:lib.accents[acc[i]]},surface:{key:surf[i],brief:lib.surfaces[surf[i]]}}))};
 await fs.writeFile(path.join(root,DEAL_FILE),JSON.stringify(deal,null,1)+'\n');
 return {...deal,file:path.join(root,DEAL_FILE)};
}
export async function readDeal(dir){try{return JSON.parse(await fs.readFile(path.join(path.resolve(dir),DEAL_FILE),'utf8'));}catch{return null;}}

const close=(a,b)=>a&&b&&a.every((v,k)=>Math.abs(v-b[k])<=10);
const whiteish=rgb=>Math.min(...rgb)>=247&&Math.max(...rgb)-Math.min(...rgb)<=8;

/** Warnings against the log (other projects only) and against the deal, per direction. */
export function historyWarnings(items,entries,project,deal=null){
 const prev=others(entries,project).slice(-10).reverse(),w=[];
 for(const d of items){
  const assigned=deal?.structures?.find(s=>s.label===d.label);
  if(assigned&&d.hero&&assigned.key!==d.hero)w.push({id:'deal-mismatch',a:d.label,c:assigned.key,d:d.hero});
  if(assigned?.type&&d.fonts?.length&&![assigned.type.display,assigned.type.text].some(f=>d.fonts.map(lc).includes(lc(f))))w.push({id:'deal-type',a:d.label,c:assigned.type.display+' + '+assigned.type.text,d:d.fonts.join(' + ')});
  if(assigned?.accent&&d.accent&&accentFamily(d.accent)!==assigned.accent.family)w.push({id:'deal-accent',a:d.label,c:assigned.accent.family,d:accentFamily(d.accent)});
  const hero=prev.slice(0,3).find(e=>e.hero&&e.hero===d.hero);
  if(hero)w.push({id:'repeat-hero',a:d.label,c:d.hero,page:hero.page});
  const pair=x=>(x||[]).slice(0,2).join(' + ');
  const fonts=d.fonts?.length&&prev.find(e=>pair(e.fonts)===pair(d.fonts));
  if(fonts)w.push({id:'repeat-fonts',a:d.label,c:pair(d.fonts),page:fonts.page});
  const surf=d.bg&&!whiteish(d.bg)&&prev.slice(0,5).find(e=>close(e.bg,d.bg));
  if(surf)w.push({id:'repeat-surface',a:d.label,c:d.bg,page:surf.page});
 const hue=c=>{const [r,g,b]=c.map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(!d)return null;const h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return (h*60+360)%360;};
  const ah=d.accent&&hue(d.accent),acc=ah!=null&&prev.slice(0,3).find(e=>{const eh=e.accent&&hue(e.accent);return eh!=null&&Math.min(Math.abs(eh-ah),360-Math.abs(eh-ah))<=18;});
  if(acc)w.push({id:'repeat-accent',a:d.label,c:d.accent,page:acc.page});
 }
 return w;
}

/**
 * Pick-time note, not a warning: when the last `run` picks for other projects were all plain white,
 * point at the dealt non-white directions. Human sites are white 82% of the time, so one white pick is
 * normal; a run of them is how round 9 put 8 of 8 pages on white and read as one template.
 */
export function pickNotes(items,entries,project,run=4){
 const prev=others(entries,project).filter(e=>e.bg).slice(-run),odd=items.filter(d=>d.bg&&!whiteish(d.bg)).map(d=>d.label);
 return prev.length===run&&prev.every(e=>whiteish(e.bg))&&odd.length&&odd.length<items.length?[{id:'white-run',n:run,a:odd.join(', ')}]:[];
}

/** Appends the picked direction (by label) from the last `directions` run to the log. */
export async function recordChoice(dir,{pick,page,log}={}){
 const root=path.resolve(dir);
 let sheet;try{sheet=JSON.parse(await fs.readFile(path.join(root,SHEET_JSON),'utf8'));}catch{throw new Error(`Run "ui-refiner directions ${dir}" first; ${SHEET_JSON} is missing.`);}
 const item=sheet.items.find(d=>d.label===String(pick||'').toUpperCase());
 if(!item)throw new Error(`--pick must be one of ${sheet.items.map(d=>d.label).join(', ')}`);
 const entries=await readLog(log);
 const entry={date:new Date().toISOString().slice(0,10),project:projectOf(root),page:page||path.basename(projectOf(root)),label:item.label,concept:item.note?.concept??null,hero:item.hero??null,fonts:item.fonts??[],bg:item.bg??null,accent:item.accent??null};
 entries.push(entry);
 await fs.writeFile(path.join(root,'PICK.json'),JSON.stringify(entry,null,1)+'\n');
 return {entry,file:await writeLog(entries.slice(-200),log)};
}
