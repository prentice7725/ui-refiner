import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import Ajv from 'ajv-draft-04';
import addFormats from 'ajv-formats';
import {reportToSarif} from '../src/sarif.mjs';
import {renderOfflineReport} from '../src/offline-report.mjs';
import {exportHtmlBundle,collectEvidence,exportSarif} from '../src/exporters.mjs';
import {finalizeHandoff,handoffEvidenceMarkdown} from '../src/handoff.mjs';
import {makePreset} from '../src/presets.mjs';
import {reportExitCode} from '../src/result-contract.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const schema=JSON.parse(await fs.readFile(new URL('./schemas/sarif-schema-2.1.0.json',import.meta.url)));
const ajv=new Ajv({strict:false,allErrors:true});addFormats(ajv);const validate=ajv.compile(schema);
const base=()=>({fingerprintVersion:2,version:'0.3.0',automatedStatus:'PASS',status:'REVIEW_REQUIRED',scope:{mode:'full',routes:[]},findings:[],stages:[{engine:'suta',status:'complete'},{engine:'lintapple',status:'complete'}]});
async function temp(fn){const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-export-'));try{await fn(root);}finally{await fs.rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:250});}}
test('SARIF official offline schema provenance and all verdicts',async()=>{
 const bytes=await fs.readFile(new URL('./schemas/sarif-schema-2.1.0.json',import.meta.url)),provenance=JSON.parse(await fs.readFile(new URL('./schemas/provenance.json',import.meta.url)));assert.equal(hash(bytes),provenance.sha256);
 for(const [status,code] of [['PASS',0],['FAIL',1],['ERROR',2],['INCOMPLETE',2],['SCOPED_PASS',3]]){
  const r=base();r.automatedStatus=r.status=status;r.findings=[{engine:'lintapple',rule:'keyboard-operation',selector:'src/fake.ts:4',message:'Button missing keyboard operation',file:'fake.ts',line:4,sourceLocation:{status:'verified',file:'fake.ts',line:4,sha256:'a'.repeat(64)}}];
  const sarif=JSON.parse(JSON.stringify(reportToSarif(r)));assert.ok(validate(sarif),JSON.stringify(validate.errors));assert.equal(sarif.runs[0].invocations[0].exitCode,code);assert.equal(sarif.runs[0].results[0].locations,undefined);assert.equal(reportExitCode(r),code);
 }
 assert.equal(validate({version:'2.1.0',runs:[{tool:{driver:{name:'x'}},results:[{message:{text:'x'},locations:[{physicalLocation:{region:{startLine:0}}}]}]}]}),false);
});
test('source positions require real project bytes and matching anchors; routes respect explicit null',()=>temp(async root=>{
 await fs.writeFile(path.join(root,'app.css'),'body { color: red; }\n');const config=makePreset();config.browser.routes=[{name:'home',url:'/',interactionsPath:null}];config.browser.interactionsPath='missing-plan.json';await fs.writeFile(path.join(root,'config.json'),JSON.stringify(config));
 const r=base();r.findings=[{id:'stable',engine:'suta',rule:'color',file:'app.css',line:1,sourceAnchor:'body { color: red; }',message:'x'},{engine:'suta',file:'app.css',line:1,sourceAnchor:'changed'},{engine:'suta',file:'../outside.css',line:1},{engine:'lintapple',file:'app.css',line:1}];
 await finalizeHandoff(r,{root,config,configFile:path.join(root,'config.json')});assert.equal(r.findings[0].sourceLocation.status,'verified');assert.equal(r.findings[0].id,'stable');for(const f of r.findings.slice(1))assert.equal(f.sourceLocation.status,'unverified');assert.ok(r.reproduction.commandReady);assert.ok(!r.reproduction.inputs.some(i=>i.kind==='interactions'));
 const sarif=JSON.parse(JSON.stringify(reportToSarif(r)));assert.ok(validate(sarif),JSON.stringify(validate.errors));assert.equal(sarif.runs[0].results[0].locations[0].physicalLocation.region.startLine,1);assert.equal(sarif.runs[0].results[1].locations,undefined);
 await finalizeHandoff(r,{root,config});assert.equal(r.reproduction.commandReady,false);
}));
test('HTML escapes untrusted content, blocks unsafe links and marks size limits',()=>{
 const r=base();r.findings=[{engine:'lintapple',rule:'<script>alert(1)</script>',message:'<img src=x onerror=alert(1)>',actual:'x'.repeat(13000),imageEvidence:[{image:'javascript:alert(1).png'}]}];const html=renderOfflineReport(r);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));assert.ok(!html.includes('href="javascript:'));assert.match(html,/Content-Security-Policy/);assert.match(html,/TRUNCATED/);assert.match(html,/&lt;script&gt;/);assert.match(handoffEvidenceMarkdown({handoffDetails:{targets:[{actual:'x'.repeat(4000)}]}}),/TRUNCATED/);
});
test('portable bundle preserves canonical bytes, validates old ARIA and exposes missing/corrupt evidence',()=>temp(async root=>{
 const yaml=Buffer.from('- button "Save"'),png=Buffer.from('PNG fixture bytes'),r=base();
 await fs.writeFile(path.join(root,'old.aria.yml'),Buffer.concat([yaml,Buffer.from('\n')]));await fs.writeFile(path.join(root,'ok.png'),png);await fs.writeFile(path.join(root,'bad.png'),'corrupted');
 r.imageArtifacts=[{file:'ok.png',sha256:hash(png),bytes:png.length},{file:'bad.png',sha256:hash(png),bytes:png.length},{file:'missing.png',sha256:hash(png)}];r.ariaDiff={changed:[{file:'new.aria.yml',sha256:hash(yaml),previousFile:'old.aria.yml',previousSha256:hash(yaml),previousBytes:yaml.length}]};r.artifacts=['../outside.png','x:stream.png'];
 const raw=JSON.stringify(r,null,1)+'\n',reportFile=path.join(root,'report.json');await fs.writeFile(reportFile,raw);const out=path.join(root,'bundle');await exportHtmlBundle(reportFile,out);
 assert.equal(await fs.readFile(path.join(out,'report.json'),'utf8'),raw);assert.equal(await fs.readFile(reportFile,'utf8'),raw);assert.deepEqual(await fs.readFile(path.join(out,'old.aria.yml')),Buffer.concat([yaml,Buffer.from('\n')]));
 const manifest=JSON.parse(await fs.readFile(path.join(out,'evidence-manifest.json'))),entries=manifest.evidence;assert.equal(entries.find(e=>e.file==='ok.png').integrity,'verified');for(const file of ['bad.png','missing.png','../outside.png','x:stream.png'])assert.equal(entries.find(e=>e.file===file).status,'unavailable');assert.match(entries.find(e=>e.file==='bad.png').reason,/hash mismatch/);assert.equal(collectEvidence(r).length,7);await assert.rejects(exportHtmlBundle(reportFile,out),/EEXIST/);
 const alias=entries.find(e=>e.file==='ok.png').bundleFile;assert.ok(alias.length<40);assert.deepEqual(await fs.readFile(path.join(out,alias)),png);
 await assert.rejects(exportSarif(reportFile,reportFile),/must differ/);if(process.platform==='win32')await assert.rejects(exportSarif(reportFile,path.join(root,'REPORT.JSON')),/must differ/);
}));
test('evidence through a directory symlink cannot escape the report tree',()=>temp(async root=>{
 const dir=path.join(root,'reports'),outside=path.join(root,'outside');await fs.mkdir(dir);await fs.mkdir(outside);await fs.writeFile(path.join(outside,'secret.png'),'private');await fs.symlink(outside,path.join(dir,'escape'),process.platform==='win32'?'junction':'dir');
 const r=base();r.artifacts=['escape/secret.png'];const file=path.join(dir,'report.json');await fs.writeFile(file,JSON.stringify(r));const out=path.join(root,'bundle');await exportHtmlBundle(file,out);const manifest=JSON.parse(await fs.readFile(path.join(out,'evidence-manifest.json')));assert.equal(manifest.evidence[0].status,'unavailable');assert.match(manifest.evidence[0].reason,/inside the report directory/);await assert.rejects(fs.access(path.join(out,'escape/secret.png')));
}));
