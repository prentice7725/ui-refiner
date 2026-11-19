import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {compareStress,stressLang,renderStress,stressPage,WORST,FIXES} from '../src/stress.mjs';

test('stress: language from the page text, values on .example domains only', () => {
 assert.equal(stressLang('바른미소치과의원은 수원 영통에 있는 가족 치과입니다. 화요일과 목요일은 야간진료'),'ko');
 assert.equal(stressLang('定期検診からインプラントまで、ひとつの医院でご案内いたします。お気軽にどうぞ'),'ja');
 assert.equal(stressLang('A family dental clinic in Suwon'),'en');
 for(const v of Object.values(WORST)){assert.match(v.email,/\.example\.com$/);assert.match(v.url,/^https:\/\/www\.example\.com\//);}
});

test('stress: only breaks the swap caused count; page overflow alone only when no row explains it', () => {
 const item=(o={})=>({box:{},lines:1,offscreen:false,clipped:false,overlap:null,...o});
 const targets=[{id:'0',tag:'a',text:'031-000-0000',role:'tokens'},{id:'1',tag:'button',text:'예약',role:'label'},{id:'2',tag:'h2',text:'진료시간',role:'heading'}];
 const before={overflow:0,items:{0:item(),1:item(),2:item({offscreen:true})},images:[{n:0,ratio:1,natural:1,fit:'fill'}]};
 const after={overflow:40,items:{0:item({offscreen:true}),1:item({lines:2}),2:item({offscreen:true})},images:[{n:0,ratio:.6,natural:1,fit:'fill',src:'logo.png'}]};
 const f=compareStress(before,after,targets,{0:'031-0000-0000 (내선 1234)',1:'온라인 진료 예약 신청하기'},{kind:'tokens',width:320});
 assert.deepEqual(f.map(x=>x.type),['offscreen','label-wrap','squished'],'the heading was already off screen; no page-overflow row beside an offscreen one');
 assert.equal(f[0].severity,'broken');assert.equal(f[1].severity,'ugly');assert.equal(f[0].fix,FIXES.offscreen);
 const only=compareStress({overflow:0,items:{},images:[]},{overflow:30,items:{},images:[]},[],{},{kind:'headings',width:320});
 assert.deepEqual(only.map(x=>x.type+':'+x.by),['page-overflow:30']);
 assert.match(renderStress({target:'x',lang:'ko',widths:[320],tested:{labels:1,headings:0,tokens:1,numbers:0},findings:f}),/\| 1 \| broken \| 320 \| tokens \|/);
});

test('stress: a fragile header breaks, a sturdy one holds (real browser)', async () => {
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'uir-stress-'));
 const page=(header)=>`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{margin:0;font:16px sans-serif}${header}</style>
<header><a class="logo" href="/">바른미소치과의원</a><a class="tel" href="tel:0310000000">031-000-0000</a></header>
<main><h1>화요일과 목요일은 저녁 진료</h1><p>바른미소치과의원은 수원에 있는 가족 치과입니다. 처음 오시는 분께 진료 순서를 자세히 안내해 드립니다. 문의는 아래 버튼으로 해 주세요.</p>
<a class="btn" href="#book">예약하기</a></main></html>`;
 await fs.writeFile(path.join(dir,'fragile.html'),page('header{display:flex;justify-content:space-between;gap:16px;padding:0 16px}header a{white-space:nowrap}.btn{display:inline-block;width:96px;background:#245;color:#fff;padding:8px;text-align:center}'));
 await fs.writeFile(path.join(dir,'sturdy.html'),page('header{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 16px;padding:0 16px}header a{min-width:0;overflow-wrap:anywhere}.btn{display:inline-block;min-width:96px;background:#245;color:#fff;padding:8px 16px;white-space:nowrap}'));
 const fragile=await stressPage(path.join(dir,'fragile.html'),{out:path.join(dir,'f'),widths:[320],shots:false});
 assert.equal(fragile.lang,'ko');
 assert.ok(fragile.findings.some(f=>f.kind==='tokens'&&['offscreen','page-overflow'].includes(f.type)),'the long phone number runs off a nowrap header');
 assert.ok(fragile.findings.some(f=>f.type==='label-wrap'&&f.element.includes('예약하기')),'a fixed-width button wraps its longer label');
 assert.ok(!fragile.findings.some(f=>f.element?.includes('바른미소치과의원')&&f.kind==='labels'),'the logo link is not a label');
 const sturdy=await stressPage(path.join(dir,'sturdy.html'),{out:path.join(dir,'s'),widths:[320],shots:false});
 assert.equal(sturdy.broken,0,JSON.stringify(sturdy.findings));
 assert.match(await fs.readFile(path.join(dir,'s','STRESS.md'),'utf8'),/tokens: 1 elements, held/);
});
