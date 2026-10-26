import fs from 'node:fs/promises';
import {readProjectInput,digest} from './project-context.mjs';

// Serialized into the audited page. Never collect field values, passwords or event-handler source.
export function collectInventory(contract={}){
 const clean=v=>String(v??'').replace(/\s+/g,' ').trim().slice(0,2000);
 const name=el=>clean(el.getAttribute('aria-label')||(el.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>document.getElementById(id)?.textContent||'').join(' ').trim()||[...el.labels||[]].map(l=>l.textContent).join(' ').trim()||el.textContent||el.getAttribute('alt')||'');
 const url=v=>{try{const u=new URL(v,location.href);return u.origin===location.origin?u.pathname+u.search+u.hash:u.href;}catch{return v;}};
 const attrs=(el,keys)=>Object.fromEntries(keys.map(k=>[k,['href','action'].includes(k)&&el.hasAttribute(k)?url(el.getAttribute(k)):k==='required'?el.hasAttribute(k):el.getAttribute(k)]));
 const records=[],issues=[];const all=[...document.querySelectorAll('a[href],form,input:not([type="password"]),select,textarea,button,[data-testid]')];
 for(const el of all.slice(0,2000)){
  const tag=el.tagName.toLowerCase(),keys=tag==='a'?['href']:tag==='form'?['action','method']:['name','type','required'];const values=attrs(el,[...keys,'data-testid']);const accessibleName=name(el);
  const key=['auto',tag,el.getAttribute('data-testid')||el.getAttribute('name')||accessibleName||values.href||values.action||el.getAttribute('type')||'unnamed'].join(':');
  records.push({key,tag,attributes:values,...(['a','button','input','select','textarea'].includes(tag)?{accessibleName}:{}),selector:null});
 }
 for(const rule of contract.elements||[]){
  let found;try{found=document.querySelectorAll(rule.selector);}catch{issues.push({selector:rule.selector,reason:'Invalid preservation selector'});continue;}
  if(found.length===0){records.push({key:'contract:'+rule.selector,selector:rule.selector,present:false});continue;}
  if(found.length!==1){issues.push({selector:rule.selector,reason:'Preservation selector is ambiguous'});continue;}
  const el=found[0];records.push({key:'contract:'+rule.selector,selector:rule.selector,present:true,tag:el.tagName.toLowerCase(),attributes:attrs(el,rule.attributes),...(rule.text?{text:clean(el.textContent)}:{}),...(rule.accessibleName?{accessibleName:name(el)}:{})});
 }
 const rootStyle=getComputedStyle(document.documentElement),tokens=Object.fromEntries((contract.tokens||[]).map(k=>[k,rootStyle.getPropertyValue(k).trim()]));
 if(all.length>2000)issues.push({reason:'Inventory truncated after 2000 elements'});
 return {schemaVersion:1,status:issues.length?'incomplete':'complete',records,tokens,issues,limits:{events:'Handlers and backend behavior are not proven; use explicit interaction plans',names:'DOM label approximation; not a full accessible-name computation',passwords:'Password inputs and all input values excluded',dynamic:'IDs, classes and DOM order are not compared'}};
}
const key=e=>JSON.stringify([e.routeKey??e.route,e.state,e.viewport,e.colorScheme]);
const signature=r=>JSON.stringify(r);
export function compareInventories(before,after){
 const previous=new Map(before.map(e=>[key(e),e])),current=new Map(after.map(e=>[key(e),e])),changes=[],unknown=[];
 for(const [dimension,a] of previous){const b=current.get(dimension);if(!b){unknown.push({dimensions:dimension,reason:'Previously recorded state was not captured'});continue;}
  if(a.inventory.status!=='complete'||b.inventory.status!=='complete'){unknown.push({dimensions:dimension,reason:'Inventory collection was incomplete',issues:b.inventory.issues});continue;}
  const old=new Map(),fresh=new Map();for(const r of a.inventory.records){const s=signature(r);old.set(s,(old.get(s)||0)+1);}for(const r of b.inventory.records){const s=signature(r);fresh.set(s,(fresh.get(s)||0)+1);}
  for(const [s,count] of old)if((fresh.get(s)||0)<count)changes.push({dimensions:dimension,kind:'removed-or-changed',target:JSON.parse(s),expectedCount:count,actualCount:fresh.get(s)||0});
  for(const [token,value] of Object.entries(a.inventory.tokens))if(value!==b.inventory.tokens[token])changes.push({dimensions:dimension,kind:'token-changed',token,expected:value,actual:b.inventory.tokens[token]??null});
 }
 for(const [dimension,b] of current)if(!previous.has(dimension))unknown.push({dimensions:dimension,reason:'New state has no approved preservation reference',issues:b.inventory.issues});
 return {status:unknown.length?'not-comparable':changes.length?'different':'matched',changes,unknown};
}
export async function preservationResult(config,root,entries,compatibility){
 const options=config.preservation;if(!options?.enabled)return {enabled:false,status:'not-requested',entries:[]};
 const result={schemaVersion:1,enabled:true,enforcement:options.enforcement,compatibility,entries,changes:[],unknown:[],reviewRequired:false};
 if(!entries.length||entries.some(e=>e.inventory.status!=='complete'))return {...result,status:'error',reason:'Requested inventory was missing or incomplete'};
 if(!options.baselinePath)return {...result,status:'needs-reference',reviewRequired:true,reason:'Record a reviewed full inventory explicitly; checks never approve it'};
 const bytes=await readProjectInput(root,options.baselinePath,20_000_000),baseline=JSON.parse(bytes);
 if(baseline.schemaVersion!==1||baseline.kind!=='preservation-reference'||!Array.isArray(baseline.entries)||!baseline.entries.length||baseline.entries.some(e=>e.inventory?.status!=='complete'))throw Error('Invalid preservation reference');
 result.reference={file:options.baselinePath,sha256:digest(bytes)};
 if(baseline.compatibility!==compatibility)return {...result,status:'not-comparable',reviewRequired:true,reason:'Context, route, policy, ready or interaction plan differs from the approved reference'};
 return {...result,...compareInventories(baseline.entries,entries),reviewRequired:true};
}
export async function recordPreservation(reportFile,outFile){
 const report=JSON.parse(await fs.readFile(reportFile,'utf8')),p=report.preservation;
 if(report.scope?.mode!=='full'||report.stages?.some(s=>s.status==='error')||!['suta','lintapple'].every(engine=>report.stages?.some(s=>s.engine===engine&&['complete','findings'].includes(s.status)))||!p?.entries?.length||p.entries.some(e=>e.inventory.status!=='complete'||e.inventory.records.some(r=>r.present===false)||Object.values(e.inventory.tokens).some(v=>!v)))throw Error('Preservation recording requires full completed checkers and complete inventories');
 const manifest={schemaVersion:1,kind:'preservation-reference',sourceReportSha256:digest(await fs.readFile(reportFile)),createdAt:new Date().toISOString(),compatibility:p.compatibility,entries:p.entries};
 await fs.writeFile(outFile,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});return manifest;
}
