import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {addPref,removePref,readPrefs,activePrefs,suggestPrefs,validatePref} from '../src/preferences.mjs';
import {dealDirections,dealStructures,familiarStructure,tailoredSurface,HERO_STRUCTURES} from '../src/refine-log.mjs';

const tmpLog=async()=>{const d=await fs.mkdtemp(path.join(os.tmpdir(),'uir-pref-'));return path.join(d,'refine-log.json');};

test('prefer add: needs the person\'s words and a value the deal knows; replaces, never deletes', async () => {
 const log=await tmpLog();
 await assert.rejects(addPref('surface','paper',{log}),/--said/);
 await assert.rejects(addPref('surface','cream',{log,said:'크림 싫어'}),/surface must be one of/);
 await assert.rejects(addPref('colour','blue',{log,said:'x'}),/axis must be one of/);
 assert.throws(()=>validatePref('material','foil',{materials:['riso','kraft']}),/material must be one of riso, kraft/);
 const a=await addPref('surface','Paper',{log,said:'크림 바탕은 싫어'});
 assert.equal(a.entry.value,'paper');assert.equal(path.dirname(a.file),path.dirname(log),'kept next to the refine log');
 await addPref('surface','paper',{log,said:'미색 바탕 말고'});
 await addPref('face','Noto Serif KR',{log,said:'명조는 병원엔 안 맞아',kind:'service'});
 let all=await readPrefs(undefined,log);
 assert.deepEqual(all.map(p=>p.status),['replaced','active','active']);
 assert.equal(all[0].replacedBy,all[1].id);
 assert.deepEqual(activePrefs(all,'place').map(p=>p.value),['paper'],'a kind-scoped entry applies only to that kind');
 assert.deepEqual(activePrefs(all,'service').map(p=>p.value),['paper','Noto Serif KR']);
 assert.equal((await removePref('surface','paper',{log})).retired,1);
 all=await readPrefs(undefined,log);
 assert.equal(all.length,3,'retired, not deleted');assert.equal(all[1].status,'retired');
});

test('deal steps leave out what the person avoids, as far as the pool allows', () => {
 const keys=Object.keys(HERO_STRUCTURES);
 const avoid=new Set(['full-bleed','left+media']);
 for(let seed=0;seed<30;seed++){
  assert.ok(!dealStructures([],'/p/a',{seed,avoid}).some(k=>avoid.has(k)));
  assert.ok(!avoid.has(familiarStructure({'full-bleed':.9,'left+media':.1},{seed,avoid})),'even the most common structure');
  assert.notEqual(tailoredSurface(seed,{avoid:new Set(['paper','brand'])}),'paper');
 }
 const most=new Set(keys.slice(1));
 assert.deepEqual(dealStructures([],'/p/a',{seed:1,avoid:most})[0],keys[0],'the one not avoided comes first');
 assert.equal(dealStructures([],'/p/a',{seed:1,avoid:most}).length,3,'avoided ones fill the rest rather than a short deal');
});

test('dealDirections reads the preferences file next to the log and records what it applied', async () => {
 const log=await tmpLog();
 await addPref('face','Pretendard',{log,said:'프리텐다드는 질렸어'});
 await addPref('surface','paper',{log,said:'크림 바탕 싫어'});
 await addPref('hero','center+stacked',{log,said:'가운데 정렬 제목 그만',kind:'software'});
 const dir=path.join(path.dirname(log),'p','dirs');
 const d=await dealDirections(dir,{log,seed:3,kind:'service',tone:'calm',lang:'ko'});
 assert.deepEqual(d.preferences.map(p=>p.axis+':'+p.value),['face:Pretendard','surface:paper'],'the software-only entry does not apply');
 assert.ok(d.avoidFaces.includes('Pretendard'));
 assert.notEqual(d.structures[1].surface.key,'paper');
 assert.notEqual(d.structures[2].material.ground,'tint','an avoided paper ground also rules out tinted materials');
 const s=await dealDirections(dir,{log,seed:3,kind:'software',lang:'ko'});
 assert.ok(!s.structures.some(x=>x.key==='center+stacked'));
 const none=await dealDirections(dir,{log,seed:3,kind:'service',prefs:[]});
 assert.deepEqual(none.preferences,[]);
});

test('suggest: the person\'s words not yet turned into a preference, and looks never picked', () => {
 const look=(hero,material,font)=>({hero,material,fonts:[font]});
 const log=[1,2,3].map(i=>({date:'2026-11-1'+i,page:'p'+i,label:'A',...look('left+stacked',null,'Inter'),said:i===3?'C는 늘 과해':null,
  rejected:[look('wide+stacked','receipt','Black Han Sans'),look('full-bleed',null,'Inter')]}));
 const r=suggestPrefs(log,[]);
 assert.deepEqual(r.said.map(s=>s.said),['C는 늘 과해']);
 assert.deepEqual(r.neverPicked.map(s=>s.axis+':'+s.value),['hero:wide+stacked','hero:full-bleed','material:receipt','face:Black Han Sans'],'Inter was picked, so it is not suggested');
 const after=suggestPrefs(log,[{axis:'material',value:'receipt',status:'active',date:'2026-11-13',said:'C는 늘 과해'}]);
 assert.deepEqual(after.said,[],'words already used for a preference are not suggested again');
 assert.ok(!after.neverPicked.some(s=>s.value==='receipt'));
 assert.deepEqual(suggestPrefs(log.slice(0,2),[]).neverPicked,[],'two rejections are not enough');
});
