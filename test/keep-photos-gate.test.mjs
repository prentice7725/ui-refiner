import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {compareKeep} from '../src/keep.mjs';
import {openLicence,toCandidate,searchPhotos,creditLine,countStandIns,fetchStandIns} from '../src/photos.mjs';
import {refineGateProblems} from '../scripts/refine-gate-hook.mjs';
import {evaluateAiTells} from '../src/ai-tells.mjs';

test('keep: lost links, forms, fields and figures fail; new figures are listed; anchors are informational', () => {
 const before={links:['/book','tel:0001234567','https://maps.example/x'],anchors:['#hours','#faq'],forms:[{action:'/reserve',method:'post'}],fields:[{name:'email',type:'email'},{name:'date',type:'date'}],facts:['409,847','4.7','9:30']};
 const same=compareKeep(before,{...before,anchors:['#hours']});
 assert.equal(same.ok,true);assert.deepEqual(same.anchors,['#faq']);
 const after={links:['/book','https://maps.example/x'],anchors:[],forms:[],fields:[{name:'email',type:'email'}],facts:['420,000','4.8','9:30']};
 const r=compareKeep(before,after);
 assert.equal(r.ok,false);
 assert.deepEqual(r.links,['tel:0001234567']);assert.deepEqual(r.forms,['post /reserve']);assert.deepEqual(r.fields,['date:date']);
 assert.deepEqual(r.facts,['409,847','4.7']);assert.deepEqual(r.added,['420,000','4.8']);
});

const page=(title,{licence='CC BY-SA 4.0',width=3000,height=2000,mime='image/jpeg',artist='<a href="x">Jane Roe</a>'}={})=>({title,index:1,imageinfo:[{url:'https://upload.example/'+title,thumburl:'https://thumb.example/'+title,width,height,mime,extmetadata:{LicenseShortName:{value:licence},Artist:{value:artist},LicenseUrl:{value:'https://creativecommons.org/licenses/by-sa/4.0'}}}]});

test('photos: only open licences, real photos, the right size and orientation', () => {
 for(const l of ['CC0','Public domain','CC BY 4.0','CC BY-SA 3.0'])assert.ok(openLicence(l),l);
 for(const l of ['CC BY-NC 4.0','CC BY-ND 2.0','Non-free','Fair use',''])assert.ok(!openLicence(l),l);
 const ok=toCandidate(page('File:Bakery shelf.jpg'));
 assert.equal(ok.author,'Jane Roe');assert.equal(ok.licence,'CC BY-SA 4.0');assert.match(ok.source,/^https:\/\/commons\.wikimedia\.org\/wiki\/File%3ABakery_shelf\.jpg$/);
 assert.equal(toCandidate(page('File:a.jpg',{licence:'CC BY-NC 4.0'})),null);
 assert.equal(toCandidate(page('File:a.svg',{mime:'image/svg+xml'})),null);
 assert.equal(toCandidate(page('File:small.jpg',{width:800,height:500})),null);
 assert.equal(toCandidate(page('File:tall.jpg',{width:2000,height:3000})),null,'landscape by default');
 assert.ok(toCandidate(page('File:tall.jpg',{width:2000,height:3000}),{orientation:'portrait'}));
});

test('photos: search and save use the given fetch, write credits.json and a localized credit line', async () => {
 const pages={'1':page('File:Dental chair.jpg'),'2':page('File:Old.jpg',{licence:'CC BY-NC 4.0'})};
 const fetchImpl=async url=>url.startsWith('https://commons.wikimedia.org/w/api.php')
  ?{ok:true,json:async()=>({query:{pages}})}
  :{ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};
 assert.deepEqual((await searchPhotos('dental chair',{fetchImpl})).map(p=>p.title),['File:Dental chair.jpg']);
 await assert.rejects(searchPhotos('  ',{fetchImpl}),/subject/);
 const out=await fs.mkdtemp(path.join(os.tmpdir(),'uir-photos-'));
 const r=await fetchStandIns('dental chair',{out,lang:'ja',fetchImpl});
 assert.deepEqual(r.photos.map(p=>p.file),['dental-chair-01.jpg']);
 assert.equal((await fs.readFile(path.join(out,'dental-chair-01.jpg'))).length,3);
 const credits=JSON.parse(await fs.readFile(path.join(out,'credits.json'),'utf8'));
 assert.equal(credits.standIn,true);assert.equal(credits.photos[0].author,'Jane Roe');
 assert.match(r.credit,/^<p class="stand-in-credits">仮の写真/);assert.match(creditLine(r.photos,'ko'),/임시 사진/);
 assert.equal(countStandIns('<img src="a.jpg" data-stand-in><img data-stand-in="true" src="b.jpg"><img src="c.jpg">'),2);
});

