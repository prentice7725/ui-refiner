#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {once} from 'node:events';
import {createScenarioServer,scenarioCopy} from '../examples/state-scenarios.mjs';
import {makePreset,makePolicy} from '../src/presets.mjs';
import {realBrowser} from '../src/execute.mjs';
import {runGate,baselineFromReport,exitCode} from '../src/gate.mjs';

const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-state-scenarios-'));
const server=createScenarioServer(),reports=[];
const evidenceDir='artifacts/upstream-contracts/state-scenarios-evidence';
const readPlan=async locale=>JSON.parse(await fs.readFile(new URL(`../examples/state-scenarios/${locale}.interactions.json`,import.meta.url),'utf8'));
server.listen(0,'127.0.0.1');await once(server,'listening');
let result={status:'ERROR'};
try{
 await fs.mkdir(path.join(root,'src'));
 await fs.writeFile(path.join(root,'src/app.css'),':root { color: #222; background: #fff; }\n');
 const config=makePreset();config.browser.url=`http://127.0.0.1:${server.address().port}`;
 config.browser.timeoutMs=5000;config.browser.sessionTimeoutMs=180000;
 config.browser.captureAriaSnapshots=true;
 const execute=async()=>{
  let browser;
  const report=await runGate({root,config,browserRunner:async(...args)=>{browser=await realBrowser(...args);return browser;}});
  reports.push(report);
  // Keep every referenced YAML before subsequent runs apply normal report retention.
  await fs.mkdir(evidenceDir,{recursive:true});
  for(const artifact of report.artifacts.filter(a=>a.endsWith('.aria.yml'))){
   await fs.copyFile(path.join(root,config.reportDir,artifact),path.join(evidenceDir,artifact));
  }
  return {report,browser,scope:report.stages.find(s=>s.engine==='lintapple').inspectionScope};
 };
 for(const locale of ['ko-KR','ja-JP']){
  config.locale=locale;const plan=await readPlan(locale),policy=makePolicy(locale);
  policy.colorSchemes=['light','dark'];
  await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(policy));
  await fs.writeFile(path.join(root,'states.json'),JSON.stringify(plan));
  config.browser.routes=[{name:locale.slice(0,2),url:'/'+locale.slice(0,2),ready:'[data-app-ready]',interactionsPath:'states.json'}];
  const {report,browser,scope}=await execute();
  assert.equal(report.automatedStatus,'PASS',JSON.stringify({stages:report.stages,findings:report.findings}));
  assert.equal(scope.counts.requested,4*(1+plan.states.length));assert.equal(scope.counts.completed,scope.counts.requested);
  assert.equal(scope.completionRate,1);assert.ok(scope.intermediateStates.length>0);
  for(const run of browser.rawReport.runs){
   const checks=run.accessibilityCoverage.interactions;
   assert.ok(checks.some(c=>c.rule==='keyboard-operation'&&c.phase==='Enter'&&c.status==='passed'));
   assert.ok(checks.some(c=>c.rule==='keyboard-operation'&&c.phase==='Space'&&c.status==='passed'));
   assert.ok(checks.some(c=>c.rule==='dialog-focus'&&c.phase==='return-Escape'&&c.status==='passed'));
   assert.ok(checks.every(c=>c.status==='passed'),JSON.stringify(checks));
  }
  for(const [state,text] of [['form-error',scenarioCopy[locale].error],['empty-list',scenarioCopy[locale].empty],['loading',scenarioCopy[locale].loading],['ready',scenarioCopy[locale].ready],['long-copy',scenarioCopy[locale].long]]){
   const snapshots=report.ariaSnapshots.filter(s=>s.state===state);assert.equal(snapshots.length,4);
   for(const snapshot of snapshots)assert.ok((await fs.readFile(path.join(root,config.reportDir,snapshot.file),'utf8')).includes(text),`${locale}/${state}: actual translated data must be present`);
  }
  console.log(`PASS: ${locale} translated states, 2 viewports × light/dark, Enter/Space and modal focus return`);
 }

 // Positive defect controls use the same translated page, plan and audit engine.
 config.locale='ko-KR';const plan=await readPlan('ko-KR'),policy=makePolicy('ko-KR');
 policy.viewports=[policy.viewports[0]];policy.colorSchemes=['light'];
 await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(policy));
 config.browser.captureAriaSnapshots=false;
 await fs.writeFile(path.join(root,'states.json'),JSON.stringify(plan));
 for(const [defect,rule] of [['keyboard','keyboard-operation'],['clipping','content-clipping']]){
  config.browser.routes=[{name:'defect',url:'/ko?defect='+defect,interactionsPath:'states.json'}];
  const {report}=await execute();assert.equal(report.automatedStatus,'FAIL',JSON.stringify(report.stages));
  assert.equal(exitCode(report),1);
  assert.ok(report.findings.some(f=>f.rule===rule&&f.blocking),`Expected ${rule} in ${defect} control`);
 }

 // Every named state has its own reachability failure control. Earlier states survive;
 // subsequent states are unexecuted. No delay-based readiness or skipped checks.
 await fs.writeFile(path.join(root,'states.json'),JSON.stringify({timeout:300,states:plan.states}));
 for(const [index,state] of plan.states.entries()){
  config.browser.routes=[{name:'unreachable',url:'/ko?fail='+state.name,interactionsPath:'states.json'}];
  const {report,scope}=await execute();assert.equal(report.automatedStatus,'ERROR',JSON.stringify(report.stages));
  assert.equal(exitCode(report),2);
  assert.equal(scope.counts.completed,1+index);assert.equal(scope.counts.failed,1);assert.equal(scope.counts['not-run'],plan.states.length-index-1);
  assert.equal(scope.states.find(s=>s.state===state.name).status,'failed');
  await assert.rejects(()=>baselineFromReport(path.join(root,config.reportDir,'report.json'),path.join(root,'invalid-baseline.json')),/must complete/);
  console.log(`PASS: ${state.name} unreachable → ERROR/2; earlier audits retained`);
 }
 console.log('PASS: keyboard/clipping defects block; all 7 named-state reach failures preserve earlier audits and forbid baselines');

 // A known Storybook document URL is already a route: no discovery adapter/runtime.
 config.browser.routes=[{name:'story',url:'/iframe.html?id=states--ko&viewMode=story',ready:'[data-app-ready]',interactionsPath:'states.json'}];
 const story=await execute();assert.equal(story.report.automatedStatus,'PASS');assert.equal(story.scope.counts.completed,8);
 result={status:'PASS',evidenceDirectory:'state-scenarios-evidence',locales:['ko-KR','ja-JP'],normalDimensionsPerLocale:4,namedStates:7,defectControls:2,reachFailureControls:7,storybook:'explicit iframe document URL; local protocol fixture, not a Storybook runtime',reports};
}catch(e){result={status:'ERROR',error:e.stack,reports};process.exitCode=2;}
finally{
 await new Promise(resolve=>server.close(resolve));
 await fs.rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:250});
}
await fs.mkdir('artifacts/upstream-contracts',{recursive:true});
await fs.writeFile('artifacts/upstream-contracts/state-scenarios.json',JSON.stringify(result,null,2)+'\n');
console.log(`${result.status}: state scenarios; artifacts/upstream-contracts/state-scenarios.json`);
