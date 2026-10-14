import {spawn} from 'node:child_process';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveInside,browserRoutes} from './config.mjs';
import {browserBudget} from './browser-budget.mjs';
import {normalizeStatic,normalizeBrowser,browserCoverage} from './normalize.mjs';

export async function spawnBounded(bin,args,{cwd,timeoutMs=60000,maxOutput=20_000_000}={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(bin,args,{cwd,stdio:['ignore','pipe','pipe'],shell:false,windowsHide:true,detached:process.platform!=='win32'});
    let stdout='',stderr='',bytes=0,stopped=false,reason='';
    let forceTimer;
    const stop=()=>{
      if(process.platform==='win32')spawn('taskkill',['/pid',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true}).on('error',()=>child.kill());
      else{
        try{process.kill(-child.pid,'SIGTERM');}catch{child.kill('SIGTERM');}
        forceTimer=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}},1000);
      }
    };
    const timer=setTimeout(()=>{reason='timeout';stopped=true;stop();},timeoutMs);
    for(const [stream,label] of [[child.stdout,'stdout'],[child.stderr,'stderr']])stream.on('data',b=>{
      if(stopped)return;
      bytes+=b.length;
      if(bytes>maxOutput&&!stopped){reason='output limit';stopped=true;stop();return;}
      if(label==='stdout')stdout+=b.toString();else stderr+=b.toString();
    });
    child.on('error',e=>{clearTimeout(timer);clearTimeout(forceTimer);reject(e);});
    child.on('close',(code,signal)=>{clearTimeout(timer);clearTimeout(forceTimer);resolve({code,signal,stdout,stderr,error:reason});});
  });
}
export async function realStatic(config,root){
  const audit=staticAuditPath(config,root);
  if(audit.split(path.sep).includes('node_modules'))throw Error('suta native TypeScript cannot run from node_modules; install UI Refiner under tools/ui-refiner. A compiled npm distribution is not supported.');
  if(!(await stat(audit).catch(()=>null))?.isFile())throw new Error(`suta audit not installed: ${audit} (see README)`);
  const paths=config.static.targets.map(p=>resolveInside(root,p,'static.targets'));
  for(const target of paths)if(!await stat(target).catch(()=>null))throw new Error(`static target missing: ${target}`);
  const run=await spawnBounded(process.execPath,[audit,...paths,'--json'],{cwd:root,timeoutMs:config.static.timeoutMs});
  if(run.error||![0,1].includes(run.code))throw new Error(`suta runner failed (${run.error||run.code}): ${run.stderr.slice(-800)}`);
  let raw;try{raw=JSON.parse(run.stdout)}catch{throw new Error(`suta did not return JSON: ${run.stderr.slice(-500)}`)}
  if(!Number.isInteger(raw.files)||raw.files<1||!Number.isInteger(raw.errors)||!Number.isInteger(raw.warnings))throw new Error('suta report missing required file/error/warning counts');
  const sources = new Map();
  for (const f of raw.findings) {
    const file = resolveInside(root,f.file,'suta finding file');
    if (!sources.has(file)) sources.set(file, await readFile(file,'utf8').catch(()=>''));
    const lines = sources.get(file).split(/\r?\n/).map(line=>line.trim());
    const anchor = lines[f.line-1];
    // Duplicate/empty source anchors require a stable source marker before baselining.
    f.sourceAnchor = anchor && lines.filter(line=>line===anchor).length===1 ? anchor : undefined;
    f.file = path.relative(root,file).replaceAll(path.sep,'/');
  }
  const findings=normalizeStatic(raw);
  if((run.code===1)!==findings.some(f=>f.severity==='error'))throw new Error('suta exit code and findings disagree');
  return {findings,stats:{files:raw.files,errors:raw.errors,warnings:raw.warnings}};
}
export function staticAuditPath(config,root){
 return config.static.auditPath==='bundled' ? fileURLToPath(new URL('../vendor/suta/skills/suta/scripts/audit.mjs',import.meta.url)) : resolveInside(root,config.static.auditPath,'static.auditPath');
}
export async function realBrowser(config,root,{runner=spawnBounded}={}){
 const routes=browserRoutes(config);
 const policy=JSON.parse(await readFile(resolveInside(root,config.browser.policyPath,'browser.policyPath'),'utf8'));
 const plans=await Promise.all(routes.map(async route=>{
  try{return route.interactionsPath?JSON.parse(await readFile(resolveInside(root,route.interactionsPath,'route.interactionsPath'),'utf8')):undefined;}
  catch(e){return {loadError:e.message};}
 }));
 const budgets=browserBudget(config,policy,plans),started=Date.now();let outputBytes=0;
 const worker=fileURLToPath(new URL('./browser-worker.mjs',import.meta.url));
 const combined={rawReport:{url:config.browser.url,routes,runs:[],findings:[],errors:[]},artifacts:[],captures:[],ariaSnapshots:[],renderedMetrics:[],routeResults:[]};
 for(const [index,route] of routes.entries()){
  const remaining=Math.max(0,budgets.sessionTimeoutMs-(Date.now()-started));
  // Reserve a fair share for every pending route; one slow worker cannot consume the whole batch.
  const allocated=Math.min(config.browser.routeTimeoutMs??Infinity,Math.floor(remaining/(routes.length-index)));
  const outcome={route:route.name,url:route.url,status:'error',timeoutMs:allocated};
  combined.routeResults.push(outcome);
  try{
   if(plans[index]?.loadError)throw Error(plans[index].loadError);
   if(allocated<100)throw Error('Session budget exhausted before this route could run');
   const selected={...config,browser:{...config.browser,...(config.browser.routes?{routes:[config.browser.routes[index]]}:{})}};
   const run=await runner(process.execPath,[worker,JSON.stringify({config:selected,root})],{cwd:root,timeoutMs:allocated});
   if(run.error||run.code!==0)throw Error(`Browser worker failed (${run.error||run.code}): ${String(run.stderr||'').slice(-1000)}`);
   outputBytes+=Buffer.byteLength(run.stdout||'')+Buffer.byteLength(run.stderr||'');
   if(outputBytes>20_000_000)throw Error('Aggregate browser output limit exceeded; split routes into smaller batches');
   let result;try{result=JSON.parse(run.stdout);}catch{throw Error('Browser worker returned invalid JSON');}
   // Validate before merging, so malformed worker output never masquerades as a completed route.
   normalizeBrowser(result.rawReport);
   combined.rawReport.runs.push(...result.rawReport.runs);
   combined.rawReport.findings.push(...result.rawReport.findings);
   combined.rawReport.errors.push(...result.rawReport.errors||[]);
   for(const key of ['artifacts','captures','ariaSnapshots','renderedMetrics'])combined[key].push(...result[key]||[]);
   outcome.status=result.rawReport.errors?.length?'error':'complete';
   outcome.completedRuns=result.rawReport.runs.filter(r=>r.status!=='error').length;
   if(result.rawReport.errors?.length)outcome.error=result.rawReport.errors.map(e=>e.error).join('; ');
  }catch(e){outcome.error=e.message;combined.rawReport.errors.push({route:route.name,error:e.message});}
 }
 return {...combined,errors:combined.rawReport.errors,budgets,findings:combined.rawReport.runs.length?normalizeBrowser(combined.rawReport):[],ruleCoverage:combined.rawReport.runs.length?browserCoverage(combined.rawReport):[],capturesIntegrated:true};
}
// Compatibility API for explicit callers. The gate uses the integrated worker session.
export async function screenshots(config,root){
 const result=await realBrowser({...config,browser:{...config.browser,captureScreenshots:true}},root);
 if(result.errors.length)throw Error(result.errors.map(e=>e.error).join('; '));
 return result.artifacts;
}

export async function probeChromium({launch,timeout=15000}={}){
  launch ??= (await import('../vendor/lintapple/src/browser.js')).launchBrowser;
  const browser = await launch({timeout});
  try { const page = await browser.newPage(); await page.goto('about:blank',{timeout}); }
  finally { await browser.close(); }
}