test('gate: blocks only while a recorded refine lacks a fresh, passing keep check or verify', async () => {
 const cwd=await fs.mkdtemp(path.join(os.tmpdir(),'uir-gate-'));
 assert.deepEqual(await refineGateProblems(cwd),[],'inert outside a refine');
 await fs.writeFile(path.join(cwd,'index.html'),'<h1>x</h1>');
 await fs.writeFile(path.join(cwd,'ui-refiner-keep.json'),JSON.stringify({target:'index.html',links:[]}));
 assert.match((await refineGateProblems(cwd))[0],/keep check/);
 const later=new Date(Date.now()+60e3).toISOString();
 await fs.writeFile(path.join(cwd,'ui-refiner-keep-check.json'),JSON.stringify({ok:false,checkedAt:later,links:['/book'],forms:[],fields:[],facts:['4.7']}));
 assert.match((await refineGateProblems(cwd))[0],/links: \/book; facts: 4\.7/);
 await fs.writeFile(path.join(cwd,'ui-refiner-keep-check.json'),JSON.stringify({ok:true,checkedAt:later}));
 assert.deepEqual(await refineGateProblems(cwd),[]);
 await fs.writeFile(path.join(cwd,'ui-refiner-keep-check.json'),JSON.stringify({ok:true,checkedAt:new Date(Date.now()-3600e3).toISOString()}));
 assert.match((await refineGateProblems(cwd))[0],/changed after the last/);
 await fs.writeFile(path.join(cwd,'ui-refiner-keep-check.json'),JSON.stringify({ok:true,checkedAt:later}));
 await fs.mkdir(path.join(cwd,'refine-directions'));
 await fs.writeFile(path.join(cwd,'refine-directions','DIRECTIONS.json'),'{}');
 assert.deepEqual(await refineGateProblems(cwd),[],'waiting for the person to choose is not blocked');
 await fs.writeFile(path.join(cwd,'refine-directions','PICK.json'),JSON.stringify({label:'B'}));
 assert.match((await refineGateProblems(cwd))[0],/directions verify/);
 await fs.writeFile(path.join(cwd,'refine-directions','VERIFY.json'),JSON.stringify({target:'index.html',checkedAt:later,drift:[{id:'hero',chosen:'below-fold',applied:'left+stacked'}]}));
 assert.match((await refineGateProblems(cwd))[0],/drifted.*below-fold → left\+stacked/);
 await fs.writeFile(path.join(cwd,'refine-directions','VERIFY.json'),JSON.stringify({target:'index.html',checkedAt:later,drift:[],problems:['no-claim']}));
 assert.match((await refineGateProblems(cwd))[0],/does not say what this is/);
 await fs.writeFile(path.join(cwd,'refine-directions','VERIFY.json'),JSON.stringify({target:'index.html',checkedAt:later,drift:[]}));
 assert.deepEqual(await refineGateProblems(cwd),[]);
 assert.deepEqual(await refineGateProblems(cwd,Date.now()+13*3600e3),[],'stale refine state older than 12 hours is ignored');
});

test('new signals: coloured word, tail sign-up, empty frames, hero CTA below the fold', () => {
 const base={gradients:{purple:0,large:0,coverage:0,targets:[]},gradientText:{count:0},emoji:{icons:0,count:0},cardGrids:{count:0,groups:[]},glass:{count:0},glow:{count:0},eyebrowPills:{count:0},centered:{blocks:0,ratio:0},rounding:{containers:0,ratio:0},typography:{families:[{name:'archivo',count:20},{name:'karla',count:9}],ratio:3},accents:[],text:'',labels:[],hueBuckets:2,transitionAll:{count:0},craft:{}};
 const ids=m=>evaluateAiTells({...base,...m},{lang:'en'}).signals.map(s=>s.id);
 assert.deepEqual(ids({}),[]);
 const all=ids({accentWords:{count:1,targets:[]},tailSignup:{count:1,targets:[]},emptyFrames:{count:2,targets:[]},heroCta:{headlineTop:200,ctaTop:980,fold:900,below:true}});
 for(const id of ['accent-word','newsletter-tail','empty-frames','hero-cta-below'])assert.ok(all.includes(id),id);
 assert.ok(!ids({emptyFrames:{count:1,targets:[]}}).includes('empty-frames'),'one empty box is not enough');
});

test('gate hook: plugin and installer register it, and the script blocks with exit 2 then gives up', async () => {
 const {spawnSync}=await import('node:child_process');
 const hooks=JSON.parse(await fs.readFile(new URL('../hooks/hooks.json',import.meta.url),'utf8'));
 assert.match(hooks.hooks.Stop[0].hooks[0].command,/CLAUDE_PLUGIN_ROOT.*refine-gate-hook\.mjs/);
 assert.match(await fs.readFile(new URL('../scripts/install-agent-skill.mjs',import.meta.url),'utf8'),/settings\.hooks\.Stop/);
 const cwd=await fs.mkdtemp(path.join(os.tmpdir(),'uir-gate-run-'));
 await fs.writeFile(path.join(cwd,'ui-refiner-keep.json'),JSON.stringify({target:'index.html'}));
 const run=()=>spawnSync(process.execPath,[new URL('../scripts/refine-gate-hook.mjs',import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/,'')],{input:JSON.stringify({cwd}),encoding:'utf8',env:{...process.env,UI_REFINER_GATE:''}});
 for(let i=0;i<3;i++){const r=run();assert.equal(r.status,2,r.stderr);assert.match(r.stderr,/refine is not finished/);}
 const last=run();assert.equal(last.status,0);assert.match(last.stdout,/gave up after 3/);
 const off=spawnSync(process.execPath,[new URL('../scripts/refine-gate-hook.mjs',import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/,'')],{input:JSON.stringify({cwd}),encoding:'utf8',env:{...process.env,UI_REFINER_GATE:'off'}});
 assert.equal(off.status,0);
});
