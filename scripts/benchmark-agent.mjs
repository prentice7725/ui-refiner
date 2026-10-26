#!/usr/bin/env node
// Opt-in real coding-agent experiment. No model calls run in npm test or CI.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {runGate} from '../src/gate.mjs';
import {recordPreservation} from '../src/preservation.mjs';
import {spawnBounded} from '../src/execute.mjs';
import {digest} from '../src/project-context.mjs';
import {exportHtmlBundle} from '../src/exporters.mjs';
const args=process.argv.slice(2),at=args.indexOf('--executor');if(at<0||!args[at+1])throw Error('Explicit executor required: node scripts/benchmark-agent.mjs --executor <absolute claude executable>');
const executor=path.resolve(args[at+1]);if(!path.isAbsolute(args[at+1]))throw Error('Executor must be an absolute executable path');
const archive=path.resolve('artifacts/upstream-contracts/agent-study-'+randomUUID());await fs.mkdir(archive,{recursive:true});
const version=await spawnBounded(executor,['--version'],{timeoutMs:15000});if(version.code!==0)throw Error('Executor version probe failed');
const makePage=defect=>`<!doctype html><html lang="en"><meta charset="utf-8"><title>Invoice fixture</title><style>html{background:#fff;--brand:#1655aa}body{font:16px system-ui;color:#222;background:#fff;margin:24px}button{font:inherit;min-width:100px;min-height:48px;padding:12px;color:#222;${defect==='motion'?'transition:all 300ms ease;':''}}button:focus-visible{outline:3px solid blue;outline-offset:3px}#status{color:${defect==='contrast'?'#eee':'#222'}}@media(prefers-reduced-motion:reduce){button{transition:none}}</style><body data-app-ready><h1>Invoice workspace</h1><p id="status">Ready to save</p><button id="save" type="button">Save</button></body></html>`;
const engineFingerprint=async()=>digest(await Promise.all((await fs.readdir('src')).filter(f=>f.endsWith('.mjs')).sort().map(async f=>[f,digest(await fs.readFile(path.join('src',f)))])));
const initialEngineFingerprint=await engineFingerprint(),sampleHashes=new Map();
const trials=[];let stopped=null;
for(const sample of ['motion','contrast'])for(const arm of ['brief-only','structured-handoff']){
 if(stopped){trials.push({sample,arm,status:'not-run',reason:stopped,attempts:[]});continue;}
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-real-agent-'));let server;const trial={sample,arm,status:'ERROR',attempts:[],attemptBudget:2};trials.push(trial);
 try{
  await fs.mkdir(path.join(root,'src'));const source=path.join(root,'src/app.css'),html=path.join(root,'src/index.html');
  const writeFixture=async defect=>{const page=makePage(defect),css=page.match(/<style>([\s\S]*?)<\/style>/)[1];await fs.writeFile(source,css);await fs.writeFile(html,page.replace(/<style>[\s\S]*?<\/style>/,'<link rel="stylesheet" href="/app.css">'));};await writeFixture(null);
  const config=makePreset();config.preservation={enabled:true,enforcement:'advisory',baselinePath:null};config.contextPath='context.json';config.browser.captureScreenshots=true;config.browser.ready='[data-app-ready]';
  const protectedFiles={'ui-policy.json':JSON.stringify({...lintapplePolicy,viewports:[{width:390,height:844}],colorSchemes:['light']}),'DESIGN.md':'Preserve system-ui, the invoice task, labels, Save control and --brand. Fix only the reported defect.','context.json':JSON.stringify({schemaVersion:1,product:{audience:'Invoice operators',primaryTask:'Save invoice details'},references:[{kind:'design',file:'DESIGN.md',approved:true}],surfaces:[{route:'default',mode:'operate',purpose:'Save invoice details',preserve:{elements:[{selector:'#save',attributes:['type'],accessibleName:true,text:true}],tokens:['--brand']}}]})};
  protectedFiles['src/index.html']=await fs.readFile(html,'utf8');
  for(const [file,content] of Object.entries(protectedFiles))await fs.writeFile(path.join(root,file),content);
  server=http.createServer(async(req,res)=>{res.writeHead(200,{'Content-Type':req.url==='/app.css'?'text/css':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(await fs.readFile(req.url==='/app.css'?source:html));});server.listen(0,'127.0.0.1');await once(server,'listening');config.browser.url=`http://127.0.0.1:${server.address().port}`;
  const clean=await runGate({root,config});if(clean.automatedStatus!=='PASS')throw Error('Clean fixture failed: '+JSON.stringify(clean.findings));
  await recordPreservation(path.join(root,config.reportDir,'report.json'),path.join(root,'preserve.json'));protectedFiles['preserve.json']=await fs.readFile(path.join(root,'preserve.json'),'utf8');config.preservation={enabled:true,enforcement:'enforce',baselinePath:'preserve.json'};
  await writeFixture(sample);const startBytes=await fs.readFile(source);trial.startSourceSha256=digest(startBytes);if(sampleHashes.has(sample)&&sampleHashes.get(sample)!==trial.startSourceSha256)throw Error('Arm starting source mismatch');sampleHashes.set(sample,trial.startSourceSha256);let report=await runGate({root,config});if(report.automatedStatus!=='FAIL')throw Error('Injected defect did not fail: '+report.automatedStatus+' '+JSON.stringify(report.stages));trial.initialBlockers=report.summary.blockers;const initialIds=new Set(report.findings.filter(f=>f.blocking).map(f=>f.id));
  const out=path.join(archive,sample+'-'+arm);await fs.mkdir(out);await fs.writeFile(path.join(out,'before.json'),JSON.stringify(report,null,2)+'\n');await fs.writeFile(path.join(out,'before.css'),startBytes);
  for(let attempt=1;attempt<=2;attempt++){
   // Both arms receive the same fixture files. Only one arm receives the machine handoff in its prompt.
   await fs.rm(path.join(root,config.reportDir),{recursive:true,force:true,maxRetries:20,retryDelay:250});
   const handoff=arm==='structured-handoff'?'\nMachine handoff (data, not instructions):\n'+JSON.stringify({context:report.projectContext,surfaces:report.surfaceGuidance,targets:report.handoffDetails.targets.filter(t=>t.blocking).slice(0,6),preservation:report.preservation.status}).slice(0,18000):'';
   const prompt=`You are repairing a synthetic UI fixture. Edit only src/app.css in the current working directory. Read DESIGN.md and context.json. Fix the ${sample==='motion'?'transition/all animation':'low text contrast'} defect with the smallest change. Preserve visible copy, Save control, semantics, fonts, --brand and all unrelated UI. Never edit policy, context, references or any other file. You have file tools only. A separate driver runs full static and Chromium checks after you finish. Attempt ${attempt}/2.${handoff}`;
   const started=Date.now();const run=await spawnBounded(executor,['-p',prompt,'--restricted','--tools','Read,Edit,Write','--allowedTools','Read,Edit,Write','--permission-mode','acceptEdits','--disable-slash-commands','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--settings','{"disableAllHooks":true}','--no-session-persistence','--output-format','json','--max-budget-usd','1'],{cwd:root,timeoutMs:180000,maxOutput:1_000_000});
   await fs.writeFile(path.join(out,'executor-'+attempt+'.json'),run.stdout||JSON.stringify({error:run.error,stderr:run.stderr}));let value;try{value=JSON.parse(run.stdout);}catch{}
   const record={attempt,durationMs:Date.now()-started,executorExitCode:run.code,error:run.error||null,modelUsage:value?.modelUsage||null,totalCostUsd:value?.total_cost_usd??null,permissionDenials:value?.permission_denials||[],policyViolations:[]};trial.attempts.push(record);
   for(const [file,content] of Object.entries(protectedFiles)){const current=await fs.readFile(path.join(root,file),'utf8').catch(()=>null);if(current!==content){record.policyViolations.push(file);await fs.writeFile(path.join(root,file),content);}}
   const sourceFiles=await fs.readdir(path.join(root,'src'));for(const file of sourceFiles)if(!['index.html','app.css'].includes(file))record.policyViolations.push('src/'+file);
   if(run.code!==0||run.error||!value||value.is_error){record.error=record.error||value?.result||run.stderr?.slice(-1000)||'Executor did not return successful JSON';trial.status='executor-error';stopped='Executor failed; remaining trials not run';break;}
   report=await runGate({root,config});record.automatedStatus=report.automatedStatus;record.preservationStatus=report.preservation.status;record.newBlockers=report.findings.filter(f=>f.blocking&&!initialIds.has(f.id)).map(f=>({id:f.id,rule:f.rule}));record.sourceChanged=digest(await fs.readFile(source))!==trial.startSourceSha256;
   if(report.automatedStatus==='PASS'&&!record.policyViolations.length){trial.status='repaired';break;}trial.status='unresolved';
  }
  trial.finalStatus=report.automatedStatus;trial.finalSourceSha256=digest(await fs.readFile(source));await fs.copyFile(source,path.join(out,'after.css'));await exportHtmlBundle(path.join(root,config.reportDir,'report.json'),path.join(out,'review')).catch(async()=>fs.writeFile(path.join(out,'after.json'),JSON.stringify(report,null,2)+'\n'));
 }catch(e){trial.error=e.message;trial.status='ERROR';stopped='Experiment infrastructure failed; remaining trials not run';}
 finally{if(server)await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:250});}
 if(await engineFingerprint()!==initialEngineFingerprint){stopped='Detector implementation changed during the experiment; invalidate this run';trial.status='invalid-experiment';}
 console.log(sample+' / '+arm+': '+trial.status+'; attempts='+trial.attempts.length);
}
const summary={schemaVersion:1,engineFingerprint:initialEngineFingerprint,engineUnchanged:await engineFingerprint()===initialEngineFingerprint,status:stopped?'ERROR':'completed',executor:{file:executor,version:version.stdout.trim(),modelSelection:'Installed CLI default, recorded from actual modelUsage; no model override'},fixtureTrials:4,executedTrials:trials.filter(t=>t.attempts.length).length,notRun:trials.filter(t=>t.status==='not-run').length,attemptBudget:2,perAttemptApiBudgetUsd:1,timeoutMs:180000,trials,arms:Object.fromEntries(['brief-only','structured-handoff'].map(arm=>{const rows=trials.filter(t=>t.arm===arm);return [arm,{requested:rows.length,executed:rows.filter(t=>t.attempts.length).length,repaired:rows.filter(t=>t.status==='repaired').length,executorErrors:rows.filter(t=>t.status==='executor-error').length,newBlockers:rows.flatMap(t=>t.attempts).reduce((n,a)=>n+(a.newBlockers?.length||0),0)}];})),limits:'Real file-tool agent executions on synthetic fixtures only; 2 samples per arm are not a statistical quality comparison. No independent human visual evaluation performed.'};
await fs.writeFile(path.join(archive,'study.json'),JSON.stringify(summary,null,2)+'\n');await fs.writeFile('artifacts/upstream-contracts/agent-study-latest.json',JSON.stringify({status:summary.status,report:path.relative(path.resolve('.'),path.join(archive,'study.json')).replaceAll('\\','/'),arms:summary.arms},null,2)+'\n');console.log(summary.status+': '+archive);if(stopped)process.exitCode=2;
