import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {compareInventories,recordPreservation} from '../src/preservation.mjs';
import {runGate} from '../src/gate.mjs';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
const entry=(records=[],tokens={})=>({route:'default',state:'initial',viewport:{width:390,height:844},colorScheme:'light',inventory:{status:'complete',records,tokens,issues:[]}});
const link={key:'link:Pay',tag:'a',attributes:{href:'/pay'},accessibleName:'Pay'};
async function temp(fn){const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-preserve-'));try{await fn(root);}finally{await fs.rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:250});}}
test('preservation is a multiset, ignores order and exposes token/link losses and missing dimensions',()=>{
 const a=entry([link,{key:'field',attributes:{name:'email'}}],{'--brand':'red'});const b=entry([...a.inventory.records].reverse(),{'--brand':'red'});assert.equal(compareInventories([a],[b]).status,'matched');b.inventory.records[1]={...link,attributes:{href:'/wrong'}};b.inventory.tokens['--brand']='blue';const diff=compareInventories([a],[b]);assert.equal(diff.status,'different');assert.equal(diff.changes.length,2);assert.equal(compareInventories([a],[]).status,'not-comparable');const incomplete=structuredClone(a);incomplete.inventory.status='incomplete';assert.equal(compareInventories([a],[incomplete]).status,'not-comparable');
 const duplicate=entry([link,link]);assert.equal(compareInventories([duplicate],[entry([link])]).changes[0].expectedCount,2);
});
test('preservation reference requires completed full engines; explicit recording never overwrites',()=>temp(async root=>{
 const report={scope:{mode:'full'},stages:[{engine:'suta',status:'complete'},{engine:'lintapple',status:'complete'}],preservation:{compatibility:'x',entries:[entry([link])]}};const file=path.join(root,'report.json'),out=path.join(root,'reference.json');await fs.writeFile(file,JSON.stringify(report));await recordPreservation(file,out);await assert.rejects(recordPreservation(file,out),/EEXIST/);report.scope.mode='changed-only';await fs.writeFile(file,JSON.stringify(report));await assert.rejects(recordPreservation(file,path.join(root,'bad.json')),/full completed/);
}));
test('gate distinguishes requested preservation pending, differences, error and unchanged baselines',()=>temp(async root=>{
 const config=makePreset();config.preservation={enabled:true,enforcement:'enforce',baselinePath:null};await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy));let entries=[entry([link])];const opts={root,config,staticRunner:async()=>({findings:[]}),browserRunner:async()=>({findings:[],preservationEntries:entries})};const first=await runGate(opts);assert.equal(first.automatedStatus,'INCOMPLETE');await recordPreservation(path.join(root,config.reportDir,'report.json'),path.join(root,'reference.json'));config.preservation.baselinePath='reference.json';const original=await fs.readFile(path.join(root,'reference.json'));const match=await runGate(opts);assert.equal(match.automatedStatus,'PASS');assert.equal(match.preservation.status,'matched');entries=[entry([])];const changed=await runGate(opts);assert.equal(changed.automatedStatus,'FAIL');assert.match(changed.handoff,/preservation changes/);config.preservation.enforcement='advisory';assert.equal((await runGate(opts)).automatedStatus,'PASS');entries=[];assert.equal((await runGate(opts)).automatedStatus,'ERROR');assert.deepEqual(await fs.readFile(path.join(root,'reference.json')),original);
}));
