// 평가용 폴더를 만든다: 버전 이름을 가리고 글자를 섞는다. 세트 평가는 8페이지 첫 화면을 한 장에 모은다.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const B=process.env.BENCH_DIR||path.resolve('refine-bench-out'),ARMS=(process.env.ARMS||'before,plain,refine,unslop').split(','),J=path.join(B,'judge');
let seed=Number(process.env.SEED||20261111);const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const LETTERS='ABCDEFGH';
(async()=>{fs.rmSync(J,{recursive:true,force:true});const key={page:{},set:{}};const ids=fs.readdirSync(path.join(B,'pages')).sort();
 // 페이지 평가: 같은 페이지의 버전들을 섞어 A, B, C…로 복사한다
 for(const id of ids){const d=path.join(J,'page',id);fs.mkdirSync(d,{recursive:true});key.page[id]={};
  shuffle(ARMS).forEach((arm,i)=>{const L=LETTERS[i];key.page[id][L]=arm;for(const k of ['fold','full'])fs.copyFileSync(path.join(B,'shots',`${id}__${arm}__${k}.png`),path.join(d,`${L}-${k}.png`));});}
 // 세트 평가: 방식마다 8페이지 첫 화면을 한 장으로. file:// 이미지는 파일로 연 페이지에서만 뜨므로 임시 HTML을 거친다
 const b=await chromium.launch();
 for(const run of [1,2]){const d=path.join(J,'set'+run);fs.mkdirSync(d,{recursive:true});key.set[run]={};
  for(const [i,arm] of shuffle(ARMS).entries()){const L=LETTERS[i];key.set[run][L]=arm;
   const imgs=shuffle(ids).map(id=>`<img src="file://${path.join(B,'shots',`${id}__${arm}__fold.png`)}">`).join('');
   const h=path.join(J,'sheet.html');fs.writeFileSync(h,`<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(4,720px);gap:8px;padding:4px">${imgs}<style>img{width:720px;height:450px;display:block}</style>`);
   const p=await b.newPage({viewport:{width:2912,height:920}});await p.goto('file://'+h,{waitUntil:'load'});
   await p.screenshot({path:path.join(d,`set-${L}.png`),fullPage:true});await p.close();fs.rmSync(h);}}
 await b.close();fs.writeFileSync(path.join(B,'judge-key.json'),JSON.stringify(key,null,1));console.log('prepared');})();
