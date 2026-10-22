import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {ariaTextDiff} from '../src/aria-text-diff.mjs';
import {explainAriaDiff,maskAriaSnapshot,pruneAriaSnapshots} from '../src/aria-evidence.mjs';
import {ariaDiff,ariaReviewDetails} from '../src/reporting.mjs';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {runGate,exitCode} from '../src/gate.mjs';

const viewport={width:390,height:844};
async function temp(fn){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ui-aria-text-'));try{await fn(dir);}finally{await fs.rm(dir,{recursive:true,force:true,maxRetries:20,retryDelay:100});}}
async function snapshot(dir,text,{state='initial',route='home'}={}){
 const sha256=createHash('sha256').update(text).digest('hex');
 const file=`render-${route}-390x844-light-${state}-deadbeef-${sha256.slice(0,16)}.aria.yml`;
 await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,file),text+'\n');
 return {route,viewport,colorScheme:'light',state,file,sha256,bytes:Buffer.byteLength(text)};
}
const edits=diff=>diff.hunks.flatMap(h=>h.lines).filter(l=>l.type!=='context');

test('plain YAML lines expose role/name/selection changes and additions/removals with exact line numbers',()=>{
 const before='- heading "Cart" [level=1]\n- button "Save"\n- tab "Details" [selected]\n- paragraph: Remove me';
 const after='- heading "Cart" [level=1]\n- link "Submit":\n  - /url: /save\n- tab "Details"\n- paragraph: Added item';
 const diff=ariaTextDiff(before,after);
 assert.equal(diff.truncated,false);assert.equal(diff.hunks.length,1);
 assert.deepEqual(edits(diff).filter(l=>l.type==='remove').map(l=>[l.oldLine,l.text]),[[2,'- button "Save"'],[3,'- tab "Details" [selected]'],[4,'- paragraph: Remove me']]);
 assert.deepEqual(edits(diff).filter(l=>l.type==='add').map(l=>[l.newLine,l.text]),[[2,'- link "Submit":'],[3,'  - /url: /save'],[4,'- tab "Details"'],[5,'- paragraph: Added item']]);
 assert.deepEqual([diff.hunks[0].oldStart,diff.hunks[0].oldLines,diff.hunks[0].newStart,diff.hunks[0].newLines],[1,4,1,5]);
});

test('empty sides, repeated lines and separated hunks produce valid text edits without YAML parsing',()=>{
 assert.deepEqual(ariaTextDiff('','- button "New"').hunks.map(h=>[h.oldStart,h.oldLines,h.newStart,h.newLines]),[[0,0,1,1]]);
 assert.deepEqual(ariaTextDiff('- button "Old"','').hunks.map(h=>[h.oldStart,h.oldLines,h.newStart,h.newLines]),[[1,1,0,0]]);
 const lines=Array.from({length:30},(_,i)=>'- paragraph: '+i),after=[...lines];after[2]='- button "Changed"';after[27]='- link "Changed"';
 const diff=ariaTextDiff(lines.join('\n'),after.join('\n'));assert.equal(diff.hunks.length,2);assert.equal(diff.hunks[1].oldStart,25);
 // Full-context application checks edit correctness across duplicates and empty lines.
 const samples=['','x','x\nx','x\ny\nx','\n','a\n\nb','- button "\\\\ and : []"'];
 for(const a of samples)for(const b of samples){
  const d=ariaTextDiff(a,b,{context:100});if(a===b){assert.deepEqual(d.hunks,[]);continue;}
  const restored=d.hunks.flatMap(h=>h.lines).filter(l=>l.type!=='remove').map(l=>l.text);
  assert.deepEqual(restored,b===''?[]:b.split('\n'),JSON.stringify({a,b}));
 }
});

