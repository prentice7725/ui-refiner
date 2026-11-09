#!/usr/bin/env node
// Claude Code Stop hook: do not let a refine finish while its own checks are missing, stale or failing.
// It only reads small state files the refine commands write in the project, so it is fast and inert
// in projects that are not mid-refine:
//   ui-refiner-keep.json        (keep record)  → needs ui-refiner-keep-check.json newer than the page, ok
//   refine-directions/PICK.json (directions record) → needs refine-directions/VERIFY.json newer than the page, no drift
// It blocks at most three times in a row (state in .ui-refiner-gate.json), then lets the turn end and says why.
// Set UI_REFINER_GATE=off to disable.
import fs from 'node:fs/promises';
import path from 'node:path';

const MAX_AGE=12*3600e3,MAX_BLOCKS=3;
const readJson=async f=>{try{return JSON.parse(await fs.readFile(f,'utf8'));}catch{return null;}};
const mtime=async f=>{try{return (await fs.stat(f)).mtimeMs;}catch{return null;}};

/** Returns the list of unmet conditions for the project in `cwd` (exported for tests). */
export async function refineGateProblems(cwd,now=Date.now()){
 const problems=[];
 const inv=path.join(cwd,'ui-refiner-keep.json'),invTime=await mtime(inv);
 if(invTime&&now-invTime<MAX_AGE){
  const before=await readJson(inv),check=await readJson(path.join(cwd,'ui-refiner-keep-check.json'));
  const page=before?.target&&!/^https?:/i.test(before.target)?path.resolve(cwd,before.target):null,pageTime=page?await mtime(page):null;
  if(!check)problems.push('run `ui-refiner keep check <page>`: nothing confirms the redesign kept the links, forms, fields and figures');
  else if(!check.ok)problems.push(`restore what \`ui-refiner keep check\` reported lost (${['links','forms','fields','facts'].filter(k=>check[k]?.length).map(k=>`${k}: ${check[k].slice(0,5).join(', ')}`).join('; ')}), then run it again`);
  else if(pageTime&&Date.parse(check.checkedAt)<pageTime)problems.push('the page changed after the last `ui-refiner keep check`; run it again');
 }
 const dir=path.join(cwd,'refine-directions'),pickTime=await mtime(path.join(dir,'PICK.json'));
 if(pickTime&&now-pickTime<MAX_AGE){
  const verify=await readJson(path.join(dir,'VERIFY.json'));
  const page=verify?.target&&!/^https?:/i.test(verify.target)?path.resolve(cwd,verify.target):null,pageTime=page?await mtime(page):null;
  if(!verify)problems.push('run `ui-refiner directions verify refine-directions <page>`: nothing confirms the page kept the chosen direction');
  else if(verify.drift?.length)problems.push(`the page drifted from the chosen direction (${verify.drift.map(d=>`${d.id} ${d.chosen} → ${d.applied}`).join('; ')}); rebuild it in the chosen structure and verify again`);
  else if(pageTime&&Date.parse(verify.checkedAt)<pageTime)problems.push('the page changed after the last `directions verify`; run it again');
 }
 return problems;
}

if(import.meta.url===`file://${process.argv[1]?.replaceAll('\\','/').replace(/^(?=[A-Za-z]:)/,'/')}`||process.argv[1]?.endsWith('refine-gate-hook.mjs')){
 try{
  if(process.env.UI_REFINER_GATE==='off')process.exit(0);
  let text='';for await(const chunk of process.stdin){text+=chunk;if(text.length>1_000_000)break;}
  const input=text?JSON.parse(text):{},cwd=path.resolve(input.cwd||process.cwd());
  const problems=await refineGateProblems(cwd);
  const stateFile=path.join(cwd,'.ui-refiner-gate.json'),state=(await readJson(stateFile))||{blocks:0};
  if(!problems.length){if(state.blocks)await fs.rm(stateFile,{force:true});process.exit(0);}
  if(state.blocks>=MAX_BLOCKS){
   await fs.rm(stateFile,{force:true});
   process.stdout.write(JSON.stringify({systemMessage:`UI Refiner gate gave up after ${MAX_BLOCKS} attempts. Still open: ${problems.join(' | ')}`})+'\n');
   process.exit(0);
  }
  await fs.writeFile(stateFile,JSON.stringify({blocks:state.blocks+1,at:new Date().toISOString()})+'\n');
  process.stderr.write(`UI Refiner refine is not finished:\n- ${problems.join('\n- ')}\n`);
  process.exit(2);
 }catch(e){process.stderr.write(`UI Refiner gate skipped: ${e.message}\n`);process.exit(0);}
}
