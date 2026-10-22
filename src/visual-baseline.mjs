import fs from 'node:fs/promises';
import path from 'node:path';
import {atomicWrite} from './image-evidence.mjs';
import {visualHash,readVisualFile,decodeVisualPng} from './visual-png.mjs';

const marker='.ui-refiner-visual.json',imageName=/^[a-f0-9]{64}-[a-f0-9]{64}\.png$/;
export function validateVisualManifest(manifest,kind){
 if(manifest?.schemaVersion!==1||manifest.kind!==kind||!Array.isArray(manifest.entries)||!manifest.entries.length||manifest.entries.length>10000)throw Error('Invalid visual '+kind+' manifest');
 const keys=new Set();
 for(const e of manifest.entries){
  if(!/^[a-f0-9]{64}$/.test(e.key||'')||keys.has(e.key)||!e.dimensions||!e.compatibility||!imageName.test(e.image?.file||'')||!/^[a-f0-9]{64}$/.test(e.image?.sha256||'')||!Number.isInteger(e.image?.bytes))throw Error('Invalid or duplicate visual baseline entry');
  if(e.image.file!==e.key+'-'+e.image.sha256+'.png'||e.image.bytes<1||e.image.bytes>32000000)throw Error('Invalid visual image metadata');
  if(kind==='approved'&&!e.compatibility.environment?.declaredProfile)throw Error('Approved visual baseline requires a declared font/execution profile');
  keys.add(e.key);
 }
 return manifest;
}
export async function loadVisualBaseline(dir){
 try{const file=path.join(dir,'manifest.json'),stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>20000000)throw Error('Visual manifest must be a bounded regular file');return validateVisualManifest(JSON.parse(await fs.readFile(file,'utf8')),'approved');}
 catch(e){if(e.code==='ENOENT')return null;throw e;}
}
async function ownedDirectory(dir,kind,{fresh=false}={}){
 try{await fs.mkdir(dir,{recursive:false});await fs.writeFile(path.join(dir,marker),JSON.stringify({schemaVersion:1,owner:'ui-refiner',kind})+'\n',{flag:'wx'});}
 catch(e){
  if(e.code!=='EEXIST')throw e;if(fresh)throw Error('Visual candidate output already exists');
  const stat=await fs.lstat(dir);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Visual output must be a regular directory');
  const ownership=JSON.parse(await fs.readFile(path.join(dir,marker),'utf8'));
  if(ownership.owner!=='ui-refiner'||ownership.schemaVersion!==1||ownership.kind!==kind)throw Error('Visual output is not owned by this command');
 }
}
async function writeImage(dir,file,bytes){
 const target=path.join(dir,file);
 try{await fs.writeFile(target,bytes,{flag:'wx'});}
 catch(e){if(e.code!=='EEXIST')throw e;const existing=await readVisualFile(dir,file,{sha256:visualHash(bytes),bytes:bytes.length});if(!existing.equals(bytes))throw Error('Visual image collision');}
}
export async function createVisualCandidate(reportFile,outDir){
 const file=path.resolve(reportFile),reportBytes=await fs.readFile(file),report=JSON.parse(reportBytes);
 if(!Array.isArray(report.stages)||!['suta','lintapple'].every(engine=>report.stages.some(s=>s.engine===engine&&['complete','findings'].includes(s.status)))||report.scope?.mode!=='full'||!report.visual?.enabled||!report.visual.entries?.length||report.stages?.some(s=>['error','not-covered'].includes(s.status))||report.visual.entries.some(e=>!['matched','different','needs-baseline','not-comparable'].includes(e.status)||!e.actual))throw Error('Visual candidates require completed full browser/static checks and all requested captures');
 const entries=[];
 for(const entry of report.visual.entries){
  const bytes=await readVisualFile(path.dirname(file),entry.actual.file,entry.actual);const size=decodeVisualPng(bytes);
  const image={file:entry.key+'-'+visualHash(bytes)+'.png',sha256:visualHash(bytes),bytes:bytes.length,width:size.width,height:size.height};
  entries.push({key:entry.key,dimensions:entry.dimensions,compatibility:entry.compatibility,maskRegions:entry.maskRegions,image});
 }
 const manifest=validateVisualManifest({schemaVersion:1,kind:'candidate',createdAt:new Date().toISOString(),sourceReportHash:visualHash(reportBytes),entries},'candidate');
 const destination=path.resolve(outDir);await fs.mkdir(path.dirname(destination),{recursive:true});await ownedDirectory(destination,'candidate',{fresh:true});
 for(const [i,entry] of entries.entries())await writeImage(destination,entry.image.file,await readVisualFile(path.dirname(file),report.visual.entries[i].actual.file,report.visual.entries[i].actual));
 await atomicWrite(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
export async function approveVisualCandidate(candidateFile,outDir){
 const source=path.resolve(candidateFile),bytes=await fs.readFile(source);
 const candidate=validateVisualManifest(JSON.parse(bytes),'candidate');
 if(candidate.entries.some(e=>!e.compatibility.environment?.declaredProfile))throw Error('Declare and review the font/execution environmentProfile before approving images');
 for(const entry of candidate.entries)decodeVisualPng(await readVisualFile(path.dirname(source),entry.image.file,entry.image));
 const destination=path.resolve(outDir);await fs.mkdir(path.dirname(destination),{recursive:true});await ownedDirectory(destination,'approved');
 const previous=await loadVisualBaseline(destination);
 for(const entry of candidate.entries)await writeImage(destination,entry.image.file,await readVisualFile(path.dirname(source),entry.image.file,entry.image));
 const manifest={...candidate,kind:'approved',approvedAt:new Date().toISOString(),sourceCandidateHash:visualHash(bytes)};
 await atomicWrite(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 // Only owned, recognized PNGs become eligible after the new manifest is published.
 const keep=new Set(manifest.entries.map(e=>e.image.file));
 for(const entry of previous?.entries||[])if(!keep.has(entry.image.file)){const target=path.join(destination,entry.image.file);const stat=await fs.lstat(target).catch(()=>null);if(stat?.isFile()&&!stat.isSymbolicLink())await fs.unlink(target);}
 return manifest;
}
