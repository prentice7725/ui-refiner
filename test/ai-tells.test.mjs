import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAiTells,signalTitle} from '../src/ai-tells.mjs';
import {scanTarget,renderScan,groupQuality} from '../src/scan.mjs';
import {evaluateJaTypography} from '../src/ja-typography.mjs';

const quiet=()=>({gradients:{count:0,large:0,purple:0,coverage:0,targets:[]},gradientText:{count:0,headings:0,targets:[]},glass:{count:0,targets:[]},glow:{count:0,targets:[]},transitionAll:{count:0,targets:[]},emoji:{count:0,icons:0,targets:[]},centered:{blocks:6,centered:1,ratio:1/6,targets:[]},cardGrids:{count:0,groups:[]},eyebrowPills:{count:0,targets:[]},rounding:{containers:5,rounded:1,ratio:.2},typography:{families:[{name:'söhne',count:40}],sizes:8,ratio:3},accents:[[200,60,40]],hueBuckets:2,craft:{loadedFonts:['söhne'],imagery:4,fontSizes:8},text:'Invoices sent in 2 clicks. Used by 4,000 clinics.',labels:['compare plans','read the api docs']});

test('a deliberate page with craft signals scores none and lists every avoided tell',()=>{
 const r=evaluateAiTells(quiet());
 assert.equal(r.score,0);assert.equal(r.band,'none');assert.equal(r.blocking,false);
 assert.deepEqual(r.craft,['custom-webfont','imagery'],'type scale no longer counts as craft: AI sites have it as often (calibration 2026-11)');
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

const jaMetrics=over=>({japanese:true,jaRatio:.8,lang:'ja',phraseAware:0,fontFallback:{count:0,ratio:0,stacks:[],targets:[]},lineHeight:{paragraphs:6,tight:0,normal:0,values:[],targets:[]},italic:{count:0,targets:[]},tiny:{count:0,targets:[]},tracking:{count:0,targets:[]},orphans:{count:0,headings:5,examples:[]},breakAll:{count:0,targets:[]},halfWidthKana:{count:0,targets:[]},fullWidthAlnum:{count:0,targets:[]},...over});

test('Japanese typesetting: non-Japanese pages are skipped and clean pages report nothing',()=>{
 assert.deepEqual(evaluateJaTypography({japanese:false}),{japanese:false,issues:[]});
 assert.deepEqual(evaluateJaTypography(jaMetrics({})).issues,[]);
});

test('Japanese typesetting: AI-default Inter stack, tight leading and orphans are explained in Japanese',()=>{
 const r=evaluateJaTypography(jaMetrics({fontFallback:{count:15,ratio:1,stacks:[{stack:'Inter, sans-serif',count:15}],targets:['h1']},lineHeight:{paragraphs:4,tight:3,normal:0,values:[1.3],targets:['p']},orphans:{count:2,headings:4,examples:[{target:'h1',lastLine:'を',lines:3}]},italic:{count:1,targets:['p']},halfWidthKana:{count:1,targets:['p']}}),{lang:'ja'});
 assert.deepEqual(r.issues.map(i=>i.id),['ja-font-fallback','ja-line-height','ja-orphans','ja-italic','ja-half-kana']);
 assert.match(r.issues[0].title,/和文書体/);assert.match(r.issues[0].fix,/Noto Sans JP/);assert.deepEqual(r.issues[2].evidence.examples,['を']);
});

test('Japanese pages: stock phrases and CTAs count, a proper Japanese stack is not "generic type"',()=>{
 const m=quiet();m.text='次世代のAIであなたのビジネスを加速。シームレスな連携。';m.labels=['詳しく見る','詳しく見る'];m.typography.families=[{name:'noto sans jp',count:40}];m.japanese=true;m.japaneseFontCoverage=1;
 const r=evaluateAiTells(m,{lang:'ja'});
 assert.ok(r.signals.some(s=>s.id==='buzzword-copy'&&s.title==='紋切り型のマーケティング文句'));
 assert.equal(r.signals.find(s=>s.id==='buzzword-copy').weight,0,'reported, not scored, since the 2026-11-19 recheck');
 assert.ok(r.signals.some(s=>s.id==='generic-cta'));assert.ok(!r.signals.some(s=>s.id==='generic-type'));
 assert.ok(evaluateAiTells({...m,japaneseFontCoverage:0},{lang:'ja'}).signals.some(s=>s.id==='generic-type'));
});

test('Japanese report renders its own section and numbering without gaps',()=>{
 const md=renderScan({url:'http://x/',lang:'ja',aiLook:evaluateAiTells(quiet(),{lang:'ja'}),quality:[],japanese:{japanese:true,issues:[{...evaluateJaTypography(jaMetrics({italic:{count:1,targets:['p']}}),{lang:'ja'}).issues[0],viewports:['mobile']}]},views:[{viewport:'desktop',width:1440,screenshot:'scan-desktop.png'}],static:null});
 assert.match(md,/AI感指数/);assert.match(md,/## 1\. この点数の理由/);assert.match(md,/判定：AIが作ったサイトには見えません。/);assert.match(md,/## 4\. 日本語タイポグラフィ/);assert.match(md,/日本語の斜体 \(mobile\)/);assert.match(md,/## 6\. エージェントが続けて行うこと/);
});

test('Japanese typesetting: words broken in short titles and links are reported with the break point',()=>{
 const r=evaluateJaTypography(jaMetrics({badBreaks:{count:2,blocks:12,examples:[{target:'li > a',kind:'split-word',at:'支援フ／ァンド」'},{target:'h3',kind:'line-start',at:'ブロ／ッグ'}]}}),{lang:'ja'});
 assert.deepEqual(r.issues.map(i=>[i.id,i.severity]),[['ja-bad-break','medium']]);
 assert.deepEqual(r.issues[0].evidence.examples,['支援フ／ァンド」','ブロ／ッグ']);assert.match(r.issues[0].title,/カタカナ語の分断/);
 assert.deepEqual(evaluateJaTypography(jaMetrics({badBreaks:{count:0,blocks:12,examples:[]}})).issues,[],'clean short blocks report nothing');
});

test('Japanese typesetting: only main-heading line starts and UI-label breaks are reported, others are counted',()=>{
 const ex=[{target:'nav > button',kind:'split-word',where:'label',at:'サステナ／ビリティ'},{target:'h2',kind:'split-word',where:'heading',at:'ニュース／リリース'},{target:'ul.news > li > a',kind:'line-start',where:'list',at:'支援フ／ァンド」'}];
 const r=evaluateJaTypography(jaMetrics({badBreaks:{count:5,prominent:1,blocks:30,examples:ex}}),{lang:'ja'});
 assert.deepEqual(r.issues.map(i=>[i.id,i.severity]),[['ja-bad-break','low']]);
 assert.deepEqual(r.issues[0].evidence,{count:1,inLists:4,examples:['サステナ／ビリティ']});assert.deepEqual(r.issues[0].targets,['nav > button']);
 assert.deepEqual(evaluateJaTypography(jaMetrics({badBreaks:{count:4,prominent:0,blocks:30,examples:[ex[1]]}})).issues,[],'news-list breaks alone are not an issue');
});

test('quality counts each element once across viewports and shows one example per threshold',()=>{
 const f=(selector,expected)=>({rule:'text-contrast',selector,expected,message:`Expected text contrast of at least ${expected}. Found 2.96:1.`});
 const [q]=groupQuality([{viewport:'desktop',quality:[f('nav > a','3:1'),f('nav > a.b','3:1'),f('#Message h2','4.5:1')]},{viewport:'mobile',quality:[f('nav > a','3:1'),f('#Message h2','4.5:1')]}]);
 assert.equal(q.count,3);assert.equal(q.occurrences,5);assert.deepEqual(q.viewports,['desktop','mobile']);
 assert.deepEqual(q.examples.map(e=>e.selector),['nav > a','#Message h2','nav > a.b'],'4.5:1 is shown even though 3:1 came first');
 const md=renderScan({url:'http://x/',lang:'ko',aiLook:evaluateAiTells(quiet()),quality:[q],views:[{viewport:'desktop',width:1440,screenshot:'scan-desktop.png'}],static:null});
 assert.match(md,/요소 수/);assert.match(md,/`nav > a` — .*<br>`#Message h2` — .*4\.5:1/);
});

test('editorial AI template: tracked labels, numbered labels, period headlines and paper+serif score; quiet editorial pages do not',()=>{
 const m=quiet();m.editorial={tracked:14,numbered:4,periodHeadings:5,headings:7,serifDisplay:1,paper:true,targets:['h2']};
 const r=evaluateAiTells(m,{lang:'en'});
 assert.deepEqual(r.signals.filter(s=>['tracked-labels','numbered-labels','period-headlines','paper-serif'].includes(s.id)).map(s=>[s.id,s.strength]),[['tracked-labels','strong'],['period-headlines','strong'],['numbered-labels','moderate'],['paper-serif','moderate']]);
 assert.ok(r.score>=30,`editorial template should reach medium, got ${r.score}`);
 assert.deepEqual(r.measures,{tracked:14,numbered:4,periodHeadings:5,headings:7,serifDisplay:1,paper:true});
 m.editorial={tracked:2,numbered:1,periodHeadings:1,headings:7,serifDisplay:1,paper:false,targets:[]};
 assert.equal(evaluateAiTells(m).score,0,'one period headline and a serif face are ordinary choices');
 assert.ok(signalTitle('period-headlines','ja'));
});

test('signals common on human sites are reported but not scored',()=>{
 const m=quiet();m.transitionAll={count:5,targets:['a']};m.labels=['learn more','learn more'];m.accents=[[37,99,235],[37,99,235]];
 const r=evaluateAiTells(m,{lang:'en'});
 assert.deepEqual(r.signals.map(s=>[s.id,s.weight]).sort(),[['default-accent',0],['generic-cta',0],['transition-all',0]]);
 assert.equal(r.score,0);assert.equal(r.band,'none');
 m.accents=[[99,102,241],[99,102,241]];
 assert.equal(evaluateAiTells(m).signals.find(s=>s.id==='default-accent').weight,2,'Tailwind indigo still scores');
});

test('cards inside cards and icons in tinted rounded squares are reported; old scans without the measures are skipped',()=>{
 const old=evaluateAiTells(quiet());
 assert.ok(!old.signals.some(s=>['nested-cards','boxed-icons'].includes(s.id)),'no measure, no signal');
 const m=quiet();m.editorial={tracked:0,numbered:0,periodHeadings:0,headings:4,serifDisplay:0,paper:false,targets:[]};
 m.nestedCards={count:4,hosts:3,targets:['div.card > div.inner']};m.iconBoxes={count:3,targets:['div.icon-wrap']};
 const r=evaluateAiTells(m,{lang:'ja'});
 assert.deepEqual(r.signals.filter(s=>['nested-cards','boxed-icons'].includes(s.id)).map(s=>[s.id,s.weight]),[['nested-cards',2],['boxed-icons',2]]);
 assert.equal(r.signals.find(s=>s.id==='nested-cards').title,'カードの中のカード');
 assert.deepEqual([r.measures.nestedCards,r.measures.nestedHosts,r.measures.iconBoxes],[4,3,3]);
 m.nestedCards={count:5,hosts:2,targets:[]};m.iconBoxes={count:2,targets:[]};
 assert.ok(!evaluateAiTells(m).signals.some(s=>['nested-cards','boxed-icons'].includes(s.id)),'inner boxes in only two cards, or two icon boxes, are normal');
});

test('score breakdown: whole points per signal add up to the score, and the verdict follows the score',async()=>{
 const {scoreBreakdown,scoreSignals,aiVerdict}=await import('../src/ai-tells.mjs');
 const sig=(id,weight)=>({id,title:id,weight});
 for(const [signals,craft] of [[[sig('a',3),sig('b',2),sig('c',1),sig('d',0)],[]],[[sig('a',3),sig('b',3),sig('c',2),sig('d',1)],['custom-webfont','imagery']],[Array.from({length:9},(_,i)=>sig('s'+i,3)),['imagery']],[[],[]]]){
  const b=scoreBreakdown(signals,craft),{score}=scoreSignals(signals,craft);
  assert.equal(b.score,score);
  assert.equal(b.rows.reduce((n,r)=>n+r.points,0)+b.craft.reduce((n,c)=>n+c.points,0)+b.cap,score);
  assert.ok(b.rows.every(r=>r.points>0)&&!b.rows.some(r=>r.id==='d'&&signals.find(s=>s.id==='d')?.weight===0));
 }
 assert.deepEqual([0,7,8,19,20,100].map(aiVerdict),['none','none','unclear','unclear','ai','ai']);
 const md=renderScan({url:'http://x/',lang:'ko',aiLook:evaluateAiTells({...quiet(),emoji:{count:6,icons:6,targets:['span']}}),quality:[],japanese:{japanese:false,issues:[]},views:[{viewport:'desktop',width:1440,screenshot:'scan-desktop.png'}],static:null});
 assert.match(md,/## 1\. 왜 이 점수인가/);assert.match(md,/\| \*\*합계\*\* \| \*\*\d+\*\* \|/);assert.match(md,/판정: AI가 만든/);
});

test('allow: a signal the project keeps on purpose is reported without being scored', async () => {
 const {mergeTells}=await import('../src/scan.mjs');
 const {readAllow,addAllow,removeAllow,findAllow,ALLOW_FILE}=await import('../src/allow.mjs');
 const fsp=await import('node:fs/promises'),os=await import('node:os'),path=await import('node:path');
 const m=quiet();m.typography={...m.typography,families:[{name:'noto sans kr',count:40}]};
 const plain=mergeTells([{viewport:'desktop',metrics:m}],'ko'),kept=mergeTells([{viewport:'desktop',metrics:m}],'ko',[{signal:'generic-type',reason:'brand typeface'}]);
 const g=r=>r.signals.find(x=>x.id==='generic-type');
 assert.ok(g(plain).weight>0&&!g(plain).allowed);
 assert.equal(g(kept).weight,0);assert.equal(g(kept).points,0);assert.equal(g(kept).allowed,'brand typeface');assert.ok(kept.score<plain.score);
 assert.equal(kept.breakdown.rows.reduce((n,r)=>n+r.points,0)+kept.breakdown.craft.reduce((n,c)=>n+c.points,0)+kept.breakdown.cap,kept.score);
 const md=renderScan({url:'http://x/',lang:'ko',aiLook:kept,quality:[],japanese:{japanese:false,issues:[]},views:[{viewport:'desktop',width:1440,screenshot:'scan-desktop.png'}],static:null});
 assert.match(md,/0 \(허용: brand typeface\)/);assert.match(md,/ui-refiner-allow\.json/);
 const dir=await fsp.mkdtemp(path.join(os.tmpdir(),'uir-allow-')),file=path.join(dir,ALLOW_FILE);
 assert.deepEqual(await readAllow(file),[],'a missing file is an empty list');
 await addAllow(file,{signal:'generic-type',reason:'brand typeface'});await addAllow(file,{signal:'generic-type',reason:'house face'});
 assert.deepEqual(await readAllow(file),[{signal:'generic-type',reason:'house face'}],'one entry per signal');
 await assert.rejects(addAllow(file,{signal:'text-contrast',reason:'we like it'}),/Unknown signal/,'quality rules cannot be allowed');
 await assert.rejects(addAllow(file,{signal:'gradient-text'}),/--reason is required/);
 assert.equal(await findAllow(path.join(dir,'index.html'),os.tmpdir()),file,'found beside a local page');
 assert.equal(await findAllow('https://example.com/',dir),file,'found in the working directory for a URL');
 await removeAllow(file,'generic-type');assert.deepEqual(await readAllow(file),[]);
});

test('allow: the CLI adds, lists and removes an entry', async () => {
 const {execFileSync}=await import('node:child_process'),fsp=await import('node:fs/promises'),os=await import('node:os'),path=await import('node:path');
 const dir=await fsp.mkdtemp(path.join(os.tmpdir(),'uir-allow-cli-')),bin=path.resolve('bin/ui-refiner.mjs'),run=(...a)=>execFileSync(process.execPath,[bin,...a],{cwd:dir,encoding:'utf8'});
 assert.match(run('allow','add','default-accent','--reason','brand blue'),/\[ALLOW\] default-accent: brand blue/);
 assert.match(run('allow','list'),/default-accent: brand blue/);
 run('allow','remove','default-accent');assert.match(run('allow','list'),/No allowed signals/);
});

test('Korean pages: a small display size and a single plain family are reported but not scored', () => {
 const base=quiet();base.typography={...base.typography,display:28,body:16,ratio:1.75};
 const f=r=>r.signals.find(s=>s.id==='flat-scale');
 const en=evaluateAiTells({...base,text:'A plain English page about budgets and spending, long enough to count.'},{lang:'en'});
 const ko=evaluateAiTells({...base,text:'흩어진 계좌를 한 화면에 모아 보고 수수료 없이 송금하는 개인 자산관리 앱입니다.'},{lang:'ko'});
 // Since the 2026-11-19 recheck a small display size is reported on every page: it fired on more English human sites than AI ones.
 assert.equal(f(en)?.weight,0,'reported on an English page');assert.equal(f(ko)?.weight,0,'reported on a Korean page');assert.equal(f(ko)?.points,0);
 const one={...base,typography:{...base.typography,families:[{name:'noto sans kr',count:40}]}},g=r=>r.signals.find(x=>x.id==='generic-type');
 assert.ok(g(evaluateAiTells({...one,text:'A plain English page about budgets and spending, long enough to count.'},{lang:'en'}))?.weight>0,'a single plain family is scored on an English page');
 assert.equal(g(evaluateAiTells({...one,text:'흩어진 계좌를 한 화면에 모아 보고 수수료 없이 송금하는 개인 자산관리 앱입니다.'},{lang:'ko'}))?.weight,0,'and reported on a Korean page');
});
