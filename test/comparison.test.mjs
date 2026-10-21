import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {runGate,exitCode,baselineFromReport} from '../src/gate.mjs';
import {spawnBounded} from '../src/execute.mjs';

const debt={engine:'lintapple',rule:'font-family',severity:'error',selector:'#save',location:'#save',identity:{key:'#save',stable:true},viewport:{width:390,height:844},colorScheme:'light',state:'initial',actual:'serif'};
const snapshot={route:'default',viewport:debt.viewport,colorScheme:'light',state:'initial',file:'fixture.aria.yml',sha256:'a'};
async function fixture(fn){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-comparison-'));
 try{
  await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy));
  for(const args of [['init','-q'],['-c','user.name=test','-c','user.email=test@example.invalid','commit','--allow-empty','-qm','initial']]){
   const r=await spawnBounded('git',args,{cwd:root});assert.equal(r.code,0,r.stderr);
  }
  const config=makePreset();
  const options={root,config,staticRunner:async()=>({findings:[]}),browserRunner:async()=>({findings:[debt],ariaSnapshots:[snapshot],capturesIntegrated:true})};
  await fn({root,config,options,reportFile:path.join(root,config.reportDir,'report.json'),fullFile:path.join(root,config.reportDir,'last-full-report.json')});
 }finally{await fs.rm(root,{recursive:true,force:true});}
}

test('ready changes invalidate finding/ARIA comparisons and cannot suppress browser debt in either route mode',async()=>{
 for(const named of [false,true])await fixture(async({config,options})=>{
  if(named)config.browser.routes=[{name:'home',url:'/'}];
  await runGate(options);
  const repeated=await runGate(options);assert.equal(repeated.diff.status,'compared');assert.equal(repeated.ariaDiff.status,'compared');
  const scoped=await runGate({...options,changedOnly:true});assert.equal(scoped.summary.existingBrowserDebt,1);assert.equal(exitCode(scoped),3);
  config.browser.ready='[data-ready]';
  const changed=await runGate({...options,changedOnly:true});assert.equal(changed.summary.existingBrowserDebt,0);assert.equal(exitCode(changed),1);assert.equal(changed.diff.status,'unavailable');assert.equal(changed.ariaDiff.status,'unavailable');
  assert.match(changed.browserReference.reason,/context/i);
  const full=await runGate(options);assert.equal(full.diff.status,'unavailable');
 });
});

test('effective route overrides ignore unused global ready/plan settings, but not an override change',()=>fixture(async({config,options})=>{
 config.browser.routes=[{name:'home',url:'/',ready:null,interactionsPath:null}];
 const before=await runGate(options);config.browser.ready='#unused';config.browser.interactionsPath='unused.json';
 const after=await runGate(options);assert.equal(after.comparisonContext,before.comparisonContext);assert.equal(after.diff.status,'compared');
 config.browser.routes[0].ready='#route-ready';
 const changed=await runGate(options);assert.equal(changed.diff.status,'unavailable');assert.equal(changed.ariaDiff.status,'unavailable');
}));

test('ARIA masks and capture switches do not erase browser debt; masks only reset ARIA comparisons',()=>fixture(async({config,options})=>{
 config.browser.captureAriaSnapshots=true;await runGate(options);
 config.browser.ariaSnapshotMasks=[{pattern:'clock [0-9]+',flags:'g'}];
 const masked=await runGate(options);assert.equal(masked.diff.status,'compared');assert.equal(masked.ariaDiff.status,'unavailable');assert.match(masked.ariaDiff.reason,/context/i);
 config.browser.ariaSnapshotMasks=[{pattern:'another clock [0-9]+',flags:'g'}];
 const changed=await runGate({...options,changedOnly:true});assert.equal(changed.summary.existingBrowserDebt,1);
 const full=await runGate(options);assert.equal(full.diff.status,'unavailable','previous report was scoped');
 config.browser.captureScreenshots=true;
 const images=await runGate(options);assert.equal(images.diff.status,'compared');assert.equal(images.ariaDiff.status,'compared');
 config.browser.captureAriaSnapshots=false;
 const disabled=await runGate(options);assert.equal(disabled.diff.status,'compared');assert.equal(disabled.ariaDiff.status,'unavailable');
}));

test('policy, locale and plan contents invalidate references while timeout/report settings do not',async()=>{
 for(const mutate of [
  async({config})=>{config.locale='ja-JP';},
  async({root})=>{await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify({...lintapplePolicy,minControlSize:44}));},
  async({root})=>{await fs.writeFile(path.join(root,'plan.json'),JSON.stringify({states:[{name:'open',action:'click',selector:'#open'}]}));}
 ])await fixture(async context=>{
  const {root,config,options}=context;config.browser.interactionsPath='plan.json';await fs.writeFile(path.join(root,'plan.json'),'{}');
  await runGate(options);await mutate(context);
  const changed=await runGate({...options,changedOnly:true});assert.equal(changed.summary.existingBrowserDebt,0);assert.equal(exitCode(changed),1);
 });
 await fixture(async({config,options})=>{
  await runGate(options);config.browser.timeoutMs=10000;config.browser.sessionTimeoutMs=60000;config.gate.manualVisualReview=false;
  const same=await runGate(options);assert.equal(same.diff.status,'compared');assert.equal(same.ariaDiff.status,'compared');
 });
});

test('rendered observation changes reset findings but leave ARIA and enforced browser debt comparable',()=>fixture(async({config,options})=>{
 await runGate(options);config.browser.renderedMetrics=true;
 const full=await runGate(options);assert.equal(full.diff.status,'unavailable');assert.equal(full.ariaDiff.status,'compared');
 config.browser.renderedMetrics=false;
 const scoped=await runGate({...options,changedOnly:true});assert.equal(scoped.summary.existingBrowserDebt,1);
}));

test('legacy reports, changed engine contracts and incomplete full reports cannot act as debt references',async()=>{
 for(const mutate of [r=>{delete r.comparisonContexts;},r=>{r.comparisonContexts.schemaVersion=999;},r=>{r.comparisonContexts.browserDebt='other-engine';},r=>{r.automatedStatus='ERROR';},r=>{r.scope.mode='changed-only';}])await fixture(async({options,fullFile})=>{
  const previous=await runGate(options);mutate(previous);await fs.writeFile(fullFile,JSON.stringify(previous));
  const scoped=await runGate({...options,changedOnly:true});assert.equal(scoped.summary.existingBrowserDebt,0);assert.equal(exitCode(scoped),1);assert.ok(scoped.browserReference.reason);
 });
});

test('legacy report context is rejected explicitly while existing baseline v2 identities still work',()=>fixture(async({root,config,options,reportFile})=>{
 const previous=await runGate(options);await baselineFromReport(reportFile,path.join(root,'baseline.json'));
 delete previous.comparisonContexts;await fs.writeFile(reportFile,JSON.stringify(previous));
 config.gate.baselinePath='baseline.json';const current=await runGate(options);
 assert.equal(current.summary.baselined,1);assert.equal(current.findings[0].id,previous.findings[0].id);assert.equal(current.diff.status,'unavailable');assert.match(current.diff.reason,/metadata/i);
}));
