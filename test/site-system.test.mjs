import test from 'node:test';
import assert from 'node:assert/strict';
import {systemDrift,renderSystemMarkdown} from '../src/site-system.mjs';

const main={fonts:{display:'gowun batang',heading:'gowun batang',body:'pretendard'},sizes:{h1:53,h2:40,h3:15,body:18},weights:{h1:700,h2:700},colours:{text:[90,88,82],heading:[27,27,27]},
 button:{bg:[27,27,27],color:[247,245,239],radius:6,weight:700,height:44},radius:0,hairlines:50,content:1100,bg:[255,255,255],accent:[15,118,110],accentFamily:'teal',aiLook:20,measured:'2026-11-13'};

test('system: an inner page in the same design keeps it, even with a smaller h1', () => {
 assert.deepEqual(systemDrift(main,{...main,sizes:{...main.sizes,h1:36},content:1060,aiLook:28}),[]);
});

test('system: lists where an inner page leaves the design', () => {
 const other={...main,fonts:{...main.fonts,heading:'jua'},button:{...main.button,radius:0,bg:[200,65,11]},radius:12,sizes:{...main.sizes,body:16,h2:28},content:800,bg:[247,244,236],accentFamily:'orange',aiLook:40};
 assert.deepEqual(systemDrift(main,other).map(d=>d.id),['font-heading','surface','accent','button-radius','button-colour','radius','body-size','heading-size','width','ai-look']);
});

test('system: notes name the measured tokens', () => {
 const md=renderSystemMarkdown(main,'index.html');
 for(const s of ['gowun batang','pretendard','#0f766e','radius 6px','1100px','not a second landing hero'])assert.ok(md.includes(s),s);
});
