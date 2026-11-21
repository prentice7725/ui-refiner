// One fictional Korean maker (한빛정밀, the kr-business-dark sample client) drawn in the impression archetypes that
// have no finished theme for the Korean business family. Demonstration samples, not themes.
// node scripts/build-archetype-demo.mjs → docs/archetype-demo/kr-business/<archetype>.html
import fs from 'node:fs/promises';

const out=new URL('../docs/archetype-demo/kr-business/',import.meta.url);
const IMG='../../../skills/ui-refiner-agent/reference/themes/kr-business-dark/assets/generated/';
const PHOTOS={
 hero:['hero-line.jpg',1920,1080,'정밀가공 공장의 긴 통로 양옆으로 CNC 가공기가 줄지어 서 있고, 작업자 한 명이 멀리 걸어가는 모습'],
 measure:['tech-measure.jpg',1650,1100,'항온 측정실에서 3차원 측정기 프로브가 정밀 부품을 측정하고, 뒤에서 엔지니어가 지켜보는 모습'],
 machining:['tile-machining.jpg',1200,1600,'CNC 가공기 주축이 절삭유를 뿌리며 알루미늄 부품을 깎는 모습'],
 automation:['tile-automation.jpg',1200,1600,'안전 펜스 너머로 로봇 팔이 지그 위의 금속 부품을 조립하는 자동화 셀'],
 semicon:['tile-semicon.jpg',1200,1600,'방진복을 입은 기술자가 검사등 아래에서 스테인리스 장비 부품을 살펴보는 모습'],
 mold:['tile-mold.jpg',1200,1600,'공장 바닥에 놓인 다이캐스팅 금형 상·하형 두 짝']
};
const photo=(key,{eager=false,position='50% 50%'}={})=>{const [file,w,h,alt]=PHOTOS[key];
 return `<img src="${IMG}${file}" width="${w}" height="${h}" alt="${alt}" style="object-position:${position}" ${eager?'fetchpriority="high"':'loading="lazy"'} data-generated>`;};

const CLAIM=['마이크로미터 단위의 정밀함으로','라인을 움직입니다'];
const INTRO='1998년 화성에서 시작한 한빛정밀은 자동차와 반도체 장비에 들어가는 정밀 부품을 깎고, 그 부품을 만드는 자동화 라인까지 직접 설계합니다.';
const BUSINESS=[
 ['machining','정밀가공 부품','변속기·조향 장치용 샤프트와 하우징','50% 62%'],
 ['automation','자동화 설비','조립·검사·적재 라인 턴키 공급','45% 40%'],
 ['semicon','반도체 장비 부품','챔버 부품과 진공 플랜지, 클린룸 세정 출하','50% 40%'],
 ['mold','금형','프레스·다이캐스팅 금형 설계와 제작','50% 55%']
];
// Sample figures, invented for the fictional client as in the kr-business-dark sample.
const FIGURES=[['1998','년','화성에서 설립'],['2','곳','생산 공장 (화성 · 천안)'],['14','개국','부품 수출국'],['±2','μm','양산 가공 공차']];
const TECH_TITLE='가공부터 조립까지 한 공장에서 검증합니다';
const TECH_LEDE='부품을 깎는 팀과 라인을 짜는 팀이 같은 바닥에서 일하기 때문에, 공차 문제는 도면 단계에서 먼저 걸러집니다.';
const TECH=[
 ['5축 동시 가공','복합 형상 부품을 한 번의 셋업으로 끝내 누적 오차를 줄입니다.'],
 ['항온 측정실 전수 검사','20℃로 유지되는 측정실에서 3차원 측정기로 출하 전 치수를 확인합니다.'],
 ['자체 설계 자동화 셀','우리 라인에서 먼저 돌려 본 셀만 고객사 공장에 들어갑니다.']
];
const SITES=[['본사','경기도 화성시','경영지원 · 연구소 · 영업 본부'],['공장','화성 공장','자동차 정밀가공 부품 · 금형'],['공장','천안 공장','반도체 장비 부품 · 자동화 설비 조립'],['해외 영업소','베트남 하노이','현지 고객사 영업 · 기술 지원']];
const NEWS=[['2026.11.12','보도자료','천안 공장 반도체 장비 부품 2라인 가동 시작'],['2026.10.28','공지','2026 하반기 협력사 품질 간담회 개최 안내'],['2026.09.30','전시회','국제 공작기계 전시회에서 자동화 검사 셀 공개']];
const MENU=[['#about','회사소개'],['#business','사업분야'],['#technology','기술'],['#news','홍보센터'],['#inquiry','고객지원']];

const PRETENDARD='<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">';
const NOTO='<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap">';
const BASE=`*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;word-break:keep-all;overflow-wrap:anywhere}img{display:block;max-width:100%;height:auto;object-fit:cover}a{color:inherit;text-decoration:none}a:hover{text-decoration:underline}a:focus-visible{outline:2px solid currentColor;outline-offset:3px}h1,h2,h3,p,ul,ol,dl,dd,figure{margin:0}ul,ol{padding:0;list-style:none}.wrap{max-width:var(--content);margin-inline:auto;padding-inline:24px}.num{font-variant-numeric:tabular-nums}`;
const nav=(items=MENU)=>items.map(([href,label])=>`<a href="${href}">${label}</a>`).join('');
const news=()=>NEWS.map(([date,cat,title])=>`<li><a href="#"><time class="num">${date}</time><span>${cat}</span><strong>${title}</strong></a></li>`).join('');
const footer=(extra='')=>`<footer class="foot"><div class="wrap">${extra}<p><strong>한빛정밀 주식회사</strong> 대표이사 홍길동 · 경기도 화성시 OO로 00 · 사업자등록번호 000-00-00000 · 대표전화 031-000-0000 · contact@example.com</p>
<p>© 2026 Hanbit Precision Co., Ltd. 유형 시연용 가상 회사입니다. 이 페이지의 이미지는 AI가 생성한 이미지(Grok Imagine)이며, 실제 회사의 사진이 아닙니다.</p></div></footer>`;
const page=({archetype,sites,font,css,body})=>`<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>한빛정밀 | 정밀가공 부품 · 자동화 설비</title>
<meta name="description" content="한빛정밀은 자동차와 반도체 장비에 들어가는 정밀가공 부품과 자동화 라인을 만듭니다.">
<!-- Archetype demonstration, not a theme: Korean business family drawn as "${archetype}" (${sites} of 235 measured sites).
     한빛정밀 is a fictional client; all images are AI-generated samples (Grok Imagine). Built by scripts/build-archetype-demo.mjs. -->
${font}
<style>
${BASE}
${css}
</style>
</head>
<body>
${body}
</body>
</html>
`;

