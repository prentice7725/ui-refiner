// 각 버전의 전체 페이지(데스크톱 1440)와 첫 화면 스크린샷을 찍는다
// 사용법: node shots.cjs <방식…>   방식 이름은 pages/<id>/ 아래 폴더 이름 (반복을 썼다면 refine-a.1 처럼 번호까지)
// SHOT_FILE=refine-directions/a.html이면 결과 페이지 대신 그 파일을 찍는다 (시안만 만드는 업종 벤치마크)
// STAGES=1이면 refine 방식의 중간 단계도 찍는다: <방식>~mock (고른 시안), <방식>~first (처음 검사받은 구현)
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const B=process.env.BENCH_DIR||path.resolve('refine-bench-out'),arms=process.argv.slice(2),STAGES=process.env.STAGES==='1';
/** 스냅숏 기록에서 단계별 파일을 찾는다. 기록이 없거나 단계가 없으면 그 단계는 빠진다. */
function stageFiles(dir){
 const f=path.join(dir,'.stages.jsonl');if(!fs.existsSync(f))return {};
 const lines=fs.readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)),out={};
 const pick=lines.find(l=>l.pick)?.pick;
 if(pick){const m=path.join(dir,'.stage-directions',pick.toLowerCase()+'.html');if(fs.existsSync(m))out.mock=m;}
 // 첫 구현: 선택 뒤 keep check나 directions verify가 처음 돈 순간의 페이지
 const first=lines.find(l=>l.pick&&(l.verifyAt||l.keepAt)&&l.snap);
 if(first&&first.hash!==lines.at(-1).hash)out.first=path.join(dir,first.snap);
 return out;
}
(async()=>{const b=await chromium.launch();const out=path.join(B,'shots');fs.mkdirSync(out,{recursive:true});
 const shoot=async(file,name,full=true)=>{
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.goto('file://'+file,{waitUntil:'networkidle'}).catch(()=>{});
  await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}window.scrollTo(0,0);});
  await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
  await p.screenshot({path:path.join(out,`${name}__fold.png`)});
  if(full)await p.screenshot({path:path.join(out,`${name}__full.png`),fullPage:true});
  await p.close();console.log('shot',name);};
 for(const id of fs.readdirSync(path.join(B,'pages')))for(const arm of arms){
  const dir=path.join(B,'pages',id,arm),f=path.join(dir,process.env.SHOT_FILE||'index.html');if(!fs.existsSync(f)){console.log('missing',id,arm);continue;}
  await shoot(f,`${id}__${arm}`);
  if(STAGES){const s=stageFiles(dir);if(s.mock)await shoot(s.mock,`${id}__${arm}~mock`,false);if(s.first)await shoot(s.first,`${id}__${arm}~first`);}
 }
 await b.close();})();
