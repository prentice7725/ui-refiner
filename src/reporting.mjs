import {findingEvidence} from './normalize.mjs';
const unique=xs=>[...new Set(xs)];
const key=f=>JSON.stringify([f.engine,f.rule,f.actual??f.sourceAnchor??f.message,f.expected??'',f.fix,f.baselined]);
export function groupFindings(findings){
 const groups=new Map();
 for(const f of findings){const k=key(f);if(!groups.has(k))groups.set(k,{engine:f.engine,rule:f.rule,actual:f.actual,expected:f.expected,fix:f.fix,baselined:f.baselined,findings:[]});groups.get(k).findings.push(f);}
 return [...groups.values()].map(g=>({...g,count:g.findings.length,locations:unique(g.findings.map(f=>f.selector||f.file||f.location)),viewports:unique(g.findings.map(f=>f.viewport?`${f.viewport.width}x${f.viewport.height}`:'source')),states:unique(g.findings.map(f=>f.state||'initial')),themes:unique(g.findings.map(f=>f.colorScheme||'source'))}));
}
const short=(xs,n=4)=>xs.slice(0,n).join(', ')+(xs.length>n?` (+${xs.length-n}; all in report.json)`:'');
export function groupedHandoff(findings){
 return groupFindings(findings.filter(f=>!f.baselined)).map(g=>`- [ ] ${g.engine}/${g.rule}: ${g.fix||g.findings[0].message} (${g.count} findings)\n  ${findingEvidence(g.findings[0])}\n  Targets: ${short(g.locations)}; viewports: ${short(g.viewports)}; states: ${short(g.states)}; themes: ${short(g.themes)}${g.findings.some(f=>!f.baselineEligible)?'\n  Some identities are ambiguous; they cannot be baselined.':''}`).join('\n');
}
export function reportDiff(previous,current){
 if(!previous||previous.fingerprintVersion!==2||!Array.isArray(previous.findings))return {status:'unavailable',reason:'no compatible previous report',resolved:[],added:[],persisting:[]};
 const before=new Map(previous.findings.map(f=>[f.id,f])),after=new Map(current.map(f=>[f.id,f]));
 return {status:'compared',resolved:[...before].filter(([id])=>!after.has(id)).map(([,f])=>f),added:[...after].filter(([id])=>!before.has(id)).map(([,f])=>f),persisting:[...after].filter(([id])=>before.has(id)).map(([,f])=>f)};
}
export function compactCoverage(stages){
 const rows=stages.flatMap(s=>s.ruleCoverage||[]),groups=new Map();
 for(const c of rows){const key=JSON.stringify([c.rule,c.status,c.targets]);if(!groups.has(key))groups.set(key,{...c,runs:0});groups.get(key).runs++;}
 return [...groups.values()].map(c=>`- ${c.rule}: ${c.status}, targets=${c.targets??'unknown'} (${c.runs} viewport/theme/state checks; details in report.json)`).join('\n');
}
export function visualReviewPacket(report){
 return `# Visual review — advisory only\n\nNo model has been executed by UI Refiner. Use these captured images and the project SOT for an optional external review; its output never changes gate status. Human approval remains required.\n\n## Evidence\n\n${report.artifacts.map(a=>`- ${a}`).join('\n')||'- No images captured; rerun with browser.captureScreenshots enabled.'}\n\n## Review checklist\n\n- Identify the primary action and check information hierarchy.\n- Check competing emphasis, spacing rhythm, redundant decoration and consistency with approved art direction.\n- Inspect long Korean/Japanese/English copy, mobile wrapping, error/empty/loading states and keyboard focus.\n- Tie each advisory observation to a screenshot/state and a concrete target. Do not weaken policy or suppress measured accessibility violations.\n`;
}
