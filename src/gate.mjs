import {guidanceMarkdown} from './repair-guidance.mjs';
import {preservationResult} from './preservation.mjs';
import {digest} from './project-context.mjs';
import {loadProjectContext,surfaceGuidance} from './project-context.mjs';
import {reportExitCode} from './result-contract.mjs';
import {finalizeHandoff,reproductionMarkdown,handoffEvidenceMarkdown} from './handoff.mjs';
import {renderOfflineReport} from './offline-report.mjs';
import {summarizeVisual} from './visual.mjs';
import {visualComparisonMarkdown} from './visual-reporting.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {resolveInside,browserRoutes} from './config.mjs';
import {realStatic,realBrowser,screenshots} from './execute.mjs';
import {identify,toMarkdown} from './normalize.mjs';
import {groupedHandoff,groupFindings,reportDiff,ariaDiff,ariaReviewSummary,ariaReviewDetails,compactCoverage,visualReviewPacket} from './reporting.mjs';
import {gitChangedLines,touchesChanged} from './changed.mjs';
import {loadValueExceptions,matchValueException} from './value-exceptions.mjs';
import {pruneAriaSnapshots,explainAriaDiff} from './aria-evidence.mjs';
import {comparisonContexts,comparisonUnavailable} from './comparison.mjs';
import {atomicWrite,completeImageRun,linkImageEvidence,pruneImageEvidence} from './image-evidence.mjs';

