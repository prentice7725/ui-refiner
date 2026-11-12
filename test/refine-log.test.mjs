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

test('pick note: a run of white picks for other projects points at the non-white directions', async () => {
 const {pickNotes}=await import('../src/refine-log.mjs');
 const items=[{label:'A',bg:[255,255,255]},{label:'B',bg:[20,22,24]},{label:'C',bg:[255,255,255]}];
 const white=i=>({project:'/p/o'+i,page:'p'+i,bg:[255,255,255]});
 assert.deepEqual(pickNotes(items,[0,1,2,3].map(white),'/p/me'),[{id:'white-run',n:4,a:'B'}]);
 assert.deepEqual(pickNotes(items,[0,1,2].map(white),'/p/me'),[],'three white picks are normal');
 assert.deepEqual(pickNotes(items,[...[0,1,2].map(white),{project:'/p/x',bg:[17,17,17]}],'/p/me'),[]);
 assert.deepEqual(pickNotes(items,[0,1,2,3].map(i=>({...white(i),project:'/p/me'})),'/p/me'),[],'own project is ignored');
 assert.deepEqual(pickNotes(items.map(d=>({...d,bg:[255,255,255]})),[0,1,2,3].map(white),'/p/me'),[],'nothing to point at');
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
 for(let seed=0;seed<30;seed++)assert.ok(!dealSurfaces(3,seed,{kind:'software'}).includes('dark'),'software pages get no dark ground');
 assert.ok(Array.from({length:30},(_,seed)=>dealSurfaces(3,seed)).flat().includes('dark'));
 const many=Array.from({length:600},(_,seed)=>dealSurfaces(3,seed)).flat(),share=k=>many.filter(s=>s===k).length/many.length;
 assert.ok(share('brand')>0&&share('brand')<.08&&share('dark')<.12&&share('paper')>share('brand')+share('dark'),'full-colour grounds stay rare, as on human sites');
 await assert.rejects(dealDirections(path.join(os.tmpdir(),'uir-kind'),{kind:'bank'}),/--kind must be one of/);
});

test('deal: structure, surface and colour family, with faces to avoid', async () => {
 const {dealDirections}=await import('../src/refine-log.mjs');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'uir-deal-'));const log=path.join(dir,'log.json');
 await fs.writeFile(log,JSON.stringify({entries:[{project:'/p/other',page:'x',fonts:['Archivo']}]}));
 const d=await dealDirections(path.join(dir,'dirs'),{log,seed:3});
 assert.equal(d.structures.length,3);
 assert.ok(d.structures.every(s=>s.key&&s.surface&&!s.type&&s.accent?.family&&s.accent.brief));
 assert.equal(new Set(d.structures.map(s=>s.accent.family)).size,3,'three colour families');
 assert.ok(d.avoidFaces.includes('Bricolage Grotesque')&&d.avoidFaces.includes('Archivo'));
});

test('history: warns when a mock ignores its dealt type or accent', () => {
 const deal={structures:[{label:'A',key:'full-bleed',type:{display:'Zilla Slab',text:'Work Sans'},accent:{family:'orange'}}]};
 const w=historyWarnings([{label:'A',hero:'full-bleed',fonts:['inter'],accent:[22,59,51]}],[],'/p/me',deal);
 assert.deepEqual(w.map(x=>x.id),['deal-type','deal-accent']);
 assert.deepEqual(historyWarnings([{label:'A',hero:'full-bleed',fonts:['work sans','zilla slab'],accent:[230,90,40]}],[],'/p/me',deal),[]);
});

test('deal: a brand ground counts as the colour, and repeats across projects are dealt later', async () => {
 const {dealDirections,leadColour}=await import('../src/refine-log.mjs');
 const forest=[29,90,67],yellow=[240,200,40];
 assert.deepEqual(leadColour({bg:forest,accent:yellow}),forest,'a clear colour ground leads');
 assert.deepEqual(leadColour({bg:[255,255,255],accent:yellow}),yellow);
 assert.deepEqual(leadColour({bg:[243,241,234],accent:yellow}),yellow,'a paper tint does not lead');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'uir-colour-'));const log=path.join(dir,'log.json');
 await fs.writeFile(log,JSON.stringify({entries:[{project:'/p/other',page:'fintech',bg:forest,accent:yellow}]}));
 for(let seed=0;seed<20;seed++){
  const d=await dealDirections(path.join(dir,'dirs'+seed),{log,seed});
  const fams=d.structures.map(s=>s.accent.family);
  assert.ok(!fams.includes('teal')&&!fams.includes('amber'),'the ground and the accent of another project are both dealt later');
  const brand=d.structures.find(s=>s.surface.key==='brand');if(brand)assert.notEqual(brand.accent.family,'ink','a brand ground needs a hue');
 }
 const deal={structures:[{label:'A',key:'left+stacked',accent:{family:'red'}}]};
 const w=historyWarnings([{label:'A',hero:'left+stacked',bg:forest,accent:[220,40,30]}],[{project:'/p/other',page:'fintech',bg:[31,74,59]}],'/p/me',deal);
 assert.deepEqual(w.map(x=>x.id),['deal-accent','repeat-accent'],'a green ground with a red button reads as green');
});

