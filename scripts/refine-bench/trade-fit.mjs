#!/usr/bin/env node
// 업종 벤치마크 1단계의 기계 판정: 익숙한 안(A) 시안이 그 업종 실측(data/genre-reference/human.json)에 얼마나 맞는가.
// 사용법: node trade-fit.mjs refine-k.1 refine-l.1 …   (BENCH_DIR 아래 pages/<id>/<방식>/refine-directions/a.html; FIT_FILE=index.html이면 최종 페이지)
// 페이지와 업종은 trades.tsv에서 읽는다. --trade 없이 만든 시안(k)도 같은 업종 실측에 대어 본다.
// 잰 값은 수집기와 같다: 첫 화면 구성(heroSkeleton), 첫 화면 바탕과 강조색(first-screen-colour), 본문 크기, 제목 배율, 명조·세리프.
// 결과: BENCH_DIR/trade-fit.json (시안마다 한 줄)과 페이지×방식 요약표.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {scanUrl} from '../../src/scan.mjs';
import {compactSite} from '../../src/reference.mjs';
import {heroSkeleton} from '../../src/directions.mjs';
import {colourProbe,measureColours} from '../../src/first-screen-colour.mjs';
import {FAMILY} from '../../src/refine-log.mjs';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const B=process.env.BENCH_DIR||path.resolve('refine-bench-out'),arms=process.argv.slice(2);
const human=JSON.parse(await fs.readFile(path.join(HERE,'../../data/genre-reference/human.json'),'utf8'));
const pages=(await fs.readFile(path.join(HERE,'trades.tsv'),'utf8')).split(/\r?\n/).filter(l=>l&&!l.startsWith('#')&&!l.startsWith('id\t')).map(l=>{const [id,kind,trade]=l.split('\t');return {id,kind,trade};});
const COUNTRY={ja:'JP',ko:'KR'};

/**
 * 한 시안을 업종 실측과 비교한다. share는 그 값이 실측 그룹에서 차지하는 비율(0–1), ok는 허용 범위 안인지.
 * 첫 화면 구성은 같은 계열끼리 묶어 잰다(heroShare). 배정의 below-fold("사진 먼저")는 문구를 첫 화면에 남기라고 하므로,
 * 지시대로 만들면 사진 아래에 제목이 보여 full-bleed로 잰다(2026-11-19 시험 실행). 배정도 두 구성을 한 계열(image)로 다룬다.
 * heroExact는 구성 그대로의 비율이다.
 */
export function fit(m,g){
 const r=x=>Math.round(x*1000)/1000;
 const share=(dist,k)=>dist&&k!=null?dist[k]??0:null;
 const fam=FAMILY[m.hero],heroExact=share(g.hero?.share,m.hero),heroShare=fam&&g.hero?.share?Object.entries(g.hero.share).filter(([k])=>FAMILY[k]===fam).reduce((a,[,v])=>a+v,0):heroExact,groundShare=share(g.colour?.ground,m.ground),accentShare=share(g.colour?.accent,m.accent);
 const t=g.type||{};
 const bodyOk=m.body!=null&&t.body!=null?Math.abs(m.body-t.body)<=1:null;
 const ratioOk=m.ratio!=null&&t.displayRatio?Math.abs(m.ratio-t.displayRatio)/t.displayRatio<=.25:null;
 const serifOk=t.serifDisplay!=null?m.serif===(t.serifDisplay>=.3):null;
 const shares=[heroShare,groundShare,accentShare].filter(v=>v!=null),oks=[bodyOk,ratioOk,serifOk].filter(v=>v!=null);
 return {heroShare:heroShare==null?null:r(heroShare),heroExact,groundShare,accentShare,bodyOk,ratioOk,serifOk,typical:shares.length?r(shares.reduce((a,b)=>a+b,0)/shares.length):null,matches:oks.filter(Boolean).length,of:oks.length};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!arms.length){console.error('usage: trade-fit.mjs <방식…>  (예: refine-k.1 refine-l.1)');process.exit(2);}
 const browser=await chromium.launch(),rows=[];
 for(const p of pages)for(const arm of arms){
  const file=path.join(B,'pages',p.id,arm,...(process.env.FIT_FILE||'refine-directions/a.html').split('/'));
  try{await fs.access(file);}catch{console.log('missing',p.id,arm);continue;}
  const country=COUNTRY[p.id.split('-')[0]],g=human.byTrade[`${p.trade}/${country}`];
  if(!g){console.log('no group',p.trade,country);continue;}
  const {result}=await scanUrl(file,{out:await fs.mkdtemp(path.join(os.tmpdir(),'trade-fit-')),compare:false,keepRaw:true,screenshots:false});
  const c=compactSite(result),metrics=result.raw?.find(r=>r.viewport==='desktop')?.metrics;
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto('file://'+file.replaceAll('\\','/'),{waitUntil:'load'}).catch(()=>{});await page.waitForTimeout(1500);
  const col=measureColours(await page.evaluate(colourProbe));await page.close();
  const m={hero:heroSkeleton(metrics?.hero)??'below-fold',ground:col.ground,accent:col.accent,body:c.type?.body??null,ratio:c.type?.ratio??null,serif:(c.measures?.serifDisplay??0)>0};
  const row={page:p.id,arm,group:`${p.trade}/${country}`,measured:m,...fit(m,g)};
  rows.push(row);console.log(p.id,arm,JSON.stringify(m),'typical',row.typical,'matches',`${row.matches}/${row.of}`);
 }
 await browser.close();
 await fs.writeFile(path.join(B,'trade-fit.json'),JSON.stringify(rows,null,1)+'\n');
 // 페이지×방식(반복을 묶어서) 평균
 const key=r=>`${r.page}\t${r.arm.replace(/\.\d+$/,'')}`,groups=Object.groupBy(rows,key),avg=xs=>xs.length?(xs.reduce((a,b)=>a+b,0)/xs.length).toFixed(2):'-';
 console.log('\npage\tarm\truns\ttypical\tmatches');
 for(const [k,list] of Object.entries(groups).sort())console.log(`${k}\t${list.length}\t${avg(list.map(r=>r.typical).filter(v=>v!=null))}\t${avg(list.map(r=>r.matches))}/${list[0].of}`);
}
