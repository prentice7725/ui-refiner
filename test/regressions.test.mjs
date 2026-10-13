import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {identify,normalizeBrowser,browserCoverage} from '../src/normalize.mjs';
import {realStatic,probeChromium} from '../src/execute.mjs';
import {launchBrowser} from '../vendor/lintapple/src/browser.js';
import {runGate,baselineFromReport} from '../src/gate.mjs';
import {makePreset} from '../src/presets.mjs';
const browserFinding={rule:'font-family',selector:'button:nth-of-type(2)',viewport:{width:390,height:844},colorScheme:'light',state:'initial',identity:{key:'[data-qa="save"]',stable:true},actual:'Arial',expected:'system-ui',message:'Found Arial',fix:'Use the approved interface font.'};
const normalize=f=>normalizeBrowser({runs:[{}],findings:[f]});
async function temp(fn){const root=await mkdtemp(path.join(os.tmpdir(),'ui-regression-'));try{await fn(root);}finally{await rm(root,{recursive:true,force:true});}}
test('browser v2 fingerprint survives selector and measured-message changes, separates state and viewport',()=>{
 const f=identify(normalize(browserFinding))[0];
 const moved=identify(normalize({...browserFinding,selector:'button:nth-of-type(3)',actual:'Helvetica',message:'Found Helvetica'}))[0];
 assert.equal(f.id,moved.id);assert.equal(f.baselineEligible,true);
 for(const delta of [{state:'dialog'},{viewport:{width:390,height:900}},{colorScheme:'dark'},{identity:{key:'[data-qa="cancel"]',stable:true}}]) assert.notEqual(f.id,identify(normalize({...browserFinding,...delta}))[0].id);
 assert.equal(identify(normalize({...browserFinding,identity:undefined}))[0].baselineEligible,false);
 assert.ok(identify([...normalize(browserFinding),...normalize(browserFinding)]).every(f=>!f.baselineEligible));
});
test('real suta source identity survives a leading line insertion',()=>temp(async root=>{
 await mkdir(path.join(root,'src'));
 const audit=path.resolve('vendor/suta/skills/suta/scripts/audit.mjs');
 // Real auditor is copied with its TS dependencies to keep config paths inside root.
 const {cp}=await import('node:fs/promises');
 await cp(path.dirname(path.dirname(audit)),path.join(root,'audit'),{recursive:true});
 const c=makePreset('web');c.static.auditPath='audit/scripts/audit.mjs';
 const file=path.join(root,'src/app.css');
 await writeFile(file,'button { transition: all 300ms ease; }\n');
 const a=identify((await realStatic(c,root)).findings).find(f=>f.rule==='transition-all');
 await writeFile(file,'/* inserted unrelated line */\nbutton { transition: all 300ms ease; }\n');
 const b=identify((await realStatic(c,root)).findings).find(f=>f.rule==='transition-all');
 assert.ok(a.baselineEligible);assert.equal(a.id,b.id);assert.notEqual(a.line,b.line);
}));
test('v2 baseline, evidence handoff and zero/unknown coverage survive report write',()=>temp(async root=>{
 const c=makePreset('web');
 const raw={findings:[browserFinding],runs:[{viewport:browserFinding.viewport,colorScheme:'light',states:[{name:'initial',ruleCoverage:{'layout-gap':0,'layout-alignment':0,'control-inset':0,'nested-radius':1,'control-gap':2}}]}]};
 const options={root,config:c,staticRunner:async()=>({findings:[]}),browserRunner:async()=>({findings:normalizeBrowser(raw),rawReport:raw,ruleCoverage:browserCoverage(raw)})};
 let report=await runGate(options);
 assert.match(report.coverageNote,/no targets/);
 const dir=path.join(root,c.reportDir);
 for(const name of ['report.md','AGENT_HANDOFF.md']){
  const text=await readFile(path.join(dir,name),'utf8');assert.match(text,/Arial/);assert.match(text,/system-ui/);assert.match(text,/no targets/);
 }
 const baseline=path.join(root,'baseline.json');
 await baselineFromReport(path.join(dir,'report.json'),baseline);
 assert.equal(JSON.parse(await readFile(baseline)).schemaVersion,2);
 c.gate.baselinePath='baseline.json';report=await runGate(options);assert.equal(report.summary.baselined,1);
 await writeFile(baseline,JSON.stringify({schemaVersion:1,ids:[]}));await assert.rejects(()=>runGate(options),/recreate v1/);
 assert.equal(browserCoverage({runs:[{viewport:{width:390},alignmentGroups:0}]})[1].status,'unknown');
}));
test('legacy reports cannot be relabeled as v2; ambiguous findings cannot be baselined',()=>temp(async root=>{
 const file=path.join(root,'report.json'),out=path.join(root,'baseline.json');
 await writeFile(file,JSON.stringify({findings:[{id:'v1'}]}));await assert.rejects(()=>baselineFromReport(file,out),/Invalid report/);
 await writeFile(file,JSON.stringify({fingerprintVersion:2,findings:identify(normalize({...browserFinding,identity:undefined}))}));
 assert.equal(await baselineFromReport(file,out),0);
}));
test('Chromium launch failure is bounded and never installs; probe closes on page failure',async()=>{
 let attempts=0;
 await assert.rejects(()=>launchBrowser({chromium:{launch:async options=>{attempts++;assert.equal(options.timeout,15000);throw Error("Executable doesn't exist at missing");}}}),/Install it explicitly/);
 assert.equal(attempts,1);
 let closed=0;
 await assert.rejects(()=>probeChromium({launch:async()=>({newPage:async()=>{throw Error('page failed');},close:async()=>{closed++;}})}),/page failed/);
 assert.equal(closed,1);
});