test('deal: colour families stay within what fits the tone', async () => {
 const {toneColours}=await import('../src/refine-log.mjs');
 const lib=JSON.parse(await fs.readFile(new URL('../data/type-pairs.json',import.meta.url),'utf8'));
 for(const tone of ['calm','warm','technical'])for(let seed=0;seed<40;seed++){
  const surf=['white','brand','white'],acc=toneColours(lib,lib.tones[tone],surf,[],'/p/a',{seed});
  assert.equal(new Set(acc).size,3);
  assert.ok(acc.every(f=>lib.tones[tone].accents.includes(f)),`${tone} keeps to its families`);
  assert.ok(lib.tones[tone].brandGround.includes(acc[1]),`${tone} brand ground in a suitable family`);
 }
 assert.ok(!lib.tones.calm.brandGround.includes('red')&&!lib.tones.warm.brandGround.includes('pink'),'no full red or magenta ground on calm or warm pages');
 for(let seed=0;seed<20;seed++)assert.notEqual(toneColours(lib,null,['brand','white','white'],[],'/p/a',{seed})[0],'ink','a brand ground needs a hue');
});

test('deal: colour families lean towards what human sites of the kind use', async () => {
 const {dealAccents,humanColours}=await import('../src/refine-log.mjs');
 const fams=['blue','teal','green','brown'],weights={blue:.5,teal:.2,green:.1};
 const count=w=>{const c={};for(let seed=0;seed<400;seed++){const f=dealAccents(fams,[],'/p/a',{n:1,seed,weights:w})[0];c[f]=(c[f]||0)+1;}return c;};
 const flat=count(null),lean=count(weights);
 assert.ok(lean.blue>flat.blue&&(lean.brown||0)<flat.brown,'common families come up more, unused ones less');
 assert.ok((lean.brown||0)>0,'a family human sites rarely use still comes up now and then');
 const recent=[{project:'/p/b',accent:[30,90,200]}];
 for(let seed=0;seed<20;seed++)assert.notEqual(dealAccents(fams,recent,'/p/a',{n:1,seed,weights})[0],'blue','a family used recently still waits its turn');
 const ko=await humanColours('software','ko'),any=await humanColours('software');
 assert.ok(ko&&any&&ko!==any,'Korean pages use the Korean figures when enough sites were measured');
});

test('deal: the tone narrows surfaces and faces', async () => {
 const {dealSurfaces,dealDirections}=await import('../src/refine-log.mjs');
 for(let seed=0;seed<30;seed++)for(const tone of ['calm','warm'])assert.ok(!dealSurfaces(3,seed,{kind:'public',tone}).includes('dark'),'no dark ground on a calm or warm page');
 assert.ok(Array.from({length:30},(_,seed)=>dealSurfaces(3,seed,{kind:'media',tone:'bold'})).flat().includes('dark'));
 assert.ok(!Array.from({length:30},(_,seed)=>dealSurfaces(3,seed,{kind:'software',tone:'technical'})).flat().includes('dark'),'software stays light');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'uir-tone-'));
 const d=await dealDirections(path.join(dir,'dirs'),{log:path.join(dir,'log.json'),seed:3,kind:'service',tone:'calm',lang:'ja'});
 assert.equal(d.schemaVersion,5);assert.equal(d.tone,'calm');assert.ok(d.toneBrief);
 for(const f of ['Dela Gothic One','Black Han Sans','Barlow Condensed','Big Shoulders Display'])assert.ok(d.avoidFaces.includes(f),f);
 const t=await dealDirections(path.join(dir,'dirs2'),{log:path.join(dir,'log.json'),seed:3,tone:'technical'});
 assert.ok(!t.avoidFaces.includes('Barlow Condensed')&&t.avoidFaces.includes('Klee One'));
 await assert.rejects(dealDirections(path.join(dir,'x'),{tone:'cosy'}),/--tone must be one of/);
});
