#!/usr/bin/env node
// Real end-to-end CLI smoke for both vendored engines. No mocks, no baseline suppressions.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {cp,mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createDemoServer} from '../examples/demo-server.mjs';
import {verifyRecordedContract} from '../src/contracts.mjs';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=await mkdtemp(path.join(os.tmpdir(),'ui-refiner-e2e-'));
const server=createDemoServer();
server.listen(0,'127.0.0.1');
await once(server,'listening');
const url=`http://127.0.0.1:${server.address().port}`;
const runCli=()=>new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[path.join(repo,'bin/ui-refiner.mjs'),'check','--config',path.join(root,'ui-refiner.config.json')],{cwd:root,stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';
  child.stdout.on('data',x=>stdout+=x.toString());
  child.stderr.on('data',x=>stderr+=x.toString());
  child.on('error',reject);
  child.on('close',(code,signal)=>resolve({code,signal,stdout,stderr}));
});
try{
  await mkdir(path.join(root,'src'),{recursive:true});
  await mkdir(path.join(root,'.agents/skills'),{recursive:true});
  await cp(path.join(repo,'vendor/suta/skills/suta'),path.join(root,'.agents/skills/suta'),{recursive:true});
  const cssPath=path.join(root,'src/demo.css');
  await writeFile(cssPath,':root { color: #222; background: #fff; }\nbutton { font-size: 16px; }\n');
  const config=makePreset('web');
  config.browser.url=url;
  assert.equal(config.static.auditPath,'bundled');
  config.browser.ready='[data-app-ready]';
  config.browser.captureScreenshots=true;
  const interactionPlan={states:[{name:'saved',action:'click',selector:'[data-qa=primary-action]',ready:{selector:'[data-qa=result]',expectedText:'Saved'}}]};
  config.browser.interactionsPath='interactions.json';
  await writeFile(path.join(root,'interactions.json'),JSON.stringify(interactionPlan));
  await writeFile(path.join(root,'ui-refiner.config.json'),JSON.stringify(config,null,2)+'\n');
  await writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy,null,2)+'\n');

  const clean=await runCli();
  const cleanReport=JSON.parse(await readFile(path.join(root,'artifacts/ui-refiner/report.json'),'utf8'));
  if(clean.code!==0)console.error(JSON.stringify({clean,stages:cleanReport.stages,findings:cleanReport.findings.slice(0,5)},null,2));
  assert.equal(clean.code,0,'bundled suta and lintapple must both execute without blockers');
  assert.equal(cleanReport.version,'0.4.0');
  assert.equal(cleanReport.automatedStatus,'PASS');
  assert.equal(cleanReport.status,'REVIEW_REQUIRED');
  assert.equal(cleanReport.stages.length,2);
  assert.ok(cleanReport.stages.every(s=>s.status==='complete'));
  const raw=JSON.parse(await readFile(path.join(root,'artifacts/ui-refiner/lintapple.raw.json'),'utf8'));
  assert.equal(raw.runs.length,lintapplePolicy.viewports.length*lintapplePolicy.colorSchemes.length);
  assert.ok(cleanReport.captures.some(c=>c.state==='saved'));
  assert.ok(cleanReport.captures.every(c=>c.reducedMotion==='reduce'&&c.locale==='en-US'));
  assert.ok(cleanReport.artifacts.length>=4);
  await mkdir(path.join(repo,'artifacts/upstream-contracts'),{recursive:true});
  // doctor must launch the actual installed browser rather than checking imports alone.
  const {doctor}=await import('../src/doctor.mjs');const environment=await doctor({root,config});assert.equal(environment.errors,0,environment.lines.join('\n'));assert.ok(environment.lines.includes('Chromium: launch OK'));
  console.log('PASS: integrated clean CLI audit, state-matched screenshots and actual Chromium doctor');

  await writeFile(cssPath,':root { color: #222; background: #fff; }\nbutton { transition: all 300ms ease; }\n');
  const bad=await runCli();
  const badReport=JSON.parse(await readFile(path.join(root,'artifacts/ui-refiner/report.json'),'utf8'));
  if(bad.code!==1)console.error(JSON.stringify({bad,stages:badReport.stages,findings:badReport.findings.slice(0,5)},null,2));
  assert.equal(bad.code,1,'violating CSS must fail the actual CLI');
  assert.equal(badReport.automatedStatus,'FAIL');
  assert.ok(badReport.findings.some(f=>f.engine==='suta'&&f.rule==='transition-all'&&!f.baselined));
  assert.ok(badReport.summary.blockers>0);
  const {spawnBounded}=await import('../src/execute.mjs');
  const recorded=await spawnBounded(process.execPath,[path.join(repo,'vendor/suta/skills/suta/scripts/audit.mjs'),cssPath,'--json'],{cwd:root});
  assert.equal(recorded.code,1);
  const original=JSON.parse(recorded.stdout);for(const finding of original.findings)finding.file=path.relative(root,finding.file).replaceAll(path.sep,'/');
  await writeFile(path.join(repo,'artifacts/upstream-contracts/suta.recorded.json'),JSON.stringify(original,null,2)+'\n');
  await verifyRecordedContract('suta',original);
  console.log('PASS: integrated negative control rejected by suta, browser remained checked');
  config.browser.url=url+'/negative-control';
  await writeFile(path.join(root,'ui-refiner.config.json'),JSON.stringify(config));
  const typography=await runCli();assert.equal(typography.code,1);
  const typedReport=JSON.parse(await readFile(path.join(root,'artifacts/ui-refiner/report.json'),'utf8'));
  assert.ok(typedReport.captures.some(c=>c.crops.some(crop=>crop.image)),'violating element crops must be captured in the same checked session');
  assert.ok(typedReport.groups.some(g=>g.rule==='font-family'&&g.actual==='serif'));
  const handoff=await readFile(path.join(root,'artifacts/ui-refiner/AGENT_HANDOFF.md'),'utf8');assert.match(handoff,/serif/);
  console.log('PASS: browser evidence preserves measured font and crops actual violating targets');
}finally{
 await Promise.allSettled([new Promise(resolve=>server.close(()=>resolve())),rm(root,{force:true,recursive:true})]);
}