const pages={};

// 0 short & small: 31 sites. 1 / 1.3 / 3.2 screens, body 14px, display 24px, 0–2 menu items, no full-bleed hero, white outline buttons.
pages.short={archetype:'short & small',sites:31,font:PRETENDARD,css:`
:root{--content:1000px}body{background:#eceded;color:#222;font:14px/1.7 "Pretendard Variable",Pretendard,"Malgun Gothic",sans-serif}
.sheet{max-width:1000px;margin:0 auto;background:#fff;border-inline:1px solid #d9dada}
.top{display:flex;justify-content:space-between;align-items:center;padding:18px 32px;border-bottom:2px solid #222}
.logo{font-size:18px;font-weight:700}.logo small{font-size:11px;font-weight:400;color:#777;letter-spacing:.08em;margin-left:6px}
.top nav{display:flex;gap:20px;font-size:13px}
.intro{display:grid;grid-template-columns:1fr 300px;gap:32px;padding:32px}
.intro h1{font-size:24px;line-height:1.4;font-weight:700;margin-bottom:10px}.intro p{color:#555}
.intro img{width:300px;height:170px}
.cols{display:grid;grid-template-columns:1fr 300px;gap:32px;padding:0 32px 32px}
h2{font-size:15px;font-weight:700;padding-bottom:8px;border-bottom:1px solid #222}
.biz li{display:grid;grid-template-columns:130px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid #e2e2e2}.biz strong{font-weight:600}.biz span{color:#555}
.box{background:#f4f5f5;padding:20px}.box dl{display:grid;grid-template-columns:64px 1fr;gap:4px 8px;margin:10px 0 16px}.box dt{color:#777}
.btn{display:block;text-align:center;border:1px solid #222;border-radius:2px;background:#fff;padding:9px;font-weight:600}
.list li a{display:grid;grid-template-columns:84px 1fr;padding:7px 0;border-bottom:1px solid #e2e2e2}.list span{display:none}.list time{color:#777}.list strong{font-weight:400}
.foot{font-size:12px;color:#777;padding:18px 0;border-top:1px solid #d9dada}.foot .wrap{padding-inline:32px}
@media(max-width:760px){.intro,.cols{grid-template-columns:1fr;padding-inline:20px}.intro img{width:100%}.top{padding-inline:20px}.foot .wrap{padding-inline:20px}.biz li{grid-template-columns:1fr;gap:0}}`,
body:`<div class="sheet">
<header class="top"><a class="logo" href="#">한빛정밀 <small>HANBIT PRECISION</small></a><nav aria-label="주 메뉴"><a href="#business">사업분야</a><a href="#inquiry">오시는 길 · 문의</a></nav></header>
<main>
<section class="intro" id="about"><div><h1>${CLAIM.join(' ')}</h1><p>${INTRO}</p></div>${photo('hero',{eager:true})}</section>
<div class="cols">
<section id="business"><h2>사업분야</h2><ul class="biz">${BUSINESS.map(([, name,line])=>`<li><strong>${name}</strong><span>${line}</span></li>`).join('')}</ul>
<h2 style="margin-top:28px" id="news">새 소식</h2><ul class="list">${news()}</ul></section>
<aside class="box" id="inquiry"><h2>문의</h2><dl><dt>대표전화</dt><dd><a href="tel:0310000000">031-000-0000</a></dd><dt>이메일</dt><dd><a href="mailto:contact@example.com">contact@example.com</a></dd><dt>본사</dt><dd>경기도 화성시 OO로 00</dd><dt>공장</dt><dd>화성 · 천안</dd></dl><a class="btn" href="mailto:contact@example.com">견적 · 기술 문의하기</a></aside>
</div>
</main>
${footer()}
</div>`};

