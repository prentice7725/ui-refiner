import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {browserRoutes,validateConfig} from '../src/config.mjs';
import {identify,normalizeBrowser} from '../src/normalize.mjs';
import {realBrowser} from '../src/execute.mjs';
import {runGate,baselineFromReport} from '../src/gate.mjs';
import {checkRoutes} from '../src/browser-session.mjs';
import {maskAriaSnapshot,pruneAriaSnapshots} from '../src/aria-evidence.mjs';
async function temp(fn){const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-review4-'));try{await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy));await fn(root);}finally{await fs.rm(root,{recursive:true,force:true});}}
const f={rule:'font-family',selector:'#save',identity:{key:'#save',stable:true},viewport:{width:390,height:844},colorScheme:'light',state:'initial',actual:'serif',fix:'Fix font'};
test('named route IDs survive localhost/loopback and port changes, but distinguish names, paths and query values',()=>{
 const ids=(base,route)=>{const c=makePreset();c.browser.url=base;c.browser.routes=[route];const r=browserRoutes(c)[0];return identify(normalizeBrowser({runs:[{}],findings:[{...f,route:r.name,routeKey:r.routeKey}]}))[0].id;};
 const route={name:'home',url:'/app?mode=preview'};
 const original=ids('http://localhost:1234',route);assert.equal(original,ids('http://127.0.0.1:5678',route));assert.equal(original,ids('http://127.0.0.1:7890',{...route,url:'http://localhost:9999/app?mode=preview'}));
 for(const changed of [{...route,name:'other'},{...route,url:'/other?mode=preview'},{...route,url:'/app?mode=other'}])assert.notEqual(original,ids('http://localhost:1234',changed));
});
test('worker timeout reserves time for other routes and gate retains findings while ERROR forbids baseline and fake resolution',()=>temp(async root=>{
 const c=makePreset();c.browser.routes=[{name:'slow',url:'/slow'},{name:'good',url:'/good'},{name:'bad',url:'/missing'}];c.browser.sessionTimeoutMs=9000;
 const calls=[];
 const browserRunner=async config=>realBrowser(config,root,{runner:async(bin,args,options)=>{
  const cfg=JSON.parse(args[1]).config,route=browserRoutes(cfg)[0];calls.push({route:route.name,allocated:options.timeoutMs});
  if(route.name==='slow')return {code:null,error:'timeout',stderr:''};
  if(route.name==='bad')return {code:2,stderr:'HTTP 404'};
  return {code:0,stderr:'',stdout:JSON.stringify({rawReport:{runs:[{route:route.name,status:'complete'}],findings:[{...f,route:route.name,routeKey:route.routeKey}]}})};
 }});
 const report=await runGate({root,config:c,browserRunner,staticRunner:async()=>({findings:[]})});
 assert.equal(report.automatedStatus,'ERROR');assert.equal(report.findings.length,1);assert.equal(report.findings[0].route,'good');assert.equal(calls.length,3);assert.ok(calls[0].allocated<=3000);assert.ok(calls[1].allocated>0);
 const stage=report.stages.find(s=>s.engine==='lintapple');assert.deepEqual(stage.routeResults.map(r=>r.status),['error','complete','error']);assert.match(await fs.readFile(path.join(root,c.reportDir,'AGENT_HANDOFF.md'),'utf8'),/Route good: complete/);
 assert.equal(report.diff.status,'unavailable');await assert.rejects(()=>baselineFromReport(path.join(root,c.reportDir,'report.json'),path.join(root,'baseline.json')),/must complete/);
 const rerun=await runGate({root,config:c,browserRunner,staticRunner:async()=>({findings:[]})});assert.equal(rerun.diff.status,'unavailable');
}));
test('failed navigation or interaction preserves completed run/state findings and proceeds to remaining runs',async()=>{
 const c=makePreset(),routes=[{name:'good',url:'http://localhost/good'},{name:'bad',url:'http://localhost/missing'}];
 const launch=async()=>({close:async()=>{},newContext:async()=>{
  let url;return {route:async()=>{},close:async()=>{},newPage:async()=>({setDefaultTimeout(){},goto:async input=>{url=input;return {ok:()=>!url.includes('missing'),status:()=>404,url:()=>url};},url:()=>url})};
 }});
 const raw=await checkRoutes(routes,lintapplePolicy,{launch,audit:async()=>({findings:[f],suppressed:[],accessibilityCoverage:{}}),allowedHosts:c.gate.allowedHosts,timeout:1000});
 assert.equal(raw.findings.length,2);assert.equal(raw.errors.length,2);assert.equal(raw.runs.filter(r=>r.status==='complete').length,2);
 const partial=await checkRoutes([{...routes[0],interactions:{}}],lintapplePolicy,{launch,audit:async()=>({findings:[f],suppressed:[],accessibilityCoverage:{}}),interact:async()=>{throw Error('interaction failed');},allowedHosts:c.gate.allowedHosts,timeout:1000});assert.equal(partial.findings.length,2);assert.equal(partial.errors.length,2);assert.ok(partial.runs.every(r=>r.states.length===1));assert.ok(partial.runs.every(r=>r.plannedStates[0].status==='completed'));
 const named=await checkRoutes([{...routes[0],interactions:{states:[{name:'saved',action:'click',selector:'#save',ready:{selector:'#ready'}},{name:'later',action:'click',selector:'#next',ready:{selector:'#ready'}}]}}],lintapplePolicy,{launch,audit:async()=>({findings:[],suppressed:[],accessibilityCoverage:{}}),interact:async()=>{throw Error('State "saved" could not be checked: Ready text did not match.');},allowedHosts:c.gate.allowedHosts,timeout:1000});assert.ok(named.runs.every(r=>r.plannedStates[1].status==='failed'&&r.plannedStates[1].started&&r.plannedStates[2].status==='not-run'));
});
test('ARIA masks stabilize configured dynamic text without hiding meaningful unconfigured label changes',()=>{
 const masks=[{pattern:'\\d{2}:\\d{2}:\\d{2}',flags:'g'}];
 const before='- heading "Clock 12:30:00" [level=1]\n- button "Save 2 items"';
 const after='- heading "Clock 12:30:01" [level=1]\n- button "Save 2 items"';
 assert.equal(maskAriaSnapshot(before,masks),maskAriaSnapshot(after,masks));assert.notEqual(maskAriaSnapshot(before),maskAriaSnapshot(after));assert.notEqual(maskAriaSnapshot(before,masks),maskAriaSnapshot(after.replace('Save 2','Save 3'),masks));
 const c=makePreset();c.browser.ariaSnapshotMasks=masks;validateConfig(c);c.browser.ariaSnapshotMasks=[{pattern:'['}];assert.throws(()=>validateConfig(c));c.browser.ariaSnapshotMasks=[{pattern:'x',flags:'s'}];assert.throws(()=>validateConfig(c));
});
test('snapshot GC retains referenced comparisons/full evidence and only deletes owned unreferenced regular files',()=>temp(async root=>{
 const file=n=>`render-home-390x844-light-initial-deadbeef-${String(n).padStart(16,'0')}.aria.yml`;
 for(let n=1;n<=5;n++)await fs.writeFile(path.join(root,file(n)),'snapshot');await fs.writeFile(path.join(root,'user.aria.yml'),'manual');
 const reports=[{ariaSnapshots:[{file:file(1)}],ariaDiff:{changed:[{file:file(1),previousFile:file(2)}]}},{ariaSnapshots:[{file:file(3)}]},{ariaSnapshots:[{file:file(4)}]}];
 const result=await pruneAriaSnapshots(root,reports);assert.equal(result.removed,1);for(let n=1;n<=4;n++)await fs.access(path.join(root,file(n)));await fs.access(path.join(root,'user.aria.yml'));await assert.rejects(()=>fs.access(path.join(root,file(5))));
}));
