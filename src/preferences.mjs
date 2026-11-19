// The person's taste, as things the deal leaves out. Each entry traces back to the person's own words (`said`).
// Rules live here as data the deal reads, not as sentences in a file: a sentence gets skipped when the agent's
// context is full, an exclusion runs every time. Only "avoid": a "favour" would pull every client towards one look,
// which is what the refine log exists to prevent.
// Entries are never deleted. Removing one marks it retired with a date; adding the same axis and value again replaces
// the old entry and points to the new one, so the history of what the person said stays readable.
// Default location: next to the refine log, ~/.ui-refiner/preferences.json (UI_REFINER_HOME overrides).
import fs from 'node:fs/promises';
import path from 'node:path';
import {logPath,HERO_STRUCTURES,PAGE_KINDS,cleanSaid} from './refine-log.mjs';

export const AXES={
 hero:'a hero structure (directions deal keys)',
 face:'a typeface, by family name',
 accent:'an accent colour family',
 surface:'a ground the tailored direction can be dealt: brand, dark or paper',
 material:'a material for the bold direction (its slug)'
};
export const SURFACES=['brand','dark','paper'];
export const ACCENT_FAMILIES=['red','orange','amber','brown','green','teal','blue','indigo','pink','ink'];

export function prefsPath(file,log){return file||path.join(path.dirname(logPath(log)),'preferences.json');}
export async function readPrefs(file,log){try{const j=JSON.parse(await fs.readFile(prefsPath(file,log),'utf8'));return Array.isArray(j.entries)?j.entries:[];}catch{return [];}}
async function writePrefs(entries,file,log){const f=prefsPath(file,log);await fs.mkdir(path.dirname(f),{recursive:true});await fs.writeFile(f,JSON.stringify({schemaVersion:1,entries},null,1)+'\n');return f;}

const norm=(axis,value)=>axis==='face'?String(value).trim().replace(/\s+/g,' '):String(value).trim().toLowerCase();
const same=(a,b)=>a.axis===b.axis&&a.value.toLowerCase()===b.value.toLowerCase()&&(a.kind??null)===(b.kind??null);

/** Checks an axis and value against what the deal can leave out. `materials` is the list of known slugs. */
export function validatePref(axis,value,{materials=[]}={}){
 if(!AXES[axis])throw new Error(`axis must be one of ${Object.keys(AXES).join(', ')}`);
 const v=norm(axis,value||'');
 if(!v)throw new Error(`${axis} needs a value`);
 const ok={hero:Object.keys(HERO_STRUCTURES),accent:ACCENT_FAMILIES,surface:SURFACES,material:materials}[axis];
 if(ok&&ok.length&&!ok.includes(v))throw new Error(`${axis} must be one of ${ok.join(', ')}`);
 return v;
}

/** Adds an avoid entry. `said` (the person's words) is required: no preference without its source. */
export async function addPref(axis,value,{said,kind,file,log,materials}={}){
 const s=cleanSaid(said);
 if(!s)throw new Error('prefer add requires --said with the person\'s own words');
 if(kind&&!PAGE_KINDS.includes(kind))throw new Error(`--kind must be one of ${PAGE_KINDS.join(', ')}`);
 const v=validatePref(axis,value,{materials});
 const entries=await readPrefs(file,log),date=new Date().toISOString().slice(0,10);
 const entry={id:`${axis}:${v}${kind?'@'+kind:''}:${entries.length+1}`,axis,value:v,kind:kind??null,said:s,date,status:'active'};
 for(const e of entries)if(e.status==='active'&&same(e,entry)){e.status='replaced';e.until=date;e.replacedBy=entry.id;}
 entries.push(entry);
 return {entry,file:await writePrefs(entries,file,log)};
}

/** Retires the active entries for an axis and value (all kinds unless `kind` is given). Returns how many. */
export async function removePref(axis,value,{kind,file,log}={}){
 if(!AXES[axis])throw new Error(`axis must be one of ${Object.keys(AXES).join(', ')}`);
 const v=norm(axis,value||''),entries=await readPrefs(file,log),date=new Date().toISOString().slice(0,10);
 let n=0;
 for(const e of entries)if(e.status==='active'&&e.axis===axis&&e.value.toLowerCase()===v.toLowerCase()&&(!kind||e.kind===kind)){e.status='retired';e.until=date;n++;}
 return {retired:n,file:await writePrefs(entries,file,log)};
}

/** The active entries that apply to a page of this kind: those without a kind, and those for this kind. */
export function activePrefs(entries,kind){return entries.filter(e=>e.status==='active'&&(!e.kind||e.kind===kind));}

/** The values to leave out, per axis, from the applying entries. */
export function avoidSets(prefs){
 const out=Object.fromEntries(Object.keys(AXES).map(a=>[a,new Set()]));
 for(const p of prefs)out[p.axis]?.add(p.axis==='face'?p.value.toLowerCase():p.value);
 return out;
}

/**
 * Candidates from the refine log for the agent to put to the person. It never writes anything: a preference is added
 * only after the person agrees, with their words.
 * - `said`: picks whose words have no preference recorded on the same date, newest first.
 * - `neverPicked`: a hero structure, material or display face shown in `min` or more rejected directions and never
 *   picked. Weak evidence on its own (one of three always loses), so it is a question, never a rule.
 */
export function suggestPrefs(logEntries,prefs,{min=3}={}){
 const active=prefs.filter(p=>p.status==='active'),has=(axis,v)=>active.some(p=>p.axis===axis&&p.value.toLowerCase()===String(v).toLowerCase());
 const said=logEntries.filter(e=>e.said&&!prefs.some(p=>p.date===e.date&&p.said===e.said)).slice(-10).reverse().map(e=>({date:e.date,page:e.page,pick:e.label,said:e.said}));
 const tally=(get,axis)=>{const shown=new Map(),picked=new Set();
  for(const e of logEntries){for(const v of [get(e)].flat())if(v)picked.add(String(v).toLowerCase());
   for(const r of e.rejected||[])for(const v of [get(r)].flat())if(v){const k=String(v).toLowerCase();shown.set(k,{value:v,n:(shown.get(k)?.n??0)+1});}}
  return [...shown.entries()].filter(([k,s])=>s.n>=min&&!picked.has(k)&&!has(axis,s.value)).map(([,s])=>({axis,value:s.value,rejected:s.n}));};
 const neverPicked=[...tally(e=>e.hero,'hero'),...tally(e=>e.material,'material'),...tally(e=>(e.fonts||[])[0],'face')].sort((a,b)=>b.rejected-a.rejected);
 return {said,neverPicked};
}
