// 평가 결과를 방식별로 모은다. 화면에 요약을 찍고 $BENCH_DIR/results.json에 원자료와 함께 쓴다.
const fs=require('fs'),path=require('path');const B=process.env.BENCH_DIR||path.resolve('refine-bench-out');const key=JSON.parse(fs.readFileSync(path.join(B,'judge-key.json')));
const ARMS=key.arms||(process.env.ARMS||'before,plain,refine,unslop').split(','),REPS=key.reps?.length?key.reps:[null];
const parse=f=>{try{const r=JSON.parse(fs.readFileSync(f)).result;return JSON.parse(r.slice(r.indexOf('{'),r.lastIndexOf('}')+1));}catch{return null;}};
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null,f1=x=>x==null?'  - ':x.toFixed(1).padStart(4),failed=[];
const DIMS=['hierarchy','distinctiveness','typography','cohesion','ai_look'];
// 페이지 평가
const ranks=[]; // {id,rep,order,arm,rank,scores}
for(const [unit,k] of Object.entries(key.page)){const v=parse(path.join(B,'verdicts',`page-${unit}.json`));
 if(!v||!Array.isArray(v.ranking)||v.ranking.length!==Object.keys(k.letters).length||v.ranking.some(L=>!k.letters[L])){failed.push('page-'+unit);continue;}
 v.ranking.forEach((L,i)=>ranks.push({id:k.id,rep:k.rep,order:k.order,arm:k.letters[L],rank:i+1,scores:v.scores?.[L]??{}}));
 fs.writeFileSync(path.join(B,'verdicts',`notes-${unit}.txt`),Object.entries(k.letters).map(([L,a])=>`${L}=${a}`).join(' ')+'\n'+(typeof v.notes==='string'?v.notes:JSON.stringify(v.notes)));}
const of=(arm,rep)=>ranks.filter(r=>r.arm===arm&&(rep===undefined||r.rep===rep));
const page={};for(const a of ARMS){const all=of(a),per=REPS.map(rep=>mean(of(a,rep).map(r=>r.rank)));
 page[a]={rank:mean(all.map(r=>r.rank)),perRep:per,spread:per.every(x=>x!=null)?Math.max(...per)-Math.min(...per):null,first:all.filter(r=>r.rank===1).length,n:all.length,...Object.fromEntries(DIMS.map(d=>[d,mean(all.map(r=>r.scores[d]).filter(x=>typeof x==='number'))]))};}
// 순서 편향: 같은 비교(페이지, 반복)를 순서만 바꿔 봤을 때 1위가 같은 비율, 그리고 자리(글자)별 평균 순위
const pairs={};for(const r of ranks)if(r.rank===1)(pairs[`${r.id}@${r.rep}`]??={})[r.order]=r.arm;
const both=Object.values(pairs).filter(p=>p[1]&&p[2]),orderAgree=both.length?both.filter(p=>p[1]===p[2]).length/both.length:null;
const slot={};for(const [unit,k] of Object.entries(key.page)){const v=parse(path.join(B,'verdicts',`page-${unit}.json`));v?.ranking?.forEach((L,i)=>(slot[L]??=[]).push(i+1));}
// 세트 평가
const set={};for(const a of ARMS)set[a]={sameness:[],rank:[]};const habits=[];
for(const [unit,k] of Object.entries(key.set)){const v=parse(path.join(B,'verdicts',`set${unit}.json`)),letters=k.letters||k;
 if(!v?.sameness||!Array.isArray(v.ranking)){failed.push('set'+unit);continue;}
 for(const [L,a] of Object.entries(letters)){if(typeof v.sameness[L]==='number')set[a].sameness.push(v.sameness[L]);const i=v.ranking.indexOf(L);if(i>=0)set[a].rank.push(i+1);habits.push({unit,arm:a,habits:v.habits?.[L]??''});}}
// 단계 평가: 최종본이 앞 단계보다 방향이 뚜렷해졌는지, 흐려졌는지
const stage={};for(const [unit,k] of Object.entries(key.stage||{})){const v=parse(path.join(B,'verdicts',`stage-${unit}.json`));if(!v){failed.push('stage-'+unit);continue;}
 const s=((stage[k.arm]??={})[k.from]??={direction:{final:0,earlier:0,same:0},ship:{final:0,earlier:0,same:0},lost:[]});
 for(const q of ['direction','ship']){const w=v[q]==='X'?k.X:v[q]==='Y'?k.Y:'same';s[q][w==='final'?'final':w==='same'?'same':'earlier']++;}
 if(v.lost)s.lost.push({unit,text:v.lost});}
