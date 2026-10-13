import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {resolveInside,checkUrl} from './config.mjs';
import {realStatic,realBrowser,screenshots} from './execute.mjs';
import {identify,toMarkdown} from './normalize.mjs';
import {groupedHandoff,groupFindings,reportDiff,compactCoverage,visualReviewPacket} from './reporting.mjs';
import {gitChangedLines,touchesChanged} from './changed.mjs';

export async function runGate({root,config,staticRunner=realStatic,browserRunner=realBrowser,captureRunner=screenshots,writeReports=true,changedOnly=false,baseRef}){
 if(config.browser.enabled)checkUrl(config.browser.url,config.gate.allowedHosts);
 if(config.sot.path)await fs.access(resolveInside(root,config.sot.path,'sot.path'));
 const dir=resolveInside(root,config.reportDir,'reportDir');
 let previous;
 try{previous=JSON.parse(await fs.readFile(path.join(dir,'report.json'),'utf8'));}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}
 let baseline=new Set();
 if(config.gate.baselinePath){
  const raw=JSON.parse(await fs.readFile(resolveInside(root,config.gate.baselinePath,'gate.baselinePath'),'utf8'));
  if(raw.schemaVersion!==2||!Array.isArray(raw.ids)||raw.ids.some(id=>typeof id!=='string'))throw Error('Invalid baseline: schemaVersion=2 and ids[] required; recreate v1 baselines from a fresh v2 report');
  baseline=new Set(raw.ids);
 }
 const comparisonContext=createHash('sha256').update(JSON.stringify([config.browser.url,config.locale||'en-US',await fs.readFile(resolveInside(root,config.browser.policyPath,'browser.policyPath'),'utf8').catch(()=>null),config.browser.interactionsPath?await fs.readFile(resolveInside(root,config.browser.interactionsPath,'browser.interactionsPath'),'utf8').catch(()=>null):null])).digest('hex');
 let browserReference;
 if(changedOnly){
  try{browserReference=JSON.parse(await fs.readFile(path.join(dir,'last-full-report.json'),'utf8'));}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}
  if(!browserReference&&previous?.scope?.mode==='full')browserReference=previous;
 }
 const referenceIds=new Set(browserReference?.fingerprintVersion===2&&browserReference?.comparisonContext===comparisonContext?browserReference.findings.filter(f=>f.engine==='lintapple'&&f.baselineEligible).map(f=>f.id):[]);
 const changed=changedOnly?await gitChangedLines(root,{base:baseRef}):null;
 const stages=[],all=[],rawBrowser=[],artifacts=[],captures=[];
 const inConfiguredTargets=file=>config.static.targets.some(target=>{
  const relative=path.relative(root,resolveInside(root,target,'static.targets')).replaceAll(path.sep,'/');
  return !relative||file===relative||file.startsWith(relative+'/');
 });
 const partialStatic=changed?{...config,static:{...config.static,targets:[...changed.keys()].filter(f=>inConfiguredTargets(f)&&/\.(css|scss|less|[cm]?[jt]sx?|vue|svelte|html)$/.test(f)&&!/(^|\/)(node_modules|dist|build|artifacts)\//.test(f))}}:config;
 for(const [engine,enabled,runner,enforcement] of [['suta',config.static.enabled,staticRunner,config.static.enforcement],['lintapple',config.browser.enabled,browserRunner,config.browser.enforcement]]){
  if(!enabled){stages.push({engine,status:'not-covered',enforcement});continue;}
  try{
   const runnerConfig=engine==='suta'?partialStatic:{...config,browser:{...config.browser,captureScreenshots:config.browser.captureScreenshots&&writeReports}};
   const run=engine==='suta'&&changed&&!partialStatic.static.targets.length?{findings:[],stats:{files:0},scope:'no changed source files'}:await runner(runnerConfig,root);
   if(!Array.isArray(run.findings))throw Error('Engine result missing findings array');
   const findings=engine==='suta'&&changed?run.findings.filter(f=>touchesChanged(f,changed)):run.findings;
   all.push(...findings);
   if(engine==='lintapple'&&run.rawReport)rawBrowser.push(run.rawReport);
   artifacts.push(...run.artifacts||[]);captures.push(...run.captures||[]);
   stages.push({engine,status:run.scope==='no changed source files'?'no-changes':findings.length?'findings':'complete',enforcement,count:findings.length,ruleCoverage:run.ruleCoverage||[],capturesIntegrated:!!run.capturesIntegrated,budgets:run.budgets,clickListenerCoverage:run.rawReport?.runs.flatMap(r=>(r.states||[]).map(s=>({viewport:r.viewport,colorScheme:r.colorScheme,state:s.name,...s.clickListenerCoverage})))});
  }catch(e){stages.push({engine,status:'error',enforcement,error:e.message});}
 }
 const marked=identify(all).map(f=>({...f,baselined:f.baselineEligible&&baseline.has(f.id),existingBrowserDebt:!!changedOnly&&f.engine==='lintapple'&&f.baselineEligible&&referenceIds.has(f.id)}));
 const warnings=marked.filter(f=>f.engine==='suta'&&f.severity==='warning'&&!f.baselined).length;
 const blockers=marked.filter(f=>!f.baselined&&!f.existingBrowserDebt&&(f.engine==='lintapple'&&config.browser.enforcement==='enforce'||f.engine==='suta'&&config.static.enforcement==='enforce'&&(f.severity==='error'||config.gate.maxStaticWarnings!==null&&warnings>config.gate.maxStaticWarnings&&f.severity==='warning')));
 const infra=stages.some(s=>s.status==='error'),covered=stages.every(s=>s.status!=='not-covered');
 const automatedStatus=infra?'ERROR':!covered?'INCOMPLETE':blockers.length?'FAIL':changedOnly?'SCOPED_PASS':'PASS';
 const untested=stages.flatMap(s=>s.ruleCoverage||[]).filter(c=>c.status!=='tested');
 const coverageNote=untested.length?`${untested.length} rule/run/state checks have no targets or unknown coverage. Automated PASS does not cover these rules; add contracts where applicable and rerun.`:'';
 const handoff=infra?'Fix the tool/environment error and rerun full QA.':!covered?'Enable both required checkers and rerun full QA.':changedOnly?'Changed-line static scope; browser findings cover the whole page. Previously observed browser debt from a matching full report is listed separately, not saved to a baseline. This is not a full QA PASS. Run a full check before approval.':blockers.length?`Fix ${blockers.length} new blocking finding(s) by root cause, preserve SOT art direction, then rerun. Never weaken policy or add suppressions automatically.`:'Executed checks have no new enforced findings. Human visual/UX review remains necessary.';
 const scope={mode:changedOnly?'changed-only':'full',static:changedOnly?'git changed lines':'all configured targets',browser:'entire configured page and interaction plan',baseRef:baseRef||null};
 const comparable=previous?.scope?.mode===scope.mode&&previous?.scope?.baseRef===scope.baseRef||!previous?.scope&&!changedOnly;
 const result={fingerprintVersion:2,comparisonContext,browserReference:{status:referenceIds.size?'matching-full-report':'none',existingDebt:marked.filter(f=>f.existingBrowserDebt).length},version:'0.3.0',generatedAt:new Date().toISOString(),project:config.name,preset:config.preset,locale:config.locale||'en-US',scope,automatedStatus,status:automatedStatus==='PASS'&&config.gate.manualVisualReview?'REVIEW_REQUIRED':automatedStatus,manualVisualReview:config.gate.manualVisualReview,summary:{total:marked.length,blockers:blockers.length,baselined:marked.filter(f=>f.baselined).length,existingBrowserDebt:marked.filter(f=>f.existingBrowserDebt).length},stages,findings:marked,groups:groupFindings(marked).map(({findings,...g})=>({...g,ids:findings.map(f=>f.id)})),diff:reportDiff(comparable?previous:null,marked),coverageNote,handoff:handoff+(coverageNote?' '+coverageNote:''),artifacts,captures};
 if(writeReports){
  await fs.mkdir(dir,{recursive:true});
  // Explicit injected legacy capture runners remain testable; real runs capture in the audit session.
  if(config.browser.enabled&&config.browser.captureScreenshots&&!stages.some(s=>s.engine==='lintapple'&&(s.status==='error'||s.capturesIntegrated))){
   try{result.artifacts.push(...await captureRunner(config,root,dir));}catch(e){result.automatedStatus=result.status='ERROR';result.stages.push({engine:'screenshots',status:'error',error:e.message,enforcement:'enforce'});result.handoff='Screenshot evidence capture failed. Fix and rerun; do not approve.';}
  }
  if(!changedOnly&&!infra&&covered)await fs.writeFile(path.join(dir,'last-full-report.json'),JSON.stringify(result,null,2)+'\n');
  if(previous)await fs.writeFile(path.join(dir,'previous-report.json'),JSON.stringify(previous,null,2)+'\n');
  await fs.writeFile(path.join(dir,'report.json'),JSON.stringify(result,null,2)+'\n');
  await fs.writeFile(path.join(dir,'report.md'),toMarkdown(result));
  if(rawBrowser.length)await fs.writeFile(path.join(dir,'lintapple.raw.json'),JSON.stringify(rawBrowser[0],null,2)+'\n');
  else await fs.rm(path.join(dir,'lintapple.raw.json'),{force:true});
  const diff=result.diff.status==='compared'?`Compared to previous run: resolved=${result.diff.resolved.length}, added=${result.diff.added.length}, persisting=${result.diff.persisting.length}. Full identities and locations: report.json.\n\n`:'';
  await fs.writeFile(path.join(dir,'AGENT_HANDOFF.md'),`# UI QA agent handoff\n\n${result.handoff}\n\n${diff}${result.browserReference.existingDebt?`Existing browser debt outside the static edit scope: ${result.browserReference.existingDebt}; see report.json. No baseline was written.\n\n`:''}## Rule coverage\n\n${compactCoverage(stages)||'- No rendered rule counters returned'}\n\n## Fix root causes\n\n${groupedHandoff(marked)||'- No new automated findings'}\n\nUse report.json for every affected target. Respect the project SOT; do not hide failed checks.\n`);
  await fs.writeFile(path.join(dir,'VISUAL_REVIEW.md'),visualReviewPacket(result));
 }
 return result;
}
export function exitCode(report){return ['ERROR','INCOMPLETE'].includes(report.automatedStatus)?2:report.automatedStatus==='FAIL'?1:report.automatedStatus==='SCOPED_PASS'?3:0;}
export async function baselineFromReport(reportFile,outFile){
 const raw=JSON.parse(await fs.readFile(reportFile,'utf8'));
 if(raw.fingerprintVersion!==2||raw.scope?.mode==='changed-only'||!Array.isArray(raw.findings)||raw.findings.some(f=>typeof f.id!=='string'||f.fingerprintVersion!==2))throw Error('Invalid report for baseline: use a full fingerprint v2 report');
 const ids=[...new Set(raw.findings.filter(f=>f.baselineEligible===true).map(f=>f.id))].sort();
 await fs.writeFile(outFile,JSON.stringify({schemaVersion:2,excludedFindings:raw.findings.filter(f=>f.baselineEligible!==true).length,createdAt:new Date().toISOString(),ids},null,2)+'\n',{flag:'wx'});
 return ids.length;
}
