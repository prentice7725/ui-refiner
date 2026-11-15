// 평가용 폴더를 만든다: 버전 이름을 가리고 글자를 섞는다. 세트 평가는 페이지들의 첫 화면을 한 장에 모은다.
// 환경변수
//   ARMS    비교할 방식 (쉼표로 구분)
//   REPS    반복 번호 (예: 1,2,3). 주면 방식 폴더를 <방식>.<번호>로 읽고, 반복마다 따로 평가한다
//   ORDERS  같은 비교를 몇 가지 순서로 평가할지 (기본 1). 2면 두 번째는 글자 순서를 뒤집는다:
//           평가자가 자리에 따라 고르는지(순서 편향) 확인하고 평균으로 지운다
//   STAGES  1이면 refine 중간 단계 쌍(첫 구현 대 최종, 고른 시안 대 최종)도 준비한다. shots.cjs를 STAGES=1로 먼저 돌린다
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const B=process.env.BENCH_DIR||path.resolve('refine-bench-out'),ARMS=(process.env.ARMS||'before,plain,refine,unslop').split(','),J=path.join(B,'judge');
const REPS=(process.env.REPS||'').split(',').filter(Boolean),ORDERS=Number(process.env.ORDERS||1),STAGES=process.env.STAGES==='1';
let seed=Number(process.env.SEED||20261111);const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const LETTERS='ABCDEFGH',reps=REPS.length?REPS:[''],plain=!REPS.length&&ORDERS===1;
const folder=(arm,rep)=>rep?`${arm}.${rep}`:arm,shot=(id,name,k)=>path.join(B,'shots',`${id}__${name}__${k}.png`);
// 두 번째 순서는 첫 번째를 뒤집은 것, 그 뒤는 새로 섞는다
const orders=base=>Array.from({length:ORDERS},(_,o)=>o===0?base:o===1?[...base].reverse():shuffle(base));
(async()=>{fs.rmSync(J,{recursive:true,force:true});const key={arms:ARMS,reps:REPS,orders:ORDERS,page:{},set:{},stage:{}};const ids=fs.readdirSync(path.join(B,'pages')).sort();
 // 페이지 평가: 같은 페이지의 버전들을 섞어 A, B, C…로 복사한다
 for(const id of ids)for(const rep of reps){
  if(ARMS.some(a=>!fs.existsSync(shot(id,folder(a,rep),'fold')))){console.log('skip page',id,rep,'(스크린샷 없음)');continue;}
  orders(shuffle(ARMS)).forEach((order,o)=>{const unit=plain?id:`${id}@${rep||1}@${o+1}`,d=path.join(J,'page',unit);fs.mkdirSync(d,{recursive:true});key.page[unit]={id,rep:rep||null,order:o+1,letters:{}};
   order.forEach((arm,i)=>{const L=LETTERS[i];key.page[unit].letters[L]=arm;for(const k of ['fold','full'])fs.copyFileSync(shot(id,folder(arm,rep),k),path.join(d,`${L}-${k}.png`));});});}
 // 세트 평가: 방식마다 페이지들의 첫 화면을 한 장으로. file:// 이미지는 파일로 연 페이지에서만 뜨므로 임시 HTML을 거친다
 const b=await chromium.launch();
 for(const rep of reps){const have=ids.filter(id=>ARMS.every(a=>fs.existsSync(shot(id,folder(a,rep),'fold'))));if(have.length<2)continue;
  const runs=plain?[shuffle(ARMS),shuffle(ARMS)]:orders(shuffle(ARMS));
  for(const [r,order] of runs.entries()){const unit=plain?String(r+1):`${rep||1}@${r+1}`,d=path.join(J,'set'+unit);fs.mkdirSync(d,{recursive:true});key.set[unit]={rep:rep||null,order:r+1,pages:have.length,letters:{}};
   for(const [i,arm] of order.entries()){const L=LETTERS[i];key.set[unit].letters[L]=arm;
    const imgs=shuffle(have).map(id=>`<img src="file://${shot(id,folder(arm,rep),'fold')}">`).join('');
    const h=path.join(J,'sheet.html');fs.writeFileSync(h,`<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(${Math.min(4,have.length)},720px);gap:8px;padding:4px">${imgs}<style>img{width:720px;height:450px;display:block}</style>`);
    const p=await b.newPage({viewport:{width:Math.min(4,have.length)*728,height:920}});await p.goto('file://'+h,{waitUntil:'load'});
    await p.screenshot({path:path.join(d,`set-${L}.png`),fullPage:true});await p.close();fs.rmSync(h);}}}
 await b.close();
 // 단계 평가: 같은 실행의 두 단계를 X, Y로 두고 양쪽 순서로 본다
 if(STAGES)for(const id of ids)for(const rep of reps)for(const arm of ARMS){const name=folder(arm,rep);
  for(const [from,kinds] of [['first',['fold','full']],['mock',['fold']]]){if(!fs.existsSync(shot(id,`${name}~${from}`,'fold')))continue;
   for(const o of [1,2]){const unit=`${id}@${name}@${from}@${o}`,d=path.join(J,'stage',unit);fs.mkdirSync(d,{recursive:true});
    const pair=o===1?[from,'final']:['final',from];key.stage[unit]={id,arm,rep:rep||null,from,X:pair[0],Y:pair[1]};
    pair.forEach((s,i)=>{for(const k of kinds)fs.copyFileSync(shot(id,s==='final'?name:`${name}~${s}`,k),path.join(d,`${'XY'[i]}-${k}.png`));});}}}
 fs.writeFileSync(path.join(B,'judge-key.json'),JSON.stringify(key,null,1));
 console.log('prepared',Object.keys(key.page).length,'page,',Object.keys(key.set).length,'set,',Object.keys(key.stage).length,'stage');})();
