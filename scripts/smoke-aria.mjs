#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import {once} from 'node:events';
import path from 'node:path';
import os from 'node:os';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {runGate} from '../src/gate.mjs';

const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-aria-explanation-'));
const archive='artifacts/upstream-contracts/aria-text-evidence',reports=[];
let revision=0,clock='12:30:00',defect=false,finalName='Submit';
const server=http.createServer((req,res)=>{
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
 res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><title>ARIA comparison fixture</title><style>html{background:white}body{font:16px system-ui;color:#222;background:white;margin:24px}button,a{font:inherit;color:inherit;display:inline-block;min-width:80px;min-height:48px;padding:12px;margin:12px}button:focus-visible,a:focus-visible{outline:3px solid #0655c0;outline-offset:3px}h1{font-size:32px}</style><body data-app-ready><h1>ARIA fixture</h1>
 ${revision?`<a id="primary" href="#panel-summary">${finalName}</a>`:'<button id="primary">Save</button>'}
 <div role="tablist" aria-label="Pages"><button id="details" role="tab" aria-selected="${!revision}" aria-controls="panel-details">Details</button><button id="summary" role="tab" aria-selected="${!!revision}" aria-controls="panel-summary">Summary</button></div>
 <section id="panel-details" role="tabpanel" aria-labelledby="details" ${revision?'hidden':''}>Details panel</section><section id="panel-summary" role="tabpanel" aria-labelledby="summary" ${revision?'':'hidden'}>Summary panel</section>
 ${revision?'<p>Added note</p>':'<p>Removed note</p>'}<p>Clock ${clock}</p><p id="contrast" style="color:${defect?'#eee':'#222'}">Readable status text</p>
 ${defect?'<div id="keyboard" data-ui-clickable onclick="void 0">Run action</div>':'<button id="keyboard">Run action</button>'}
 </body></html>`);
});
server.listen(0,'127.0.0.1');await once(server,'listening');
let result={status:'ERROR'};
try{
 await fs.mkdir(path.join(root,'src'));await fs.writeFile(path.join(root,'src/app.css'),':root { color: #222; background: #fff; }\n');
 await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify({...lintapplePolicy,viewports:[{width:390,height:844}]}));
 const config=makePreset();config.browser.url=`http://127.0.0.1:${server.address().port}`;
 config.browser.ready='[data-app-ready]';config.browser.timeoutMs=5000;config.browser.sessionTimeoutMs=30000;
 config.browser.captureAriaSnapshots=true;config.browser.ariaSnapshotMasks=[{pattern:'\\d{2}:\\d{2}:\\d{2}',flags:'g'}];
 const run=async()=>{
  const report=await runGate({root,config});reports.push(report);
  await fs.mkdir(archive,{recursive:true});
  for(const s of report.ariaSnapshots)await fs.copyFile(path.join(root,config.reportDir,s.file),path.join(archive,s.file));
  return report;
 };
 const first=await run();assert.equal(first.automatedStatus,'PASS',JSON.stringify(first.findings));
 revision=1;clock='12:30:01';const changed=await run();assert.equal(changed.automatedStatus,'PASS',JSON.stringify(changed.findings));assert.equal(changed.status,'REVIEW_REQUIRED');
 assert.equal(changed.ariaDiff.changed.length,1);const text=changed.ariaDiff.changed[0].textDiff;
 assert.equal(text.status,'compared');assert.equal(text.truncated,false);
 const edits=text.hunks.flatMap(h=>h.lines).filter(l=>l.type!=='context');
 for(const word of ['Save','Submit','selected','Added note','Removed note'])assert.ok(edits.some(l=>l.text.includes(word)),`Expected ARIA edit containing ${word}`);
 assert.ok(edits.some(l=>l.type==='remove'&&l.text.includes('button "Save"')));assert.ok(edits.some(l=>l.type==='add'&&l.text.includes('link "Submit"')));
 const markdown=await fs.readFile(path.join(root,config.reportDir,'report.md'),'utf8');assert.match(markdown,/Previous YAML/);assert.match(markdown,/@@ -/);
 await fs.copyFile(path.join(root,config.reportDir,'report.md'),path.join(archive,'comparison.md'));
 const original=await fs.readFile(path.join(root,config.reportDir,first.ariaSnapshots[0].file));
 clock='12:30:02';const masked=await run();assert.equal(masked.ariaDiff.changed.length,0);assert.equal(masked.ariaDiff.unchanged.length,1);assert.equal(masked.ariaDiff.textSummary.compared,0);
 assert.deepEqual(await fs.readFile(path.join(root,config.reportDir,first.ariaSnapshots[0].file)),original,'Comparison must retain the original YAML bytes');
 defect=true;let failed=await run();assert.equal(failed.automatedStatus,'FAIL');
 for(const rule of ['text-contrast','keyboard-operation'])assert.ok(failed.findings.some(f=>f.rule===rule&&f.blocking),`Expected unmasked ${rule} blocker`);
 clock='12:30:03';failed=await run();assert.equal(failed.automatedStatus,'FAIL');assert.equal(failed.ariaDiff.changed.length,0);
 for(const rule of ['text-contrast','keyboard-operation'])assert.ok(failed.findings.some(f=>f.rule===rule&&f.blocking));
 await fs.unlink(path.join(root,config.reportDir,failed.ariaSnapshots[0].file));
 finalName='Publish';const missing=await run();assert.equal(missing.automatedStatus,'FAIL');assert.equal(missing.ariaDiff.changed[0].textDiff.status,'unavailable');assert.match(missing.ariaDiff.changed[0].textDiff.reason,/missing/);
 result={status:'PASS',evidenceDirectory:'aria-text-evidence',reports};
 console.log('PASS: real role/name/selected/add/remove text edits, masked clock stability, retained YAML, missing-history reason and unmasked contrast/keyboard blockers');
}catch(e){result={status:'ERROR',error:e.stack,reports};process.exitCode=2;}
finally{await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:250});}
await fs.mkdir('artifacts/upstream-contracts',{recursive:true});
await fs.writeFile('artifacts/upstream-contracts/aria-text.report.json',JSON.stringify(result,null,2)+'\n');
console.log(`${result.status}: ARIA text explanations; artifacts/upstream-contracts/aria-text.report.json`);
