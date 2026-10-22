#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {once} from 'node:events';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {runGate,exitCode} from '../src/gate.mjs';
import {spawnBounded} from '../src/execute.mjs';
import {createVisualCandidate,approveVisualCandidate} from '../src/visual-baseline.mjs';
import {visualHash} from '../src/visual-png.mjs';
import {visualComparisonMarkdown} from '../src/visual-reporting.mjs';

const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-visual-smoke-'));
const evidence='artifacts/upstream-contracts/visual-evidence',reports=[],repeats=[];
let clock=0,shift=0,clipping=false,unstable=false,broken=false,height=0;
const server=http.createServer((req,res)=>{
 if(req.url==='/missing.png'){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
 res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Visual fixture</title><style>html{background:white;color:#222;font:16px system-ui}body{margin:24px}h1{font-size:32px}button{font:inherit;min-width:100px;min-height:48px;padding:12px;color:#222;background:white;border:1px solid #555}button:focus-visible{outline:3px solid #0655c0;outline-offset:3px}.square{width:80px;height:80px;background:#246;margin-block:24px;margin-left:${shift}px}.copy{width:300px;max-width:100%;line-height:1.5;${clipping?'width:90px;white-space:nowrap;overflow:hidden':''}}#clock{width:300px;max-width:100%;height:24px}.spacer{height:${height}px}</style><body data-app-ready><h1>Visual fixture</h1><p id="clock">Dynamic count ${clock}</p><div class="square"></div><p class="copy">A long stable sentence that wraps cleanly and remains readable on the fixed viewport.</p><button id="save" onclick="document.querySelector('output').textContent='Saved'">Save</button><output>Ready</output><div class="spacer"></div>${broken?'<img src="/missing.png" width="80" height="80" alt="Broken resource">':''}${unstable?'<canvas id="motion" width="80" height="80"></canvas><script>let tick=0;const ctx=motion.getContext("2d");function draw(){tick++;ctx.fillStyle="rgb("+((tick>>8)&255)+","+(tick&255)+",0)";ctx.fillRect(0,0,80,80);requestAnimationFrame(draw)}draw()</script>':''}</body></html>`);
});
server.listen(0,'127.0.0.1');await once(server,'listening');
let result={status:'ERROR'};
try{
 await fs.mkdir(path.join(root,'src'));await fs.writeFile(path.join(root,'src/app.css'),':root { color: #222; background: #fff; }\n');
 await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify({...lintapplePolicy,viewports:[{width:390,height:844}]}));
 await fs.writeFile(path.join(root,'states.json'),JSON.stringify({states:[{name:'saved',action:'click',selector:'#save',ready:{selector:'output',expectedText:'Saved'}}]}));
 const config=makePreset();config.browser.url=`http://127.0.0.1:${server.address().port}`;config.browser.timeoutMs=5000;config.browser.sessionTimeoutMs=45000;
 config.browser.routes=[{name:'fixture',url:'/',ready:'[data-app-ready]',interactionsPath:'states.json'}];
 config.visual={...config.visual,enabled:true,environmentProfile:'controlled-smoke-system-fonts-'+process.platform,baselineDir:'approved',masks:['#clock'],threshold:0};
 const run=async()=>{
  const start=performance.now(),report=await runGate({root,config});report.smokeWallMs=performance.now()-start;reports.push(report);
  for(const image of report.imageArtifacts){const destination=path.join(evidence,image.file);await fs.mkdir(path.dirname(destination),{recursive:true});await fs.copyFile(path.join(root,config.reportDir,image.file),destination);}
  return report;
 };
 const initial=await run();assert.equal(initial.visual.status,'needs-baseline');assert.equal(initial.status,'REVIEW_REQUIRED');assert.equal(initial.automatedStatus,'PASS');assert.equal(initial.captures.length,0);assert.equal(initial.visual.entries.length,2);
 assert.equal(initial.stages.find(s=>s.engine==='lintapple').inspectionScope.counts.completed,2);
 await assert.rejects(()=>fs.access(path.join(root,'approved')));
 const cli=fileURLToPath(new URL('../bin/ui-refiner.mjs',import.meta.url)),reportFile=path.join(root,config.reportDir,'report.json');
 for(const args of [['visual','candidate','--from',reportFile,'--out',path.join(root,'candidate')],['visual','approve','--from',path.join(root,'candidate','manifest.json'),'--out',path.join(root,'approved')]]){
  const command=await spawnBounded(process.execPath,[cli,...args],{cwd:root,timeoutMs:15000});assert.equal(command.code,0,command.stderr);
 }
 const approvedPath=path.join(root,'approved','manifest.json'),approvedBytes=await fs.readFile(approvedPath);
 const referenceSignature=JSON.stringify(initial.findings.map(f=>f.id).sort());
 for(let i=0;i<10;i++){
  clock++;const report=await run();assert.equal(report.visual.status,'matched',JSON.stringify(report.visual));assert.equal(report.automatedStatus,'PASS');
  assert.equal(JSON.stringify(report.findings.map(f=>f.id).sort()),referenceSignature);assert.equal(report.visual.entries.length,2);
  repeats.push({iteration:i+1,status:report.visual.status,automatedStatus:report.automatedStatus,actualHashes:report.visual.entries.map(e=>e.actual.sha256),wallMs:report.smokeWallMs,...report.visual.metrics});
  assert.deepEqual(await fs.readFile(approvedPath),approvedBytes,'check cannot modify approved images or manifest');
 }
 assert.ok(repeats.every(r=>JSON.stringify(r.actualHashes)===JSON.stringify(repeats[0].actualHashes)));
 console.log('PASS: ten repeated fixed-fixture runs match approved initial/saved states despite declared masked text changes');
 config.visual.mode='enforce';let report=await run();assert.equal(report.visual.status,'matched');assert.equal(report.status,'REVIEW_REQUIRED');assert.equal(exitCode(report),0);
 shift=24;report=await run();assert.equal(report.visual.status,'different');assert.equal(report.automatedStatus,'FAIL');assert.equal(exitCode(report),1);assert.ok(report.visual.entries.every(e=>e.diffPixels>0&&e.actual&&e.expected&&e.diff));
 config.visual.mode='advisory';report=await run();assert.equal(report.visual.status,'different');assert.equal(report.automatedStatus,'PASS');assert.equal(report.status,'REVIEW_REQUIRED');
 clipping=true;report=await run();assert.equal(report.visual.status,'different');assert.ok(report.findings.some(f=>f.rule==='content-clipping'&&f.blocking));
 shift=0;clipping=false;config.visual.mode='enforce';
 config.visual.environmentProfile+='-other';report=await run();assert.equal(report.visual.status,'not-comparable');assert.equal(report.automatedStatus,'INCOMPLETE');assert.equal(exitCode(report),2);
 config.visual.environmentProfile=config.visual.environmentProfile.replace('-other','');config.visual.baselineDir='absent';report=await run();assert.equal(report.visual.status,'needs-baseline');assert.equal(report.automatedStatus,'INCOMPLETE');
 config.visual.baselineDir='approved';config.visual.masks=['#missing'];report=await run();assert.equal(report.automatedStatus,'ERROR');assert.equal(exitCode(report),2);
 config.visual.masks=['#clock'];unstable=true;report=await run();assert.equal(report.automatedStatus,'ERROR');assert.ok(report.visual.entries.some(e=>e.reason.includes('stabilization failed')));unstable=false;
 broken=true;report=await run();assert.equal(report.automatedStatus,'ERROR');broken=false;
 const manifest=JSON.parse(approvedBytes),expectedFile=path.join(root,'approved',manifest.entries[0].image.file),expectedBytes=await fs.readFile(expectedFile);
 await fs.unlink(expectedFile);report=await run();assert.equal(report.automatedStatus,'ERROR');await fs.writeFile(expectedFile,expectedBytes);
 config.browser.captureScreenshots=true;report=await run();assert.equal(report.visual.status,'matched');assert.equal(report.captures.length,2);assert.equal(report.imageArtifacts.filter(i=>i.kind==='state').length,2);assert.notEqual(report.captures[0].sha256,report.visual.entries[0].actual.sha256);config.browser.captureScreenshots=false;
 console.log('PASS: layout/clipping defects, masks outside changes, advisory/enforce exits, missing/mismatched baselines, unstable/failed captures and independent raw evidence');
 config.visual.capture='fullPage';config.visual.mode='advisory';config.visual.baselineDir='approved-full';height=1000;await run();
 await createVisualCandidate(reportFile,path.join(root,'candidate-full'));await approveVisualCandidate(path.join(root,'candidate-full','manifest.json'),path.join(root,'approved-full'));
 config.visual.mode='enforce';height=1100;report=await run();assert.equal(report.visual.status,'different');assert.equal(report.automatedStatus,'FAIL');assert.ok(report.visual.entries.every(e=>e.reason.includes('dimensions changed')&&e.diffPixels===null));
 assert.deepEqual(await fs.readFile(approvedPath),approvedBytes);
 const sourceFiles=['../src/visual.mjs','../src/visual-png.mjs','../src/visual-baseline.mjs','../src/browser-worker.mjs','../src/browser-session.mjs','../src/image-evidence.mjs','../package-lock.json'];
 const sourceDigests=Object.fromEntries(await Promise.all(sourceFiles.map(async file=>[file,visualHash(await fs.readFile(new URL(file,import.meta.url)))])));
 const times=repeats.map(r=>r.wallMs).sort((a,b)=>a-b);
 result={status:'PASS',node:process.version,sourceDigests,environment:initial.visual.entries[0].compatibility.environment,engine:initial.visual.entries[0].compatibility.engine,evidenceDirectory:'visual-evidence',repetition:{runs:10,stateCapturesPerRun:2,unstableRuns:0,definition:'same fixture/code/environment; exact masked PNG bytes, finding IDs and statuses',wallMs:{min:times[0],median:(times[4]+times[5])/2,max:times.at(-1)},samples:repeats},approvedManifestHash:visualHash(approvedBytes),reports};
}catch(e){result={status:'ERROR',error:e.stack,reports,repeats};process.exitCode=2;}
finally{await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:250});}
if(result.status==='PASS'){const example=reports.find(r=>r.visual.status==='different');await fs.writeFile(path.join(evidence,'comparison.md'),'# Visual image regression fixture\n\n'+visualComparisonMarkdown(example.visual)+'\n');}
await fs.mkdir('artifacts/upstream-contracts',{recursive:true});await fs.writeFile('artifacts/upstream-contracts/visual.report.json',JSON.stringify(result,null,2)+'\n');
console.log(`${result.status}: visual regression; artifacts/upstream-contracts/visual.report.json`);
