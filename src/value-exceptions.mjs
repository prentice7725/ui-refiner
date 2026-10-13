import fs from 'node:fs/promises';
import {resolveInside} from './config.mjs';
// Exact design values only: accessibility/interaction failures cannot be waived here.
const rules=['font-family','font-size','copy','root-background'];
export async function loadValueExceptions(config,root){
 if(!config.gate.valueExceptionsPath)return {exceptions:[],content:null};
 const content=await fs.readFile(resolveInside(root,config.gate.valueExceptionsPath,'gate.valueExceptionsPath'),'utf8');
 const raw=JSON.parse(content);
 if(!raw||Object.keys(raw).some(k=>!['schemaVersion','exceptions'].includes(k))||raw.schemaVersion!==1||!Array.isArray(raw.exceptions)||raw.exceptions.length>200)throw Error('Value exceptions need schemaVersion 1 and at most 200 exceptions');
 for(const e of raw.exceptions){
  if(!e||typeof e!=='object'||Object.keys(e).some(k=>!['engine','rule','actual','reason','route','selector'].includes(k))||e.engine!=='lintapple'||!rules.includes(e.rule)||!['string','number','boolean'].includes(typeof e.actual)||typeof e.actual==='number'&&!Number.isFinite(e.actual)||typeof e.reason!=='string'||!e.reason.trim())throw Error('Value exception needs a supported design rule, exact primitive actual value and nonempty review reason');
  for(const key of ['route','selector'])if(e[key]!==undefined&&(typeof e[key]!=='string'||!e[key].trim()))throw Error(`Value exception ${key} must be nonempty`);
 }
 return {exceptions:raw.exceptions,content};
}
export function matchValueException(f,exceptions){
 return exceptions.find(e=>!f.advisory&&f.engine===e.engine&&f.rule===e.rule&&f.actual===e.actual&&(e.route===undefined||e.route===(f.route||'default'))&&(e.selector===undefined||e.selector===f.selector));
}
