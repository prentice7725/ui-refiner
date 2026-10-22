#!/usr/bin/env node
// A deterministic fixture consumer, not an autonomous coding-agent evaluation.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {once} from 'node:events';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import Ajv from 'ajv-draft-04';
import addFormats from 'ajv-formats';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {runGate} from '../src/gate.mjs';
import {exportHtmlBundle} from '../src/exporters.mjs';
import {createVisualCandidate,approveVisualCandidate} from '../src/visual-baseline.mjs';
import {reportToSarif} from '../src/sarif.mjs';
const repo=path.resolve('.'),root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-handoff-')),archive=path.join(repo,'artifacts/upstream-contracts/export-evidence'),trials=[];
let defect=false,label='Save';
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Export fixture</title><style>html{background:white}body{font:16px system-ui;color:#222;background:white;margin:24px}button{font:inherit;min-width:90px;min-height:48px;padding:12px}button:focus-visible{outline:3px solid blue;outline-offset:3px}</style><body data-app-ready><h1>Handoff fixture</h1><p id="status" style="color:${defect?'#eee':'#222'}">Status text</p><button id="save">${label}</button></body></html>`);});
server.listen(0,'127.0.0.1');await once(server,'listening');
const cli=args=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(repo,'bin/ui-refiner.mjs'),...args],{cwd:root,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.on('error',reject);child.on('close',code=>resolve({code,stdout,stderr}));});
let browser,result;
try{
 await fs.mkdir(path.join(root,'src'));const css=path.join(root,'src/app.css'),good=':root { color: #222; background: #fff; }\n';await fs.writeFile(css,good);
 const config=makePreset();config.browser.url=`http://127.0.0.1:${server.address().port}`;config.browser.ready='[data-app-ready]';config.browser.captureScreenshots=true;config.browser.captureAriaSnapshots=true;config.visual.enabled=true;config.visual.environmentProfile='export-fixture';
 const policy={...lintapplePolicy,viewports:[{width:390,height:844}],colorSchemes:['light']},policyBytes=JSON.stringify(policy);await fs.writeFile(path.join(root,'ui-policy.json'),policyBytes);
 const configFile=path.join(root,'ui-refiner.config.json');await fs.writeFile(configFile,JSON.stringify(config));const run=()=>runGate({root,config,configFile});
 const clean=await cli(['check','--config',configFile,'--format','json']);assert.equal(clean.code,0,clean.stderr+' '+JSON.stringify(JSON.parse(clean.stdout).findings));assert.equal(JSON.parse(clean.stdout).automatedStatus,'PASS');
 const candidate=path.join(root,'candidate');await createVisualCandidate(path.join(root,config.reportDir,'report.json'),candidate);await approveVisualCandidate(path.join(candidate,'manifest.json'),path.join(root,config.visual.baselineDir));
 for(const sample of ['source-transition','browser-contrast']){
  if(sample==='source-transition')await fs.writeFile(css,good+'button { transition: all 300ms ease; }\n');else defect=true;
  const before=await run();assert.equal(before.automatedStatus,'FAIL');const targets=before.handoffDetails.targets.filter(t=>t.blocking);assert.ok(targets.length);
  // Known repair recipes are restricted to this fixture and selected from the actual handoff targets.
  if(sample==='source-transition'){assert.ok(targets.some(t=>t.sourceLocation.status==='verified'&&t.file==='src/app.css'));await fs.writeFile(css,good);}else{assert.ok(targets.some(t=>t.rule==='text-contrast'&&t.selector),JSON.stringify(targets.map(t=>({rule:t.rule,selector:t.selector}))));defect=false;}
  label='Saved';const after=await run();assert.equal(after.automatedStatus,'PASS');assert.equal(after.scope.mode,'full');assert.equal(after.summary.blockers,0);assert.equal(await fs.readFile(path.join(root,'ui-policy.json'),'utf8'),policyBytes);assert.equal(config.gate.baselinePath,null);
  trials.push({sample,consumer:'deterministic fixture repair recipe',attemptBudget:2,attempts:1,before:before.automatedStatus,after:after.automatedStatus,regressions:after.summary.blockers,beforeTargets:targets.length,sourceVerified:targets.filter(t=>t.sourceLocation.status==='verified').length});
 }
 // Produce changed ARIA evidence in the final report.
 label='Publish';const report=await run();assert.ok(report.ariaDiff.changed.length);
 const ajv=new Ajv({strict:false,allErrors:true});addFormats(ajv);const validate=ajv.compile(JSON.parse(await fs.readFile('test/schemas/sarif-schema-2.1.0.json')));const sarif=JSON.parse(JSON.stringify(reportToSarif(report)));assert.ok(validate(sarif),JSON.stringify(validate.errors));
 const json=path.join(root,config.reportDir,'report.json');await fs.mkdir(archive,{recursive:true});const bundle=path.join(archive,'bundle-'+report.runId);await exportHtmlBundle(json,bundle);
 await fs.writeFile(path.join(archive,'report.sarif'),JSON.stringify(sarif,null,2)+'\n');
 const matrix=[];for(const [status,code] of [['PASS',0],['FAIL',1],['ERROR',2],['INCOMPLETE',2],['SCOPED_PASS',3]]){
  const saved={...report,automatedStatus:status,status,exitCode:code};const file=path.join(root,status+'.json');await fs.writeFile(file,JSON.stringify(saved));const exported=await cli(['export','sarif','--from',file,'--out',path.join(root,status+'.sarif')]);assert.equal(exported.code,code,exported.stderr);const value=JSON.parse(await fs.readFile(path.join(root,status+'.sarif')));assert.ok(validate(value),JSON.stringify(validate.errors));matrix.push({status,exitCode:exported.code});
 }
 defect=true;const failed=await cli(['check','--config',configFile,'--format','sarif']);assert.equal(failed.code,1,failed.stderr);assert.ok(validate(JSON.parse(failed.stdout)),JSON.stringify(validate.errors));defect=false;
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}}),requests=[];page.on('request',req=>requests.push(req.url()));await page.goto(pathToFileURL(path.join(bundle,'report.html')).href);await page.locator('details').first().evaluate(el=>el.open=true);await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));assert.ok(await page.locator('img').count());
 assert.ok((await page.locator('h1').innerText()).includes('REVIEW_REQUIRED'));await page.screenshot({path:path.join(archive,'desktop.png'),fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(archive,'mobile.png'),fullPage:true});assert.ok(requests.every(url=>url.startsWith('file:')),JSON.stringify(requests));assert.equal(await page.locator('script').count(),0);
 const canonical=await fs.readFile(path.join(bundle,'report.json'));result={status:'PASS',bundle:path.relative(repo,bundle).replaceAll('\\','/'),sourceReportSha256:createHash('sha256').update(canonical).digest('hex'),offlineNetworkRequests:requests.filter(u=>!u.startsWith('file:')).length,exitMatrix:matrix,study:{consumer:'deterministic fixture recipes; no autonomous agent evaluated',fixtureTrials:trials.length,autonomousAgentTrials:0,attemptBudget:2,trials,successes:trials.filter(t=>t.after==='PASS').length,regressions:trials.reduce((n,t)=>n+t.regressions,0)}};
 console.log('PASS: offline HTML bundle, canonical bytes, SARIF schema, CLI verdict preservation and 2 deterministic handoff repair/recheck trials');
}catch(e){result={status:'ERROR',error:e.stack,trials};process.exitCode=2;console.error(e.stack);}
finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:250});}
await fs.mkdir(path.dirname(archive),{recursive:true});await fs.writeFile(path.join(path.dirname(archive),'export.report.json'),JSON.stringify(result,null,2)+'\n');
