import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {loadProjectContext,surfaceGuidance,validateContext} from '../src/project-context.mjs';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {validateConfig} from '../src/config.mjs';
import {runGate} from '../src/gate.mjs';
async function temp(fn){const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-context-'));try{await fn(root);}finally{await fs.rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:250});}}
const context=()=>({schemaVersion:1,product:{audience:'Operators',primaryTask:'Reconcile invoices'},references:[{kind:'design',file:'DESIGN.md',approved:true}],surfaces:[{route:'default',mode:'operate',purpose:'Find unpaid invoices',preserve:{elements:[{selector:'#pay',attributes:['type'],accessibleName:true}],tokens:['--brand']}}]});
test('context records real references, unknown facts and stale hashes without deriving policy',()=>temp(async root=>{
 const c=makePreset();assert.equal((await loadProjectContext(c,root)).status,'not-configured');c.contextPath='context.json';await fs.writeFile(path.join(root,'DESIGN.md'),'Approved design');await fs.writeFile(path.join(root,c.contextPath),JSON.stringify(context()));const original=JSON.stringify(c);
 const result=await loadProjectContext(c,root);assert.equal(result.status,'captured');assert.equal(result.references[0].approved,true);assert.equal(result.references[0].sha256.length,64);assert.equal(JSON.stringify(c),original);const read=structuredClone(result);read.surfaces[0].mode='read';assert.notDeepEqual(surfaceGuidance(read)[0].checks,surfaceGuidance(result)[0].checks);
 const data=context();data.references[0].sha256='a'.repeat(64);delete data.product;await fs.writeFile(path.join(root,c.contextPath),JSON.stringify(data));const stale=await loadProjectContext(c,root);assert.equal(stale.status,'needs-review');assert.equal(stale.product.audience,null);assert.deepEqual(stale.unknown,['audience','primaryTask']);assert.equal(stale.references[0].status,'stale');assert.notEqual(stale.compatibility,result.compatibility);
}));
test('context schema rejects unsafe references, conflicting routes and arbitrary preservation attributes',()=>{
 assert.throws(()=>validateContext({...context(),references:[{kind:'design',file:'../secret',approved:true}]}));const d=context();d.surfaces.push(d.surfaces[0]);assert.throws(()=>validateContext(d),/Duplicate/);const invalid=context();invalid.surfaces[0].preserve.elements[0].attributes=['onclick'];assert.throws(()=>validateContext(invalid),/Unsupported/);assert.equal(validateConfig(makePreset()).preset,'web');
});
test('context changes reset finding comparison without changing finding IDs, browser debt or ARIA semantics',()=>temp(async root=>{
 const config=makePreset();config.contextPath='context.json';await fs.writeFile(path.join(root,'DESIGN.md'),'v1');await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy));await fs.writeFile(path.join(root,'context.json'),JSON.stringify(context()));
 const finding={engine:'suta',rule:'transition-all',severity:'error',file:'app.css',line:1,sourceAnchor:'transition: all',location:'app.css:1',message:'x'};const opts={root,config,staticRunner:async()=>({findings:[finding]}),browserRunner:async()=>({findings:[]})};const a=await runGate(opts);await fs.writeFile(path.join(root,'DESIGN.md'),'v2');const b=await runGate(opts);assert.equal(a.findings[0].id,b.findings[0].id);assert.equal(b.diff.status,'unavailable');assert.equal(a.comparisonContexts.browserDebt,b.comparisonContexts.browserDebt);assert.equal(a.comparisonContexts.aria,b.comparisonContexts.aria);assert.equal(b.handoffDetails.surfaceGuidance[0].mode,'operate');assert.equal(b.automatedStatus,'FAIL');
}));
