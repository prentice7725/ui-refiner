import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {repoRoot} from '../src/vendor.mjs';
import {spawnBounded,realStatic,realBrowser} from '../src/execute.mjs';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {runGate,exitCode,baselineFromReport} from '../src/gate.mjs';
import {gitChangedLines,parseChangedDiff} from '../src/changed.mjs';
import {browserBudget} from '../src/browser-budget.mjs';
import {groupedHandoff} from '../src/reporting.mjs';
import {validateConfig} from '../src/config.mjs';
async function temp(fn){const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-review2-'));try{await fn(root);}finally{await fs.rm(root,{recursive:true,force:true});}}
async function git(root,args){const r=await spawnBounded('git',args,{cwd:root});assert.equal(r.code,0,r.stderr);return r;}
async function init(root){await git(root,['init','-q']);await git(root,['add','.']);await git(root,['-c','user.name=test','-c','user.email=test@example.invalid','commit','--allow-empty','-qm','initial']);}
test('nested monorepo config sees tracked, staged and untracked paths consistently and excludes sibling apps',()=>temp(async root=>{
 const web=path.join(root,'apps/web');await fs.mkdir(path.join(web,'src'),{recursive:true});await fs.mkdir(path.join(root,'apps/other/src'),{recursive:true});
 await fs.writeFile(path.join(web,'src/app.css'),'button { color: blue; }\n');await fs.writeFile(path.join(root,'apps/other/src/app.css'),'p { color: red; }\n');await init(root);
 await fs.writeFile(path.join(web,'src/app.css'),'button { transition: all 300ms ease; }\n');await git(root,['add','apps/web/src/app.css']);
 await fs.writeFile(path.join(web,'src/new.css'),'p { color: green; }\n');await fs.writeFile(path.join(root,'apps/other/src/app.css'),'p { color: blue; }\n');
 const changes=await gitChangedLines(web);assert.ok(changes.get('src/app.css').has(1));assert.equal(changes.get('src/new.css'),null);assert.ok(!changes.has('apps/web/src/app.css'));assert.ok(![...changes.keys()].some(k=>k.includes('other')));
 const r=await runGate({root:web,config:makePreset(),changedOnly:true,browserRunner:async()=>({findings:[]}),writeReports:false});assert.equal(r.automatedStatus,'FAIL');assert.ok(r.findings.some(f=>f.rule==='transition-all'&&f.file==='src/app.css'));assert.equal(exitCode(r),1);
 assert.ok(parseChangedDiff('+++ "b/src/file\\tname.css"\n@@ -1 +1 @@\n').get('src/file\tname.css').has(1));
}));
test('step and session budgets are distinct, scale with runs and interaction checks, and honor explicit sessions',()=>temp(async root=>{
 const c=makePreset();c.browser.timeoutMs=3000;const plan={states:[{name:'x'}]};const budget=browserBudget(c,lintapplePolicy,plan);assert.equal(budget.stepTimeoutMs,3000);assert.ok(budget.sessionTimeoutMs>3000*2);assert.equal(budget.plannedRuns,2);
 c.browser.sessionTimeoutMs=42000;assert.equal(browserBudget(c,lintapplePolicy,plan).sessionTimeoutMs,42000);assert.equal(validateConfig(c).browser.sessionTimeoutMs,42000);
 c.browser.sessionTimeoutMs=0;assert.throws(()=>validateConfig(c),/sessionTimeoutMs/);delete c.browser.sessionTimeoutMs;
 await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy));let outer;
 await realBrowser(c,root,{runner:async(bin,args,options)=>{outer=options.timeoutMs;return {code:0,stdout:JSON.stringify({rawReport:{runs:[{}],findings:[]}}),stderr:''};}});assert.ok(outer>3000);assert.equal(c.browser.timeoutMs,3000);
}));
const browserDebt={engine:'lintapple',rule:'font-family',severity:'error',location:'button @ 390px',selector:'#legacy',viewport:{width:390,height:844},colorScheme:'light',state:'initial',identity:{key:'#legacy',stable:true},actual:'serif',expected:'system-ui',fix:'Fix font'};
test('scoped pass has exit 3, separates observed browser debt without auto-baselines, and detects fresh violations',()=>temp(async root=>{
 await fs.mkdir(path.join(root,'src'));await fs.writeFile(path.join(root,'src/app.css'),'p { color: blue; }\n');await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy));await init(root);
 const config=makePreset(),options={root,config,staticRunner:async()=>({findings:[]}),browserRunner:async()=>({findings:[browserDebt]})};
 const full=await runGate(options);assert.equal(full.automatedStatus,'FAIL');
 const scoped=await runGate({...options,changedOnly:true});assert.equal(scoped.automatedStatus,'SCOPED_PASS');assert.equal(exitCode(scoped),3);assert.equal(scoped.summary.existingBrowserDebt,1);assert.equal(scoped.summary.baselined,0);
 assert.equal(scoped.findings[0].baselined,false);assert.equal(scoped.findings[0].existingBrowserDebt,true);
 await assert.rejects(()=>baselineFromReport(path.join(root,config.reportDir,'report.json'),path.join(root,'baseline.json')),/full/);
 const fresh=await runGate({...options,changedOnly:true,browserRunner:async()=>({findings:[browserDebt,{...browserDebt,identity:{key:'#new',stable:true},selector:'#new'}]})});assert.equal(fresh.automatedStatus,'FAIL');assert.equal(fresh.summary.blockers,1);
 await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify({...lintapplePolicy,minControlSize:44}));const changed=await runGate({...options,changedOnly:true});assert.equal(changed.summary.existingBrowserDebt,0);assert.equal(changed.automatedStatus,'FAIL');
 const infra=await runGate({...options,changedOnly:true,browserRunner:async()=>{throw Error('missing browser');}});assert.equal(exitCode(infra),2);
}));
test('portable hook wiring survives moving a team checkout and contains no personal path or absolute file URI',()=>temp(async parent=>{
 const app=path.join(parent,'original'),tools=path.join(app,'tools/ui-refiner');await fs.mkdir(tools,{recursive:true});
 for(const dir of ['src','vendor','skills','commands'])await fs.cp(path.join(repoRoot,dir),path.join(tools,dir),{recursive:true});await fs.mkdir(path.join(tools,'scripts'));
 for(const file of ['install-agent-skill.mjs','post-edit-hook.mjs'])await fs.cp(path.join(repoRoot,'scripts',file),path.join(tools,'scripts',file));
 const installed=await spawnBounded(process.execPath,[path.join(tools,'scripts/install-agent-skill.mjs'),app]);assert.equal(installed.code,0,installed.stderr);
 for(const file of ['.claude/commands/ui-review.md','.claude/skills/ui-refiner-agent/SKILL.md'])await fs.access(path.join(app,file));
 const settings=await fs.readFile(path.join(app,'.claude/settings.json'),'utf8'),wrapper=await fs.readFile(path.join(app,'.agents/skills/ui-refiner-agent/scripts/post-edit-hook.mjs'),'utf8');assert.match(settings,/CLAUDE_PROJECT_DIR/);assert.ok(!settings.includes(parent));assert.ok(!wrapper.includes(parent));assert.ok(!wrapper.includes('file:///'));
 const moved=path.join(parent,'teammate');await fs.rename(app,moved);const file=path.join(moved,'app.css');await fs.writeFile(file,'button { transition: all 300ms ease; }\n');
 const result=spawnSync(process.execPath,[path.join(moved,'.agents/skills/ui-refiner-agent/scripts/post-edit-hook.mjs')],{encoding:'utf8',input:JSON.stringify({cwd:moved,tool_input:{file_path:file,new_string:'button { transition: all 300ms ease; }'}}),env:{...process.env,UI_REFINER_HOME:''}});assert.equal(result.status,2,result.stderr);assert.match(result.stderr,/transition-all/);
}));
test('long nth-of-type targets remain in full evidence while the grouped handoff stays bounded and useful',()=>{
 const selector=Array.from({length:30},(_,i)=>`div:nth-of-type(${i+1})`).join(' > ');
 const findings=Array.from({length:24},(_,i)=>({...browserDebt,id:String(i),identity:undefined,selector:selector+` > span:nth-of-type(${i+1})`,baselineEligible:false}));
 const before=JSON.stringify(findings),text=groupedHandoff(findings);assert.ok(Buffer.byteLength(text)<2000);assert.ok(!text.includes('nth-of-type'));assert.match(text,/serif/);assert.match(text,/system-ui/);assert.equal(JSON.stringify(findings),before);
 const many=Array.from({length:40},(_,i)=>({...findings[0],rule:'rule-'+i,actual:'X'.repeat(1000),expected:'Y'.repeat(1000)}));const limited=groupedHandoff(many);assert.ok(Buffer.byteLength(limited)<6500);assert.match(limited,/additional root-cause groups/);
});
