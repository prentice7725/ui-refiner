import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validateAriaMasks} from './config.mjs';
import {ariaTextDiff} from './aria-text-diff.mjs';
export function maskAriaSnapshot(snapshot,masks=[]){
 validateAriaMasks(masks);
 // Explicit patterns only: numbers can be meaningful labels, so never erase them globally.
 return masks.reduce((text,mask)=>{const masked=text.replace(new RegExp(mask.pattern,mask.flags??'g'),'<masked>');if(Buffer.byteLength(masked)>2_000_000)throw Error('Masked ARIA snapshot exceeded the 2 MB evidence limit');return masked;},snapshot);
}
const managed=/^render-[a-zA-Z0-9_-]+-[a-f0-9]{16}\.aria\.yml$/;
async function readSnapshot(dir,file,sha256,expectedBytes){
 if(typeof file!=='string'||path.basename(file)!==file||file.includes('\\')||!file.endsWith('.aria.yml'))throw Error('Invalid ARIA evidence path');
 if(!/^[a-f0-9]{64}$/.test(sha256||''))throw Error('Missing or invalid ARIA evidence hash');
 const target=path.join(dir,file),stat=await fs.lstat(target);
 if(!stat.isFile()||stat.isSymbolicLink())throw Error('ARIA evidence must be a regular file');
 if(stat.size>2_000_001)throw Error('ARIA evidence exceeds the 2 MB snapshot limit');
 const handle=await fs.open(target,'r');
 let bytes;
 try{
  const opened=await handle.stat();if(!opened.isFile()||opened.size!==stat.size)throw Error('ARIA evidence changed while opening');
  const buffer=Buffer.alloc(stat.size+1);let count=0;
  while(count<buffer.length){const read=await handle.read(buffer,count,buffer.length-count,count);if(!read.bytesRead)break;count+=read.bytesRead;}
  if(count!==stat.size)throw Error('ARIA evidence changed or could not be read completely');
  bytes=buffer.subarray(0,count);
 }finally{await handle.close();}
 // browser-worker appends exactly one newline after hashing the masked snapshot.
 if(bytes.at(-1)!==10)throw Error('ARIA evidence is missing its storage newline');
 bytes=bytes.subarray(0,-1);
 if(createHash('sha256').update(bytes).digest('hex')!==sha256)throw Error('ARIA evidence hash mismatch');
 if(expectedBytes!==undefined&&bytes.length!==expectedBytes)throw Error('ARIA evidence byte count mismatch');
 return bytes.toString('utf8');
}

// Historical text explanation failures are advisory, not new capture failures.
// Current requested snapshot failures are already handled by the browser stage.
export async function explainAriaDiff(dir,diff,{maxComparisons=16,maxBytes=64000,maxLines=600}={}){
 if(diff.status!=='compared')return diff;
 let attempted=0,usedBytes=0,usedLines=0;
 const summary={schemaVersion:1,format:'unified',advisory:true,compared:0,unavailable:0,notGenerated:0,truncated:0,limits:{maxComparisons,maxBytes,maxLines}};
 for(const kind of ['changed','added','removed'])for(const entry of diff[kind]){
  const oldFile=kind==='changed'?entry.previousFile:kind==='removed'?entry.file:null;
  const newFile=kind==='removed'?null:entry.file;
  if(attempted>=maxComparisons||usedBytes>=maxBytes||usedLines>=maxLines){
   entry.textDiff={status:'not-generated',reason:'ARIA explanation batch limit reached',oldFile,newFile,truncated:true};summary.notGenerated++;continue;
  }
  attempted++;
  try{
   const before=oldFile?await readSnapshot(dir,oldFile,kind==='changed'?entry.previousSha256:entry.sha256,kind==='changed'?entry.previousBytes:entry.bytes):'';
   const after=newFile?await readSnapshot(dir,newFile,entry.sha256,entry.bytes):'';
   entry.textDiff={...ariaTextDiff(before,after,{maxBytes:Math.min(12000,maxBytes-usedBytes),maxLines:Math.min(120,maxLines-usedLines)}),oldFile,newFile};
   usedBytes+=entry.textDiff.outputBytes;usedLines+=entry.textDiff.hunks.reduce((n,h)=>n+h.lines.length,0);
   summary.compared++;if(entry.textDiff.truncated)summary.truncated++;
  }catch(e){entry.textDiff={status:'unavailable',reason:e.code==='ENOENT'?'ARIA evidence file is missing':e.message,oldFile,newFile,truncated:false};summary.unavailable++;}
 }
 diff.textSummary={...summary,outputBytes:usedBytes,outputLines:usedLines};
 return diff;
}

export async function pruneAriaSnapshots(dir,reports){
 const keep=new Set();
 for(const report of reports.filter(Boolean)){
  for(const file of report.artifacts||[])if(typeof file==='string'&&file.endsWith('.aria.yml'))keep.add(file);
  for(const snapshot of report.ariaSnapshots||[])if(typeof snapshot.file==='string')keep.add(snapshot.file);
  // Retain the comparison's old side as well, including previous-report comparisons.
  for(const snapshot of report.ariaDiff?.changed||[])for(const key of ['file','previousFile'])if(typeof snapshot[key]==='string')keep.add(snapshot[key]);
  for(const key of ['added','removed','unchanged'])for(const snapshot of report.ariaDiff?.[key]||[])if(typeof snapshot.file==='string')keep.add(snapshot.file);
 }
 let removed=0;
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  if(entry.isFile()&&managed.test(entry.name)&&!keep.has(entry.name)){await fs.unlink(path.join(dir,entry.name));removed++;}
 }
 return {status:'complete',removed,retainedReferences:keep.size};
}
