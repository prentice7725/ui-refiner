// 평가 결과를 방식별로 모은다
const fs=require('fs'),path=require('path');const B=process.env.BENCH_DIR||path.resolve('refine-bench-out');const key=JSON.parse(fs.readFileSync(path.join(B,'judge-key.json')));
const parse=f=>{const r=JSON.parse(fs.readFileSync(f)).result;return JSON.parse(r.slice(r.indexOf('{'),r.lastIndexOf('}')+1));};
const ARMS=(process.env.ARMS||'before,plain,refine,unslop').split(','),acc={};for(const a of ARMS)acc[a]={rank:[],first:0,hierarchy:[],distinctiveness:[],typography:[],cohesion:[],ai_look:[]};
const rows=[];
for(const id of Object.keys(key.page)){const v=parse(path.join(B,'verdicts',`page-${id}.json`));const row={id};
 v.ranking.forEach((L,i)=>{const a=key.page[id][L];acc[a].rank.push(i+1);if(i===0)acc[a].first++;row[a]=i+1;});
 for(const L of Object.keys(key.page[id])){const a=key.page[id][L];for(const k of ['hierarchy','distinctiveness','typography','cohesion','ai_look'])acc[a][k].push(v.scores[L][k]);}
 rows.push(row);fs.writeFileSync(path.join(B,'verdicts',`notes-${id}.txt`),Object.entries(key.page[id]).map(([L,a])=>`${L}=${a}`).join(' ')+'\n'+(typeof v.notes==='string'?v.notes:JSON.stringify(v.notes)));}
const m=a=>(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1);
console.log('page ranks');for(const r of rows)console.log(r.id.padEnd(14),ARMS.map(a=>a+'='+r[a]).join(' '));
console.log('\narm        rank first hier dist typo cohe ai');for(const a of ARMS)console.log(a.padEnd(10),m(acc[a].rank),acc[a].first,m(acc[a].hierarchy),m(acc[a].distinctiveness),m(acc[a].typography),m(acc[a].cohesion),m(acc[a].ai_look));
for(const run of [1,2]){const v=parse(path.join(B,'verdicts',`set-${run}.json`));console.log('\nset run',run,ARMS.map(a=>{const L=Object.keys(key.set[run]).find(l=>key.set[run][l]===a);return `${a}: sameness ${v.sameness[L]}, rank ${v.ranking.indexOf(L)+1}`;}).join(' | '));}
