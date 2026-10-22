import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {safeRelative,validateReport} from './result-contract.mjs';
import {renderOfflineReport} from './offline-report.mjs';
import {reportToSarif} from './sarif.mjs';
import {atomicWrite} from './image-evidence.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
export function collectEvidence(report){
 const refs=new Map();
 const add=(file,metadata={})=>{if(typeof file==='string'&&/\.(png|aria\.yml)$/.test(file))refs.set(file,{...refs.get(file),file,...metadata});};
 const walk=value=>{if(typeof value==='string')add(value);else if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object'){if(value.file||value.image)add(value.file||value.image,{sha256:value.sha256,bytes:value.bytes});for(const [key,item] of Object.entries(value))if(key!=='reproduction'&&key!=='configSnapshot')walk(item);}};
 walk(report);
 for(const item of report.imageArtifacts||[])add(item.file,item);
 for(const item of report.ariaSnapshots||[])add(item.file,item);
 for(const item of report.ariaDiff?.changed||[]){add(item.file,{sha256:item.sha256,bytes:item.bytes});add(item.previousFile,{sha256:item.previousSha256,bytes:item.previousBytes});}
 for(const item of [...report.ariaDiff?.removed||[],...report.ariaDiff?.added||[]])add(item.file,{sha256:item.sha256,bytes:item.bytes});
 return [...refs.values()];
}
export async function exportHtmlBundle(reportFile,outDir){
 const source=path.resolve(reportFile),raw=await fs.readFile(source),report=validateReport(JSON.parse(raw)),base=await fs.realpath(path.dirname(source)),destination=path.resolve(outDir);
 // Fresh directories prevent accidental replacement of reviewed bundles or source evidence.
 await fs.mkdir(destination);const inventory=[];let totalBytes=0;
 for(const ref of collectEvidence(report)){
  const entry={file:ref.file,status:'unavailable'};inventory.push(entry);
  try{
   if(inventory.length>2000||totalBytes>256_000_000)throw Error('Bundle evidence budget exhausted (2000 files / 256 MB)');
   if(!safeRelative(ref.file))throw Error('Unsafe evidence path');
   const file=path.resolve(base,ref.file),real=await fs.realpath(file),stat=await fs.lstat(file);
   if(!real.startsWith(base+path.sep)||!stat.isFile()||stat.isSymbolicLink())throw Error('Evidence must be a regular file inside the report directory');
   if(stat.size>(ref.file.endsWith('.png')?32_000_000:2_000_000))throw Error('Evidence exceeds export size limit');
   if(totalBytes+stat.size*2>256_000_000)throw Error('Bundle evidence byte budget exhausted');
   const bytes=await fs.readFile(file),aria=ref.file.endsWith('.aria.yml'),content=aria?bytes.subarray(0,-1):bytes;
   if(aria&&bytes.at(-1)!==10)throw Error('ARIA storage newline missing');
   const expected=ref.sha256||(!aria?ref.file.match(/-([a-f0-9]{64})\.png$/)?.[1]:undefined);
   if(expected&&hash(content)!==expected)throw Error('Evidence hash mismatch');
   if(ref.bytes!==undefined&&content.length!==ref.bytes)throw Error('Evidence byte count mismatch');
   const target=path.join(destination,ref.file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes,{flag:'wx'});
   const bundleFile='e/'+hash(Buffer.from(ref.file)).slice(0,24)+(aria?'.aria.yml':'.png');
   await fs.mkdir(path.join(destination,'e'),{recursive:true});await fs.writeFile(path.join(destination,bundleFile),bytes,{flag:'wx'});
   totalBytes+=bytes.length*2;Object.assign(entry,{bundleFile},{status:'copied',integrity:expected?'verified':'unverified: original report has no hash',sha256:hash(content),bytes:content.length});
  }catch(e){entry.reason=e.code==='ENOENT'?'Recorded evidence is missing':e.message;}
 }
 await fs.writeFile(path.join(destination,'report.json'),raw,{flag:'wx'});
 await fs.writeFile(path.join(destination,'handoff.json'),JSON.stringify(report.handoffDetails||{status:'unavailable',reason:'Older report has no machine handoff'},null,2)+'\n',{flag:'wx'});
 await fs.writeFile(path.join(destination,'evidence-manifest.json'),JSON.stringify({schemaVersion:1,sourceReportSha256:hash(raw),evidence:inventory},null,2)+'\n',{flag:'wx'});
 await fs.writeFile(path.join(destination,'report.html'),renderOfflineReport(report,{inventory}),{flag:'wx'});
 return report;
}
export async function exportSarif(reportFile,outFile){
 const canonical=file=>process.platform==='win32'?path.resolve(file).toLowerCase():path.resolve(file);
 if(canonical(reportFile)===canonical(outFile))throw Error('SARIF destination must differ from canonical report');
 const report=validateReport(JSON.parse(await fs.readFile(reportFile,'utf8')));
 await atomicWrite(outFile,JSON.stringify(reportToSarif(report),null,2)+'\n');return report;
}
