import fs from 'node:fs/promises';
import path from 'node:path';
import {digest,readProjectInput} from './project-context.mjs';
import {exportHtmlBundle,collectEvidence} from './exporters.mjs';
import {validateReport,safeRelative} from './result-contract.mjs';
export const reviewDomains=['hierarchy','task-clarity','density','typography','states','i18n'];
export async function createReviewPacket(reportFile,outDir){
 const raw=await fs.readFile(reportFile),report=validateReport(JSON.parse(raw));await exportHtmlBundle(reportFile,outDir);
 const sourceReportSha256=digest(raw),inventory=JSON.parse(await fs.readFile(path.join(outDir,'evidence-manifest.json'))).evidence;
 const design={schemaVersion:1,sourceReportSha256,project:report.project,scope:report.scope,context:report.projectContext||{status:'unavailable'},surfaces:report.surfaceGuidance||[],captures:inventory.filter(e=>e.status==='copied').map(e=>({file:e.file,bundleFile:e.bundleFile,sha256:e.sha256,integrity:e.integrity})),domains:reviewDomains,instructions:'Record the purpose-led design assessment before opening detector-input.json or report.html. Inputs are separated, not an enforced execution sandbox. No reviewer/model has been run by this command.'};
 const detector={schemaVersion:1,sourceReportSha256,status:report.status,automatedStatus:report.automatedStatus,stages:report.stages,findings:report.findings,preservation:report.preservation,coverageNote:report.coverageNote};
 await fs.writeFile(path.join(outDir,'design-input.json'),JSON.stringify(design,null,2)+'\n',{flag:'wx'});await fs.writeFile(path.join(outDir,'detector-input.json'),JSON.stringify(detector,null,2)+'\n',{flag:'wx'});
 const manifest={schemaVersion:1,sourceReportSha256,reviewerExecuted:false,isolation:'Separate input files only; independent reviewers must be orchestrated explicitly',automatedVerdictUnchanged:true,domains:reviewDomains};
 await fs.writeFile(path.join(outDir,'review-manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 await fs.writeFile(path.join(outDir,'REVIEW.md'),'# Purpose-led design review\n\n1. Read design-input.json and its evidence first. Record observations without detector findings.\n2. Read detector-input.json and synthesize, preserving both provenance streams.\n3. Return schemaVersion=1, sourceReportSha256, reviewer {kind: human|model, name, executedAt}, assessmentOrder: design-before-detector|combined, and observations[].\n4. Each observation: domain, route, state, basis: captured-evidence|manual, evidence: [recorded file paths], observation, reason, suggestion, confidence: low|medium|high. Manual judgments may have no attachment, but must say manual.\n\nAll accepted observations remain advisory. Review validation checks references and declarations; it cannot prove that a person/model actually ran or stayed isolated. Never infer a release approval from these records.\n',{flag:'wx'});return manifest;
}
export async function validateDesignReview(reviewFile,reportFile){
 const raw=await fs.readFile(reportFile),report=validateReport(JSON.parse(raw)),review=JSON.parse(await fs.readFile(reviewFile)),records=new Map(collectEvidence(report).map(r=>[r.file,r]));
 if(review.schemaVersion!==1||review.sourceReportSha256!==digest(raw))throw Error('Review does not match the exact canonical report');
 if(!['human','model'].includes(review.reviewer?.kind)||typeof review.reviewer.name!=='string'||!review.reviewer.name.trim()||!Number.isFinite(Date.parse(review.reviewer.executedAt)))throw Error('Review needs declared reviewer identity and execution time');
 if(!['design-before-detector','combined'].includes(review.assessmentOrder)||!Array.isArray(review.observations)||review.observations.length>50)throw Error('Invalid assessment order or observations');
 for(const o of review.observations){
  if(!reviewDomains.includes(o.domain)||!['low','medium','high'].includes(o.confidence)||!['captured-evidence','manual'].includes(o.basis)||!Array.isArray(o.evidence)||o.evidence.length>8||o.basis==='captured-evidence'&&!o.evidence.length)throw Error('Invalid review observation or missing evidence');
  for(const k of ['route','state','observation','reason','suggestion'])if(typeof o[k]!=='string'||!o[k].trim()||o[k].length>4000)throw Error('Missing bounded '+k);
  if(!report.scope.routes?.some(r=>r.name===o.route))throw Error('Review route was not in the audit scope');
  for(const file of o.evidence){const ref=records.get(file);if(!safeRelative(file)||!ref)throw Error('Review cites unrecorded evidence');if(ref.route&&ref.route!==o.route||ref.state&&ref.state!==o.state)throw Error('Review evidence route/state does not match observation');const bytes=await readProjectInput(path.dirname(reportFile),file,32_000_000),content=file.endsWith('.aria.yml')?bytes.subarray(0,-1):bytes;const expected=ref.sha256||file.match(/-([a-f0-9]{64})\.png$/)?.[1];if(!expected||digest(content)!==expected)throw Error('Review evidence lacks a verified matching hash');}
 }
 return {schemaVersion:1,status:'accepted-advisory',sourceReportSha256:digest(raw),reviewer:review.reviewer,assessmentOrder:review.assessmentOrder,provenance:'Caller-declared execution/order; not independently attested',observations:review.observations.map(o=>({...o,advisory:true,blocking:false})),automatedStatus:report.automatedStatus,automatedVerdictUnchanged:true};
}
