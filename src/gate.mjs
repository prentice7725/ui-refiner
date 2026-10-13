import fs from 'node:fs/promises';
import path from 'node:path';
import {resolveInside,checkUrl} from './config.mjs';
import {realStatic,realBrowser,screenshots} from './execute.mjs';
import {identify,toMarkdown} from './normalize.mjs';

export async function runGate({root,config,staticRunner=realStatic,browserRunner=realBrowser,captureRunner=screenshots,writeReports=true}){
  // Validate host even if the browser runner is mocked: no accidental external navigation.
  if(config.browser.enabled)checkUrl(config.browser.url,config.gate.allowedHosts);
  if(config.sot.path)await fs.access(resolveInside(root,config.sot.path,'sot.path'));
  let baseline=new Set();
  if(config.gate.baselinePath){
    const file=resolveInside(root,config.gate.baselinePath,'gate.baselinePath');
    const raw=JSON.parse(await fs.readFile(file,'utf8'));
    if(raw.schemaVersion!==1||!Array.isArray(raw.ids)||raw.ids.some(id=>typeof id!=='string'))throw new Error('Invalid baseline: schemaVersion=1 and ids[] required');
    baseline=new Set(raw.ids);
  }
  const stages=[],all=[],rawBrowser=[];
  for(const [engine,enabled,runner,enforcement] of [['suta',config.static.enabled,staticRunner,config.static.enforcement],['lintapple',config.browser.enabled,browserRunner,config.browser.enforcement]]){
    if(!enabled){stages.push({engine,status:'not-covered',enforcement});continue;}
    try{
      const result=await runner(config,root);
      if(!Array.isArray(result.findings))throw new Error('Engine result missing findings array');
      all.push(...result.findings);
      if(engine==='lintapple'&&result.rawReport)rawBrowser.push(result.rawReport);
      stages.push({engine,status:result.findings.length?'findings':'complete',enforcement,count:result.findings.length});
    }catch(e){stages.push({engine,status:'error',enforcement,error:e.message});}
  }
  const marked=identify(all).map(f=>({...f,baselined:baseline.has(f.id)}));
  const warnCount=marked.filter(f=>f.engine==='suta'&&f.severity==='warning'&&!f.baselined).length;
  const blockers=marked.filter(f=>!f.baselined && (f.engine==='lintapple'&&config.browser.enforcement==='enforce'||f.engine==='suta'&&config.static.enforcement==='enforce'&&(f.severity==='error'||(config.gate.maxStaticWarnings!==null&&warnCount>config.gate.maxStaticWarnings&&f.severity==='warning'))));
  const infra=stages.some(s=>s.status==='error');
  const coverage=stages.every(s=>s.status!=='not-covered');
  const automatedStatus=infra?'ERROR':!coverage?'INCOMPLETE':blockers.length?'FAIL':'PASS';
  const status=automatedStatus==='PASS'&&config.gate.manualVisualReview?'REVIEW_REQUIRED':automatedStatus;
  const handoff=infra?'Do not claim success. Fix the tool/environment error; rerun full QA.':!coverage?'A required web-app checker is disabled. Enable it and rerun before claiming automated PASS.':blockers.length?`Fix ${blockers.length} new blocking finding(s), preserve SOT art direction, then rerun. Never automatically weaken the UI policy or add suppressions.`:'Automated rules are clear. A human should still inspect information hierarchy, art fidelity, screenshots, and actual user flows.';
  const result={version:'0.2.1',generatedAt:new Date().toISOString(),project:config.name,preset:config.preset,automatedStatus,status,manualVisualReview:config.gate.manualVisualReview,summary:{total:marked.length,blockers:blockers.length,baselined:marked.filter(x=>x.baselined).length},stages,findings:marked,handoff,artifacts:[]};
  if(writeReports){
    const reportDir=resolveInside(root,config.reportDir,'reportDir');await fs.mkdir(reportDir,{recursive:true});
    if(config.browser.enabled && config.browser.captureScreenshots && !stages.some(s=>s.engine==='lintapple'&&s.status==='error')){
      try{result.artifacts.push(...await captureRunner(config,root,reportDir))}
      catch(e){result.automatedStatus='ERROR';result.status='ERROR';result.stages.push({engine:'screenshots',status:'error',error:e.message,enforcement:'enforce'});result.handoff='Screenshot evidence capture failed. Fix and rerun; do not approve.';}
    }
    await fs.writeFile(path.join(reportDir,'report.json'),JSON.stringify(result,null,2)+'\n');
    await fs.writeFile(path.join(reportDir,'report.md'),toMarkdown(result));
    if(rawBrowser.length)await fs.writeFile(path.join(reportDir,'lintapple.raw.json'),JSON.stringify(rawBrowser[0],null,2)+'\n');
    const todo=marked.filter(f=>!f.baselined).map(f=>`- [ ] ${f.engine}/${f.rule} ${f.location}: ${f.fix}`).join('\n');
    await fs.writeFile(path.join(reportDir,'AGENT_HANDOFF.md'),`# UI QA agent handoff\n\n${result.handoff}\n\n${todo||'- No new automated findings'}\n\nRespect the project SOT, do not modify its source files merely to satisfy a generic lint rule, and do not hide failed checks.\n`);
  }
  return result;
}
export function exitCode(report){return report.automatedStatus==='ERROR'||report.automatedStatus==='INCOMPLETE'?2:report.automatedStatus==='FAIL'?1:0;}
export async function baselineFromReport(reportFile,outFile){
  const raw=JSON.parse(await fs.readFile(reportFile,'utf8'));
  if(!Array.isArray(raw.findings)||raw.findings.some(f=>typeof f.id!=='string'))throw new Error('Invalid report for baseline');
  const ids=[...new Set(raw.findings.map(x=>x.id))].sort();
  await fs.writeFile(outFile,JSON.stringify({schemaVersion:1,createdAt:new Date().toISOString(),ids},null,2)+'\n',{flag:'wx'});
  return ids.length;
}
