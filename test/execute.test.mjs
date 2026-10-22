import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';import os from 'node:os';
import {realStatic,realBrowser,spawnBounded} from '../src/execute.mjs';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
async function temp(fn){const root=await mkdtemp(path.join(os.tmpdir(),'ui-refiner-exec-'));try{return await fn(root)}finally{await rm(root,{recursive:true,force:true})}}
test('invoke suta contract and map findings back to project relative paths',async()=>temp(async root=>{
  await mkdir(path.join(root,'src'));
  const f=path.join(root,'fake-audit.mjs');
  await writeFile(f,`console.log(JSON.stringify({files:1,errors:1,warnings:0,findings:[{file:process.argv[2]+'/app.css',line:3,rule:'bad',severity:'error',message:'bad color',fix:'use tokens'}]}));process.exit(1)`);
  const c=makePreset('web');c.static.auditPath='fake-audit.mjs';
  const r=await realStatic(c,root);
  assert.equal(r.findings[0].location,'src/app.css:3');
}));
test('subprocess output and exit code captured',async()=>{
  const r=await spawnBounded(process.execPath,['-e','console.log("ok")'],{timeoutMs:1000});
  assert.equal(r.code,0);assert.equal(r.stdout.trim(),'ok');
});

test('invalid interaction plans retain other route results and report an unknown plan denominator',async()=>temp(async root=>{
 const c=makePreset();c.browser.routes=[{name:'invalid',url:'/invalid',interactionsPath:'bad.json'},{name:'good',url:'/good',interactionsPath:null}];
 await writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy));await writeFile(path.join(root,'bad.json'),JSON.stringify({states:{invalid:true}}));
 let calls=0;const result=await realBrowser(c,root,{runner:async()=>{calls++;return {code:0,stderr:'',stdout:JSON.stringify({rawReport:{findings:[],runs:[{route:'good',viewport:lintapplePolicy.viewports[0],colorScheme:'light',status:'complete',states:[{name:'initial'}]}]}})};}});
 assert.equal(calls,1);assert.equal(result.errors.length,1);assert.equal(result.inspectionScope.planComplete,false);assert.equal(result.inspectionScope.completionRate,null);assert.equal(result.inspectionScope.counts.completed,1);assert.equal(result.routeResults[0].started,undefined);
}));
