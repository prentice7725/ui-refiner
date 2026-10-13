import {spawn} from 'node:child_process';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveInside,checkUrl} from './config.mjs';
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
export async function realBrowser(config,root){
 checkUrl(config.browser.url,config.gate.allowedHosts);
 const worker=fileURLToPath(new URL('./browser-worker.mjs',import.meta.url));
 const run=await spawnBounded(process.execPath,[worker,JSON.stringify({config,root})],{cwd:root,timeoutMs:config.browser.timeoutMs});
 if(run.error||run.code!==0)throw Error(`Browser worker failed (${run.error||run.code}): ${run.stderr.slice(-1000)}`);
 let result;try{result=JSON.parse(run.stdout);}catch{throw Error('Browser worker returned invalid JSON');}
 return {...result,findings:normalizeBrowser(result.rawReport),ruleCoverage:browserCoverage(result.rawReport),capturesIntegrated:true};
}
// Compatibility API for explicit callers. The gate uses the integrated worker session.
export async function screenshots(config,root){
 const result=await realBrowser({...config,browser:{...config.browser,captureScreenshots:true}},root);
 return result.artifacts;
}

export async function probeChromium({launch,timeout=15000}={}){
  launch ??= (await import('../vendor/lintapple/src/browser.js')).launchBrowser;
  const browser = await launch({timeout});
  try { const page = await browser.newPage(); await page.goto('about:blank',{timeout}); }
  finally { await browser.close(); }
}
