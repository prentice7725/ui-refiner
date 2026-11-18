// Signals a project keeps on purpose. A brand typeface, a brand accent or the plain family of the familiar direction
// would otherwise add the same points on every scan. Each entry names one AI-look signal and says why it is deliberate;
// the scan then reports the signal without scoring it. The file lives in the project (ui-refiner-allow.json, next to
// ui-refiner-keep.json), never in the page: nothing about the tool ships to the visitor.
// Only AI-look signals can be allowed. Baseline quality (contrast, labels, overflow) cannot be waived here.
import fs from 'node:fs/promises';
import path from 'node:path';
import {signalTitle} from './ai-tells.mjs';

export const ALLOW_FILE='ui-refiner-allow.json';

/** Reads and validates an allow file. A missing file is an empty list. */
export async function readAllow(file){
 let raw;try{raw=JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return [];throw Error(`${file}: ${e.message}`);}
 if(!raw||raw.schemaVersion!==1||!Array.isArray(raw.allow)||raw.allow.length>50)throw Error(`${file} needs schemaVersion 1 and an "allow" list of at most 50 entries`);
 for(const e of raw.allow){
  if(!e||typeof e.signal!=='string'||!signalTitle(e.signal,'en'))throw Error(`${file}: unknown signal "${e?.signal}"`);
  if(typeof e.reason!=='string'||e.reason.trim().length<3)throw Error(`${file}: "${e.signal}" needs a reason`);
 }
 return raw.allow.map(e=>({signal:e.signal,reason:e.reason.trim()}));
}
async function writeAllow(file,allow){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify({schemaVersion:1,allow},null,1)+'\n');return file;}

/** The allow file for a scan target: beside a local page, else in the working directory. */
export async function findAllow(target,cwd=process.cwd()){
 const dirs=[];
 if(target&&!/^https?:/i.test(target)){const p=String(target).replace(/^file:\/\//,'');dirs.push(path.dirname(path.resolve(cwd,p)));}
 dirs.push(path.resolve(cwd));
 for(const d of dirs){const f=path.join(d,ALLOW_FILE);try{await fs.access(f);return f;}catch{}}
 return null;
}

/** Adds or replaces the entry for one signal. */
export async function addAllow(file,{signal,reason}){
 if(!signalTitle(signal,'en'))throw Error(`Unknown signal "${signal}"; the ids are the ones the scan prints (signals=…)`);
 if(typeof reason!=='string'||reason.trim().length<3)throw Error('--reason is required: say why this is deliberate');
 const allow=(await readAllow(file)).filter(e=>e.signal!==signal);allow.push({signal,reason:reason.trim()});
 return {file:await writeAllow(file,allow),allow};
}
export async function removeAllow(file,signal){
 const before=await readAllow(file),allow=before.filter(e=>e.signal!==signal);
 if(allow.length===before.length)throw Error(`"${signal}" is not in ${file}`);
 return {file:await writeAllow(file,allow),allow};
}

/** Marks the allowed signals in a scan's AI-look result: weight 0, with the project's reason. Rescore afterwards. */
export function applyAllow(tells,allow=[]){
 for(const s of tells.signals){const a=allow.find(e=>e.signal===s.id);if(a&&s.weight>0){s.weight=0;s.scored=false;s.allowed=a.reason;}}
 return tells;
}
