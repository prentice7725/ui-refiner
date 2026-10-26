import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {safeRelative} from './result-contract.mjs';
export const digest=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const object=(v,keys,label)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))throw Error('Invalid '+label);};
const text=(v,label)=>{if(typeof v!=='string'||!v.trim()||v.length>4000)throw Error(label+' requires bounded text');};
export async function readProjectInput(root,file,maxBytes=1_000_000){
 if(!safeRelative(file))throw Error('Input must be project-relative: '+file);
 const base=await fs.realpath(root),target=path.resolve(base,file),real=await fs.realpath(target),stat=await fs.lstat(target);
 if(!real.startsWith(base+path.sep)||!stat.isFile()||stat.isSymbolicLink()||stat.size>maxBytes)throw Error('Input must be a bounded regular project file: '+file);
 return fs.readFile(target);
}
export function validateContext(value){
 object(value,['schemaVersion','product','references','surfaces'],'context');if(value.schemaVersion!==1)throw Error('context.schemaVersion must be 1');
 if(value.product!==undefined){object(value.product,['audience','primaryTask','facts'],'product');for(const k of ['audience','primaryTask'])if(value.product[k]!==undefined)text(value.product[k],k);if(value.product.facts!==undefined&&(!Array.isArray(value.product.facts)||value.product.facts.length>50))throw Error('product.facts must have at most 50 entries');for(const f of value.product.facts||[])text(f,'fact');}
 if(!Array.isArray(value.references)||value.references.length>30)throw Error('context.references must have at most 30 entries');
 for(const r of value.references){object(r,['kind','file','approved','sha256'],'reference');if(!['product','design','acceptance'].includes(r.kind)||!safeRelative(r.file)||typeof r.approved!=='boolean'||r.sha256!==undefined&&!/^[a-f0-9]{64}$/.test(r.sha256))throw Error('Invalid context reference');}
 if(!Array.isArray(value.surfaces)||value.surfaces.length>50)throw Error('context.surfaces must have at most 50 entries');const routes=new Set();
 for(const s of value.surfaces){
  object(s,['route','mode','purpose','preserve','allowedChanges'],'surface');text(s.route,'surface.route');if(routes.has(s.route))throw Error('Duplicate surface route');routes.add(s.route);
  if(!['persuade','operate','read','experience'].includes(s.mode))throw Error('Unknown surface mode');text(s.purpose,'surface.purpose');
  if(s.allowedChanges!==undefined){if(!Array.isArray(s.allowedChanges)||s.allowedChanges.length>20)throw Error('Invalid allowedChanges');for(const item of s.allowedChanges)text(item,'allowedChange');}
  if(s.preserve!==undefined){
   object(s.preserve,['elements','tokens'],'preserve');if(s.preserve.elements!==undefined&&(!Array.isArray(s.preserve.elements)||s.preserve.elements.length>100))throw Error('At most 100 preservation elements');
   for(const e of s.preserve.elements||[]){object(e,['selector','attributes','text','accessibleName'],'preserve element');text(e.selector,'selector');if(!Array.isArray(e.attributes)||e.attributes.some(a=>!['href','action','method','name','type','required','data-testid','role','aria-label','aria-controls'].includes(a)))throw Error('Unsupported preservation attribute');for(const k of ['text','accessibleName'])if(e[k]!==undefined&&typeof e[k]!=='boolean')throw Error(k+' must be boolean');}
   if(s.preserve.tokens!==undefined&&(!Array.isArray(s.preserve.tokens)||s.preserve.tokens.length>100||s.preserve.tokens.some(t=>typeof t!=='string'||!/^--[\w-]{1,100}$/.test(t))))throw Error('Invalid preservation token names');
  }
 }
 return value;
}
export async function loadProjectContext(config,root){
 if(!config.contextPath)return {schemaVersion:1,status:'not-configured',product:{audience:null,primaryTask:null,facts:[]},references:[],surfaces:[],unknown:['product audience','primary task','surface purpose'],issues:[]};
 const bytes=await readProjectInput(root,config.contextPath),data=validateContext(JSON.parse(bytes)),references=[],issues=[];
 for(const ref of data.references){try{const content=await readProjectInput(root,ref.file);const sha256=digest(content),status=ref.sha256&&ref.sha256!==sha256?'stale':'captured';references.push({...ref,status,sha256,expectedSha256:ref.sha256??null,bytes:content.length,approval:'user-declared; not inferred from prose'});if(status==='stale')issues.push({file:ref.file,reason:'Declared reference hash no longer matches'});}catch(e){references.push({...ref,status:'unavailable',reason:e.message});issues.push({file:ref.file,reason:e.message});}}
 const names=new Set((config.browser.routes||[{name:'default'}]).map(r=>r.name));for(const s of data.surfaces)if(!names.has(s.route))issues.push({route:s.route,reason:'Surface does not match a configured route name'});
 const product={audience:null,primaryTask:null,facts:[],...data.product},unknown=['audience','primaryTask'].filter(k=>!product[k]);
 const result={schemaVersion:1,status:issues.length?'needs-review':'captured',file:config.contextPath,sha256:digest(bytes),product,references,surfaces:data.surfaces,unknown,issues,policyAuthority:'Context never overrides configured policy, exceptions or approved baseline IDs'};
 result.compatibility=digest({sha256:result.sha256,references:references.map(r=>({file:r.file,status:r.status,sha256:r.sha256,approved:r.approved}))});return result;
}
export function surfaceGuidance(context){return context.surfaces.map(s=>({route:s.route,mode:s.mode,purpose:s.purpose,advisory:true,checks:s.mode==='operate'?['Task clarity and familiar controls','Data density serves the task','Loading, empty, error and keyboard states']:s.mode==='read'?['Readable prose measure','Navigation and heading hierarchy','Long and translated content']:s.mode==='persuade'?['Evidence supports product claims','Primary action and message hierarchy','Real product material above decorative framing']:['Experience supports its stated purpose','Motion has reduced-motion alternatives','Controls remain discoverable'],preserve:s.preserve||{},allowedChanges:s.allowedChanges||[]}));}
