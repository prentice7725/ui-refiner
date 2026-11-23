// README figures: the eight impression archetypes as schematics, and the Korean business family drawn in all eight.
// node scripts/build-archetype-figures.mjs → docs/assets/archetypes.jpg, docs/assets/archetype-demo-kr-business.jpg
// Counts come from data/archetypes/counts.json.
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const root=new URL('../',import.meta.url);
const {archetypes,groups}=JSON.parse(await fs.readFile(new URL('data/archetypes/counts.json',root),'utf8'));
const total=i=>Object.values(groups).reduce((s,g)=>s+g[i],0);
const country=(c,i)=>Object.entries(groups).filter(([k])=>k.startsWith(c)).reduce((s,[,g])=>s+g[i],0);

// Schematics of the first two and a half screens, drawn from each archetype's measured means:
// ground (white, dark, photograph, saturated colour shares), full-bleed hero rate, display size against body, density.
const P='background:linear-gradient(135deg,#8fa1b3,#5d6f82)';
const bar=(w,h,c='#222',m=6)=>`<i style="display:block;width:${w}%;height:${h}px;background:${c};margin-top:${m}px"></i>`;
const lines=(n,c='#c9cdd2',w=[92,84,70])=>Array.from({length:n},(_,i)=>bar(w[i%w.length],3,c,5)).join('');
const row=(n,inner,gap=6,style='')=>`<div style="display:grid;grid-template-columns:repeat(${n},1fr);gap:${gap}px;${style}">${Array.from({length:n},(_,i)=>typeof inner==='function'?inner(i):inner).join('')}</div>`;
const head=(c='#222',n=4,bg='transparent')=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;background:${bg}"><i style="width:26px;height:5px;background:${c}"></i><span style="display:flex;gap:5px">${Array.from({length:n},()=>`<i style="width:12px;height:3px;background:${c};opacity:.7"></i>`).join('')}</span></div>`;
const schematic=[
 // short & small: white 50%, 2.9 screens, display 1.8 × body, 2.7 menu items
 `<div style="background:#fff;height:46%">${head('#222',2)}<div style="padding:8px 12px;display:grid;grid-template-columns:1fr 54px;gap:10px"><div>${bar(80,5)}${lines(3)}</div><div style="height:38px;${P}"></div></div><div style="padding:0 12px">${lines(5,'#dcdfe3',[100])}</div></div><div style="background:#e9eaeb;height:54%"></div>`,
 // dark cinematic: dark 49%, white 16%, full-bleed hero 41%
 `<div style="background:#14171c;height:100%;color:#fff">${head('#fff')}<div style="height:124px;background:linear-gradient(180deg,#39424e,#14171c);padding:54px 12px 0">${bar(74,8,'#fff',0)}${bar(52,8,'#fff')}${bar(22,9,'transparent;border:1px solid #fff',10)}</div><div style="padding:14px 12px">${row(4,`<div style="height:74px;background:linear-gradient(180deg,#4a5563,#232830)"></div>`)}${bar(40,6,'#fff',18)}${lines(3,'#4a4f57')}</div></div>`,
 // white quiet: white 73%, photographs 2%, 7.7 screens
 `<div style="background:#fff;height:100%">${head()}<div style="padding:26px 12px 0;display:grid;grid-template-columns:1fr 70px;gap:12px"><div>${bar(90,7,'#111',0)}${bar(64,7,'#111')}${lines(2)}${bar(26,10,'#111',10)}</div><div style="border:1px solid #d5d9de;border-radius:4px;height:70px"></div></div><div style="padding:30px 12px 0">${bar(46,6)}${lines(4,'#e3e6ea',[100])}</div><div style="background:#f4f5f7;margin-top:22px;padding:14px 12px;height:90px">${bar(50,6)}${lines(3)}</div></div>`,
 // dense portal: 6.5 menu items, hairlines and elements highest, full-bleed hero 3%
 `<div style="background:#fff;height:100%"><div style="height:8px;border-bottom:1px solid #ddd"></div>${head('#222',0)}<div style="display:flex;border-block:1px solid #222;margin:0 8px">${Array.from({length:7},(_,i)=>`<i style="flex:1;height:10px;border-right:1px solid #ddd;background:${i?'transparent':'#222'}"></i>`).join('')}</div><div style="padding:6px 8px;display:grid;grid-template-columns:36px 1fr 46px;gap:5px"><div style="border:1px solid #ddd;padding:3px">${lines(6,'#ccc',[100])}</div><div style="height:58px;${P}"></div><div style="border:1px solid #ddd;padding:3px">${lines(3,'#ccc',[100])}${bar(100,7,'#f96209',5)}</div></div><div style="padding:0 8px">${row(6,`<div><div style="height:20px;${P}"></div>${lines(2,'#ccc',[90,60])}</div>`,4)}${row(3,`<div style="border:1px solid #ddd;padding:3px">${bar(40,4,'#222',0)}${lines(5,'#ccc',[100])}</div>`,5,'margin-top:8px')}${row(6,`<div><div style="height:20px;${P}"></div>${lines(2,'#ccc',[90,60])}</div>`,4,'margin-top:8px')}${row(5,`<div style="border:1px solid #ddd;height:12px"></div>`,4,'margin-top:8px')}</div></div>`,
 // photo-led: photographs 28% of the first screen, full-bleed hero 47%
 `<div style="background:#fff;height:100%"><div style="height:128px;${P};padding:0"><div style="opacity:.9">${head('#fff')}</div><div style="padding:48px 12px 0">${bar(70,7,'#fff',0)}${bar(46,7,'#fff')}</div></div>${row(4,i=>`<div style="height:84px;background:linear-gradient(${120+i*40}deg,#a3b1bf,#4f6072)"></div>`,0)}<div style="display:grid;grid-template-columns:3fr 2fr"><div style="height:88px;background:linear-gradient(200deg,#b9c4cf,#6c7d8f)"></div><div style="padding:14px 10px">${bar(80,5,'#222',0)}${lines(4)}</div></div></div>`,
 // big type: display 6.3 × body (104px), 11.5 screens, full-bleed hero 61%, serif display 38%
 `<div style="background:#fff;height:100%">${head()}<div style="padding:12px 12px 0">${bar(96,17,'#111',0)}${bar(62,17,'#111',7)}${bar(84,17,'#111',7)}${lines(2)}</div><div style="height:76px;${P};margin-top:14px"></div><div style="padding:6px 12px">${[70,52,82].map(w=>`<div style="border-bottom:1px solid #111;padding:9px 0;display:flex;justify-content:space-between;align-items:center"><i style="width:${w}%;height:13px;background:#111"></i><i style="width:26px;height:18px;${P}"></i></div>`).join('')}</div></div>`,
 // standard corporate: full-bleed hero on all, headline left, cards, about half white
 `<div style="background:#fff;height:100%"><div style="height:112px;background:linear-gradient(90deg,#27405f,#8fa1b3)">${head('#fff')}<div style="padding:26px 12px 0">${bar(56,7,'#fff',0)}${bar(40,7,'#fff')}${bar(20,8,'transparent;border:1px solid #fff',9)}</div></div><div style="padding:16px 12px 0">${bar(24,6,'#222;margin-inline:auto',0)}${row(4,`<div style="border:1px solid #ddd"><div style="height:34px;${P}"></div><div style="padding:4px">${lines(2,'#ccc',[90,60])}</div></div>`,6,'margin-top:10px')}</div><div style="background:#0b4ea2;height:28px;margin-top:14px"></div><div style="background:#f4f6f8;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;height:80px"><div style="${P}"></div><div>${bar(80,5,'#222',0)}${lines(4)}</div></div></div>`,
 // bold colour: saturated colour 37%, white 24%, 4.1 menu items
 `<div style="background:#0056aa;height:100%">${head('#fff',3)}<div style="padding:22px 12px;display:grid;grid-template-columns:1fr 74px;gap:10px"><div>${bar(92,7,'#fff',0)}${bar(60,7,'#fff')}${lines(2,'#8db4dd')}${bar(34,10,'#000;border-radius:6px',10)}</div><div style="height:70px;border-radius:0 22px 0 0;${P}"></div></div>${row(2,i=>`<div style="height:52px;background:${['#e85623','#dfedf5'][i]};padding:10px">${bar(60,7,i?'#0b2b4d':'#fff',0)}</div>`,0)}${row(2,i=>`<div style="height:52px;background:${['#fff','#0b2b4d'][i]};padding:10px">${bar(50,7,i?'#fff':'#0b2b4d',0)}</div>`,0)}<div style="background:#e85623;height:60px;padding:12px">${bar(50,6,'#fff',0)}</div></div>`
];
const frame='font:13px/1.4 Pretendard Variable,Pretendard,Malgun Gothic,system-ui,sans-serif;color:#18241f;background:#f7f7f4;margin:0;padding:28px';
const types=`<body style="${frame}"><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:16px;width:1544px">${archetypes.map((name,i)=>`<figure style="margin:0"><div style="height:300px;overflow:hidden;border:1px solid #c5cbc6;background:#fff">${schematic[i]}</div><figcaption style="margin-top:10px"><b style="font-size:15px">${name}</b><br>${total(i)} sites<br><span style="color:#5a6a62">KR ${country('KR',i)} · JP ${country('JP',i)}</span></figcaption></figure>`).join('')}</div></body>`;

