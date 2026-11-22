#!/usr/bin/env node
// 테마 벤치마크의 가린 판정: 같은 페이지의 테마 없음(refine-o)과 테마(refine-p)를 X·Y로 가리고, 순서를 바꿔 두 번 묻는다.
//   "진짜 그 나라 그 업종 사이트 같은가(real)", "어느 쪽을 내보내겠는가(ship)", 각 안의 AI 티(ai_look 1–10).
// 사용법: REPS=1 node theme-judge.mjs   (BENCH_DIR 아래 shots/<id>__refine-o.<rep>__fold.png 등. pilot.sh가 shots.cjs로 찍어 둔다)
//   JUDGE_MODEL 평가 모델 (기본 claude-opus-5-5)   JOBS 동시 평가 수 (기본 4)
// 결과: BENCH_DIR/theme-judge/<단위>/verdict.json, BENCH_DIR/theme-judge.json (조건별 요약과 페이지별 결과)
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const B=process.env.BENCH_DIR||path.resolve('refine-bench-out'),J=path.join(B,'theme-judge');
const REPS=(process.env.REPS||'1').split(','),JOBS=Number(process.env.JOBS||4),MODEL=process.env.JUDGE_MODEL||'claude-opus-5-5';
const ARMS=['refine-o','refine-p'];
const TRADE={inn:'inn (ryokan or guesthouse)',dental:'dental clinic',finance:'finance company',care:'elderly care provider',hiring:'company recruiting page',logistics:'logistics company'};
const COUNTRY={ja:'Japanese',ko:'Korean'};
const ONLY=process.env.PAGES?.split(/\s+/).filter(Boolean);
const pages=(await fs.readFile(path.join(HERE,'trades.tsv'),'utf8')).split(/\r?\n/).filter(l=>l&&!l.startsWith('#')&&!l.startsWith('id\t')).map(l=>{const [id,kind,trade]=l.split('\t');return {id,kind,trade};});
// P_REP: judge refine-p of another rep against refine-o of REPS (a re-run of the theme arm after a theme change).
const PREP=process.env.P_REP||null,TAG=PREP?`-p${PREP}`:'';
const shot=(id,arm,rep,k)=>path.join(B,'shots',`${id}__${arm}.${arm==='refine-p'&&PREP?PREP:rep}__${k}.png`);
const exists=f=>fs.access(f).then(()=>true,()=>false);

const prompt=p=>`You are a web designer who knows ${COUNTRY[p.id.split('-')[0]]} local business websites well. This folder has two versions, X and Y, of the same client's web page: a ${COUNTRY[p.id.split('-')[0]]} ${TRADE[p.trade]||p.trade}. X-fold.png and Y-fold.png show the first screen at 1440x900; X-full.png and Y-full.png show the full page. Read all four image files before answering.
Answer separately:
- real: which version looks more like a real ${TRADE[p.trade]||p.trade} site that a local studio made for a ${COUNTRY[p.id.split('-')[0]]} client? Answer X, Y or same.
- ship: which would you ship for this client, counting polish and usability? Answer X, Y or same.
- ai_look: rate each version 1-10 (10 = obviously AI-generated, 1 = clearly made by a person).
Reply with JSON only, no prose and no code fence: {"real":"X","ship":"X","ai_look":{"X":0,"Y":0},"why":"one sentence"}`;

function ask(dir,text){
 return new Promise(res=>{
  const c=spawn('claude',['-p','--model',MODEL,'--setting-sources','','--strict-mcp-config','--disable-slash-commands','--allowed-tools','Read','--output-format','json'],{cwd:dir});
  let out='';c.stdout.on('data',d=>out+=d);c.stderr.on('data',()=>{});c.on('close',()=>res(out));c.stdin.end(text);
 });
}

// 판정 단위: 페이지 × 반복 × 순서(1: o가 X, 2: p가 X)
const units=[];
for(const p of pages)for(const rep of REPS){
 const files=ARMS.flatMap(a=>['fold','full'].map(k=>shot(p.id,a,rep,k)));
 if(!(await Promise.all(files.map(exists))).every(Boolean)){console.log('skip',p.id,rep,'(스크린샷 없음)');continue;}
 for(const order of [1,2]){
  const map=order===1?{X:'refine-o',Y:'refine-p'}:{X:'refine-p',Y:'refine-o'},dir=path.join(J,`${p.id}@${rep}${TAG}@${order}`);
  await fs.mkdir(dir,{recursive:true});
  for(const [L,arm] of Object.entries(map))for(const k of ['fold','full'])await fs.copyFile(shot(p.id,arm,rep,k),path.join(dir,`${L}-${k}.png`));
  units.push({p,rep,order,map,dir});
 }
}
let next=0;
async function worker(){
 while(next<units.length){
  const u=units[next++],f=path.join(u.dir,'verdict.json');
  if(await exists(f))continue;
  const raw=await ask(u.dir,prompt(u.p));
  await fs.writeFile(path.join(u.dir,'raw.json'),raw);
  try{const j=JSON.parse(raw);const v=JSON.parse(String(j.result).replace(/^```(json)?|```$/g,'').trim());await fs.writeFile(f,JSON.stringify({...v,cost:j.total_cost_usd},null,1));console.log(path.basename(u.dir),v.real,v.ship);}
  catch(e){console.log(path.basename(u.dir),'unreadable verdict');}
 }
}
await Promise.all(Array.from({length:JOBS},worker));

// 요약: 순서 두 번이 같은 조건을 고른 경우만 그 조건의 승리로 센다 (자리 편향을 지운다)
const rows=[];let cost=0;
for(const p of pages)for(const rep of REPS){
 const vs=[];
 for(const order of [1,2]){const u=units.find(x=>x.p.id===p.id&&x.rep===rep&&x.order===order);if(!u)continue;
  try{const v=JSON.parse(await fs.readFile(path.join(u.dir,'verdict.json'),'utf8'));cost+=v.cost||0;
   const arm=L=>L==='X'||L==='Y'?u.map[L]:'same';vs.push({real:arm(v.real),ship:arm(v.ship),ai:{[u.map.X]:v.ai_look?.X,[u.map.Y]:v.ai_look?.Y},why:v.why});}catch{}}
 if(vs.length<2)continue;
 const agree=k=>vs[0][k]===vs[1][k]?vs[0][k]:'split';
 rows.push({page:p.id,rep,real:agree('real'),ship:agree('ship'),ai:Object.fromEntries(ARMS.map(a=>[a,+(vs.reduce((s,v)=>s+(+v.ai[a]||0),0)/vs.length).toFixed(1)])),why:vs.map(v=>v.why)});
}
const count=(k,arm)=>rows.filter(r=>r[k]===arm).length;
const summary={judged:rows.length,model:MODEL,cost:+cost.toFixed(2),
 real:{theme:count('real','refine-p'),noTheme:count('real','refine-o'),split:count('real','split'),same:count('real','same')},
 ship:{theme:count('ship','refine-p'),noTheme:count('ship','refine-o'),split:count('ship','split'),same:count('ship','same')},
 aiLook:Object.fromEntries(ARMS.map(a=>[a,rows.length?+(rows.reduce((s,r)=>s+r.ai[a],0)/rows.length).toFixed(1):null]))};
await fs.writeFile(path.join(B,`theme-judge${TAG}.json`),JSON.stringify({summary,rows},null,1)+'\n');
console.log(JSON.stringify(summary,null,1));
for(const r of rows)console.log(r.page.padEnd(14),r.rep,'real',r.real.padEnd(9),'ship',r.ship.padEnd(9),'ai',JSON.stringify(r.ai));
