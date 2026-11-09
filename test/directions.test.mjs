import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDirectionNote,renderDirectionsMarkdown,renderDirectionsHtml,directionWarnings,firstScreenProblems} from '../src/directions.mjs';

test('direction note: concept first, then key: value parts', () => {
 const n=parseDirectionNote('<!doctype html>\n<!-- direction: The clinic\'s front desk | type: Bricolage Grotesque + Public Sans | palette: deep green, marigold | signature: today\'s hours board -->\n<h1>x</h1>');
 assert.deepEqual(n,{concept:"The clinic's front desk",type:'Bricolage Grotesque + Public Sans',palette:'deep green, marigold',signature:"today's hours board"});
 assert.equal(parseDirectionNote('<h1>no note</h1>'),null);
});

const items=[
 {label:'A',file:'a.html',note:{concept:'이번 달 장부 한 장',type:'Black Han Sans + Pretendard',signature:'11월 가계부'},score:0,signals:[],quality:2,ja:null,desktop:'_scans/a/scan-desktop.png',mobile:'_scans/a/scan-mobile.png'},
 {label:'B',file:'b.html',note:null,score:24,signals:['Uniform 3–4 card grid'],quality:0,ja:1,desktop:'_scans/b/scan-desktop.png',mobile:'_scans/b/scan-mobile.png'}];

test('directions sheet: markdown lists each direction and asks for a choice in the report language', () => {
 const ko=renderDirectionsMarkdown(items,'ko');
 assert.match(ko,/^# 디자인 방향 비교/);
 assert.match(ko,/## A\. 이번 달 장부 한 장/);assert.match(ko,/- 고유 요소: 11월 가계부/);
 assert.match(ko,/## B\. b\.html/,'a mock without a note falls back to its file name');
 assert.match(ko,/AI 티 지수: 24\/100 · 기본 품질 문제: 0 · 일본어 조판 문제: 1/);
 assert.match(ko,/어느 방향으로 갈지 정해 주세요: A \/ B\n$/);
 assert.match(renderDirectionsMarkdown(items,'ja'),/どの方針で進めるか選んでください：A \/ B/);
});

test('directions sheet: HTML escapes notes and links the screenshots relatively', () => {
 const html=renderDirectionsHtml([{...items[0],note:{concept:'<b>bold</b> & co'}}],'en');
 assert.match(html,/&lt;b&gt;bold&lt;\/b&gt; &amp; co/);
 assert.match(html,/<img src="_scans\/a\/scan-desktop.png"/);
 assert.match(html,/<html lang="en">/);
});

test('directions sheet: warns when mocks share a surface or a type pair, or all sit on off-white', () => {
 const d=(label,bg,fonts)=>({label,file:label+'.html',note:null,score:0,signals:[],quality:0,ja:null,desktop:'',mobile:'',bg,fonts});
 const w=directionWarnings([d('A',[244,241,234],['instrument sans','bricolage grotesque']),d('B',[246,245,241],['instrument sans','bricolage grotesque']),d('C',[250,248,244],['inter'])]);
 assert.deepEqual(w.map(x=>x.id),['same-surface','same-fonts','same-surface','same-surface','all-tinted']);
 assert.deepEqual(directionWarnings([d('A',[255,255,255],['inter']),d('B',[16,32,58],['m plus 1']),d('C',[244,241,234],['klee one'])]),[]);
 const md=renderDirectionsMarkdown([d('A',[244,241,234],['a','b']),d('B',[246,243,236],['c'])],'ko');
 assert.match(md,/> \*\*시안끼리 너무 비슷합니다\*\*/);assert.match(md,/A와 B의 바탕색이 거의 같습니다\(#f4f1ea \/ #f6f3ec\)/);
 assert.match(md,/- 바탕색: #f4f1ea · 측정된 서체: a \+ b/);
 assert.match(renderDirectionsHtml([d('A',[255,255,255],['x']),d('B',[0,0,0],['y'])],'en'),/^(?![\s\S]*class="warn")/);
});

test('directions sheet: names the hero skeleton and warns when two directions share it', async () => {
 const {heroSkeleton}=await import('../src/directions.mjs');
 assert.equal(heroSkeleton({align:'left',side:{kind:'panel'},fullBleed:false,stats:4}),'left+panel');
 assert.equal(heroSkeleton({align:'center',side:null,fullBleed:false,stats:0}),'center+stacked');
 assert.equal(heroSkeleton({align:'left',side:{kind:'media'},fullBleed:true,stats:0}),'full-bleed');
 assert.equal(heroSkeleton(null),null);
 const d=(label,hero)=>({label,file:label,note:null,score:0,signals:[],quality:0,ja:null,desktop:'',mobile:'',bg:[255,255,255],fonts:[label],hero});
 const items=[d('A','left+panel'),d('B','left+panel'),d('C','full-bleed')];
 assert.deepEqual(directionWarnings(items),[{id:'same-hero',a:'A',b:'B',c:'left+panel'}]);
 assert.match(renderDirectionsMarkdown(items,'ja'),/AとBのヒーローの構成が同じです（左寄せの見出し＋横にパネル）。/);
 assert.match(renderDirectionsMarkdown(items,'en'),/- Surface: #ffffff · Measured type: C · Hero layout: full-bleed photo or video/);
});

test('first screen: warns when nothing says what this is (unless a photo carries it) or the button falls below the fold', () => {
 assert.deepEqual(firstScreenProblems({firstScreen:{claim:false,media:0,action:false}}),['no-claim']);
 assert.deepEqual(firstScreenProblems({firstScreen:{claim:false,media:.8,action:false}}),[],'a full-bleed photo can carry the first screen');
 assert.deepEqual(firstScreenProblems({firstScreen:{claim:true,media:0,action:true},heroCta:{below:true}}),['cta-below']);
 assert.deepEqual(firstScreenProblems({}),[]);
 assert.deepEqual(firstScreenProblems({firstScreen:{claim:true,claimRatio:.43,media:0,action:true}}),['weak-claim'],'a board label dwarfs the claim');
 assert.deepEqual(firstScreenProblems({firstScreen:{claim:true,claimRatio:.43,media:.9,action:true}}),[],'image-led screens may carry a small claim');
 assert.deepEqual(firstScreenProblems({firstScreen:{claim:true,claimRatio:.89,media:0,action:true}}),[]);
 const w=directionWarnings([{label:'A',first:['no-claim']},{label:'B',first:[]}]);
 assert.deepEqual(w,[{id:'no-claim',a:'A'}]);
 for(const lang of ['ko','ja','en'])assert.match(renderDirectionsMarkdown([{label:'A',file:'a.html',signals:[],score:0,quality:0,first:['no-claim']}],lang,w),/A/);
 assert.match(renderDirectionsMarkdown([{label:'A',file:'a.html',signals:[],score:0,quality:0}],'ko',w),/첫 화면에 무엇을 하는 곳인지/);
});
