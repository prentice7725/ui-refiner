import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {makePreset} from '../src/presets.mjs';
import {runGate,exitCode,baselineFromReport} from '../src/gate.mjs';
import {checkUrl,initProject,loadConfig,validateConfig} from '../src/config.mjs';
import {identify,normalizeStatic,normalizeBrowser} from '../src/normalize.mjs';

const staticFail={engine:'suta',rule:'transition-all',severity:'error',location:'src/app.css:7',message:'transition:all',fix:'Specify properties'};
const browserFail={engine:'lintapple',rule:'text-contrast',severity:'error',location:'button @ 390px light initial',message:'Low contrast',fix:'Improve text contrast'};
async function temp(fn){const root=await mkdtemp(path.join(os.tmpdir(),'ui-refiner-'));try{return await fn(root)}finally{await rm(root,{recursive:true,force:true})}}
const runners={staticRunner:async()=>({findings:[staticFail]}),browserRunner:async()=>({findings:[browserFail]})};

test('web: static+rendered violations fail',async()=>temp(async root=>{
  const r=await runGate({root,config:makePreset('web'),...runners});
  assert.equal(r.automatedStatus,'FAIL');assert.equal(r.summary.blockers,2);assert.equal(exitCode(r),1);
  const md=await readFile(path.join(root,'artifacts/ui-refiner/report.md'),'utf8');assert.match(md,/transition-all/);
  assert.match(await readFile(path.join(root,'artifacts/ui-refiner/AGENT_HANDOFF.md'),'utf8'),/Improve text contrast/);
}));

test('web passing automated results still require visual review',async()=>temp(async root=>{
  const r=await runGate({root,config:makePreset('web'),staticRunner:async()=>({findings:[]}),browserRunner:async()=>({findings:[]}),writeReports:false});
  assert.equal(r.automatedStatus,'PASS');assert.equal(r.status,'REVIEW_REQUIRED');assert.equal(exitCode(r),0);
}));

test('runner exception is infrastructure error, never false PASS',async()=>temp(async root=>{
  const r=await runGate({root,config:makePreset('web'),staticRunner:async()=>{throw Error('No Node 22.18')},browserRunner:async()=>({findings:[]}),writeReports:false});
  assert.equal(r.automatedStatus,'ERROR');assert.equal(exitCode(r),2);
}));

test('init does not overwrite user-written files',async()=>temp(async root=>{
  await initProject(root,'web');await writeFile(path.join(root,'ui-policy.json'),'CUSTOM');
  const status=await initProject(root,'web');
  assert.deepEqual(status,['Kept ui-refiner.config.json','Kept ui-policy.json']);
  assert.equal(await readFile(path.join(root,'ui-policy.json'),'utf8'),'CUSTOM');
  const loaded=await loadConfig(path.join(root,'ui-refiner.config.json'));
  assert.equal(loaded.config.preset,'web');
}));

test('reject unknown policy fields and path traversal',async()=>temp(async root=>{
  const c=makePreset('web');c.gate.admin=true;assert.throws(()=>validateConfig(c),/Unknown/);
  await initProject(root,'web');const f=path.join(root,'ui-refiner.config.json');
  const raw=JSON.parse(await readFile(f,'utf8'));raw.static.auditPath='../outside.js';
  await writeFile(f,JSON.stringify(raw));await assert.rejects(()=>loadConfig(f),/within project root/);
}));

test('normalizers require structured output',()=>{
  assert.throws(()=>normalizeStatic({}),/Invalid suta/);
  assert.throws(()=>normalizeBrowser({findings:[]}),/Invalid lintapple/);
  assert.equal(normalizeStatic({findings:[{rule:'x',severity:'warn',file:'x.css',line:2} ]})[0].severity,'warning');
});

test('screenshot failures are infra errors',async()=>temp(async root=>{
  const c=makePreset('web');c.browser.captureScreenshots=true;
  const r=await runGate({root,config:c,staticRunner:async()=>({findings:[]}),browserRunner:async()=>({findings:[]}),captureRunner:async()=>{throw new Error('chromium missing')}});
  assert.equal(r.automatedStatus,'ERROR');assert.equal(exitCode(r),2);
}));

test('only web profile exists; legacy game profiles explicitly rejected',()=>{
  for(const profile of ['retro-web','phaser-dom','canvas','godot']){
    assert.throws(()=>makePreset(profile),/Game UI is a separate research project/);
  }
});

test('disabling either required web checker is INCOMPLETE, not PASS',async()=>temp(async root=>{
  for(const stage of ['static','browser']){
    const config=makePreset('web');config[stage].enabled=false;
    const result=await runGate({root,config,staticRunner:async()=>({findings:[]}),browserRunner:async()=>({findings:[]}),writeReports:false});
    assert.equal(result.automatedStatus,'INCOMPLETE');assert.equal(exitCode(result),2);
  }
}));

test('web output directory is isolated from legacy mixed project',async()=>temp(async root=>{
  const c=makePreset('web');
  const r=await runGate({root,config:c,staticRunner:async()=>({findings:[]}),browserRunner:async()=>({findings:[]})});
  assert.equal(r.status,'REVIEW_REQUIRED');
  assert.match(await readFile(path.join(root,'artifacts/ui-refiner/report.md'),'utf8'),/UI Refiner/);
}));

test('reject empty rendered coverage and malformed upstream severities',()=>{
  assert.throws(()=>normalizeBrowser({findings:[],runs:[]}),/no completed browser runs/);
  assert.throws(()=>normalizeStatic({findings:[{file:'x.css',line:2,rule:'fake',severity:'fatal'}]}),/Invalid suta finding/);
});
