#!/usr/bin/env node
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {runGate,baselineFromReport} from '../src/gate.mjs';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-review4-browser-'));let clock='12:30:00',heading='Clock';
const serve=(req,res)=>{
 if(req.url==='/missing'){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
 res.end(`<html style="background:white"><style>body{margin:0;font:16px system-ui}header{position:sticky;top:0;background:#222;color:white;height:32px}button{font-family:inherit;font-size:16px;min-width:80px;min-height:48px;margin:8px}.primary{background:#222;color:white}.ghost{background:white;color:#222;border:1px solid #222}.backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);pointer-events:none}</style><body><header>Navigation</header><h1>${heading} ${clock}</h1><p data-ui-id="font-fixture" style="font-family:serif">Stable typography target</p><button class="primary" id="open" onclick="document.querySelector('.backdrop').hidden=false">Open</button><button class="ghost">Ghost A</button><button class="ghost">Ghost B</button><button>Native</button><div class="backdrop" data-ui-backdrop hidden></div></body></html>`);
};
const servers=[http.createServer(serve),http.createServer(serve)];
for(const server of servers){server.listen(0,'127.0.0.1');await once(server,'listening');}
try{
 await fs.mkdir(path.join(root,'src'));await fs.writeFile(path.join(root,'src/app.css'),':root { color: #222; background: #fff; }\n');
 await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify({...lintapplePolicy,viewports:[{width:390,height:844}],colorSchemes:['light']}));
 await fs.writeFile(path.join(root,'modal.json'),JSON.stringify({states:[{name:'modal',action:'click',selector:'#open',ready:{selector:'.backdrop',state:'visible'}}]}));
 const config=makePreset();config.browser.url=`http://127.0.0.1:${servers[0].address().port}`;config.browser.renderedMetrics=true;config.browser.captureAriaSnapshots=true;config.browser.routes=[{name:'one',url:'/one',interactionsPath:'modal.json'},{name:'two',url:'/two',interactionsPath:'modal.json'}];
 const check=()=>runGate({root,config});
 const before=await check();assert.equal(before.automatedStatus,'FAIL',JSON.stringify(before.stages));
 assert.ok(before.renderedMetrics.every(m=>m.filledButtons.count===1&&m.topPinned.count===1),JSON.stringify(before.renderedMetrics));
 await baselineFromReport(path.join(root,config.reportDir,'report.json'),path.join(root,'baseline.json'));config.gate.baselinePath='baseline.json';
 config.browser.url=`http://127.0.0.1:${servers[1].address().port}`;
 const moved=await check();assert.equal(moved.summary.baselined,before.findings.filter(f=>f.baselineEligible).length);assert.ok(moved.summary.baselined>0);assert.equal(moved.summary.blockers,0);
 config.browser.routes.splice(1,0,{name:'bad',url:'/missing',interactionsPath:null});
 const partial=await check();assert.equal(partial.automatedStatus,'ERROR');assert.ok(partial.findings.some(f=>f.route==='one'));assert.ok(partial.findings.some(f=>f.route==='two'));assert.deepEqual(partial.stages.find(s=>s.engine==='lintapple').routeResults.map(r=>r.status),['complete','error','complete']);assert.equal(partial.diff.status,'unavailable');
 await assert.rejects(()=>baselineFromReport(path.join(root,config.reportDir,'report.json'),path.join(root,'bad-baseline.json')),/must complete/);
 config.browser.routes.splice(1,1);config.browser.ariaSnapshotMasks=[{pattern:'\\d{2}:\\d{2}:\\d{2}',flags:'g'}];
 for(let i=0;i<4;i++){clock=`12:30:0${i}`;const report=await check();assert.ok(report.automatedStatus!=='ERROR',JSON.stringify(report.stages));if(i>0){assert.equal(report.ariaDiff.changed.length,0);assert.equal(report.ariaDiff.unchanged.length,4);}}
 const files=(await fs.readdir(path.join(root,config.reportDir))).filter(f=>f.endsWith('.aria.yml'));assert.equal(files.length,4,'Only the four stable masked states should remain');
 heading='Changed heading';const changed=await check();assert.equal(changed.ariaDiff.changed.length,4,'Meaningful labels must still change');
 const {chromium}=await import('playwright');const {collectRenderedMetrics}=await import('../src/rendered-metrics.mjs');const browser=await chromium.launch();
 try{const page=await browser.newPage();await page.setContent('<html style="background:white"><body><section style="background:#222"><button style="background:#222;color:white">Ghost on dark</button><button style="background:white;color:black">Primary on dark</button></section></body></html>');const metrics=await page.evaluate(collectRenderedMetrics);assert.equal(metrics.filledButtons.count,1,'Contrast must use the nearest opaque ancestor, including dark surfaces');}finally{await browser.close();}
 await fs.mkdir('artifacts/upstream-contracts',{recursive:true});await fs.writeFile('artifacts/upstream-contracts/review4.report.json',JSON.stringify(changed,null,2)+'\n');
 console.log('PASS: cross-port baseline, successful-route evidence despite 404, one visually filled button, modal backdrop exclusion, four masked clock runs with bounded files, meaningful ARIA change and dark ancestor contrast');
}finally{for(const server of servers)await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});}
