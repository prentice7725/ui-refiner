import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';import os from 'node:os';
import {realStatic,spawnBounded} from '../src/execute.mjs';
import {makePreset} from '../src/presets.mjs';
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
