import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {dealStructures,dealDirections,historyWarnings,recordChoice,readLog,HERO_STRUCTURES} from '../src/refine-log.mjs';

test('deal: three different structures, recent picks for other projects go last', () => {
 const keys=Object.keys(HERO_STRUCTURES);
 const fresh=dealStructures([], '/p/a', {seed:1});
 assert.equal(fresh.length,3);assert.equal(new Set(fresh).size,3);
 const log=keys.slice(0,5).map((hero,i)=>({project:'/p/other'+i,page:'x'+i,hero}));
 const dealt=dealStructures(log,'/p/a',{seed:1});
 assert.ok(dealt.includes('below-fold')&&!dealt.includes('wide+stacked')&&!dealt.includes('full-bleed'),'never-chosen structures first, the latest picks last');
 assert.equal(new Set(dealt.map(k=>k.split('+')[1]??k)).size,3,'spread over structure families');
 assert.deepEqual(new Set(dealStructures(log.map(e=>({...e,project:'/p/a'})),'/p/a',{seed:1})).size,3,'own project history is ignored');
 for(let seed=0;seed<20;seed++)assert.ok(!dealStructures([],'/p/a',{seed,noPhoto:true}).some(k=>['below-fold','full-bleed','left+media'].includes(k)),'without photos, no image-led structure is dealt');
 for(let seed=0;seed<20;seed++){const d=dealStructures([],'/p/a',{seed});assert.ok(!(d.includes('below-fold')&&d.includes('full-bleed')),'image-led structures share one family');}
 assert.deepEqual(dealStructures([],'/p/a',{seed:1,human:{'center+stacked':.5,'left+media':.3,'full-bleed':.2}}),['center+stacked','left+media','full-bleed']);
});

test('history: warns on a deal mismatch and on repeats from other projects only', () => {
 const items=[{label:'A',hero:'left+stacked',fonts:['public sans','archivo'],bg:[255,255,255]},{label:'B',hero:'full-bleed',fonts:['inter'],bg:[244,241,234]}];
 const log=[{project:'/p/x',page:'dental',hero:'left+stacked',fonts:['public sans','archivo'],bg:[245,242,233]},{project:'/p/me',page:'home',hero:'full-bleed',fonts:['inter'],bg:[244,241,234]}];
 const deal={structures:[{label:'A',key:'center+stacked'},{label:'B',key:'full-bleed'}]};
 assert.deepEqual(historyWarnings(items,log,'/p/me',deal).map(w=>w.id+':'+w.a),['deal-mismatch:A','repeat-hero:A','repeat-fonts:A','repeat-surface:B'],'B matches the dental cream; its own project entry is ignored');
});

test('deal and record round-trip through DEAL.json, DIRECTIONS.json and the log file', async () => {
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'uir-log-')),dir=path.join(tmp,'proj','refine-directions'),log=path.join(tmp,'log.json');
 const deal=await dealDirections(dir,{log,seed:3});
 assert.deepEqual(deal.structures.map(s=>s.label),['A','B','C']);
 assert.ok(JSON.parse(await fs.readFile(path.join(dir,'DEAL.json'),'utf8')).structures[0].brief);
 await fs.writeFile(path.join(dir,'DIRECTIONS.json'),JSON.stringify({items:[{label:'A',hero:'left+panel',fonts:['a','b'],bg:[255,255,255],note:{concept:'front desk'}},{label:'B',hero:'full-bleed',fonts:['c'],bg:[0,0,0]}]}));
 await assert.rejects(recordChoice(dir,{pick:'D',log}),/--pick must be one of A, B/);
 const r=await recordChoice(dir,{pick:'b',page:'clinic',log});
 assert.equal(r.entry.hero,'full-bleed');assert.equal(r.entry.page,'clinic');assert.equal(r.entry.project,path.join(tmp,'proj'));
 assert.equal((await readLog(log)).length,1);
});

test('history: warns when the accent hue repeats one picked for another project', async () => {
 const {accentOf}=await import('../src/directions.mjs');
 assert.deepEqual(accentOf({accents:[[22,59,51],[22,59,51],[255,255,255],[17,17,17],[244,194,91]]}),[22,59,51],'greys and white are not accents');
 const log=[{project:'/p/x',page:'dental',accent:[24,62,50]}];
 assert.deepEqual(historyWarnings([{label:'A',accent:[30,80,60]},{label:'B',accent:[230,90,40]}],log,'/p/me').map(w=>w.id+':'+w.a),['repeat-accent:A']);
});

test('deal: type pairings by voice and kind, accents by family, one non-white surface', async () => {
 const {dealType,dealAccents,dealSurfaces,accentFamily,dealDirections}=await import('../src/refine-log.mjs');
 const lib=JSON.parse(await fs.readFile(new URL('../data/type-pairs.json',import.meta.url),'utf8'));
 const t=dealType(lib.pairs,[],'/p/a',{seed:2,kind:'place',script:'ja'});
 assert.equal(t.length,3);assert.equal(new Set(t.map(p=>p.voice)).size,3,'three voices');
 assert.ok(t.every(p=>lib.pairs.find(x=>x.id===p.id).script==='ja'));
 const latin=dealType(lib.pairs,[{project:'/p/x',fonts:['archivo']}],'/p/a',{seed:2,script:'latin'});
 assert.ok(!latin.some(p=>p.display==='Archivo'),'a face picked for another project is dealt later');
 assert.ok(!latin.some(p=>['bricolage','fraunces'].includes(p.id)),'overused pairings are dealt last');
 assert.deepEqual([[40,120,50],[230,90,40],[30,60,200],[17,17,17],[120,80,60]].map(accentFamily),['green','orange','blue','ink','brown']);
 const acc=dealAccents(Object.keys(lib.accents),[{project:'/p/x',accent:[22,120,51]}],'/p/a',{seed:1});
 assert.equal(new Set(acc).size,3);assert.ok(!acc.includes('green')&&!acc.includes('indigo'));
 const surf=dealSurfaces(3,5);assert.equal(surf.filter(s=>s!=='white').length,1);
 await assert.rejects(dealDirections(path.join(os.tmpdir(),'uir-kind'),{kind:'bank'}),/--kind must be one of/);
});

test('history: warns when a mock ignores its dealt type or accent', () => {
 const deal={structures:[{label:'A',key:'full-bleed',type:{display:'Zilla Slab',text:'Work Sans'},accent:{family:'orange'}}]};
 const w=historyWarnings([{label:'A',hero:'full-bleed',fonts:['inter'],accent:[22,59,51]}],[],'/p/me',deal);
 assert.deepEqual(w.map(x=>x.id),['deal-type','deal-accent']);
 assert.deepEqual(historyWarnings([{label:'A',hero:'full-bleed',fonts:['work sans','zilla slab'],accent:[230,90,40]}],[],'/p/me',deal),[]);
});
