import {createHash} from 'node:crypto';
function hash(x){return createHash('sha256').update(x).digest('hex').slice(0,20);}
function string(v){return typeof v==='string'?v:String(v??'');}
export function normalizeStatic(raw){
  if(!raw||!Array.isArray(raw.findings))throw new Error('Invalid suta JSON: findings missing');
  for(const f of raw.findings)if(!f || !['error','warn'].includes(f.severity) || typeof f.rule!=='string' || typeof f.file!=='string' || !Number.isInteger(f.line))throw new Error('Invalid suta finding structure');
  return raw.findings.map(x=>({engine:'suta',rule:string(x.rule),severity:x.severity==='error'?'error':'warning',location:`${string(x.file)}:${x.line??'?'}`,message:string(x.message),fix:string(x.fix)}));
}
export function normalizeBrowser(raw){
  if(!raw||!Array.isArray(raw.findings)||!Array.isArray(raw.runs)||raw.runs.length===0)throw new Error('Invalid lintapple JSON: no completed browser runs');
  for(const f of raw.findings)if(!f || typeof f.rule!=='string' || typeof f.selector!=='string' || !f.viewport || !Number.isInteger(f.viewport.width))throw new Error('Invalid lintapple finding structure');
  return raw.findings.map(x=>({engine:'lintapple',rule:string(x.rule),severity:'error',location:`${string(x.selector)} @ ${x.viewport?.width??'?'}px ${string(x.colorScheme)} ${string(x.state||'initial')}`,message:string(x.message),fix:string(x.fix)}));
}
export function identify(findings){return findings.map(x=>({...x,id:hash([x.engine,x.rule,x.location,x.message].join('\x00'))}));}
export function count(findings){return {errors:findings.filter(f=>f.severity==='error').length,warnings:findings.filter(f=>f.severity==='warning').length};}
export function toMarkdown(report){
  const rows=report.findings.map(f=>`| ${f.baselined?'existing':f.severity} | ${escapeCell(f.engine+'/'+f.rule)} | ${escapeCell(f.location)} | ${escapeCell(f.fix||f.message)} |`);
  return [`# UI Refiner UI QA — ${report.status}`,``, `- Project: ${report.project}` ,`- Profile: ${report.preset}`,`- Automated: ${report.automatedStatus}`,`- Human visual review: ${report.manualVisualReview?'REQUIRED':'not configured'}`,`- New blocking findings: ${report.summary.blockers}`,`- Existing baseline findings: ${report.summary.baselined}`,`- Total: ${report.summary.total}`,``, `## Coverage`,``,...report.stages.map(s=>`- ${s.engine}: ${s.status}${s.enforcement==='advisory'?' (advisory)':''}${s.error?` — ${s.error}`:''}`),``,`## Findings`,``,`| Status | Rule | Location | Suggested fix |`,`|---|---|---|---|`,...(rows.length?rows:['| — | — | — | — |']),``,`## Agent handoff`,``,report.handoff,``].join('\n');
}
function escapeCell(x){return string(x).replace(/\|/g,'\\|').replace(/[\r\n]+/g,' ').slice(0,300);}