// 2 white quiet: 50 sites (the kr-business-white theme). Three quarters white, Pretendard, display 52px/700, left headline with a panel, 0–3 photographs.
pages.white={archetype:'white quiet',sites:50,font:PRETENDARD,css:`
:root{--content:1200px;--ink:#111418;--soft:#5b6470;--line:#e4e7eb;--band:#f5f6f8}
body{background:#fff;color:var(--ink);font:16px/1.7 "Pretendard Variable",Pretendard,sans-serif}
.head{border-bottom:1px solid var(--line)}.head .wrap{display:flex;align-items:center;gap:40px;height:72px}.logo{font-weight:700;font-size:19px}.head nav{display:flex;gap:28px;font-size:15px;margin-right:auto}
.btn{display:inline-flex;align-items:center;height:48px;padding:0 22px;border-radius:8px;background:var(--ink);color:#fff;font-weight:600}.btn:hover{text-decoration:none;background:#2a2f36}.btn--sm{height:40px;padding:0 16px;font-size:14px}
.link{font-weight:600;border-bottom:1px solid currentColor}
section{padding:clamp(72px,10vw,120px) 0}.label{font-size:14px;font-weight:600;color:var(--soft)}
.hero .wrap{display:grid;grid-template-columns:1fr 480px;gap:72px;align-items:center}
h1{font-size:52px;line-height:1.22;letter-spacing:-.02em;font-weight:700;margin:14px 0 22px}h1 span{display:block}.hero p{color:var(--soft);max-width:34em}.acts{display:flex;gap:24px;align-items:center;margin-top:32px}
.panel{border:1px solid #dfe3e8;border-radius:12px;padding:28px}.panel h2{font-size:15px;font-weight:600;color:var(--soft);margin-bottom:8px}.panel li{display:flex;justify-content:space-between;align-items:baseline;padding:14px 0;border-top:1px solid var(--line)}.panel b{font-size:26px;font-weight:700;letter-spacing:-.02em}.panel small{font-size:14px;font-weight:500;margin-left:2px}.panel span{color:var(--soft);font-size:15px}
h2.h2{font-size:36px;line-height:1.3;letter-spacing:-.02em;font-weight:700}
.rows{margin-top:40px;border-top:1px solid var(--ink)}.rows li{display:grid;grid-template-columns:72px 320px 1fr;gap:24px;padding:26px 0;border-bottom:1px solid var(--line);align-items:baseline}.rows .num{color:var(--soft);font-size:14px}.rows h3{font-size:22px;font-weight:700}.rows p{color:var(--soft)}
.band{background:var(--band)}.tech{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center}.tech img{border-radius:6px;aspect-ratio:3/2;width:100%}.tech .lede{color:var(--soft);margin:16px 0 28px}
.steps li{display:grid;grid-template-columns:40px 1fr;padding:16px 0;border-top:1px solid #dcdfe4}.steps .num{font-size:14px;color:var(--soft)}.steps strong{display:block}.steps p{color:var(--soft);font-size:15px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:72px}.plain{margin-top:28px}.plain li{padding:16px 0;border-top:1px solid var(--line)}.plain li>a{display:grid;grid-template-columns:96px 1fr;gap:4px 12px}.plain time,.plain span,.plain small{color:var(--soft);font-size:14px}.plain a span{display:none}.plain strong{font-weight:500}.site{display:grid;grid-template-columns:96px 1fr;gap:12px}.site b{font-weight:600}.site small{display:block}
.close .wrap{display:flex;justify-content:space-between;align-items:center;gap:32px}.close p{color:var(--soft);margin-top:8px}
.foot{border-top:1px solid var(--line);padding:36px 0;font-size:13px;color:var(--soft)}.foot strong{color:var(--ink)}
@media(max-width:900px){.hero .wrap,.tech,.two{grid-template-columns:1fr;gap:40px}h1{font-size:32px}h2.h2{font-size:26px}.head nav{display:none}.head .wrap{justify-content:space-between}.rows li{grid-template-columns:1fr;gap:4px}.close .wrap{flex-direction:column;align-items:flex-start}}`,
body:`<header class="head"><div class="wrap"><a class="logo" href="#">한빛정밀</a><nav aria-label="주 메뉴">${nav()}</nav><a class="btn btn--sm" href="#inquiry">문의하기</a></div></header>
<main>
<section class="hero" id="about"><div class="wrap"><div><p class="label">정밀가공 부품 · 자동화 설비</p><h1>${CLAIM.map(l=>`<span>${l}</span>`).join(' ')}</h1><p>${INTRO}</p><div class="acts"><a class="btn" href="#inquiry">견적 · 기술 문의</a><a class="link" href="#business">사업분야 보기</a></div></div>
<div class="panel"><h2>숫자로 보는 한빛정밀</h2><ul>${FIGURES.map(([v,u,l])=>`<li><span>${l}</span><b class="num">${v}<small>${u}</small></b></li>`).join('')}</ul></div></div></section>
<section id="business" style="padding-top:0"><div class="wrap"><p class="label">사업분야</p><h2 class="h2">설계 도면 한 장에서 양산 라인까지</h2><ol class="rows">${BUSINESS.map(([, name,line],i)=>`<li><span class="num">0${i+1}</span><h3>${name}</h3><p>${line}</p></li>`).join('')}</ol></div></section>
<section class="band" id="technology"><div class="wrap tech"><div><p class="label">기술</p><h2 class="h2">${TECH_TITLE}</h2><p class="lede">${TECH_LEDE}</p><ol class="steps">${TECH.map(([t,d],i)=>`<li><span class="num">0${i+1}</span><div><strong>${t}</strong><p>${d}</p></div></li>`).join('')}</ol></div><figure>${photo('measure',{position:'60% 50%'})}</figure></div></section>
<section><div class="wrap two"><div id="news"><p class="label">홍보센터</p><h2 class="h2">새 소식</h2><ul class="plain">${news()}</ul></div><div><p class="label">사업장</p><h2 class="h2">화성 · 천안 · 하노이</h2><ul class="plain">${SITES.map(([role,name,detail])=>`<li class="site"><small>${role}</small><div><b>${name}</b><small>${detail}</small></div></li>`).join('')}</ul></div></div></section>
<section class="band close" id="inquiry"><div class="wrap"><div><h2 class="h2">프로젝트 문의</h2><p>대표전화 <a href="tel:0310000000">031-000-0000</a> · 이메일 <a href="mailto:contact@example.com">contact@example.com</a></p></div><a class="btn" href="mailto:contact@example.com">견적 · 기술 문의하기</a></div></section>
</main>
${footer()}`};

