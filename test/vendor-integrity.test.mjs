import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {inventory,verifyVendor,repoRoot} from '../src/vendor.mjs';
test('vendored files and reviewed local patches match every SHA-256 manifest entry',async()=>{
 assert.deepEqual(await verifyVendor(),[]);
 const pinned=JSON.parse(await fs.readFile(path.join(repoRoot,'vendor/UPSTREAM.json'),'utf8'));
 for(const name of ['suta','lintapple']){
  assert.match(pinned[name].sha,/^[a-f0-9]{40}$/);
  assert.match(await fs.readFile(path.join(repoRoot,'vendor',name,'LICENSE'),'utf8'),/MIT License/);
  assert.ok(Object.keys(pinned[name].upstreamSha256).length>0);
 }
 const actual=await inventory(path.join(repoRoot,'vendor/suta'));
 const patterns=Object.keys(actual).filter(p=>p.endsWith('/PATTERN.md'));
 assert.equal(patterns.length,Object.keys(pinned.suta.sha256).filter(p=>p.endsWith('/PATTERN.md')).length);
});
test('a one-line vendor edit is detected despite unchanged file count',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ui-vendor-integrity-'));
 try{
  await fs.mkdir(path.join(tmp,'vendor'));await fs.cp(path.join(repoRoot,'vendor/UPSTREAM.json'),path.join(tmp,'vendor/UPSTREAM.json'));
  for(const name of ['suta','lintapple','patches'])await fs.cp(path.join(repoRoot,'vendor',name),path.join(tmp,'vendor',name),{recursive:true});
  await fs.appendFile(path.join(tmp,'vendor/suta/skills/suta/scripts/audit.mjs'),'\n// accidental change\n');
  const drift=await verifyVendor(tmp);assert.ok(drift.includes('suta/skills/suta/scripts/audit.mjs: modified'));assert.equal(drift.length,1);
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
});