// 비용과 턴 수, 첫 화면 형태
const runs={};for(const a of ARMS){const c=[],t=[];for(const id of new Set(ranks.map(r=>r.id)))for(const rep of REPS){try{const j=JSON.parse(fs.readFileSync(path.join(B,'logs',`${rep?`${a}.${rep}`:a}-${id}.json`)));if(typeof j.total_cost_usd==='number')c.push(j.total_cost_usd);if(typeof j.num_turns==='number')t.push(j.num_turns);}catch{}}
 runs[a]={cost:c.length?c.reduce((x,y)=>x+y,0):null,turns:mean(t),n:c.length};}
let forms=null;try{const F=JSON.parse(fs.readFileSync(path.join(B,'forms.json')));forms={};for(const a of ARMS){const rows=[];for(const id of Object.keys(F))for(const rep of REPS){const m=F[id][rep?`${a}.${rep}`:a];if(m)rows.push(m);}
 forms[a]={n:rows.length,withTable:rows.length?rows.filter(m=>m.tables+m.rowGroups>0).length/rows.length:null,times:mean(rows.map(m=>m.times)),hairlines:mean(rows.map(m=>m.hairlines))};}}catch{}

const w=Math.max(10,...ARMS.map(a=>a.length))+1;
console.log('page ranks (평균, 반복·순서 포함)');
for(const id of [...new Set(ranks.map(r=>r.id))])console.log(id.padEnd(14),ARMS.map(a=>a+'='+f1(mean(ranks.filter(r=>r.id===id&&r.arm===a).map(r=>r.rank))).trim()).join(' '));
console.log('\n'+'arm'.padEnd(w),'rank  1st   n  hier dist typo cohe   ai'+(REPS[0]?'  | 반복별 평균 (최대-최소)':''));
for(const a of ARMS){const p=page[a];console.log(a.padEnd(w),f1(p.rank),String(p.first).padStart(4),String(p.n).padStart(3),' ',DIMS.map(d=>f1(p[d])).join(' '),REPS[0]?'  | '+p.perRep.map(f1).join(' ')+'  ('+f1(p.spread).trim()+')':'');}
if(REPS[0])console.log('반복별 평균의 최대-최소가 한 방식 안에서 흔들리는 폭입니다. 방식 사이의 차이가 이보다 작으면 차이로 보지 않습니다.');
if(orderAgree!=null)console.log(`\n순서를 뒤집어도 1위가 같은 비율: ${(orderAgree*100).toFixed(0)}% (${both.length}쌍) · 자리별 평균 순위: ${Object.keys(slot).sort().map(L=>L+'='+f1(mean(slot[L])).trim()).join(' ')}`);
console.log('\nset'.padEnd(w+1),'sameness rank   n');for(const a of ARMS)console.log(a.padEnd(w),'  ',f1(mean(set[a].sameness)),' ',f1(mean(set[a].rank)),String(set[a].rank.length).padStart(4));
if(Object.keys(stage).length){console.log('\nstage (최종본 대 앞 단계, 양쪽 순서의 표를 합침)    direction: 최종/앞/같음   ship: 최종/앞/같음');
 for(const a of Object.keys(stage))for(const from of Object.keys(stage[a])){const s=stage[a][from];console.log(a.padEnd(w),(from==='first'?'첫 구현 → 최종':'고른 시안 → 최종').padEnd(16),`${s.direction.final}/${s.direction.earlier}/${s.direction.same}`.padStart(12),`${s.ship.final}/${s.ship.earlier}/${s.ship.same}`.padStart(16));}}
if(Object.values(runs).some(r=>r.n)){console.log('\nruns'.padEnd(w+1),'  cost  turns   n');for(const a of ARMS)if(runs[a].n)console.log(a.padEnd(w),('$'+runs[a].cost.toFixed(2)).padStart(7),f1(runs[a].turns).padStart(6),String(runs[a].n).padStart(4));}
if(forms){console.log('\nfirst screen'.padEnd(w+1),'표·행 묶음 있는 페이지  시각 표기  가는 선');for(const a of ARMS)if(forms[a].n)console.log(a.padEnd(w),((forms[a].withTable*100).toFixed(0)+'%').padStart(12),f1(forms[a].times).padStart(14),f1(forms[a].hairlines).padStart(9));}
if(failed.length)console.log('\n읽지 못한 평가:',failed.join(', '));
fs.writeFileSync(path.join(B,'results.json'),JSON.stringify({arms:ARMS,reps:key.reps??[],orders:key.orders??1,page,orderAgree,slot:Object.fromEntries(Object.entries(slot).map(([L,a])=>[L,mean(a)])),set:Object.fromEntries(ARMS.map(a=>[a,{sameness:mean(set[a].sameness),rank:mean(set[a].rank),n:set[a].rank.length}])),habits,stage,runs,forms,failed,ranks},null,1)+'\n');
