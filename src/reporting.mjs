const unique=xs=>[...new Set(xs)];
const key=f=>JSON.stringify([f.engine,f.rule,!!f.advisory,f.reviewedException?.reason,f.actual??f.sourceAnchor??f.message,f.expected??'',f.fix,f.baselined,!!f.existingBrowserDebt,!!f.blocking]);
export function groupFindings(findings){
 const groups=new Map();
 for(const f of findings){const k=key(f);if(!groups.has(k))groups.set(k,{engine:f.engine,rule:f.rule,actual:f.actual,expected:f.expected,fix:f.fix,baselined:f.baselined,reviewedException:f.reviewedException,existingBrowserDebt:f.existingBrowserDebt,blocking:f.blocking,findings:[]});groups.get(k).findings.push(f);}
 return [...groups.values()].map(g=>({...g,count:g.findings.length,locations:unique(g.findings.map(f=>(f.route?f.route+' / ':'')+(f.selector||f.file||f.location))),routes:unique(g.findings.map(f=>f.route||'default')),viewports:unique(g.findings.map(f=>f.viewport?`${f.viewport.width}x${f.viewport.height}`:'source')),states:unique(g.findings.map(f=>f.state||'initial')),themes:unique(g.findings.map(f=>f.colorScheme||'source'))}));
}
const clip=(x,n=120)=>{const s=String(x??'').replace(/[\r\n]+/g,' ');return s.length>n?s.slice(0,n-1)+'…':s;};
const shortEvidence=f=>[f.actual!==undefined?`Actual: ${clip(JSON.stringify(f.actual),220)}`:clip(f.message,240),f.expected!==undefined?`Expected: ${clip(JSON.stringify(f.expected),220)}`:''].filter(Boolean).join(' — ');
const priority=f=>(f.blocking===true||f.blocking===undefined&&f.severity==='error')?0:f.severity==='error'?1:f.severity==='warning'?2:3;
const short=(xs,n=4)=>xs.slice(0,n).map(x=>clip(x)).join(', ')+(xs.length>n?` (+${xs.length-n}; all in report.json)`:'');
export function groupedHandoff(findings){
 const groups=groupFindings(findings.filter(f=>!f.baselined&&!f.existingBrowserDebt&&!f.reviewedException)).sort((a,b)=>Math.min(...a.findings.map(priority))-Math.min(...b.findings.map(priority)));
 const rows=[];let bytes=0;
 for(const g of groups){
  const targets=unique(g.findings.map(f=>(f.route?f.route+' / ':'')+targetHint(f)));
  const row=`- [ ] ${g.findings.some(f=>priority(f)===0)?'[blocker] ':''}${g.engine}/${g.rule}: ${clip(g.fix||g.findings[0].message,240)} (${g.count} findings)
  ${g.findings[0].advisory?'Advisory only. ':''}${shortEvidence(g.findings[0])}
  Targets: ${short(targets)}; viewports: ${short(g.viewports)}; states: ${short(g.states)}; themes: ${short(g.themes)}${g.findings.some(f=>!f.baselineEligible)?'\n  Some identities are ambiguous; use stable markers. Full selectors/identities: report.json.':''}`;
  const size=Buffer.byteLength(row,'utf8');if(bytes+size>5200)break;
  rows.push(row);bytes+=size;
 }
 if(rows.length<groups.length){
  const omitted=groups.slice(rows.length),blocked=omitted.filter(g=>g.findings.some(f=>priority(f)===0));
  rows.push(`- Inspect ${omitted.length} additional root-cause groups in report.json before finishing repairs. Omitted blocker groups: ${blocked.length}${blocked.length?' ('+short(unique(blocked.map(g=>g.rule)),8)+')':''}. All findings and full selectors are preserved there.`);
 }
 return rows.join('\n');
}
export function targetHint(f){
 const identity=f.identity?.key;
 if(identity){
  // Semantic identity is machine data, not a human-facing selector.
  const split=identity.indexOf(' / [');
  if(split>=0){
   try{
    const [tag,role,name,type,label,href,text]=JSON.parse(identity.slice(split+3));
    return [tag,role?`role=${clip(role,32)}`:'',label||text?JSON.stringify(clip(label||text,64)):name?`name=${clip(name,32)}`:href?`href=${clip(href,48)}`:type?`type=${clip(type,24)}`:''].filter(Boolean).join(' ');
   }catch{}
  }else return identity;
 }
 return compactSelector(f.selector)||f.file||f.location;
}
function compactSelector(selector){
 if(!selector)return '';
 const markers=selector.match(/\[(?:data-ui-id|data-testid|data-qa|id)=[^\]]+\]/g);
 if(markers?.length)return markers[markers.length-1];
 return selector.split(' > ').slice(-3).map(s=>s.replace(/:nth-of-type\(\d+\)/g,'')).join(' > ');
}
export function reportDiff(previous,current){
 if(!previous||previous.fingerprintVersion!==2||!Array.isArray(previous.findings))return {status:'unavailable',reason:'no compatible previous report',resolved:[],added:[],persisting:[]};
 const before=new Map(previous.findings.map(f=>[f.id,f])),after=new Map(current.map(f=>[f.id,f]));
 return {status:'compared',resolved:[...before].filter(([id])=>!after.has(id)).map(([,f])=>f),added:[...after].filter(([id])=>!before.has(id)).map(([,f])=>f),persisting:[...after].filter(([id])=>before.has(id)).map(([,f])=>f)};
}
export function ariaDiff(previous,current){
 const empty={status:'unavailable',changed:[],added:[],removed:[],unchanged:[]};
 if(!current.length||!previous?.ariaSnapshots?.length)return empty;
 const key=s=>JSON.stringify([s.routeKey||s.route||'default',s.viewport.width,s.viewport.height,s.colorScheme,s.state]);
 const before=new Map(previous.ariaSnapshots.map(s=>[key(s),s])),after=new Map(current.map(s=>[key(s),s]));
 return {status:'compared',changed:[...after].filter(([k,s])=>before.has(k)&&before.get(k).sha256!==s.sha256).map(([k,s])=>({...s,previousFile:before.get(k).file})),added:[...after].filter(([k])=>!before.has(k)).map(([,s])=>s),removed:[...before].filter(([k])=>!after.has(k)).map(([,s])=>s),unchanged:[...after].filter(([k,s])=>before.get(k)?.sha256===s.sha256).map(([,s])=>s)};
}
export function ariaReviewSummary(diff){
 return `ARIA structure (advisory): ${diff?.status||'unavailable'}; changed=${diff?.changed.length||0}, added=${diff?.added.length||0}, removed=${diff?.removed.length||0}. Compare previousFile and file in report.json; a structure change is not automatically a defect.`;
}
export function compactCoverage(stages){
 const rows=stages.flatMap(s=>s.ruleCoverage||[]),groups=new Map();
 for(const c of rows){const key=JSON.stringify([c.rule,c.status,c.targets]);if(!groups.has(key))groups.set(key,{...c,runs:0});groups.get(key).runs++;}
 const listenerRows=stages.flatMap(s=>s.clickListenerCoverage||[]);
 const listeners=[...new Set(listenerRows.map(c=>`click listener discovery: ${c.status||'unknown'}; inspected=${c.inspected??'?'}; cap=${c.limit??'?'}; priority=${c.priority||'unspecified'}; delegated handlers need explicit markers/plans`))].map(c=>`- ${c}`);
 const budgets=stages.filter(s=>s.budgets).map(s=>`- Browser timeouts: step=${s.budgets.stepTimeoutMs}ms; session=${s.budgets.sessionTimeoutMs}ms (${s.budgets.sessionTimeoutSource}); routes=${s.budgets.routeCount||1}, planned runs=${s.budgets.plannedRuns}`);
 return [...groups.values()].map(c=>`- ${c.rule}: ${c.status}, targets=${c.targets??'unknown'} (${c.runs} viewport/theme/state checks; details in report.json)`).concat(listeners,budgets).join('\n');
}
export function visualReviewPacket(report){
 return `# Visual review — advisory only\n\nNo model has been executed by UI Refiner. Use these captured images and the project SOT for an optional external review; its output never changes gate status. Human approval remains required.\n\n## Evidence\n\n${report.artifacts.map(a=>`- ${a}`).join('\n')||'- No images captured; rerun with browser.captureScreenshots enabled.'}\n\n## Review checklist\n\n- Identify the primary action and check information hierarchy.\n- Check competing emphasis, spacing rhythm, redundant decoration and consistency with approved art direction.\n- Inspect long Korean/Japanese/English copy, mobile wrapping, error/empty/loading states and keyboard focus.\n- Tie each advisory observation to a screenshot/state and a concrete target. Do not weaken policy or suppress measured accessibility violations.\n`;
}