// 3 dense portal: 22 sites (hiring 59%, builder 23%). No full-bleed hero, 6 / 11 / 23 small photographs, 31 / 79 / 130 hairlines,
// display 32px, 7 menu items plus 로그인 · 회원가입, action on the first screen 82%.
pages.portal={archetype:'dense portal',sites:22,font:PRETENDARD,css:`
:root{--content:1260px;--line:#dcdfe3;--blue:#0086cd}
body{background:#fff;color:#222;font:15px/1.6 "Pretendard Variable",Pretendard,sans-serif}
.util{border-bottom:1px solid var(--line);font-size:12px;color:#666}.util .wrap{display:flex;justify-content:flex-end;gap:16px;padding-block:6px}
.head .wrap{display:flex;align-items:center;gap:32px;padding-block:18px}.logo{font-size:24px;font-weight:800}.logo small{display:block;font-size:10px;font-weight:500;letter-spacing:.1em;color:#777}
.search{display:flex;flex:1;max-width:460px;border:2px solid var(--blue)}.search input{flex:1;border:0;padding:9px 12px;font:inherit;min-width:0}.search button{border:0;background:var(--blue);color:#fff;padding:0 18px;font:inherit;font-weight:600}
.tel{margin-left:auto;text-align:right;font-size:12px;color:#666}.tel b{display:block;font-size:20px;color:#222}
.gnb{border-block:1px solid #222}.gnb .wrap{display:flex}.gnb a{padding:12px 22px;font-weight:600;border-right:1px solid var(--line)}.gnb a:first-child{background:#222;color:#fff}
.first{display:grid;grid-template-columns:200px 1fr 280px;gap:16px;padding-block:16px}
.side{border:1px solid var(--line)}.side h2,.board h2,.quote h2{font-size:14px;font-weight:700;padding:9px 12px;background:#f3f4f6;border-bottom:1px solid var(--line)}.side a{display:flex;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #eceef0;font-size:14px}.side li:last-child a{border:0}
.visual{position:relative;border:1px solid var(--line)}.visual img{width:100%;height:328px}.visual div{position:absolute;inset:auto 0 0 0;background:rgba(255,255,255,.93);padding:14px 18px}.visual h1{font-size:28px;line-height:1.3;font-weight:700}.visual p{font-size:13px;color:#555}
.quote{border:1px solid var(--line)}.quote form{display:grid;gap:6px;padding:12px}.quote input,.quote select{border:1px solid #c8ccd1;padding:8px;font:inherit;font-size:13px;width:100%}.quote button{border:0;background:#f96209;color:#fff;padding:10px;font:inherit;font-weight:700}.quote p{font-size:12px;color:#666;padding:0 12px 12px}
.sec{padding-block:14px}.sec>h2{display:flex;justify-content:space-between;align-items:baseline;font-size:18px;font-weight:700;padding-bottom:8px;border-bottom:2px solid #222}.sec>h2 a{font-size:12px;font-weight:400;color:#666}
.goods{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;padding-top:14px}.goods a{border:1px solid var(--line);display:block}.goods img{width:100%;aspect-ratio:4/3}.goods b{display:block;font-size:14px;padding:8px 10px 0}.goods span{display:block;font-size:12px;color:#666;padding:0 10px 10px}
.boards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding-block:14px}.board{border:1px solid var(--line)}.board li a{display:grid;grid-template-columns:1fr auto;gap:8px;padding:7px 12px;border-bottom:1px solid #eceef0;font-size:13px}.board li:last-child a{border:0}.board time,.board em{font-style:normal;font-size:12px;color:#777}.board strong{font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.board span{display:none}.board li a{grid-template-columns:auto 1fr}.board time{order:2}
.figs{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);margin-block:6px 14px}.figs li{padding:12px 16px;border-right:1px solid var(--line);font-size:13px;color:#555}.figs li:last-child{border:0}.figs b{font-size:20px;color:#222;margin-right:6px}
.banners{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding-bottom:20px}.banners a{border:1px solid var(--line);padding:12px;text-align:center;font-size:13px;font-weight:600}
.foot{background:#f3f4f6;border-top:1px solid var(--line);font-size:12px;color:#666;padding:18px 0}.foot nav{display:flex;flex-wrap:wrap;gap:6px 16px;margin-bottom:8px;color:#222}
@media(max-width:900px){.first,.boards{grid-template-columns:1fr}.goods{grid-template-columns:repeat(2,1fr)}.gnb .wrap{overflow-x:auto;padding:0}.gnb a{white-space:nowrap;padding:10px 14px}.tel{display:none}.head .wrap{flex-wrap:wrap;gap:12px}.search{max-width:none;flex-basis:100%}.figs{grid-template-columns:1fr 1fr}.banners{grid-template-columns:1fr 1fr}.visual img{height:220px}.visual h1{font-size:20px}}`,
body:`<div class="util"><div class="wrap"><a href="#">로그인</a><a href="#">회원가입</a><a href="#">협력사 포털</a><a href="#">사이트맵</a><a href="#" lang="en">ENG</a></div></div>
<header class="head"><div class="wrap"><a class="logo" href="#">한빛정밀<small>HANBIT PRECISION</small></a><form class="search" role="search"><input type="search" aria-label="품번 · 품명 검색" placeholder="품번 · 품명 검색"><button type="submit">검색</button></form><p class="tel">견적 · 기술 문의<b class="num">031-000-0000</b></p></div></header>
<nav class="gnb" aria-label="주 메뉴"><div class="wrap">${nav([['#business','전체 품목'],...MENU,['#jobs','채용정보']])}</div></nav>
<main class="wrap">
<div class="first">
<nav class="side" aria-label="품목"><h2>품목별 보기</h2><ul>${BUSINESS.map(([, name])=>`<li><a href="#business">${name}<span aria-hidden="true">›</span></a></li>`).join('')}<li><a href="#technology">가공 · 측정 설비<span aria-hidden="true">›</span></a></li><li><a href="#sites">사업장 안내<span aria-hidden="true">›</span></a></li><li><a href="#news">자료실<span aria-hidden="true">›</span></a></li></ul></nav>
<section class="visual" id="about">${photo('hero',{eager:true})}<div><h1>${CLAIM.join(' ')}</h1><p>${INTRO}</p></div></section>
<aside class="quote" id="inquiry"><h2>빠른 견적 문의</h2><form action="mailto:contact@example.com"><select aria-label="품목"><option>품목 선택</option>${BUSINESS.map(([, name])=>`<option>${name}</option>`).join('')}</select><input type="text" aria-label="회사명" placeholder="회사명"><input type="tel" aria-label="연락처" placeholder="연락처"><button type="submit">견적 요청</button></form><p>대표전화 031-000-0000 · contact@example.com</p></aside>
</div>
<ul class="figs" aria-label="숫자로 보는 한빛정밀">${FIGURES.map(([v,u,l])=>`<li><b class="num">${v}${u}</b>${l}</li>`).join('')}</ul>
<section class="sec" id="business"><h2>사업분야 <a href="#">전체 보기 +</a></h2><div class="goods">${BUSINESS.map(([key,name,line,position])=>`<a href="#">${photo(key,{position})}<b>${name}</b><span>${line}</span></a>`).join('')}<a href="#technology">${photo('measure',{position:'60% 50%'})}<b>측정 · 검사</b><span>항온 측정실 전수 검사</span></a><a href="#sites">${photo('hero',{position:'50% 70%'})}<b>화성 · 천안 공장</b><span>가공부터 조립까지 한 공장에서</span></a></div></section>
<div class="boards">
<section class="board" id="news"><h2>새 소식</h2><ul>${news()}</ul></section>
<section class="board" id="technology"><h2>기술</h2><ul>${TECH.map(([t,d])=>`<li><a href="#"><strong>${t}</strong><em>${d.slice(0,14)}…</em></a></li>`).join('')}</ul></section>
<section class="board" id="sites"><h2>사업장</h2><ul>${SITES.slice(0,3).map(([role,name,detail])=>`<li><a href="#"><strong>${name} · ${detail}</strong><em>${role}</em></a></li>`).join('')}</ul></section>
</div>
<div class="banners" id="jobs"><a href="#">채용정보</a><a href="#">협력사 포털</a><a href="#">품질 방침</a><a href="#">카탈로그 받기</a><a href="#">오시는 길</a></div>
</main>
${footer('<nav aria-label="하단 메뉴"><a href="#">회사소개</a><a href="#">윤리경영</a><a href="#"><strong>개인정보처리방침</strong></a><a href="#">이메일무단수집거부</a><a href="#">사이트맵</a></nav>')}`};

