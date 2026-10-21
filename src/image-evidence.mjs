import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';

const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const runPattern=/^images-([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/;
const imagePattern=/^render-[a-zA-Z0-9_-]+-[a-f0-9]{64}\.png$/;
const marker='.ui-refiner-images.json';

export async function atomicWrite(file,content){
 const temporary=path.join(path.dirname(file),`.${path.basename(file)}-${randomUUID()}.tmp`);
 try{await fs.writeFile(temporary,content,{flag:'wx'});await fs.rename(temporary,file);}
 finally{await fs.rm(temporary,{force:true});}
}

// Each audit owns a fresh directory. Content hashes also prevent overwrites within that run.
export async function imageWriter(dir,runId=randomUUID()){
 const name=`images-${runId}`;
 if(!runPattern.test(name))throw Error('Invalid image evidence run ID');
 await fs.mkdir(dir,{recursive:true});
 const destination=path.join(dir,name);
 try{
  await fs.mkdir(destination);
  await fs.writeFile(path.join(destination,marker),JSON.stringify({schemaVersion:1,owner:'ui-refiner',runId,createdAt:Date.now()})+'\n',{flag:'wx'});
 }catch(e){
  if(e.code!=='EEXIST')throw e;
  if(!(await fs.lstat(destination)).isDirectory())throw Error('Image evidence directory is not a regular directory');
  if(!(await fs.lstat(path.join(destination,marker))).isFile())throw Error('Image evidence ownership marker is not a regular file');
  const ownership=JSON.parse(await fs.readFile(path.join(destination,marker),'utf8'));
  if(ownership.schemaVersion!==1||ownership.owner!=='ui-refiner'||ownership.runId!==runId)throw Error('Image evidence directory is not owned by this audit');
 }
 return async(stem,bytes,dimensions,kind,selector)=>{
  if(!/^render-[a-zA-Z0-9_-]+$/.test(stem)||!Buffer.isBuffer(bytes)||!bytes.length)throw Error('Invalid image evidence');
  const hash=sha256(bytes),basename=`${stem}-${hash}.png`,file=`${name}/${basename}`,target=path.join(destination,basename);
  try{await fs.writeFile(target,bytes,{flag:'wx'});}
  catch(e){if(e.code!=='EEXIST')throw e;if(!(await fs.lstat(target)).isFile()||!Buffer.from(await fs.readFile(target)).equals(bytes))throw Error('Existing image evidence has different bytes or is not a regular file');}
  return {artifactId:'image-'+sha256(file),file,runId,kind,mediaType:'image/png',sha256:hash,bytes:bytes.length,...dimensions,...(selector?{selector}:{})};
 };
}

export async function captureImages(page,state,{dir,runId,locale='en-US',timeoutMs}){
 const write=await imageWriter(dir,runId),images=[];
 const label=state.name.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,40);
 const suffix=sha256(JSON.stringify([state.routeKey||'',state.name])).slice(0,8);
 const stem=`render-${state.route}-${state.viewport.width}x${state.viewport.height}-${state.colorScheme}-${label}-${suffix}`;
 const dimensions={route:state.route,routeUrl:state.routeUrl,routeKey:state.routeKey??null,state:state.name,viewport:state.viewport,colorScheme:state.colorScheme,locale,reducedMotion:'reduce'};
 const image=await write(stem,await page.screenshot({fullPage:true}),dimensions,'state');images.push(image);
 const capture={...dimensions,image:image.file,artifactId:image.artifactId,sha256:image.sha256,bytes:image.bytes,runId:image.runId,crops:[]};
 const selectors=[...new Set(state.findings.map(f=>f.selector))].slice(0,5);
 for(const [index,selector] of selectors.entries()){
  try{
   const locator=page.locator(selector);
   if(await locator.count()!==1||!await locator.isVisible())throw Error('target is not uniquely visible');
   const crop=await write(`${stem}-finding-${index+1}`,await locator.screenshot({timeout:Math.min(timeoutMs,5000)}),dimensions,'crop',selector);
   images.push(crop);capture.crops.push({selector,image:crop.file,artifactId:crop.artifactId,sha256:crop.sha256,bytes:crop.bytes});
  }catch(e){capture.crops.push({selector,status:'unavailable',reason:e.message});}
 }
 return {capture,imageArtifacts:images,artifacts:images.map(image=>image.file)};
}

export function linkImageEvidence(findings,captures){
 for(const finding of findings){
  if(finding.engine!=='lintapple')continue;
  finding.imageEvidence=captures.filter(c=>
   (c.routeKey??c.route??'default')===(finding.routeKey??finding.route??'default')&&
   c.state===(finding.state||'initial')&&c.colorScheme===finding.colorScheme&&
   c.viewport?.width===finding.viewport?.width&&c.viewport?.height===finding.viewport?.height
  ).flatMap(c=>[
   {artifactId:c.artifactId,image:c.image,kind:'state'},
   ...c.crops.filter(crop=>crop.image&&crop.selector===finding.selector).map(crop=>({artifactId:crop.artifactId,image:crop.image,kind:'crop'}))
  ]);
 }
}

export async function completeImageRun(dir,runId){
 const name=`images-${runId}`;
 if(!runPattern.test(name))throw Error('Invalid image evidence run ID');
 const destination=path.join(dir,name);
 try{if(!(await fs.lstat(destination)).isDirectory()||!(await fs.lstat(path.join(destination,marker))).isFile())throw Error('Image evidence ownership is not regular');}
 catch(e){if(e.code==='ENOENT')return;throw e;}
 const ownership=JSON.parse(await fs.readFile(path.join(destination,marker),'utf8'));
 if(ownership.schemaVersion!==1||ownership.owner!=='ui-refiner'||ownership.runId!==runId)throw Error('Image evidence ownership mismatch');
 await atomicWrite(path.join(destination,marker),JSON.stringify({...ownership,completedAt:Date.now()})+'\n');
}

export async function pruneImageEvidence(dir,reports){
 const keep=new Set();
 for(const report of reports.filter(Boolean)){
  for(const file of report.artifacts||[])if(typeof file==='string')keep.add(file);
  for(const image of report.imageArtifacts||[])keep.add(image.file);
  for(const capture of report.captures||[]){keep.add(capture.image);for(const crop of capture.crops||[])if(crop.image)keep.add(crop.image);}
  for(const finding of [report.findings,report.diff?.resolved,report.diff?.added,report.diff?.persisting].flatMap(items=>items||[]))for(const image of finding.imageEvidence||[])keep.add(image.image);
 }
 let removedRuns=0,removedImages=0,retainedRuns=0,skippedRuns=0;
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const match=entry.name.match(runPattern);
  if(!match||!entry.isDirectory())continue;
  if([...keep].some(file=>typeof file==='string'&&file.startsWith(entry.name+'/'))){retainedRuns++;continue;}
  const destination=path.join(dir,entry.name);
  let ownership;
  try{if(!(await fs.lstat(path.join(destination,marker))).isFile()){skippedRuns++;continue;}ownership=JSON.parse(await fs.readFile(path.join(destination,marker),'utf8'));}
  catch(e){if(e.code==='ENOENT'||e instanceof SyntaxError){skippedRuns++;continue;}throw e;}
  if(ownership.schemaVersion!==1||ownership.owner!=='ui-refiner'||ownership.runId!==match[1]){skippedRuns++;continue;}
  // A killed audit may leave a fresh active directory. Allow the maximum 10-minute
  // browser budget plus a one-minute grace period before reclaiming such orphans.
  if(!Number.isFinite(ownership.completedAt)&&(!Number.isFinite(ownership.createdAt)||Date.now()-ownership.createdAt<660000)){skippedRuns++;continue;}
  const files=await fs.readdir(destination,{withFileTypes:true});
  // A manual file, subdirectory or symlink protects the whole directory from cleanup.
  if(files.some(file=>!file.isFile()||(file.name!==marker&&!imagePattern.test(file.name)))){skippedRuns++;continue;}
  for(const file of files)if(file.name!==marker){await fs.unlink(path.join(destination,file.name));removedImages++;}
  await fs.unlink(path.join(destination,marker));await fs.rmdir(destination);removedRuns++;
 }
 return {status:'complete',removedRuns,removedImages,retainedRuns,skippedRuns};
}
