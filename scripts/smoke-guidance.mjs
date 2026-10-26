#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {once} from 'node:events';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {runGate,exitCode} from '../src/gate.mjs';
import {exportHtmlBundle} from '../src/exporters.mjs';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-guidance-smoke-')),archive=path.resolve('artifacts/upstream-contracts/guidance-evidence');let broken=false;
const page=()=>`<!doctype html><html lang="en"><meta charset="utf-8"><title>Guidance fixture</title><style>html{background:#fff}body{font:16px system-ui;color:#222;background:#fff;margin:24px}button,input{font:inherit;min-width:100px;min-height:48px;padding:12px;margin:12px}button:focus-visible,input:focus-visible{outline:3px solid #1455aa;outline-offset:3px}</style><body data-app-ready><h1>Guidance fixture</h1><label for="email">Email</label><input id="email" type="email"><button id="save" type="button">Save</button><p id="status" style="color:${broken?'#eee':'#222'}">Ready to save</p></body></html>`;
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(page());});server.listen(0,'127.0.0.1');await once(server,'listening');let result;
try{
 await fs.mkdir(path.join(root,'src'));await fs.writeFile(path.join(root,'src/app.css'),':root { color: #222; background: #fff; }\n');await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify({...lintapplePolicy,viewports:[{width:390,height:844}],colorSchemes:['light']}));
 const config=makePreset();config.browser.url=`http://127.0.0.1:${server.address().port}`;config.browser.ready='[data-app-ready]';config.browser.captureScreenshots=true;config.browser.captureAriaSnapshots=true;
 const run=()=>runGate({root,config});const clean=await run();assert.equal(exitCode(clean),0,JSON.stringify(clean.findings));assert.equal(clean.repairGuidance.counts.suggested,0);
 broken=true;await fs.writeFile(path.join(root,'src/app.css'),':root { color: #222; background: #fff; }\nbutton { transition: all 300ms ease; }\n');const failure=await run();assert.equal(exitCode(failure),1);for(const rule of ['text-contrast','transition-all']){const target=failure.handoffDetails.targets.find(t=>t.rule===rule&&t.blocking);assert.ok(target,rule);assert.ok(target.repairSuggestions.length,rule);assert.ok(target.repairSuggestions.every(s=>s.advisory&&!s.blocking&&s.source.commit.length===40));}
 const markdown=await fs.readFile(path.join(root,config.reportDir,'AGENT_HANDOFF.md'),'utf8');assert.match(markdown,/Repair guidance — advisory/);assert.match(markdown,/Source row/);assert.match(markdown,/Fix root causes/);const ids=failure.findings.map(f=>f.id).sort();
 await fs.mkdir(archive,{recursive:true});const bundle=path.join(archive,'bundle-'+failure.runId);await exportHtmlBundle(path.join(root,config.reportDir,'report.json'),bundle);
 config.guidance={enabled:false};const disabled=await run();assert.equal(exitCode(disabled),exitCode(failure));assert.deepEqual(disabled.findings.map(f=>f.id).sort(),ids);assert.deepEqual(disabled.comparisonContexts,failure.comparisonContexts);
 broken=false;await fs.writeFile(path.join(root,'src/app.css'),':root { color: #222; background: #fff; }\n');config.guidance={enabled:true};const fixed=await run();assert.equal(exitCode(fixed),0);assert.equal(fixed.repairGuidance.counts.suggested,0);
 result={status:'PASS',bundle:path.relative(path.resolve('.'),bundle).replaceAll('\\','/'),retrievalSource:failure.repairGuidance.source,observedRules:failure.repairGuidance.entries.filter(e=>e.suggestions.length).map(e=>({rule:e.rule,sourceRows:e.suggestions.map(s=>s.source.rowId)})),verdicts:{clean:clean.automatedStatus,failure:failure.automatedStatus,disabled:disabled.automatedStatus,fixed:fixed.automatedStatus},idsUnchanged:true,comparisonContextsUnchanged:true};console.log('PASS: real static/browser defects attach source-linked advisory guidance; disabled retrieval preserves verdicts and identities');
}catch(e){result={status:'ERROR',error:e.stack};process.exitCode=2;console.error(e.stack);}finally{await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:250});}
await fs.mkdir(path.dirname(archive),{recursive:true});await fs.writeFile(path.join(path.dirname(archive),'guidance.report.json'),JSON.stringify(result,null,2)+'\n');