// 4 photo-led: 26 sites (logistics 46%). Photographs 11–19% of the first four screens, 3 / 6 / 8 photographs, 2.9 / 3.6 / 5 screens,
// display 48px/600, Noto Sans KR, square boxes and buttons, red the commonest button colour after white.
pages.photo={archetype:'photo-led',sites:26,font:NOTO,css:`
:root{--content:1200px;--red:#ce1313}
body{background:#fff;color:#1c1c1c;font:15px/1.75 "Noto Sans KR",sans-serif}
.head{position:absolute;inset:0 0 auto 0;z-index:2;color:#fff}.head .wrap{display:flex;align-items:center;justify-content:space-between;height:84px;max-width:none;padding-inline:48px}.logo{font-size:20px;font-weight:700}.head nav{display:flex;gap:36px;font-weight:500}
.hero{position:relative;height:min(100vh,860px);min-height:560px;color:#fff}.hero img{position:absolute;inset:0;width:100%;height:100%}.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.55),rgba(0,0,0,.1) 60%,rgba(0,0,0,.35))}
.hero div{position:absolute;z-index:1;left:48px;bottom:64px;max-width:760px}h1{font-size:48px;line-height:1.3;font-weight:600;letter-spacing:-.01em}h1 span{display:block}.hero p{margin-top:16px;max-width:36em}
.btn{display:inline-block;margin-top:28px;background:var(--red);color:#fff;padding:14px 30px;font-weight:500}
.mosaic{display:grid;grid-template-columns:repeat(4,1fr)}.mosaic a{position:relative;display:block;color:#fff;overflow:hidden}.mosaic img{width:100%;aspect-ratio:3/4;transition:transform .5s}.mosaic a:hover img{transform:scale(1.04)}.mosaic div{position:absolute;inset:auto 0 0 0;padding:72px 28px 28px;background:linear-gradient(0deg,rgba(0,0,0,.7),transparent)}.mosaic h3{font-size:22px;font-weight:700}.mosaic p{font-size:14px;opacity:.9}
.split{display:grid;grid-template-columns:3fr 2fr}.split img{width:100%;height:100%;min-height:480px}.split div{padding:72px 56px;align-self:center}.eyebrow{font-size:13px;font-weight:700;color:var(--red);letter-spacing:.08em}h2{font-size:30px;line-height:1.4;font-weight:700;margin:10px 0 16px}.split li{padding:12px 0;border-top:1px solid #ddd;font-weight:500}.split ul{margin-top:24px}
.strip{background:#1c1c1c;color:#fff}.strip .wrap{display:flex;justify-content:space-between;align-items:center;gap:32px;padding-block:44px}.strip h2{margin:0}.strip p{opacity:.8}.strip .btn{margin:0}
.foot{padding:28px 0;font-size:12px;color:#777}
@media(max-width:900px){.head nav{display:none}.head .wrap{padding-inline:20px}.hero div{left:20px;right:20px;bottom:40px}h1{font-size:30px}.mosaic{grid-template-columns:1fr 1fr}.mosaic div{padding:40px 16px 16px}.mosaic h3{font-size:17px}.mosaic p{display:none}.split{grid-template-columns:1fr}.split img{min-height:260px}.split div{padding:40px 20px}.strip .wrap{flex-direction:column;align-items:flex-start}}`,
body:`<header class="head"><div class="wrap"><a class="logo" href="#">한빛정밀</a><nav aria-label="주 메뉴">${nav()}</nav></div></header>
<main>
<section class="hero" id="about">${photo('measure',{eager:true,position:'60% 45%'})}<div><h1>${CLAIM.map(l=>`<span>${l}</span>`).join(' ')}</h1><p>${INTRO}</p><a class="btn" href="#business">사업분야 보기</a></div></section>
<section class="mosaic" id="business" aria-label="사업분야">${BUSINESS.map(([key,name,line,position])=>`<a href="#">${photo(key,{position})}<div><h3>${name}</h3><p>${line}</p></div></a>`).join('')}</section>
<section class="split" id="technology">${photo('hero',{position:'50% 60%'})}<div><p class="eyebrow">TECHNOLOGY</p><h2>${TECH_TITLE}</h2><p>${TECH_LEDE}</p><ul>${TECH.map(([t])=>`<li>${t}</li>`).join('')}</ul></div></section>
<section class="strip" id="inquiry"><div class="wrap"><div><h2>프로젝트 문의</h2><p>대표전화 031-000-0000 · contact@example.com</p></div><a class="btn" href="mailto:contact@example.com">견적 · 기술 문의하기</a></div></section>
</main>
${footer()}`};

