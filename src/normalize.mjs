import {groupFindings,compactCoverage} from './reporting.mjs';
import {createHash} from 'node:crypto';
function hash(x){return createHash('sha256').update(x).digest('hex').slice(0,20);}
function string(v){return typeof v==='string'?v:String(v??'');}
export function normalizeStatic(raw){
  if(!raw||!Array.isArray(raw.findings))throw new Error('Invalid suta JSON: findings missing');
  for(const f of raw.findings)if(!f || !['error','warn'].includes(f.severity) || typeof f.rule!=='string' || typeof f.file!=='string' || !Number.isInteger(f.line))throw new Error('Invalid suta finding structure');
  return raw.findings.map(x=>({engine:'suta',rule:string(x.rule),severity:x.severity==='error'?'error':'warning',file:string(x.file).replaceAll('\\','/'),line:x.line,lines:x.lines,sourceAnchor:x.sourceAnchor,location:`${string(x.file)}:${x.line??'?'}`,message:string(x.message),fix:string(x.fix)}));
}
export function normalizeBrowser(raw){
  if(!raw||!Array.isArray(raw.findings)||!Array.isArray(raw.runs)||raw.runs.length===0)throw new Error('Invalid lintapple JSON: no completed browser runs');
  for(const f of raw.findings)if(!f || typeof f.rule!=='string' || typeof f.selector!=='string' || !f.viewport || !Number.isInteger(f.viewport.width))throw new Error('Invalid lintapple finding structure');
  return raw.findings.map(x=>({engine:'lintapple',rule:string(x.rule),severity:'error',location:`${string(x.selector)} @ ${x.viewport?.width??'?'}px ${string(x.colorScheme)} ${string(x.state||'initial')}`,message:string(x.message),fix:string(x.fix),actual:x.actual,expected:x.expected,selector:x.selector,relatedSelector:x.relatedSelector,viewport:x.viewport,colorScheme:x.colorScheme,state:x.state||'initial',identity:x.identity,relatedIdentity:x.relatedIdentity,pseudo:x.pseudo,details:{...x}}));
}
export const fingerprintVersion = 2;
export function identify(findings){
  const identified = findings.map(x=>{
    const stable = x.engine === 'suta' ? !!x.sourceAnchor :
      x.identity?.stable === true && (!x.relatedIdentity || x.relatedIdentity.stable === true);
    const key = x.engine === 'suta' ? [x.file || x.location.replace(/:\d+$/, ''), x.sourceAnchor] :
      [x.identity?.key, x.relatedIdentity?.key, x.pseudo || '', [x.viewport?.width,x.viewport?.height], x.colorScheme, x.state || 'initial'];
    return {...x, fingerprintVersion, baselineEligible:stable,
      id:hash(JSON.stringify([fingerprintVersion,x.engine,x.rule,...key,...(stable?[]:[x.location])]))};
  });
  // Do not silently baseline indistinguishable findings as one item.
  const counts = new Map();
  for(const f of identified) counts.set(f.id,(counts.get(f.id)||0)+1);
  return identified.map(f=>({...f,baselineEligible:f.baselineEligible && counts.get(f.id)===1}));
}
export function browserCoverage(raw){
  return raw.runs.flatMap(run=>(run.states?.length ? run.states : [{name:'initial',...run}]).flatMap(state=>
    ['layout-alignment','layout-gap','control-gap','nested-radius','control-inset'].map(rule=>{
      const legacy = {'layout-alignment':'alignmentGroups','nested-radius':'radiusContracts','control-inset':'insetControls'};
      const targets = state.ruleCoverage?.[rule] ?? state[legacy[rule]];
      return {rule,viewport:run.viewport,colorScheme:run.colorScheme,state:state.name||'initial',
        targets:targets ?? null,status:targets === undefined ? 'unknown' : targets === 0 ? 'not-tested' : 'tested'};
    })));
}
export function findingEvidence(f){
  return [f.message, f.actual !== undefined ? `Actual: ${JSON.stringify(f.actual)}` : '',
    f.expected !== undefined ? `Expected: ${JSON.stringify(f.expected)}` : '',
    f.relatedSelector ? `Related: ${f.relatedSelector}` : ''].filter(Boolean).join(' — ');
}
export function count(findings){return {errors:findings.filter(f=>f.severity==='error').length,warnings:findings.filter(f=>f.severity==='warning').length};}
export function toMarkdown(report){
  const rows=groupFindings(report.findings).map(g=>`| ${g.existingBrowserDebt?'existing/outside scope':g.baselined?'existing':g.findings[0].severity} | ${escapeCell(g.engine+'/'+g.rule)} (${g.count}) | ${escapeCell(g.locations.slice(0,4).join(', '))}${g.locations.length>4?' (more in report.json)':''} | ${escapeCell(g.fix)+'<br>'+escapeCell(findingEvidence(g.findings[0]))} |`);
  return [`# UI Refiner UI QA — ${report.status}`,``, `- Project: ${report.project}` ,`- Profile: ${report.preset}`,`- Automated: ${report.automatedStatus}`,`- Human visual review: ${report.manualVisualReview?'REQUIRED':'not configured'}`,`- New blocking findings: ${report.summary.blockers}`,`- Existing baseline findings: ${report.summary.baselined}`,`- Total: ${report.summary.total}`,`- Scope: ${report.scope?.mode||'full'}`,`- Compared to previous run: ${report.diff?.status||'unavailable'}; resolved=${report.diff?.resolved.length||0}, added=${report.diff?.added.length||0}, persisting=${report.diff?.persisting.length||0}`,``, `## Coverage`,``,...report.stages.map(s=>`- ${s.engine}: ${s.status}${s.enforcement==='advisory'?' (advisory)':''}${s.error?` — ${s.error}`:''}`),``,compactCoverage(report.stages),``,`## Findings`,``,`| Status | Rule | Location | Suggested fix |`,`|---|---|---|---|`,...(rows.length?rows:['| — | — | — | — |']),``,`## Agent handoff`,``,report.handoff,``].join('\n');
}
function escapeCell(x){return string(x).replace(/\|/g,'\\|').replace(/[\r\n]+/g,' ');}
