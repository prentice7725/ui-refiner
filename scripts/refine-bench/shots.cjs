// 각 버전의 전체 페이지(데스크톱 1440)와 첫 화면 스크린샷을 찍는다
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const B=process.env.BENCH_DIR||path.resolve('refine-bench-out'),arms=process.argv.slice(2);const b=await chromium.launch();
 for(const id of fs.readdirSync(path.join(B,'pages')))for(const arm of arms){
  const f=path.join(B,'pages',id,arm,'index.html');if(!fs.existsSync(f)){console.log('missing',id,arm);continue;}
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.goto('file://'+f,{waitUntil:'networkidle'}).catch(()=>{});
  await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}window.scrollTo(0,0);});
  await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
  const out=path.join(B,'shots');fs.mkdirSync(out,{recursive:true});
  await p.screenshot({path:path.join(out,`${id}__${arm}__fold.png`)});
  await p.screenshot({path:path.join(out,`${id}__${arm}__full.png`),fullPage:true});
  await p.close();console.log('shot',id,arm);}
 await b.close();})();