// 5 big type: 15 sites (software 33%, builder 20%). Display 80 / 106 / 180px at weight 400, 4.7–11.8 times the body, full-bleed hero 67%,
// 6.2 / 8.2 / 11.3 screens, 8 / 21 / 23 photographs, blue pill buttons.
pages.bigtype={archetype:'big type',sites:15,font:PRETENDARD,css:`
:root{--content:1280px;--blue:#0175c2}
body{background:#fff;color:#111;font:16px/1.7 "Pretendard Variable",Pretendard,sans-serif}
.head .wrap{display:flex;align-items:center;justify-content:space-between;height:88px;max-width:none;padding-inline:48px}.logo{font-size:18px;font-weight:600}.head nav{display:flex;gap:32px}
.pill{display:inline-block;border-radius:40px;background:var(--blue);color:#fff;padding:14px 30px;font-weight:500}
.hero{padding:56px 48px 0}.hero h1{font-size:clamp(44px,8.2vw,118px);line-height:1.12;letter-spacing:-.045em;font-weight:400}.hero h1 span{display:block}
.hero .row{display:grid;grid-template-columns:1fr 420px;gap:48px;align-items:end;margin:48px 0}.hero .row p{font-size:18px}
.wide img{width:100%;height:78vh;min-height:420px}
.giant{padding:120px 48px 0}.giant>p{font-size:14px;letter-spacing:.06em;color:#777}
.giant li{display:grid;grid-template-columns:1fr 300px;gap:48px;align-items:center;padding:40px 0;border-bottom:1px solid #111}.giant li:first-child{border-top:1px solid #111;margin-top:20px}
.giant h2{font-size:clamp(36px,6.6vw,96px);line-height:1.1;letter-spacing:-.04em;font-weight:400}.giant h2 small{display:block;font-size:17px;letter-spacing:0;color:#555;margin-top:14px}.giant img{width:300px;aspect-ratio:4/3}
.figs{display:grid;grid-template-columns:1fr 1fr;gap:72px 48px;padding:140px 48px}.figs b{display:block;font-size:clamp(64px,12vw,180px);line-height:1;letter-spacing:-.05em;font-weight:400}.figs b small{font-size:.3em;letter-spacing:0;margin-left:.1em}.figs span{display:block;border-top:1px solid #111;margin-top:18px;padding-top:12px;color:#555}
.tech{padding:0 48px 140px;display:grid;grid-template-columns:1fr 1fr;gap:72px}.tech h2{font-size:clamp(32px,4.6vw,64px);line-height:1.2;letter-spacing:-.035em;font-weight:400}.tech li{padding:22px 0;border-top:1px solid #ccc}.tech strong{font-size:22px;font-weight:500}.tech p{color:#555}.tech .lede{margin:24px 0 0;font-size:18px}
.call{background:#111;color:#fff;padding:140px 48px}.call a.big{display:block;font-size:clamp(40px,9vw,140px);line-height:1.1;letter-spacing:-.045em;font-weight:400}.call p{margin-top:40px;display:flex;gap:32px;flex-wrap:wrap;align-items:center}
.foot{padding:28px 0;font-size:12px;color:#777}.foot .wrap{max-width:none;padding-inline:48px}
@media(max-width:900px){.head nav{display:none}.head .wrap,.foot .wrap{padding-inline:20px}.hero,.giant,.figs,.call{padding-inline:20px}.tech{padding:0 20px 80px;grid-template-columns:1fr;gap:32px}.hero .row,.giant li{grid-template-columns:1fr;gap:20px}.giant img{width:100%}.figs{gap:48px 20px;padding-block:80px}.giant{padding-top:72px}.call{padding-block:80px}.wide img{height:52vh}}`,
body:`<header class="head"><div class="wrap"><a class="logo" href="#">한빛정밀</a><nav aria-label="주 메뉴">${nav()}</nav></div></header>
<main>
<section class="hero" id="about"><h1>${CLAIM.map(l=>`<span>${l}</span>`).join(' ')}</h1><div class="row"><p>${INTRO}</p><div><a class="pill" href="#inquiry">견적 · 기술 문의하기</a></div></div></section>
<figure class="wide">${photo('hero',{eager:true,position:'50% 62%'})}</figure>
<section class="giant" id="business"><p>사업분야</p><ol>${BUSINESS.map(([key,name,line,position])=>`<li><h2>${name}<small>${line}</small></h2>${photo(key,{position})}</li>`).join('')}</ol></section>
<ul class="figs" aria-label="숫자로 보는 한빛정밀">${FIGURES.map(([v,u,l])=>`<li><b class="num">${v}<small>${u}</small></b><span>${l}</span></li>`).join('')}</ul>
<figure class="wide">${photo('measure',{position:'60% 50%'})}</figure>
<section class="tech" id="technology" style="padding-top:120px"><div><h2>${TECH_TITLE}</h2><p class="lede">${TECH_LEDE}</p></div><ol>${TECH.map(([t,d])=>`<li><strong>${t}</strong><p>${d}</p></li>`).join('')}</ol></section>
<section class="call" id="inquiry"><a class="big" href="mailto:contact@example.com">프로젝트를<br>함께 시작합니다 →</a><p><a class="pill" href="mailto:contact@example.com">견적 · 기술 문의하기</a><span>대표전화 031-000-0000</span><span>contact@example.com</span></p></section>
</main>
${footer()}`};

