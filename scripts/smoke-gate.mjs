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
  config.browser.ready='[data-app-ready]';
  config.browser.captureScreenshots=false;
  await writeFile(path.join(root,'ui-refiner.config.json'),JSON.stringify(config,null,2)+'\n');
  await writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy,null,2)+'\n');

  const clean=await runCli();
  const cleanReport=JSON.parse(await readFile(path.join(root,'artifacts/ui-refiner/report.json'),'utf8'));
  if(clean.code!==0)console.error(JSON.stringify({clean,stages:cleanReport.stages,findings:cleanReport.findings.slice(0,5)},null,2));
  assert.equal(clean.code,0,'bundled suta and lintapple must both execute without blockers');
  assert.equal(cleanReport.version,'0.3.0');
  assert.equal(cleanReport.automatedStatus,'PASS');
  assert.equal(cleanReport.status,'REVIEW_REQUIRED');
  assert.equal(cleanReport.stages.length,2);
  assert.ok(cleanReport.stages.every(s=>s.status==='complete'));
  const raw=JSON.parse(await readFile(path.join(root,'artifacts/ui-refiner/lintapple.raw.json'),'utf8'));
  assert.equal(raw.runs.length,lintapplePolicy.viewports.length*lintapplePolicy.colorSchemes.length);
  console.log('PASS: integrated clean CLI audit, full static and browser coverage');

  await writeFile(cssPath,':root { color: #222; background: #fff; }\nbutton { transition: all 300ms ease; }\n');
  const bad=await runCli();
  const badReport=JSON.parse(await readFile(path.join(root,'artifacts/ui-refiner/report.json'),'utf8'));
  if(bad.code!==1)console.error(JSON.stringify({bad,stages:badReport.stages,findings:badReport.findings.slice(0,5)},null,2));
  assert.equal(bad.code,1,'violating CSS must fail the actual CLI');
  assert.equal(badReport.automatedStatus,'FAIL');
  assert.ok(badReport.findings.some(f=>f.engine==='suta'&&f.rule==='transition-all'&&!f.baselined));
  assert.ok(badReport.summary.blockers>0);
  console.log('PASS: integrated negative control rejected by suta, browser remained checked');
}finally{
 await Promise.allSettled([new Promise(resolve=>server.close(()=>resolve())),rm(root,{force:true,recursive:true})]);
}
