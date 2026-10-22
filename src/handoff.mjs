import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {browserRoutes} from './config.mjs';
import {createHash} from 'node:crypto';
import {reportExitCode,safeRelative} from './result-contract.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const dim=(a,b)=>(a.routeKey??a.route??'default')===(b.routeKey??b.route??'default')&&(a.state||'initial')===(b.state||'initial')&&a.viewport?.width===b.viewport?.width&&a.viewport?.height===b.viewport?.height&&a.colorScheme===b.colorScheme;

async function sourceLocation(root,f){
 if(f.engine!=='suta')return {status:'unverified',reason:'Browser selector has no verified source mapping'};
 if(!safeRelative(f.file)||!Number.isInteger(f.line)||f.line<1)return {status:'unverified',reason:'Missing safe source file or positive line'};
 try{
  const base=await fs.realpath(root),file=path.resolve(base,f.file),actual=await fs.realpath(file),stat=await fs.lstat(file);
  if(!actual.startsWith(base+path.sep)||!stat.isFile()||stat.isSymbolicLink()||stat.size>10_000_000)throw Error('Source is outside project or not a bounded regular file');
  const bytes=await fs.readFile(file),lines=bytes.toString('utf8').split(/\r?\n/);
  if(f.line>lines.length)throw Error('Source line does not exist');
  if(f.sourceAnchor&&lines[f.line-1].trim()!==f.sourceAnchor)throw Error('Source anchor no longer matches reported line');
  return {status:'verified',file:f.file.replaceAll('\\','/'),line:f.line,sha256:hash(bytes),verification:'file and line read at audit time; anchor checked when provided'};
 }catch(e){return {status:'unverified',reason:e.code==='ENOENT'?'Source file not found':e.message};}
}
async function inputRecord(root,file,kind){
 if(!safeRelative(file))return {kind,file,status:'unavailable',reason:'No project-relative input path'};
 try{const target=path.resolve(root,file),base=await fs.realpath(root),actual=await fs.realpath(target),stat=await fs.stat(target);if(!actual.startsWith(base+path.sep)||!stat.isFile()||stat.size>10_000_000)throw Error('Input is not a bounded project file');return {kind,file,status:'captured',sha256:hash(await fs.readFile(target))};}
 catch(e){return {kind,file,status:'unavailable',reason:e.code==='ENOENT'?'Input file missing':e.message};}
}
export async function finalizeHandoff(report,{root,config,configFile,changedOnly,baseRef}){
 report.resultContractVersion=1;report.exitCode=reportExitCode(report);
 const configPath=configFile?path.relative(root,configFile).replaceAll(path.sep,'/'):'ui-refiner.config.json';
 const effectiveRoutes=config.browser.enabled?browserRoutes(config):[];
 const inputs=await Promise.all([[configPath,'config'],[config.browser.policyPath,'policy'],...[...new Set(effectiveRoutes.map(r=>r.interactionsPath).filter(Boolean))].map(p=>[p,'interactions'])].map(([file,kind])=>inputRecord(root,file,kind)));
 const args=[path.relative(root,fileURLToPath(new URL('../bin/ui-refiner.mjs',import.meta.url))).replaceAll(path.sep,'/'),'check','--config',configPath,...(config.browser.enabled?['--url',config.browser.url]:[]),...(changedOnly?['--changed-only']:[]),...(baseRef?['--base',baseRef]:[])];
 const saved=!!configFile&&inputs[0].status==='captured';
 report.reproduction={schemaVersion:1,cwd:'original project root (configuration directory)',configurationSource:saved?'saved project configuration':'in-memory; save configSnapshot in the project root first',executable:'node',args,commandReady:saved,powershell:["& 'node'",...args.map(a=>"'"+a.replaceAll("'","''")+"'")].join(' '),posix:['node',...args.map(a=>"'"+a.replaceAll("'","'\\''")+"'")].join(' '),configSnapshot:structuredClone(config),inputs,prerequisites:['Start the app at the recorded route URLs and prepare the same test data/authentication.','Install pinned dependencies and Chromium explicitly; the check does not download them.','Read the project SOT; adjust the relative tool installation path on another machine.']};
 for(const finding of report.findings)finding.sourceLocation=await sourceLocation(root,finding);
 Object.assign(report.reproduction,{effectiveRoutes,projectRootUri:pathToFileURL(path.resolve(root)+path.sep).href,reportDirectoryUri:pathToFileURL(path.resolve(root,config.reportDir)+path.sep).href});
 report.handoffDetails={schemaVersion:1,runId:report.runId,generatedAt:report.generatedAt,groups:report.groups,coverageNote:report.coverageNote,status:report.status,automatedStatus:report.automatedStatus,exitCode:report.exitCode,scope:report.scope,reproduction:report.reproduction,inspectionScope:report.stages.find(s=>s.engine==='lintapple')?.inspectionScope,targets:report.findings.map(f=>({id:f.id,engine:f.engine,rule:f.rule,blocking:!!f.blocking,advisory:!!f.advisory,baselined:!!f.baselined,existingBrowserDebt:!!f.existingBrowserDebt,reviewedException:f.reviewedException,sourceLocation:f.sourceLocation,file:f.file,line:f.line,route:f.route,routeUrl:f.routeUrl,routeKey:f.routeKey,state:f.state||'initial',viewport:f.viewport,colorScheme:f.colorScheme,selector:f.selector,actual:f.actual??f.message,expected:f.expected??f.fix,message:f.message,fix:f.fix,imageEvidence:f.imageEvidence||[],ariaEvidence:(report.ariaSnapshots||[]).filter(s=>f.engine==='lintapple'&&dim(s,f)).map(s=>({file:s.file,sha256:s.sha256,bytes:s.bytes})),visualEvidence:(report.visual?.entries||[]).filter(e=>f.engine==='lintapple'&&dim(e.dimensions,f)).map(e=>({status:e.status,actual:e.actual,expected:e.expected,diff:e.diff}))}))};
 return report;
}
const clip=value=>String(value??'').replace(/[\r\n]+/g,' ').slice(0,180);
export function reproductionMarkdown(report){
 const r=report.reproduction;if(!r)return 'Reproduction metadata unavailable in this older report.';
 // JSON arguments stay data even when URLs or paths contain shell syntax.
 return `## Reproduce\n\nScope: ${clip(report.scope.mode)}; status: ${report.status}; exit code: ${report.exitCode}.\n\n${r.commandReady?'Run from the original project root.':'Configuration was supplied in memory. Save reproduction.configSnapshot in the original project root before running; this recipe is not yet executable as recorded.'}\n\nExecutable: node; arguments (JSON array):\n\n${fence(JSON.stringify(r.args,null,2),'json')}\n\nPrerequisites: ${r.prerequisites.join(' ')}\n\nInput hashes and effective configuration: report.json reproduction. PowerShell/POSIX commands are recorded there.\n`;
}
function fence(value,language=''){let n=3;for(const m of value.matchAll(/`+/g))n=Math.max(n,m[0].length+1);const mark='`'.repeat(n);return mark+language+'\n'+value+'\n'+mark;}
export function handoffEvidenceMarkdown(report,{maxBytes=3200,maxTargets=4}={}){
 const targets=(report.handoffDetails?.targets||[]).filter(t=>!t.baselined&&!t.existingBrowserDebt&&!t.reviewedException).sort((a,b)=>Number(b.blocking)-Number(a.blocking));const rows=[];let bytes=0;
 for(const target of targets.slice(0,maxTargets)){
  const data={id:target.id,route:target.route,url:target.routeUrl,state:target.state,viewport:target.viewport,theme:target.colorScheme,selector:target.selector,sourceLocation:target.sourceLocation,actual:target.actual,expected:target.expected,images:target.imageEvidence,aria:target.ariaEvidence};
  const row=fence(JSON.stringify(data,null,2),'json');if(bytes+Buffer.byteLength(row)>maxBytes)break;rows.push(row);bytes+=Buffer.byteLength(row);
 }
 return '## Target evidence\n\n'+(rows.join('\n\n')||'No target evidence fits this bounded preview; inspect handoff.json.')+(rows.length<targets.length?`\n\nTRUNCATED: ${targets.length-rows.length} additional target records in handoff.json/report.json.`:'')+'\n';
}