// 6 standard corporate: 41 sites. Full-bleed hero on every one, headline left on 73%, display 58px/700, 3.8 / 4.5 / 5.6 screens,
// 2 / 5 / 12 photographs, about half white, square boxes and buttons, blue after white.
pages.corporate={archetype:'standard corporate',sites:41,font:PRETENDARD,css:`
:root{--content:1220px;--blue:#0b4ea2;--line:#dfe2e6}
body{background:#fff;color:#222;font:16px/1.7 "Pretendard Variable",Pretendard,sans-serif}
.head{position:absolute;inset:0 0 auto 0;z-index:2;color:#fff;border-bottom:1px solid rgba(255,255,255,.3)}.head .wrap{display:flex;align-items:center;height:90px;gap:56px}.logo{font-size:22px;font-weight:800}.head nav{display:flex;gap:44px;font-size:17px;font-weight:600;margin-right:auto}.lang{font-size:13px;display:flex;gap:10px}
.hero{position:relative;height:min(100vh,820px);min-height:560px;color:#fff;display:flex;align-items:center}.hero img{position:absolute;inset:0;width:100%;height:100%}.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,22,48,.72),rgba(6,22,48,.15) 75%)}
.hero .wrap{position:relative;z-index:1;width:100%}.hero small{font-size:15px;font-weight:600;letter-spacing:.14em}h1{font-size:58px;line-height:1.25;font-weight:700;letter-spacing:-.02em;margin:14px 0 20px}h1 span{display:block}.hero p{max-width:33em;font-size:17px}
.btn{display:inline-flex;align-items:center;gap:28px;border:1px solid currentColor;padding:14px 26px;font-weight:600;margin-top:32px}.btn::after{content:"→"}
.pager{position:absolute;z-index:1;left:0;right:0;bottom:36px}.pager .wrap{display:flex;align-items:center;gap:14px;font-size:14px}.pager i{display:block;width:120px;height:2px;background:rgba(255,255,255,.4)}.pager i::before{content:"";display:block;width:33%;height:100%;background:#fff}
section{padding:100px 0}.title{text-align:center;margin-bottom:48px}.title small{color:var(--blue);font-weight:700;font-size:14px;letter-spacing:.14em}h2{font-size:36px;font-weight:700;letter-spacing:-.02em}.title p{color:#666;margin-top:8px}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}.cards a{display:block;border:1px solid var(--line)}.cards img{width:100%;aspect-ratio:1/1}.cards div{padding:22px}.cards h3{font-size:20px;font-weight:700}.cards p{font-size:15px;color:#666;margin-top:4px;min-height:3.2em}.cards span{display:inline-block;margin-top:14px;font-size:13px;font-weight:700;color:var(--blue)}
.grey{background:#f4f6f8}.tech{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}.tech img{width:100%;aspect-ratio:3/2}.tech small{color:var(--blue);font-weight:700;font-size:14px;letter-spacing:.14em}.tech h2{margin:8px 0 14px;line-height:1.35}.tech>div>p{color:#555}.tech li{display:grid;grid-template-columns:44px 1fr;padding:14px 0;border-top:1px solid #d4d8dd}.tech ol{margin-top:24px}.tech li b{color:var(--blue)}.tech li p{font-size:15px;color:#666}
.figs{display:grid;grid-template-columns:repeat(4,1fr);background:var(--blue);color:#fff}.figs li{padding:44px 24px;text-align:center;border-right:1px solid rgba(255,255,255,.2)}.figs b{display:block;font-size:44px;font-weight:700;line-height:1.2}.figs b small{font-size:18px;margin-left:2px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:64px}.two h2{font-size:26px;padding-bottom:14px;border-bottom:2px solid #222;display:flex;justify-content:space-between;align-items:baseline}.two h2 a{font-size:13px;font-weight:500;color:#666}
.rows li a,.rows li.site{display:grid;grid-template-columns:104px 1fr;gap:12px;padding:16px 0;border-bottom:1px solid var(--line)}.rows time,.rows small{color:#777;font-size:14px}.rows a span{display:none}.rows strong{font-weight:500}.rows small.d{display:block}
.contact{background:#222;color:#fff;padding:56px 0}.contact .wrap{display:flex;justify-content:space-between;align-items:center;gap:32px}.contact h2{font-size:28px}.contact p{opacity:.8}.contact .btn{margin:0}
.foot{background:#f4f6f8;padding:32px 0;font-size:13px;color:#666}.foot nav{display:flex;flex-wrap:wrap;gap:6px 20px;margin-bottom:10px;color:#222}
@media(max-width:900px){.head nav,.lang{display:none}h1{font-size:32px}h2{font-size:26px}section{padding:64px 0}.cards{grid-template-columns:1fr 1fr;gap:12px}.cards div{padding:14px}.tech,.two{grid-template-columns:1fr;gap:40px}.figs{grid-template-columns:1fr 1fr}.figs li{padding:28px 12px}.figs b{font-size:32px}.contact .wrap{flex-direction:column;align-items:flex-start}}`,
body:`<header class="head"><div class="wrap"><a class="logo" href="#">한빛정밀</a><nav aria-label="주 메뉴">${nav()}</nav><div class="lang" aria-label="언어 선택"><a href="#" aria-current="true">KOR</a><a href="#" lang="en">ENG</a></div></div></header>
<main>
<div class="hero" id="about">${photo('semicon',{eager:true,position:'50% 38%'})}<div class="wrap"><small>PRECISION &amp; AUTOMATION</small><h1>${CLAIM.map(l=>`<span>${l}</span>`).join(' ')}</h1><p>${INTRO}</p><a class="btn" href="#business">사업분야 보기</a></div><div class="pager" aria-hidden="true"><div class="wrap"><span>01</span><i></i><span>03</span></div></div></div>
<section id="business"><div class="wrap"><div class="title"><small>BUSINESS</small><h2>사업분야</h2><p>설계 도면 한 장에서 양산 라인까지, 네 개 사업부가 한 공장 안에서 이어집니다.</p></div><div class="cards">${BUSINESS.map(([key,name,line,position])=>`<a href="#">${photo(key,{position})}<div><h3>${name}</h3><p>${line}</p><span>자세히 보기 +</span></div></a>`).join('')}</div></div></section>
<ul class="figs" aria-label="숫자로 보는 한빛정밀">${FIGURES.map(([v,u,l])=>`<li><b class="num">${v}<small>${u}</small></b>${l}</li>`).join('')}</ul>
<section class="grey" id="technology"><div class="wrap tech">${photo('measure',{position:'60% 50%'})}<div><small>TECHNOLOGY</small><h2>${TECH_TITLE}</h2><p>${TECH_LEDE}</p><ol>${TECH.map(([t,d],i)=>`<li><b class="num">0${i+1}</b><div><strong>${t}</strong><p>${d}</p></div></li>`).join('')}</ol></div></div></section>
<section><div class="wrap two"><div id="news"><h2>홍보센터 <a href="#">더 보기 +</a></h2><ul class="rows">${news()}</ul></div><div><h2>사업장</h2><ul class="rows">${SITES.map(([role,name,detail])=>`<li class="site"><small>${role}</small><div><strong>${name}</strong><small class="d">${detail}</small></div></li>`).join('')}</ul></div></div></section>
<section class="contact" id="inquiry"><div class="wrap"><div><h2>프로젝트 문의</h2><p>대표전화 031-000-0000 · contact@example.com</p></div><a class="btn" href="mailto:contact@example.com">견적 · 기술 문의하기</a></div></section>
</main>
${footer('<nav aria-label="하단 메뉴"><a href="#">회사소개</a><a href="#">사업분야</a><a href="#">윤리경영</a><a href="#"><strong>개인정보처리방침</strong></a><a href="#">이메일무단수집거부</a></nav>')}`};