const themes=new URL('skills/ui-refiner-agent/reference/themes/',root),demo=new URL('docs/archetype-demo/kr-business/',root);
const files=['short',null,'white','portal','photo','bigtype','corporate','colour'].map(n=>n?new URL(n+'.html',demo):new URL('business-dark/sample.html',themes));
const kr=groups['KR business'];
const browser=await chromium.launch();
const shots=[];
for(const file of files){
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.goto(file.href);await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);
 shots.push((await page.screenshot({type:'jpeg',quality:85})).toString('base64'));await page.close();
}
const demoSheet=`<body style="${frame}"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px 16px;width:1544px">${archetypes.map((name,i)=>`<figure style="margin:0"><img src="data:image/jpeg;base64,${shots[i]}" style="display:block;width:100%;border:1px solid #c5cbc6"><figcaption style="margin-top:8px"><b style="font-size:15px">${name}</b> · ${kr[i]} of ${kr.reduce((a,b)=>a+b)} sites${[1,2,6].includes(i)?' · theme':''}</figcaption></figure>`).join('')}</div></body>`;
for(const [name,html] of [['archetypes',types],['archetype-demo-kr-business',demoSheet]]){
 const page=await browser.newPage({viewport:{width:1600,height:100}});
 await page.setContent(html,{waitUntil:'load'});
 await page.screenshot({path:new URL('docs/assets/'+name+'.jpg',root).pathname.slice(1),fullPage:true,type:'jpeg',quality:82});await page.close();
}
await browser.close();
