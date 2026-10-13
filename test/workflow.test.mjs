import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {groupedHandoff,groupFindings,reportDiff} from '../src/reporting.mjs';
import {makePreset,makePolicy,lintapplePolicy} from '../src/presets.mjs';
import {runGate,exitCode,baselineFromReport} from '../src/gate.mjs';
import {spawnBounded,staticAuditPath} from '../src/execute.mjs';
import {gitChangedLines,parseChangedDiff} from '../src/changed.mjs';
import {repoRoot,sutaCopyDrift,upstreamCheck} from '../src/vendor.mjs';
async function temp(fn){const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-workflow-'));try{await fn(root);}finally{await fs.rm(root,{recursive:true,force:true});}}
const git=async(root,args)=>{const r=await spawnBounded('git',args,{cwd:root});assert.equal(r.code,0,r.stderr);return r;};
test('24 inherited-font findings become one actionable root cause while preserving all identities',()=>{
 const findings=Array.from({length:24},(_,i)=>({id:String(i),engine:'lintapple',rule:'font-family',actual:'Arial',expected:'system-ui',fix:'Use approved font',message:'Found Arial',selector:`#text-${i%12}`,location:`#text-${i%12} @ ${i<12?390:1440}px`,viewport:{width:i<12?390:1440,height:900},baselineEligible:true}));
 const grouped=groupFindings(findings);assert.equal(grouped.length,1);assert.equal(grouped[0].count,24);assert.equal(grouped[0].locations.length,12);
 const handoff=groupedHandoff(findings);assert.equal((handoff.match(/- \[ \]/g)||[]).length,1);assert.match(handoff,/Arial/);assert.match(handoff,/390x900, 1440x900/);
 assert.equal(reportDiff({fingerprintVersion:2,findings:findings.slice(0,20)},findings.slice(4)).resolved.length,4);
});
test('locale policies derive from canonical upstream policy without mutating it',async()=>{
 assert.deepEqual(lintapplePolicy,JSON.parse(await fs.readFile(path.join(repoRoot,'vendor/lintapple/ui-policy.json'),'utf8')));
 const jp=makePolicy('ja-JP');assert.ok(jp.fonts.includes('Noto Sans JP'));assert.ok(jp.fonts.includes('Meiryo'));assert.ok(jp.bannedCopy.some(s=>/シームレス/.test(s)));assert.ok(!lintapplePolicy.fonts.includes('Meiryo'));
 assert.ok(makePolicy('ko-KR').fonts.includes('Noto Sans KR'));assert.throws(()=>makePolicy('zz-ZZ'),/Unsupported locale/);
});
test('changed-line scope ignores old debt, includes tracked + staged + untracked files, and cannot claim full PASS',()=>temp(async root=>{
 await git(root,['init','-q']);await fs.mkdir(path.join(root,'src'));await fs.writeFile(path.join(root,'src/app.css'),'button { transition: all 300ms ease; }\np { color: red; }\n');
 await git(root,['add','.']);await git(root,['-c','user.name=test','-c','user.email=test@example.invalid','commit','-qm','initial']);
 await fs.writeFile(path.join(root,'src/app.css'),'button { transition: all 300ms ease; }\np { color: blue; }\n');
 await git(root,['add','src/app.css']);await fs.writeFile(path.join(root,'src/new.css'),'h1 { color: black; }\n');
 await fs.writeFile(path.join(root,'outside.css'),'p { color: red; }');
 const changes=await gitChangedLines(root);assert.ok(changes.get('src/app.css').has(2));assert.equal(changes.get('src/new.css'),null);
 const c=makePreset();c.browser.enabled=false;
 const report=await runGate({root,config:c,changedOnly:true,staticRunner:async scoped=>{assert.ok(scoped.static.targets.every(f=>f.startsWith('src/')));return {findings:[{engine:'suta',rule:'old',severity:'error',file:'src/app.css',line:1,location:'src/app.css:1',sourceAnchor:'old',message:'old debt'}]};}});
 assert.equal(report.findings.length,0);assert.equal(report.automatedStatus,'INCOMPLETE');assert.equal(exitCode(report),2);
 await assert.rejects(()=>baselineFromReport(path.join(root,c.reportDir,'report.json'),path.join(root,'baseline.json')),/full/);
 await assert.rejects(()=>gitChangedLines(root,{base:'--all'}),/Invalid --base/);
 assert.equal(parseChangedDiff('+++ b/deleted.css\n@@ -1 +0,0 @@\n').get('deleted.css').size,0);
}));
test('next report records resolved/new/persisting findings and retains the previous evidence',()=>temp(async root=>{
 const c=makePreset();let findings=[{engine:'suta',rule:'a',file:'src/a.css',line:1,location:'src/a.css:1',sourceAnchor:'a',severity:'error',message:'a'}];
 const options={root,config:c,staticRunner:async()=>({findings}),browserRunner:async()=>({findings:[]})};
 await runGate(options);findings=[{...findings[0],rule:'b',sourceAnchor:'b'}];const current=await runGate(options);
 assert.equal(current.diff.status,'compared');assert.equal(current.diff.resolved.length,1);assert.equal(current.diff.added.length,1);assert.equal(current.diff.persisting.length,0);
 assert.ok((await fs.readFile(path.join(root,c.reportDir,'previous-report.json'),'utf8')).includes('"rule": "a"'));
}));
test('browser and subprocess timeout covers hung execution instead of merely navigation',async()=>{
 const start=Date.now();const r=await spawnBounded(process.execPath,['-e','setInterval(()=>{},1000)'],{timeoutMs:100});assert.equal(r.error,'timeout');assert.ok(Date.now()-start<3000);
});
test('bundled suta is the default runtime and doctor can identify stale guidance copies',()=>temp(async root=>{
 assert.equal(makePreset().static.auditPath,'bundled');assert.equal(staticAuditPath(makePreset(),root),path.join(repoRoot,'vendor/suta/skills/suta/scripts/audit.mjs'));
 assert.equal(await sutaCopyDrift(root),null);await fs.mkdir(path.join(root,'.agents/skills/suta'),{recursive:true});await fs.writeFile(path.join(root,'.agents/skills/suta/SKILL.md'),'stale');assert.ok((await sutaCopyDrift(root)).includes('SKILL.md'));
}));
test('installed post-edit hook preserves existing Claude hooks and catches only added violations',()=>temp(async root=>{
 await fs.mkdir(path.join(root,'.claude'));await fs.writeFile(path.join(root,'.claude/settings.json'),JSON.stringify({custom:true,hooks:{PostToolUse:[{matcher:'Read',hooks:[{type:'command',command:'echo existing'}]}]}}));
 const r=await spawnBounded(process.execPath,[path.join(repoRoot,'scripts/install-agent-skill.mjs'),root]);assert.equal(r.code,0,r.stderr);
 const settings=JSON.parse(await fs.readFile(path.join(root,'.claude/settings.json'),'utf8'));assert.equal(settings.custom,true);assert.equal(settings.hooks.PostToolUse.length,1);
 const local=JSON.parse(await fs.readFile(path.join(root,'.claude/settings.local.json'),'utf8'));assert.equal(local.hooks.PostToolUse.length,1);assert.equal(local.env.UI_REFINER_HOME,repoRoot);
 const wrapper=path.join(root,'.agents/skills/ui-refiner-agent/scripts/post-edit-hook.mjs');assert.ok((await fs.readFile(wrapper,'utf8')).includes('scripts/post-edit-hook.mjs'));
 const file=path.join(root,'app.css');await fs.writeFile(file,'button { transition: all 300ms ease; }\np { color: blue; }\n');
 const payload=JSON.stringify({cwd:root,tool_input:{file_path:file,new_string:'p { color: blue; }'}});
 const {spawnSync}=await import('node:child_process');let result=spawnSync(process.execPath,[wrapper],{input:payload,encoding:'utf8',env:{...process.env,UI_REFINER_HOME:repoRoot}});assert.equal(result.status,0,result.stderr);
 result=spawnSync(process.execPath,[wrapper],{input:JSON.stringify({cwd:root,tool_input:{file_path:file,new_string:'button { transition: all 300ms ease; }'}}),encoding:'utf8',env:{...process.env,UI_REFINER_HOME:repoRoot}});assert.equal(result.status,2,result.stderr);assert.match(result.stderr,/transition-all/);
}));
test('upstream comparison compares pinned SHA and never writes or installs',async()=>{
 let calls=0;const rows=await upstreamCheck({runner:async(bin,args)=>{calls++;assert.equal(bin,'git');assert.equal(args[0],'ls-remote');return {code:0,stdout:'a'.repeat(40)+'\tHEAD\n',stderr:''};}});
 assert.equal(calls,2);assert.ok(rows.every(r=>r.status==='update-available'));
});
