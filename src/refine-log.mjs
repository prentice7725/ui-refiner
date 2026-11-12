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
/**
 * Accent families human sites of this kind use (data/colour-reference/human.json, measured on 548 Korean, Japanese
 * and English sites in November 2026), as weights for the colour deal. Korean and Japanese pages use their own
 * country's figures when 15 or more sites of that kind were measured.
 */
export async function humanColours(kind,lang){
 try{
  const j=JSON.parse(await fs.readFile(new URL('../data/colour-reference/human.json',import.meta.url),'utf8'));
  const c=lang==='ko'?'KR':lang==='ja'?'JP':null,local=c&&kind&&j.byKind?.[`${kind}/${c}`];
  return ((local?.sites>=15&&local)||(kind&&j.byKind?.[kind])||(c&&j.byCountry?.[c])||j.all).accent;
 }catch{return null;}
}
export const PAGE_KINDS=['software','service','place','public','company','studio','media'];
/** Page character, chosen before the deal; it narrows the surfaces and faces (data/type-pairs.json "tones"). */
export const PAGE_TONES=['calm','warm','technical','bold'];
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

/**
 * The colour a direction reads as: its ground when that is a clear colour, otherwise its accent. In benchmark round 14
 * three pages used the same forest-green ground while their buttons were yellow or blue, so only the accent was checked
 * and all three set judges named "deep forest green" as the shared habit.
 */
export function leadColour(d){
 const bg=d?.bg;
 if(bg&&!whiteish(bg)){const f=accentFamily(bg);const [r,g,b]=bg.map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,s=mx===mn?0:(mx-mn)/(1-Math.abs(2*l-1));if(f&&f!=='ink'&&s>=.2)return bg;}
 return d?.accent??null;
}

/** Accent hue families for n directions, distinct, avoiding families picked recently elsewhere (ground or accent); indigo last. */
export function dealAccents(families,entries,project,{n=3,seed=0,weights}={}){
 const recent=others(entries,project).slice(-4).flatMap(e=>[accentFamily(leadColour(e)),accentFamily(e.accent)]).filter(Boolean);
 const score=k=>(k==='indigo'?4:0)+(recent.includes(k)?2:0);
 // Within the same penalty, families human sites of the kind use more often come first more often (a weighted draw:
 // u^(1/w)). The square root and the floor keep rarer families in play, so a set does not all go blue.
 const draw=k=>weights?((hash(seed,k)+1)/998)**(1/(Math.sqrt(weights[k]||0)+.15)):1-hash(seed,k)/997;
 return [...families].sort((x,y)=>score(x)-score(y)||draw(y)-draw(x)).slice(0,n);
}

/**
 * Surfaces: plain white for most; one direction gets a paper, dark or brand ground, mostly paper. Measured on 548
 * Korean, Japanese and English sites (data/colour-reference), only about 2% of first screens use a full-colour ground
 * and 5% a dark one; the rest are white or a faint tint (58%) or a photo (35%). So a brand ground is dealt on about
 * one page in twenty and a dark one on about one in twelve, where the tone allows it.
 * Software pages get no dark ground: in benchmark round 12 all three judges read the dark dashboard with a neon
 * accent as a crypto or dev-tool template and ranked both Korean software pages 4th or 5th of 5.
 * Calm and warm pages get no dark ground either.
 */
/**
 * Colour families for n directions, within what fits the tone (data/type-pairs.json tones.*.accents), and a brand
 * ground only in a family that suits a full-colour ground (tones.*.brandGround). In benchmark round 15 any family
 * could be dealt: a budgeting app came out brown, and a full red food-bank hero and a magenta hiring page read heavy,
 * so per-page ranks fell by more than one place for Claude and Gemini.
 */
export function toneColours(lib,toneDef,surf,entries,project,{n=3,seed=0,weights}={}){
 const all=Object.keys(lib.accents),pool=toneDef?.accents?.length?toneDef.accents.filter(f=>all.includes(f)):all;
 const acc=dealAccents(pool,entries,project,{n,seed,weights});
 const bi=surf.indexOf('brand');
 if(bi>=0){
  const ground=(toneDef?.brandGround??pool).filter(f=>f!=='ink');
  if(!ground.includes(acc[bi])){
   const j=acc.findIndex(f=>ground.includes(f));
   if(j>=0)[acc[bi],acc[j]]=[acc[j],acc[bi]];
   else acc[bi]=dealAccents(ground.filter(f=>!acc.includes(f)),entries,project,{n:1,seed,weights})[0]??acc[bi];
  }
 }
 return acc;
}

