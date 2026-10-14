import fs from 'node:fs/promises';
import path from 'node:path';
import {validateAriaMasks} from './config.mjs';
export function maskAriaSnapshot(snapshot,masks=[]){
 validateAriaMasks(masks);
 // Explicit patterns only: numbers can be meaningful labels, so never erase them globally.
 return masks.reduce((text,mask)=>text.replace(new RegExp(mask.pattern,mask.flags??'g'),'<masked>'),snapshot);
}
const managed=/^render-[a-zA-Z0-9_-]+-[a-f0-9]{16}\.aria\.yml$/;
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
 return {removed,retainedReferences:keep.size};
}
