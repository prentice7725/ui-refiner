import {guidanceOptions} from './repair-guidance.mjs';
import {validateVisual} from './visual-config.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {makePreset} from './presets.mjs';

const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
function assertKeys(obj, keys, name){ if(!isObject(obj)) throw new Error(`${name} must be an object`); for(const key of Object.keys(obj)) if(!keys.includes(key)) throw new Error(`Unknown ${name} field: ${key}`); }
function assertType(value,type,name){if(typeof value!==type) throw new Error(`${name} must be ${type}`);}
function bool(v,name){assertType(v,'boolean',name);}
function nonEmpty(v,name){assertType(v,'string',name); if(!v.trim()) throw new Error(`${name} must not be empty`);}
export function resolveInside(root,p,field){
  nonEmpty(p,field);
  const base = path.resolve(root), target = path.resolve(base,p);
  if (target !== base && !target.startsWith(base+path.sep)) throw new Error(`${field} must be within project root`);
  return target;
}
export function validateConfig(input){
  assertKeys(input,['schemaVersion','locale','name','preset','sot','static','browser','gate','reportDir','visual','contextPath','preservation','guidance'],'config');
  if(input.schemaVersion!==1) throw new Error('Unsupported schemaVersion (expected 1)');
  makePreset(input.preset,input.locale||'en-US');
  nonEmpty(input.name,'name');
  assertKeys(input.sot,['path'],'sot');
  if(input.sot.path!==null) nonEmpty(input.sot.path,'sot.path');
  assertKeys(input.static,['enabled','auditPath','targets','timeoutMs','enforcement'],'static');
  bool(input.static.enabled,'static.enabled'); nonEmpty(input.static.auditPath,'static.auditPath');
  if(!Array.isArray(input.static.targets)||!input.static.targets.length||input.static.targets.some(s=>typeof s!=='string'||!s.trim())) throw new Error('static.targets needs paths');
  assertTimeout(input.static.timeoutMs,'static.timeoutMs');assertEnforcement(input.static.enforcement,'static.enforcement');
  assertKeys(input.browser,['enabled','url','routes','policyPath','ready','interactionsPath','timeoutMs','sessionTimeoutMs','routeTimeoutMs','captureScreenshots','captureAriaSnapshots','ariaSnapshotMasks','renderedMetrics','enforcement'],'browser');
  bool(input.browser.enabled,'browser.enabled'); nonEmpty(input.browser.url,'browser.url');nonEmpty(input.browser.policyPath,'browser.policyPath');
  for(const key of ['ready','interactionsPath'])if(input.browser[key]!==null)nonEmpty(input.browser[key],`browser.${key}`);
  assertTimeout(input.browser.timeoutMs,'browser.timeoutMs');if(input.browser.sessionTimeoutMs!=null)assertTimeout(input.browser.sessionTimeoutMs,'browser.sessionTimeoutMs'); bool(input.browser.captureScreenshots,'browser.captureScreenshots');assertEnforcement(input.browser.enforcement,'browser.enforcement');
  for(const key of ['captureAriaSnapshots','renderedMetrics'])if(input.browser[key]!==undefined)bool(input.browser[key],`browser.${key}`);
  if(input.browser.routeTimeoutMs!=null)assertTimeout(input.browser.routeTimeoutMs,'browser.routeTimeoutMs');
  validateAriaMasks(input.browser.ariaSnapshotMasks);
  if(input.browser.routes!==undefined){
    if(!Array.isArray(input.browser.routes)||!input.browser.routes.length||input.browser.routes.length>50)throw Error('browser.routes must have 1..50 routes');
    const names=new Set();
    for(const route of input.browser.routes){
      assertKeys(route,['name','url','ready','interactionsPath'],'browser.routes entry');
      nonEmpty(route.name,'route.name');if(!/^[a-zA-Z0-9_-]{1,64}$/.test(route.name)||names.has(route.name))throw Error('route names must be unique safe identifiers (1..64 characters)');names.add(route.name);
      nonEmpty(route.url,'route.url');if(!route.url.startsWith('/')&&!/^https?:\/\//.test(route.url))throw Error('route.url must be an absolute HTTP(S) URL or root-relative path');
      for(const key of ['ready','interactionsPath'])if(route[key]!=null)nonEmpty(route[key],`route.${key}`);
    }
  }
  assertKeys(input.gate,['maxStaticWarnings','allowedHosts','baselinePath','valueExceptionsPath','manualVisualReview'],'gate');
  if(input.gate.maxStaticWarnings!==null && (!Number.isInteger(input.gate.maxStaticWarnings)||input.gate.maxStaticWarnings<0))throw new Error('maxStaticWarnings must be null or nonnegative integer');
  if(!Array.isArray(input.gate.allowedHosts)||!input.gate.allowedHosts.length||input.gate.allowedHosts.some(s=>typeof s!=='string'||!s.trim()))throw new Error('allowedHosts must have hosts');
  if(input.gate.baselinePath!==null)nonEmpty(input.gate.baselinePath,'gate.baselinePath');
  if(input.gate.valueExceptionsPath!=null)nonEmpty(input.gate.valueExceptionsPath,'gate.valueExceptionsPath');
  bool(input.gate.manualVisualReview,'gate.manualVisualReview');nonEmpty(input.reportDir,'reportDir');
  if(input.contextPath!==undefined&&input.contextPath!==null)nonEmpty(input.contextPath,'contextPath');
  if(input.preservation!==undefined){
    assertKeys(input.preservation,['enabled','enforcement','baselinePath'],'preservation');bool(input.preservation.enabled,'preservation.enabled');assertEnforcement(input.preservation.enforcement,'preservation.enforcement');if(input.preservation.baselinePath!=null)nonEmpty(input.preservation.baselinePath,'preservation.baselinePath');if(input.preservation.enabled&&!input.browser.enabled)throw Error('preservation requires browser.enabled');
  }
  guidanceOptions(input);
  validateVisual(input.visual);
  if(input.visual?.enabled&&!input.browser.enabled)throw Error('visual requires browser.enabled');
  if(input.browser.enabled)browserRoutes(input);
  return input;
}
function assertTimeout(v,n){if(!Number.isInteger(v)||v<100||v>600000)throw new Error(`${n} must be 100..600000ms`);}
function assertEnforcement(v,n){if(!['enforce','advisory'].includes(v))throw new Error(`${n} must be enforce or advisory`);}
export async function loadConfig(configFile='ui-refiner.config.json'){
  const file=path.resolve(configFile), root=path.dirname(file);
  const config=validateConfig(JSON.parse(await fs.readFile(file,'utf8')));
  for(const [v,n] of [[config.static.auditPath,'static.auditPath'],[config.browser.policyPath,'browser.policyPath'],[config.reportDir,'reportDir']])resolveInside(root,v,n);
  for(const target of config.static.targets)resolveInside(root,target,'static.targets');
  if(config.contextPath)resolveInside(root,config.contextPath,'contextPath');
  if(config.preservation?.baselinePath)resolveInside(root,config.preservation.baselinePath,'preservation.baselinePath');
  if(config.sot.path)resolveInside(root,config.sot.path,'sot.path');
  if(config.browser.interactionsPath)resolveInside(root,config.browser.interactionsPath,'browser.interactionsPath');
  for(const route of config.browser.routes||[])if(route.interactionsPath)resolveInside(root,route.interactionsPath,'route.interactionsPath');
  if(config.gate.baselinePath)resolveInside(root,config.gate.baselinePath,'gate.baselinePath');
  if(config.gate.valueExceptionsPath)resolveInside(root,config.gate.valueExceptionsPath,'gate.valueExceptionsPath');
  if(config.visual?.baselineDir)resolveInside(root,config.visual.baselineDir,'visual.baselineDir');
  return {root,config,file};
}
export function checkUrl(input,allowedHosts){
  const u=new URL(input);
  if(!['http:','https:'].includes(u.protocol))throw new Error('Only HTTP(S) browser URLs are supported');
  if(u.username||u.password)throw new Error('Credentials inside URL are not allowed');
  if(!allowedHosts.includes(u.hostname))throw new Error(`Host ${u.hostname} is not allowed; edit gate.allowedHosts explicitly`);
  return u.toString();
}
// Explicit routes replace the single-page target; legacy single-page identities stay unchanged.
export function browserRoutes(config){
  const base=checkUrl(config.browser.url,config.gate.allowedHosts);
  return (config.browser.routes||[{name:'default',url:base}]).map(route=>({
    ...route,url:checkUrl(new URL(route.url,base).toString(),config.gate.allowedHosts),
    ready:route.ready===undefined?config.browser.ready:route.ready,
    interactionsPath:route.interactionsPath===undefined?config.browser.interactionsPath:route.interactionsPath,
    routeKey:config.browser.routes?JSON.stringify([route.name,new URL(route.url,base).pathname+new URL(route.url,base).search]):undefined
  }));
}
export function validateAriaMasks(masks){
 if(masks===undefined)return;
 if(!Array.isArray(masks)||masks.length>20)throw Error('browser.ariaSnapshotMasks must contain at most 20 regular expressions');
 for(const mask of masks){
  assertKeys(mask,['pattern','flags'],'ARIA mask');nonEmpty(mask.pattern,'ARIA mask pattern');
  if(mask.pattern.length>500||typeof (mask.flags??'g')!=='string'||!/^[gimu]*$/.test(mask.flags??'g'))throw Error('ARIA masks allow only g/i/m/u flags and at most 500 pattern characters');
  new RegExp(mask.pattern,mask.flags??'g');
 }
}
export async function initProject(root,preset='web',locale='en-US'){
  const config=makePreset(preset,locale);
  await fs.mkdir(root,{recursive:true});
  const entries=[['ui-refiner.config.json',config],['ui-policy.json',(await import('./presets.mjs')).makePolicy(locale)]];
  const status=[];
  for(const [name,content] of entries){
    try{await fs.writeFile(path.join(root,name),JSON.stringify(content,null,2)+'\n',{flag:'wx'});status.push(`Created ${name}`);}
    catch(e){if(e.code!=='EEXIST')throw e;status.push(`Kept ${name}`);}
  }
  return status;
}