export function dealSurfaces(n=3,seed=0,{kind,tone}={}){
 // A dark ground also needs a tone that carries it: in round 13 a dark food-bank page read "cold for a community food bank".
 const dark=kind!=='software'&&(!tone||tone==='technical'||tone==='bold');
 const r=hash(seed,'surface')%20,odd=r<3?'brand':dark&&r<8?'dark':'paper',at=hash(seed,'slot')%n;
 return Array.from({length:n},(_,i)=>i===at?odd:'white');
}

/**
 * Faces to avoid: the overused ones in data/type-pairs.json, those picked recently for other projects, and display
 * faces that fight the page's tone (condensed or ultra-heavy faces on a calm or warm page: in the November 2026
 * benchmarks judges called condensed capitals "harsh" on a family dental page and Dela Gothic One hard to read).
 */
export function avoidFaces(pairs,entries,project,toneDef){
 const out=new Set(pairs.filter(p=>p.overused).flatMap(p=>[p.display,p.text]));
 if(toneDef){for(const p of pairs)if(toneDef.avoidVoices.includes(p.voice))out.add(p.display);for(const f of toneDef.avoidFaces)out.add(f);}
 for(const e of others(entries,project).slice(-8))for(const f of e.fonts||[])out.add(f);
 return [...out];
}

/**
 * Writes DEAL.json into the directions folder: per direction a hero structure, a surface and a colour family, plus
 * faces to avoid. Type is left to the agent: in benchmark round 11 dealt pairings read as plain, and the per-page
 * winners were pages that pushed one strong face of their own choosing. The colour family is dealt again since round
 * 14, where the tone left colour free and three of eight pages took the same forest green.
 */
export async function dealDirections(dir,{log,n=3,seed=Date.now()%9973,human,colours,noPhoto=false,kind,tone,lang='en'}={}){
 if(kind&&!PAGE_KINDS.includes(kind))throw new Error(`--kind must be one of ${PAGE_KINDS.join(', ')}`);
 if(tone&&!PAGE_TONES.includes(tone))throw new Error(`--tone must be one of ${PAGE_TONES.join(', ')}`);
 const root=path.resolve(dir);await fs.mkdir(root,{recursive:true});
 const entries=await readLog(log),project=projectOf(root),lib=await typeLibrary();
 const keys=dealStructures(entries,project,{n,seed,human:human===undefined?await humanHeroShare(kind):human,noPhoto});
 const script=lang==='ja'?'ja':lang==='ko'?'ko':'latin';
 const surf=dealSurfaces(n,seed,{kind,tone}),toneDef=tone?lib.tones[tone]:null;
 const acc=toneColours(lib,toneDef,surf,entries,project,{n,seed,weights:colours===undefined?await humanColours(kind,lang):colours});
 const deal={schemaVersion:5,kind:kind??null,tone:tone??null,toneBrief:toneDef?.brief??null,lang,script,avoidFaces:avoidFaces(lib.pairs,entries,project,toneDef),structures:keys.map((key,i)=>({label:String.fromCharCode(65+i),key,brief:HERO_STRUCTURES[key],surface:{key:surf[i],brief:lib.surfaces[surf[i]]},accent:{family:acc[i],brief:lib.accents[acc[i]]}}))};
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
  const lead=leadColour(d);
  if(assigned?.accent&&lead&&accentFamily(lead)!==assigned.accent.family)w.push({id:'deal-accent',a:d.label,c:assigned.accent.family,d:accentFamily(d.accent)});
  const hero=prev.slice(0,3).find(e=>e.hero&&e.hero===d.hero);
  if(hero)w.push({id:'repeat-hero',a:d.label,c:d.hero,page:hero.page});
  const pair=x=>(x||[]).slice(0,2).join(' + ');
  const fonts=d.fonts?.length&&prev.find(e=>pair(e.fonts)===pair(d.fonts));
  if(fonts)w.push({id:'repeat-fonts',a:d.label,c:pair(d.fonts),page:fonts.page});
  const surf=d.bg&&!whiteish(d.bg)&&prev.slice(0,5).find(e=>close(e.bg,d.bg));
  if(surf)w.push({id:'repeat-surface',a:d.label,c:d.bg,page:surf.page});
 const hue=c=>{const [r,g,b]=c.map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(!d)return null;const h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return (h*60+360)%360;};
  const ah=lead&&hue(lead),acc=ah!=null&&prev.slice(0,3).find(e=>{const el=leadColour(e),eh=el&&hue(el);return eh!=null&&Math.min(Math.abs(eh-ah),360-Math.abs(eh-ah))<=18;});
  if(acc)w.push({id:'repeat-accent',a:d.label,c:lead,page:acc.page});
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
