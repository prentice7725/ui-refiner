import {spawn} from 'node:child_process';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {resolveInside,checkUrl} from './config.mjs';
import {normalizeStatic,normalizeBrowser,browserCoverage} from './normalize.mjs';

export async function spawnBounded(bin,args,{cwd,timeoutMs=60000,maxOutput=20_000_000}={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(bin,args,{cwd,stdio:['ignore','pipe','pipe'],shell:false,windowsHide:true});
    let stdout='',stderr='',bytes=0,stopped=false,reason='';
    const timer=setTimeout(()=>{reason='timeout';stopped=true;child.kill('SIGKILL');},timeoutMs);
    for(const [stream,label] of [[child.stdout,'stdout'],[child.stderr,'stderr']])stream.on('data',b=>{
      bytes+=b.length;
      if(bytes>maxOutput&&!stopped){reason='output limit';stopped=true;child.kill('SIGKILL');return;}
      if(label==='stdout')stdout+=b.toString();else stderr+=b.toString();
    });
    child.on('error',e=>{clearTimeout(timer);reject(e);});
    child.on('close',(code,signal)=>{clearTimeout(timer);resolve({code,signal,stdout,stderr,error:reason});});
  });
}
export async function realStatic(config,root){
  const audit=resolveInside(root,config.static.auditPath,'static.auditPath');
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
export async function realBrowser(config,root){
  const url=checkUrl(config.browser.url,config.gate.allowedHosts);
  const policy=JSON.parse(await readFile(resolveInside(root,config.browser.policyPath,'browser.policyPath'),'utf8'));
  let interactions;
  if(config.browser.interactionsPath) interactions=JSON.parse(await readFile(resolveInside(root,config.browser.interactionsPath,'browser.interactionsPath'),'utf8'));
  // Runtime dependency is resolved from the UI Refiner installation, not the scanned app.
  const {checkUrl:lintCheck}=await import('../vendor/lintapple/src/index.js');
  const report=await lintCheck(url,policy,{ready:config.browser.ready??undefined,timeout:config.browser.timeoutMs,interactions});
  return {findings:normalizeBrowser(report),rawReport:report,ruleCoverage:browserCoverage(report)};
}
export async function screenshots(config,root,reportDir){
  const url=checkUrl(config.browser.url,config.gate.allowedHosts);
  const policy=JSON.parse(await readFile(resolveInside(root,config.browser.policyPath,'browser.policyPath'),'utf8'));
  const {chromium}=await import('playwright');
  const browser=await chromium.launch();
  const outputs=[];
  try{
    const {mkdir}=await import('node:fs/promises');await mkdir(reportDir,{recursive:true});
    for(const viewport of policy.viewports)for(const scheme of policy.colorSchemes){
      const context=await browser.newContext({viewport,colorScheme:scheme,reducedMotion:'reduce'});
      try{
        const page=await context.newPage();await page.goto(url,{waitUntil:'load',timeout:config.browser.timeoutMs});
        if(config.browser.ready)await page.locator(config.browser.ready).waitFor({state:'visible',timeout:config.browser.timeoutMs});
        const file=`render-${viewport.width}x${viewport.height}-${scheme}.png`;
        await page.screenshot({path:path.join(reportDir,file),fullPage:true});outputs.push(file);
      }finally{await context.close()}
    }
  }finally{await browser.close()}
  return outputs;
}

export async function probeChromium({launch,timeout=15000}={}){
  launch ??= (await import('../vendor/lintapple/src/browser.js')).launchBrowser;
  const browser = await launch({timeout});
  try { const page = await browser.newPage(); await page.goto('about:blank',{timeout}); }
  finally { await browser.close(); }
}
