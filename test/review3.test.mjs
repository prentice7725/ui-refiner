import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {groupedHandoff,targetHint} from '../src/reporting.mjs';
import {runGate} from '../src/gate.mjs';
import {makePreset} from '../src/presets.mjs';
const f=(rule,severity,blocking,engine='suta')=>({engine,rule,severity,blocking,location:'src/app.css:1',sourceAnchor:rule,file:'src/app.css',line:1,message:'M'.repeat(400),actual:'A'.repeat(350),expected:'E'.repeat(350),fix:'Fix this cause',baselineEligible:true});
test('bounded handoff puts every available blocker before advisory errors and warnings regardless of engine order',()=>{
 const warnings=Array.from({length:20},(_,i)=>f('warning-'+i,'warning',false));
 const blockers=['text-contrast','keyboard-operation','control-state','horizontal-overflow'].map(r=>f(r,'error',true,'lintapple'));
 const advisor=f('advisory-error','error',false),before=JSON.stringify([...warnings,advisor,...blockers]);
 const text=groupedHandoff([...warnings,advisor,...blockers]);
 for(const blocked of blockers)assert.ok(text.includes(blocked.rule));
 assert.ok(text.indexOf('horizontal-overflow')<text.indexOf('advisory-error'));
 if(text.includes('warning-0'))assert.ok(text.indexOf('advisory-error')<text.indexOf('warning-0'));
 assert.match(text,/\[blocker\]/);assert.ok(Buffer.byteLength(text)<6500);assert.equal(JSON.stringify([...warnings,advisor,...blockers]),before);
 const omitted=groupedHandoff(Array.from({length:50},(_,i)=>f('blocker-'+i,'error',true)));assert.match(omitted,/Omitted blocker groups: [1-9]/);
});
test('semantic target hints expose tag and text without null-filled machine identity JSON',()=>{
 const identity={key:'body / '+JSON.stringify(['h1',null,null,null,null,null,'Unlock your potential']),stable:true};
 assert.equal(targetHint({identity}),'h1 "Unlock your potential"');
 assert.equal(targetHint({identity:{key:'[data-qa="save"]'}}),'[data-qa="save"]');
 assert.equal(targetHint({identity:{key:'body / '+JSON.stringify(['button','button',null,null,'Save',null,''])}}),'button role=button "Save"');
 assert.equal(targetHint({identity:{key:'body / '+JSON.stringify(['p',null,null,null,null,null,'has / [ symbols'])}}),'p "has / [ symbols"');
 assert.ok(!targetHint({identity}).includes('null'));
});
test('gate labels enforced blockers independently of severity so capped warnings are ordered first',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-blocker-priority-'));
 try{
  const config=makePreset();config.static.enforcement='advisory';
  const options={root,config,writeReports:false,staticRunner:async()=>({findings:[f('warning','warning',undefined)]}),browserRunner:async()=>({findings:[f('contrast','error',undefined,'lintapple')]})};
  const report=await runGate(options);assert.equal(report.findings[0].blocking,false);assert.equal(report.findings[1].blocking,true);
  config.static.enforcement='enforce';config.gate.maxStaticWarnings=0;const capped=await runGate({...options,browserRunner:async()=>({findings:[]})});assert.equal(capped.findings[0].blocking,true);assert.equal(capped.summary.blockers,1);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
