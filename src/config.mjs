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
  assertKeys(input,['schemaVersion','locale','name','preset','sot','static','browser','gate','reportDir'],'config');
  if(input.schemaVersion!==1) throw new Error('Unsupported schemaVersion (expected 1)');
  makePreset(input.preset,input.locale||'en-US');
  nonEmpty(input.name,'name');
  assertKeys(input.sot,['path'],'sot');
  if(input.sot.path!==null) nonEmpty(input.sot.path,'sot.path');
  assertKeys(input.static,['enabled','auditPath','targets','timeoutMs','enforcement'],'static');
  bool(input.static.enabled,'static.enabled'); nonEmpty(input.static.auditPath,'static.auditPath');
  if(!Array.isArray(input.static.targets)||!input.static.targets.length||input.static.targets.some(s=>typeof s!=='string'||!s.trim())) throw new Error('static.targets needs paths');
  assertTimeout(input.static.timeoutMs,'static.timeoutMs');assertEnforcement(input.static.enforcement,'static.enforcement');
  assertKeys(input.browser,['enabled','url','policyPath','ready','interactionsPath','timeoutMs','sessionTimeoutMs','captureScreenshots','enforcement'],'browser');
  bool(input.browser.enabled,'browser.enabled'); nonEmpty(input.browser.url,'browser.url');nonEmpty(input.browser.policyPath,'browser.policyPath');
  for(const key of ['ready','interactionsPath'])if(input.browser[key]!==null)nonEmpty(input.browser[key],`browser.${key}`);
  assertTimeout(input.browser.timeoutMs,'browser.timeoutMs');if(input.browser.sessionTimeoutMs!=null)assertTimeout(input.browser.sessionTimeoutMs,'browser.sessionTimeoutMs'); bool(input.browser.captureScreenshots,'browser.captureScreenshots');assertEnforcement(input.browser.enforcement,'browser.enforcement');
  assertKeys(input.gate,['maxStaticWarnings','allowedHosts','baselinePath','manualVisualReview'],'gate');
  if(input.gate.maxStaticWarnings!==null && (!Number.isInteger(input.gate.maxStaticWarnings)||input.gate.maxStaticWarnings<0))throw new Error('maxStaticWarnings must be null or nonnegative integer');
  if(!Array.isArray(input.gate.allowedHosts)||!input.gate.allowedHosts.length||input.gate.allowedHosts.some(s=>typeof s!=='string'||!s.trim()))throw new Error('allowedHosts must have hosts');
  if(input.gate.baselinePath!==null)nonEmpty(input.gate.baselinePath,'gate.baselinePath');
  bool(input.gate.manualVisualReview,'gate.manualVisualReview');nonEmpty(input.reportDir,'reportDir');
  return input;
}
function assertTimeout(v,n){if(!Number.isInteger(v)||v<100||v>600000)throw new Error(`${n} must be 100..600000ms`);}
function assertEnforcement(v,n){if(!['enforce','advisory'].includes(v))throw new Error(`${n} must be enforce or advisory`);}
export async function loadConfig(configFile='ui-refiner.config.json'){
  const file=path.resolve(configFile), root=path.dirname(file);
  const config=validateConfig(JSON.parse(await fs.readFile(file,'utf8')));
  for(const [v,n] of [[config.static.auditPath,'static.auditPath'],[config.browser.policyPath,'browser.policyPath'],[config.reportDir,'reportDir']])resolveInside(root,v,n);
  for(const target of config.static.targets)resolveInside(root,target,'static.targets');
  if(config.sot.path)resolveInside(root,config.sot.path,'sot.path');
  if(config.browser.interactionsPath)resolveInside(root,config.browser.interactionsPath,'browser.interactionsPath');
  if(config.gate.baselinePath)resolveInside(root,config.gate.baselinePath,'gate.baselinePath');
  return {root,config,file};
}
export function checkUrl(input,allowedHosts){
  const u=new URL(input);
  if(!['http:','https:'].includes(u.protocol))throw new Error('Only HTTP(S) browser URLs are supported');
  if(u.username||u.password)throw new Error('Credentials inside URL are not allowed');
  if(!allowedHosts.includes(u.hostname))throw new Error(`Host ${u.hostname} is not allowed; edit gate.allowedHosts explicitly`);
  return u.toString();
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