export async function runGate({root,config,configFile,staticRunner=realStatic,browserRunner=realBrowser,captureRunner=screenshots,writeReports=true,changedOnly=false,baseRef}){
 const runId=randomUUID();
 const projectContext=await loadProjectContext(config,root);
 const routes=config.browser.enabled?browserRoutes(config):[];
 const reviewedValues=await loadValueExceptions(config,root);
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
 const contexts=await comparisonContexts(config,routes,root,reviewedValues);
 const comparisonContext=contexts.findings;
 let browserReference;
 if(changedOnly){
  try{browserReference=JSON.parse(await fs.readFile(path.join(dir,'last-full-report.json'),'utf8'));}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}
  if(!browserReference&&previous?.scope?.mode==='full')browserReference=previous;
 }
 const referenceReason=changedOnly?comparisonUnavailable(browserReference,contexts,'browserDebt',{full:true}):'Full checks do not suppress existing browser debt';
 const referenceIds=new Set(!referenceReason?browserReference.findings.filter(f=>f.engine==='lintapple'&&f.baselineEligible&&!f.advisory).map(f=>f.id):[]);
 const changed=changedOnly?await gitChangedLines(root,{base:baseRef}):null;
 const stages=[],all=[],rawBrowser=[],artifacts=[],captures=[],imageArtifacts=[],ariaSnapshots=[],renderedMetrics=[],visualEntries=[],preservationEntries=[];
 const inConfiguredTargets=file=>config.static.targets.some(target=>{
  const relative=path.relative(root,resolveInside(root,target,'static.targets')).replaceAll(path.sep,'/');
  return !relative||file===relative||file.startsWith(relative+'/');
 });
 const partialStatic=changed?{...config,static:{...config.static,targets:[...changed.keys()].filter(f=>inConfiguredTargets(f)&&/\.(css|scss|less|[cm]?[jt]sx?|vue|svelte|html)$/.test(f)&&!/(^|\/)(node_modules|dist|build|artifacts)\//.test(f))}}:config;
 for(const [engine,enabled,runner,enforcement] of [['suta',config.static.enabled,staticRunner,config.static.enforcement],['lintapple',config.browser.enabled,browserRunner,config.browser.enforcement]]){
  if(!enabled){stages.push({engine,status:'not-covered',enforcement});continue;}
  try{
   const runnerConfig=engine==='suta'?partialStatic:{...config,visual:config.visual?{...config.visual,enabled:config.visual.enabled&&writeReports}:undefined,browser:{...config.browser,captureScreenshots:config.browser.captureScreenshots&&writeReports,captureAriaSnapshots:!!config.browser.captureAriaSnapshots&&writeReports}};
   const run=engine==='suta'&&changed&&!partialStatic.static.targets.length?{findings:[],stats:{files:0},scope:'no changed source files'}:await runner(runnerConfig,root,{evidenceRunId:runId});
   if(!Array.isArray(run.findings))throw Error('Engine result missing findings array');
   const findings=engine==='suta'&&changed?run.findings.filter(f=>touchesChanged(f,changed)):run.findings;
   all.push(...findings);
   if(engine==='lintapple'&&run.rawReport)rawBrowser.push(run.rawReport);
   artifacts.push(...run.artifacts||[]);captures.push(...run.captures||[]);
   imageArtifacts.push(...run.imageArtifacts||[]);
   ariaSnapshots.push(...run.ariaSnapshots||[]);renderedMetrics.push(...run.renderedMetrics||[]);visualEntries.push(...run.visualEntries||[]);preservationEntries.push(...run.preservationEntries||[]);
   stages.push({engine,status:run.errors?.length?'error':run.scope==='no changed source files'?'no-changes':findings.length?'findings':'complete',error:run.errors?.map(e=>e.error).join('; ')||undefined,inspectionScope:run.inspectionScope,routeResults:run.routeResults,enforcement,count:findings.length,ruleCoverage:run.ruleCoverage||[],capturesIntegrated:!!run.capturesIntegrated,budgets:run.budgets,routes:run.rawReport?.routes,clickListenerCoverage:run.rawReport?.runs.flatMap(r=>(r.states||[]).map(s=>({route:r.route,viewport:r.viewport,colorScheme:r.colorScheme,state:s.name,...s.clickListenerCoverage})))});
  }catch(e){stages.push({engine,status:'error',enforcement,error:e.message});}
 }
 let preservation;
 try{preservation=await preservationResult(config,root,preservationEntries,digest({browser:contexts.browserDebt,context:projectContext.compatibility??null}));}catch(e){preservation={enabled:true,enforcement:config.preservation.enforcement,status:'error',reason:e.message,entries:preservationEntries};}
 if(preservation.enabled)stages.push({engine:'preservation',status:preservation.status==='error'?'error':'complete',error:preservation.status==='error'?preservation.reason:undefined,enforcement:preservation.enforcement});
 const preservationIncomplete=preservation.enabled&&preservation.enforcement==='enforce'&&['needs-reference','not-comparable'].includes(preservation.status);
 const preservationFailure=preservation.enabled&&preservation.enforcement==='enforce'&&preservation.changes?.length>0;
 const visual=summarizeVisual(config,visualEntries,{error:config.visual?.enabled?(!writeReports?'Visual comparison requires report writing':stages.some(s=>s.engine==='lintapple'&&s.status==='error')?'Browser inspection did not complete':undefined):undefined});
 if(visual.enabled)stages.push({engine:'visual',status:visual.status==='error'?'error':'complete',visualStatus:visual.status,enforcement:visual.mode,count:visual.entries.length,error:visual.status==='error'?(visual.reason||visual.entries.find(e=>e.status==='error')?.reason):undefined});
 const visualIncomplete=visual.enabled&&visual.mode==='enforce'&&(visual.counts['needs-baseline']>0||visual.counts['not-comparable']>0);
 const visualFailure=visual.enabled&&visual.mode==='enforce'&&visual.counts.different>0;
 const marked=identify(all).map(f=>({...f,baselined:f.baselineEligible&&baseline.has(f.id),existingBrowserDebt:!!changedOnly&&f.engine==='lintapple'&&f.baselineEligible&&referenceIds.has(f.id)}));
 for(const f of marked){const exception=matchValueException(f,reviewedValues.exceptions);if(exception)f.reviewedException={...exception};}
 const warnings=marked.filter(f=>f.engine==='suta'&&f.severity==='warning'&&!f.baselined).length;
 const blockers=marked.filter(f=>!f.advisory&&!f.reviewedException&&!f.baselined&&!f.existingBrowserDebt&&(f.engine==='lintapple'&&config.browser.enforcement==='enforce'||f.engine==='suta'&&config.static.enforcement==='enforce'&&(f.severity==='error'||config.gate.maxStaticWarnings!==null&&warnings>config.gate.maxStaticWarnings&&f.severity==='warning')));
 for(const finding of marked)finding.blocking=blockers.includes(finding);
 const infra=stages.some(s=>s.status==='error'),covered=stages.every(s=>s.status!=='not-covered');
 const automatedStatus=infra?'ERROR':!covered||visualIncomplete||preservationIncomplete?'INCOMPLETE':blockers.length||visualFailure||preservationFailure?'FAIL':changedOnly?'SCOPED_PASS':'PASS';
 const untested=stages.flatMap(s=>s.ruleCoverage||[]).filter(c=>c.status!=='tested');
 const coverageNote=untested.length?`${untested.length} rule/run/state checks have no targets or unknown coverage. Automated PASS does not cover these rules; add contracts where applicable and rerun.`:'';
 const handoff=infra?'Fix the tool/environment error and rerun full QA.':visualIncomplete?'Review the missing approved visual baseline or incompatible environment; full QA is incomplete.':visualFailure&&!blockers.length?'Review actual/expected/diff images and fix visual regressions; approve new baselines only after explicit review.':!covered?'Enable both required checkers and rerun full QA.':changedOnly?'Changed-line static scope; browser findings cover the whole page. Previously observed browser debt from a matching full report is listed separately, not saved to a baseline. This is not a full QA PASS. Run a full check before approval.':blockers.length?`Fix ${blockers.length} new blocking finding(s) by root cause, preserve SOT art direction, then rerun. Never weaken policy or add suppressions automatically.`:'Executed checks have no new enforced findings. Human visual/UX review remains necessary.';
 const scope={mode:changedOnly?'changed-only':'full',static:changedOnly?'git changed lines':'all configured targets',browser:'all configured routes and interaction plans',routes:routes.map(({name,url})=>({name,url})),baseRef:baseRef||null};
 const currentReason=infra||!covered||visualIncomplete||preservationIncomplete?'Current report did not complete required checks':null;
 const findingReason=currentReason||comparisonUnavailable(previous,contexts,'findings',{scope});
 const ariaReason=currentReason||comparisonUnavailable(previous,contexts,'aria',{scope});
 const result={fingerprintVersion:2,comparisonContext,comparisonContexts:contexts,browserReference:{status:!referenceReason?'matching-full-report':'none',reason:referenceReason,existingDebt:marked.filter(f=>f.existingBrowserDebt).length},version:'0.3.0',generatedAt:new Date().toISOString(),project:config.name,preset:config.preset,visual,locale:config.locale||'en-US',scope,automatedStatus,status:automatedStatus==='PASS'&&(config.gate.manualVisualReview||visual.reviewRequired||preservation.reviewRequired)?'REVIEW_REQUIRED':automatedStatus,manualVisualReview:config.gate.manualVisualReview,summary:{total:marked.length,blockers:blockers.length,visualDifferences:visual.counts?.different||0,visualPending:(visual.counts?.['needs-baseline']||0)+(visual.counts?.['not-comparable']||0),baselined:marked.filter(f=>f.baselined).length,existingBrowserDebt:marked.filter(f=>f.existingBrowserDebt).length},stages,findings:marked,groups:groupFindings(marked).map(({findings,...g})=>({...g,ids:findings.map(f=>f.id)})),diff:reportDiff(findingReason?null:previous,marked,findingReason),coverageNote,handoff:handoff+(coverageNote?' '+coverageNote:''),artifacts,captures};
 Object.assign(result,{preservation,projectContext,surfaceGuidance:surfaceGuidance(projectContext),runId,imageArtifacts,ariaSnapshots,renderedMetrics,ariaDiff:ariaDiff(ariaReason?null:previous,ariaSnapshots,ariaReason),reviewedValueExceptions:reviewedValues.exceptions});
 if(preservationFailure)result.handoff='Fix functional preservation changes and rerun full QA. Do not approve a new reference to hide a regression.';
 else if(preservationIncomplete)result.handoff='Review missing or incompatible preservation reference; requested full QA is incomplete.';
 result.summary.preservationChanges=preservation.changes?.length||0;
 linkImageEvidence(marked,captures);
 result.summary.reviewedExceptions=marked.filter(f=>f.reviewedException).length;
 if(writeReports){
  await fs.mkdir(dir,{recursive:true});
  // Explicit injected legacy capture runners remain testable; real runs capture in the audit session.
  if(config.browser.enabled&&config.browser.captureScreenshots&&!stages.some(s=>s.engine==='lintapple'&&(s.status==='error'||s.capturesIntegrated))){
   try{result.artifacts.push(...await captureRunner(config,root,dir));}catch(e){result.automatedStatus=result.status='ERROR';result.stages.push({engine:'screenshots',status:'error',error:e.message,enforcement:'enforce'});result.handoff='Screenshot evidence capture failed. Fix and rerun; do not approve.';}
  }
  if(['ERROR','INCOMPLETE'].includes(result.automatedStatus))result.ariaDiff=ariaDiff(null,ariaSnapshots,'Current report did not complete required checks');
  await explainAriaDiff(dir,result.ariaDiff);
  await finalizeHandoff(result,{root,config,configFile,changedOnly,baseRef});
  const complete=!['ERROR','INCOMPLETE'].includes(result.automatedStatus);
  if(previous)await atomicWrite(path.join(dir,'previous-report.json'),JSON.stringify(previous,null,2)+'\n');
  await atomicWrite(path.join(dir,'report.json'),JSON.stringify(result,null,2)+'\n');
  if(!changedOnly&&complete)await atomicWrite(path.join(dir,'last-full-report.json'),JSON.stringify(result,null,2)+'\n');
  await atomicWrite(path.join(dir,'image-artifacts.json'),JSON.stringify({schemaVersion:1,runId,images:imageArtifacts},null,2)+'\n');
  await completeImageRun(dir,runId);
  // Keep current and previous evidence, plus the last-full reference used by scoped checks.
  let fullReference;if(changedOnly||!complete){try{fullReference=JSON.parse(await fs.readFile(path.join(dir,'last-full-report.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}}
  let retainedPrevious=previous;
  if(!retainedPrevious){try{retainedPrevious=JSON.parse(await fs.readFile(path.join(dir,'previous-report.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}}
  try{result.ariaRetention=await pruneAriaSnapshots(dir,[result,retainedPrevious,fullReference]);}catch(e){result.ariaRetention={status:'error',error:e.message};}
  try{result.imageRetention=await pruneImageEvidence(dir,[result,retainedPrevious,fullReference]);}catch(e){result.imageRetention={status:'error',error:e.message};}
  await atomicWrite(path.join(dir,'report.json'),JSON.stringify(result,null,2)+'\n');
  await atomicWrite(path.join(dir,'report.html'),renderOfflineReport(result));
  await atomicWrite(path.join(dir,'handoff.json'),JSON.stringify(result.handoffDetails,null,2)+'\n');
  await atomicWrite(path.join(dir,'PRESERVATION_REVIEW.json'),JSON.stringify(preservation,null,2)+'\n');
  await atomicWrite(path.join(dir,'report.md'),toMarkdown(result)+'\n\n'+guidanceMarkdown(result.repairGuidance)+'\n\n## Context and preservation\n\nSurface guidance and declared references: report.json. Preservation: '+preservation.status+'; changes='+String(preservation.changes?.length||0)+'. Details: PRESERVATION_REVIEW.json.\n\n## Visual image comparison\n\n'+visualComparisonMarkdown(visual)+'\n\n## ARIA structure evidence\n\n'+ariaReviewSummary(result.ariaDiff)+'\n\n'+ariaReviewDetails(result.ariaDiff)+'\n\nSnapshot retention: '+result.ariaRetention.status+'; removed='+String(result.ariaRetention.removed??'unknown')+(result.ariaRetention.error?' — '+result.ariaRetention.error:'')+'\n\nImage retention: '+result.imageRetention.status+'; removed runs='+String(result.imageRetention.removedRuns??'unknown')+'; details in report.json.\n');
  if(rawBrowser.length)await atomicWrite(path.join(dir,'lintapple.raw.json'),JSON.stringify(rawBrowser[0],null,2)+'\n');
  else await fs.rm(path.join(dir,'lintapple.raw.json'),{force:true});
  const diff=result.diff.status==='compared'?`Compared to previous run: resolved=${result.diff.resolved.length}, added=${result.diff.added.length}, persisting=${result.diff.persisting.length}. Full identities and locations: report.json.\n\n`:`Previous findings comparison unavailable: ${result.diff.reason}.\n\n`;
  await atomicWrite(path.join(dir,'AGENT_HANDOFF.md'),`# UI QA agent handoff\n\n${result.handoff}\n\nPreservation: ${preservation.status}; changes=${preservation.changes?.length||0}. Full contracts and evidence: handoff.json/report.json.\n\n${reproductionMarkdown(result)}\n\n${handoffEvidenceMarkdown(result)}\n\n${visualComparisonMarkdown(visual,{limit:3})}\n\n${diff}${result.browserReference.existingDebt?`Existing browser debt outside the static edit scope: ${result.browserReference.existingDebt}; see report.json. No baseline was written.\n\n`:''}ARIA structure comparison (advisory): ${result.ariaDiff.status}; changed=${result.ariaDiff.changed.length}, added=${result.ariaDiff.added.length}, removed=${result.ariaDiff.removed.length}. Snapshot files and exact dimensions: report.json.\n\n${ariaReviewDetails(result.ariaDiff,{maxComparisons:2,maxBytes:6000})}\n\nImage evidence: ${imageArtifacts.length} images; immutable paths, hashes and byte counts in image-artifacts.json. Each browser finding's imageEvidence links its state image and available matching crop.\n\n## Rule coverage\n\n${compactCoverage(stages)||'- No rendered rule counters returned'}\n\n${guidanceMarkdown(result.repairGuidance)}\n\n## Fix root causes\n\n${groupedHandoff(marked)||'- No new automated findings'}\n\nUse report.json for every affected target. Respect the project SOT; do not hide failed checks.\n`);
  await atomicWrite(path.join(dir,'VISUAL_REVIEW.md'),visualReviewPacket(result)+'\n## Automated image comparison\n\n'+visualComparisonMarkdown(visual)+'\n## Structure and rendered heuristics\n\n'+ariaReviewSummary(result.ariaDiff)+'\n\nRendered metrics (advisory only): '+renderedMetrics.length+' route/viewport/theme/state observations. See report.json for target counts, duplicate actions and approximate chromatic hue buckets. These are design-review evidence, not proven violations.\n');
 }else await finalizeHandoff(result,{root,config,configFile,changedOnly,baseRef});
 return result;
}
export const exitCode=reportExitCode;
export async function baselineFromReport(reportFile,outFile){
 const raw=JSON.parse(await fs.readFile(reportFile,'utf8'));
 if(['ERROR','INCOMPLETE'].includes(raw.automatedStatus))throw Error('Invalid report for baseline: required routes/checkers must complete a full run');
 if(raw.fingerprintVersion!==2||raw.scope?.mode==='changed-only'||!Array.isArray(raw.findings)||raw.findings.some(f=>typeof f.id!=='string'||f.fingerprintVersion!==2))throw Error('Invalid report for baseline: use a full fingerprint v2 report');
 const eligible=f=>f.baselineEligible===true&&!f.advisory&&!f.reviewedException;
 const ids=[...new Set(raw.findings.filter(eligible).map(f=>f.id))].sort();
 await fs.writeFile(outFile,JSON.stringify({schemaVersion:2,excludedFindings:raw.findings.filter(f=>!eligible(f)).length,createdAt:new Date().toISOString(),ids},null,2)+'\n',{flag:'wx'});
 return ids.length;
}
