import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAiTells,signalTitle} from '../src/ai-tells.mjs';
import {scanTarget,renderScan} from '../src/scan.mjs';

const quiet=()=>({gradients:{count:0,large:0,purple:0,coverage:0,targets:[]},gradientText:{count:0,headings:0,targets:[]},glass:{count:0,targets:[]},glow:{count:0,targets:[]},transitionAll:{count:0,targets:[]},emoji:{count:0,icons:0,targets:[]},centered:{blocks:6,centered:1,ratio:1/6,targets:[]},cardGrids:{count:0,groups:[]},eyebrowPills:{count:0,targets:[]},rounding:{containers:5,rounded:1,ratio:.2},typography:{families:[{name:'söhne',count:40}],sizes:8,ratio:3},accents:[[200,60,40]],hueBuckets:2,craft:{loadedFonts:['söhne'],imagery:4,fontSizes:8},text:'Invoices sent in 2 clicks. Used by 4,000 clinics.',labels:['compare plans','read the api docs']});

test('a deliberate page with craft signals scores none and lists every avoided tell',()=>{
 const r=evaluateAiTells(quiet());
 assert.equal(r.score,0);assert.equal(r.band,'none');assert.equal(r.blocking,false);
 assert.deepEqual(r.craft,['custom-webfont','imagery','type-scale']);
 assert.ok(r.absent.includes('purple-gradient')&&r.absent.includes('card-grid'));
});

test('stock AI landing signals rank strongest first and explain a fix in ko/en',()=>{
 const m=quiet();
 Object.assign(m.gradients,{count:2,large:1,purple:1});m.gradientText={count:1,headings:1,targets:['h1']};
 m.emoji={count:5,icons:4,targets:[]};m.cardGrids={count:1,groups:[{count:3,iconLed:true,target:'section.grid'}]};
 m.text='Unlock your potential. Seamlessly supercharge your workflow.';m.labels=['learn more','learn more','learn more'];
 m.accents=[[99,102,241],[99,102,241]];m.craft={loadedFonts:[],imagery:0,fontSizes:4};
 const ko=evaluateAiTells(m),en=evaluateAiTells(m,{lang:'en'});
 assert.equal(ko.band,'high');assert.equal(ko.signals[0].strength,'strong');
 for(const id of ['purple-gradient','gradient-text','emoji-icons','card-grid','buzzword-copy','default-accent','generic-cta'])assert.ok(ko.signals.some(s=>s.id===id),id);
 assert.ok(ko.signals.every(s=>s.fix&&s.why));assert.equal(en.signals.find(s=>s.id==='card-grid').title,signalTitle('card-grid','en'));
});

test('craft dampens but does not erase tells; one stock phrase is not a copy problem',()=>{
 const m=quiet();m.glass={count:6,targets:[]};m.text='A seamless handoff between teams.';
 const r=evaluateAiTells(m);
 assert.ok(r.signals.some(s=>s.id==='glass'));assert.ok(!r.signals.some(s=>s.id==='buzzword-copy'));
 assert.ok(r.score>0&&r.score<evaluateAiTells({...m,craft:{}}).score);
});

test('scan targets accept bare hosts, refuse credentials and unknown schemes',()=>{
 assert.equal(scanTarget('example.com/pricing'),'https://example.com/pricing');
 assert.equal(scanTarget('http://127.0.0.1:5173'),'http://127.0.0.1:5173/');
 assert.match(scanTarget('examples/ai-slop-landing.html'),/^file:.*ai-slop-landing.html$/);
 assert.throws(()=>scanTarget('https://user:pw@example.com'),/Credentials/);
 assert.throws(()=>scanTarget('javascript:alert(1)'),/Use an http/);
});

test('DESIGN_REVIEW.md leads with the index, signals, quality and agent next steps',()=>{
 const m=quiet();m.emoji={count:3,icons:3,targets:['div.icon']};
 const md=renderScan({url:'http://x/',lang:'ko',aiLook:evaluateAiTells(m),quality:[{rule:'text-contrast',count:2,viewports:['mobile'],examples:[{selector:'p',message:'Found 3:1 | low'}]}],views:[{viewport:'desktop',width:1440,screenshot:'scan-desktop.png'}],static:null});
 assert.match(md,/AI 티 지수: \d+\/100/);assert.match(md,/이모지를 아이콘으로/);assert.match(md,/text-contrast \| 2/);assert.match(md,/3:1 \\\| low/);assert.match(md,/에이전트가 이어서 할 일/);
});
