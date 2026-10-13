import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {sha256,repoRoot} from '../src/vendor.mjs';
import {recordedContract,verifyRecordedContract} from '../src/contracts.mjs';
import {normalizeStatic,normalizeBrowser,identify} from '../src/normalize.mjs';
import {groupFindings} from '../src/reporting.mjs';
test('recorded real-engine fixtures retain provenance and original bytes',async()=>{
 const provenance=JSON.parse(await fs.readFile(path.join(repoRoot,'test/fixtures/provenance.json'),'utf8'));
 assert.equal(provenance.runId,38352444592);
 for(const [name,digest] of Object.entries(provenance.sha256))assert.equal(sha256(await fs.readFile(path.join(repoRoot,'test/fixtures',name))),digest);
});
test('actual suta and Chromium recordings preserve the repair adapter contract',async()=>{
 const source=await recordedContract('suta'),rendered=await recordedContract('lintapple');
 assert.deepEqual(normalizeStatic(source).map(f=>f.rule),['no-reduced-motion','transition-all']);
 const findings=identify(normalizeBrowser(rendered));assert.ok(findings.every(f=>f.actual==='serif'&&f.expected.includes('system-ui')&&f.baselineEligible));assert.equal(groupFindings(findings).length,1);
 await verifyRecordedContract('suta',source);await verifyRecordedContract('lintapple',rendered);
 const broken=structuredClone(rendered);delete broken.findings[0].actual;await assert.rejects(()=>verifyRecordedContract('lintapple',broken),/contract changed/);
});