// 7 bold colour: 15 sites. Saturated colour on 29–41% of the first four screens, white under a fifth, 1 / 2.7 / 5.5 screens,
// display 49px and h2 48px at weight 700, few menu items, pill buttons (black first, then blue), blue and orange grounds measured.
pages.colour={archetype:'bold colour',sites:15,font:NOTO,css:`
:root{--content:1280px;--blue:#0056aa;--orange:#e85623;--pale:#dfedf5}
body{background:var(--blue);color:#fff;font:17px/1.7 "Noto Sans KR",sans-serif}
.head .wrap{display:flex;align-items:center;justify-content:space-between;height:84px}.logo{font-size:22px;font-weight:700}.head nav{display:flex;gap:28px;font-weight:500}
.pill{display:inline-block;border-radius:40px;background:#000;color:#fff;padding:14px 30px;font-weight:700}
.hero .wrap{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;padding-block:56px 96px}h1{font-size:49px;line-height:1.3;font-weight:700;letter-spacing:-.01em}h1 span{display:block}.hero p{margin:20px 0 32px;max-width:30em}.hero img{width:100%;aspect-ratio:4/3;border-radius:0 120px 0 0}
.blocks{display:grid;grid-template-columns:1fr 1fr}.blocks a{display:block;padding:64px 56px;min-height:300px}.blocks a:nth-child(1){background:var(--orange)}.blocks a:nth-child(2){background:var(--pale);color:#0b2b4d}.blocks a:nth-child(3){background:#fff;color:#0b2b4d}.blocks a:nth-child(4){background:#0b2b4d}
.blocks small{font-weight:700}.blocks h2{font-size:48px;line-height:1.25;font-weight:700;margin:6px 0 10px}
.tech{background:var(--orange)}.tech .wrap{display:grid;grid-template-columns:1fr 1fr;gap:56px;padding-block:96px}.tech h2{font-size:40px;line-height:1.35;font-weight:700}.tech li{padding:16px 0;border-top:2px solid #fff}.tech strong{font-size:20px}.tech li p{font-size:15px}
.call .wrap{display:flex;justify-content:space-between;align-items:center;gap:32px;padding-block:80px}.call h2{font-size:48px;font-weight:700;line-height:1.25}
.foot{background:#0b2b4d;padding:28px 0;font-size:12px;opacity:.9}
@media(max-width:900px){.head nav{display:none}.hero .wrap,.tech .wrap,.blocks{grid-template-columns:1fr}h1{font-size:32px}.blocks a{padding:40px 24px;min-height:0}.blocks h2,.call h2{font-size:32px}.tech h2{font-size:26px}.call .wrap{flex-direction:column;align-items:flex-start}.hero .wrap{padding-block:24px 56px}.tech .wrap{padding-block:56px}}`,
body:`<header class="head"><div class="wrap"><a class="logo" href="#">한빛정밀</a><nav aria-label="주 메뉴"><a href="#business">사업분야</a><a href="#technology">기술</a><a href="#inquiry">문의</a></nav></div></header>
<main>
<section class="hero" id="about"><div class="wrap"><div><h1>${CLAIM.map(l=>`<span>${l}</span>`).join(' ')}</h1><p>${INTRO}</p><a class="pill" href="#inquiry">견적 · 기술 문의하기</a></div>${photo('machining',{eager:true,position:'50% 62%'})}</div></section>
<section class="blocks" id="business" aria-label="사업분야">${BUSINESS.map(([, name,line],i)=>`<a href="#"><small class="num">0${i+1}</small><h2>${name}</h2><p>${line}</p></a>`).join('')}</section>
<section class="tech" id="technology"><div class="wrap"><div><h2>${TECH_TITLE}</h2></div><ol>${TECH.map(([t,d])=>`<li><strong>${t}</strong><p>${d}</p></li>`).join('')}</ol></div></section>
<section class="call" id="inquiry"><div class="wrap"><div><h2>프로젝트 문의</h2><p>대표전화 031-000-0000 · contact@example.com</p></div><a class="pill" href="mailto:contact@example.com">견적 · 기술 문의하기</a></div></section>
</main>
${footer()}`};

await fs.mkdir(out,{recursive:true});
for(const [name,spec] of Object.entries(pages)){
 const target=new URL(name+'.html',out),content=page(spec);
 if(process.argv.includes('--check')){
  if((await fs.readFile(target,'utf8')).replaceAll('\r\n','\n')!==content)throw Error('Refresh '+name+'.html with node scripts/build-archetype-demo.mjs');
 }else await fs.writeFile(target,content);
}