test('bounded replacement, long multilingual lines and batch truncation never claim complete output',()=>{
 const a=Array.from({length:10000},(_,i)=>'old '+i).join('\n'),b=Array.from({length:10000},(_,i)=>'new '+i).join('\n');
 const diff=ariaTextDiff(a,b,{maxLines:10,maxBytes:80});assert.equal(diff.algorithm,'bounded-replacement');assert.equal(diff.truncated,true);assert.ok(diff.outputBytes<=80);assert.ok(diff.omittedLines>19900);
 assert.equal(diff.hunks[0].oldLines,10000);assert.equal(diff.hunks[0].newLines,10000);
 const unicode=ariaTextDiff('old','日本語한국어'.repeat(100),{maxLineBytes:20});assert.equal(unicode.truncated,true);assert.ok(!edits(unicode).at(-1).text.includes('\uFFFD'));assert.ok(Buffer.byteLength(edits(unicode).at(-1).text)<=20);
});

test('explanations verify evidence hashes, link both sides and preserve old files during GC',()=>temp(async dir=>{
 const before=await snapshot(dir,'- button "Save"'),after=await snapshot(dir,'- button "Saved"');
 const diff=await explainAriaDiff(dir,ariaDiff({ariaSnapshots:[before]},[after]));
 assert.equal(diff.textSummary.compared,1);assert.equal(diff.changed[0].previousSha256,before.sha256);
 assert.equal(diff.changed[0].textDiff.oldFile,before.file);assert.equal(diff.changed[0].textDiff.newFile,after.file);
 const markdown=ariaReviewDetails(diff);assert.ok(markdown.includes('Previous YAML'));assert.ok(markdown.includes('Current YAML'));assert.match(markdown,/@@ -1,1 \+1,1 @@/);
 assert.match(markdown,/-\- button "Save"/);assert.match(markdown,/\+\- button "Saved"/);
 await pruneAriaSnapshots(dir,[{ariaDiff:diff}]);await fs.access(path.join(dir,before.file));await fs.access(path.join(dir,after.file));
 await fs.writeFile(path.join(dir,before.file),'tampered\n');
 const corrupt=await explainAriaDiff(dir,ariaDiff({ariaSnapshots:[before]},[after]));assert.equal(corrupt.changed[0].textDiff.status,'unavailable');assert.match(corrupt.changed[0].textDiff.reason,/hash mismatch/);
 await fs.unlink(path.join(dir,before.file));
 const missing=await explainAriaDiff(dir,ariaDiff({ariaSnapshots:[before]},[after]));assert.match(missing.changed[0].textDiff.reason,/missing/);
}));

test('added/removed dimensions, unavailable comparisons and explanation limits are explicit',()=>temp(async dir=>{
 const old=await snapshot(dir,'- button "Old"',{route:'removed'}),added=await snapshot(dir,'- button "New"',{route:'added'}),same=await snapshot(dir,'- main',{route:'same'});
 const diff=await explainAriaDiff(dir,ariaDiff({ariaSnapshots:[old,same]},[added,same]));
 assert.equal(diff.added[0].textDiff.oldFile,null);assert.equal(diff.removed[0].textDiff.newFile,null);
 assert.equal(edits(diff.added[0].textDiff)[0].type,'add');assert.equal(edits(diff.removed[0].textDiff)[0].type,'remove');
 const bounded=await explainAriaDiff(dir,ariaDiff({ariaSnapshots:[old,same]},[added,same]),{maxComparisons:1});
 assert.equal(bounded.textSummary.notGenerated,1);assert.equal(bounded.removed[0].textDiff.status,'not-generated');assert.match(ariaReviewDetails(bounded),/batch limit/);
 assert.match(ariaReviewDetails(diff,{maxComparisons:1}),/TRUNCATED/);
 const unavailable=ariaDiff(null,[added],'ARIA context changed');await explainAriaDiff(dir,unavailable);assert.equal(unavailable.status,'unavailable');assert.equal(unavailable.textSummary,undefined);
 const unsafe=ariaDiff({ariaSnapshots:[{...old,file:'../outside.aria.yml'}]},[{...old,sha256:added.sha256,file:added.file}]);
 await explainAriaDiff(dir,unsafe);assert.match(unsafe.changed[0].textDiff.reason,/Invalid ARIA evidence path/);
}));

test('Markdown evidence cannot close its diff fence; view limits and per-line limits are visible',()=>temp(async dir=>{
 const before=await snapshot(dir,'- button "Old"'),after=await snapshot(dir,'- button "```\\n# forged heading"\n- paragraph: '+ '長'.repeat(3000));
 const diff=await explainAriaDiff(dir,ariaDiff({ariaSnapshots:[before]},[after]));
 const markdown=ariaReviewDetails(diff);assert.ok(markdown.includes('````diff'));assert.ok(markdown.includes('line truncated'));assert.match(markdown,/TRUNCATED/);
 assert.match(ariaReviewDetails(diff,{maxBytes:500}),/Markdown output limit/);
}));

test('explicit time masks stabilize text while role/name/selected changes remain visible',()=>{
 const masks=[{pattern:'\\d{2}:\\d{2}:\\d{2}',flags:'g'}];
 const before=maskAriaSnapshot('- paragraph: 12:30:00\n- tab "Summary" [selected]',masks);
 const clock=maskAriaSnapshot('- paragraph: 12:30:01\n- tab "Summary" [selected]',masks);
 assert.deepEqual(ariaTextDiff(before,clock).hunks,[]);
 assert.ok(edits(ariaTextDiff(before,maskAriaSnapshot('- paragraph: 12:30:01\n- tab "Details"',masks))).some(l=>l.text.includes('Details')));
});

test('gate publishes advisory explanations without changing blockers or human review; masks cannot suppress actual findings',()=>temp(async root=>{
 const config=makePreset();config.browser.captureAriaSnapshots=true;config.browser.ariaSnapshotMasks=[{pattern:'\\d{2}:\\d{2}:\\d{2}',flags:'g'}];
 await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy));
 let text='- button "Save"',findings=[];
 const browserRunner=async()=>{const s=await snapshot(path.join(root,config.reportDir),maskAriaSnapshot(text,config.browser.ariaSnapshotMasks));return {findings,artifacts:[s.file],ariaSnapshots:[s]};};
 const run=()=>runGate({root,config,staticRunner:async()=>({findings:[]}),browserRunner});
 await run();text='- link "Submit"';let report=await run();assert.equal(report.automatedStatus,'PASS');assert.equal(report.status,'REVIEW_REQUIRED');assert.equal(exitCode(report),0);assert.equal(report.ariaDiff.textSummary.compared,1);
 assert.match(await fs.readFile(path.join(root,config.reportDir,'report.md'),'utf8'),/\+\- link "Submit"/);
 assert.match(await fs.readFile(path.join(root,config.reportDir,'AGENT_HANDOFF.md'),'utf8'),/Previous YAML/);
 findings=[{engine:'lintapple',rule:'text-contrast',severity:'error',selector:'#clock',viewport,colorScheme:'light',actual:'1:1',expected:'4.5:1',identity:{key:'#clock',stable:true}},{engine:'lintapple',rule:'keyboard-operation',severity:'error',selector:'#action',viewport,colorScheme:'light',identity:{key:'#action',stable:true}}];
 text='- paragraph: 12:30:01';report=await run();assert.equal(report.automatedStatus,'FAIL');assert.equal(report.summary.blockers,2);
 text='- paragraph: 12:30:02';report=await run();assert.equal(report.ariaDiff.changed.length,0);assert.equal(report.automatedStatus,'FAIL');assert.equal(report.summary.blockers,2);
 config.browser.ariaSnapshotMasks=[];report=await run();assert.equal(report.ariaDiff.status,'unavailable');assert.equal(report.automatedStatus,'FAIL');
 config.browser.captureScreenshots=true;text='- button "New state"';
 report=await runGate({root,config,staticRunner:async()=>({findings:[]}),browserRunner,captureRunner:async()=>{throw Error('Requested image failed');}});
 assert.equal(report.automatedStatus,'ERROR');assert.equal(report.ariaDiff.status,'unavailable');assert.equal(report.ariaDiff.textSummary,undefined);assert.match(report.ariaDiff.reason,/Current report did not complete/);
}));
