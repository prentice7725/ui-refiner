// 첫 화면에 어떤 형태가 놓였는지 센다. 평가자의 말("표와 가는 선이 반복된다")을 숫자로 확인하기 위한 것이다.
// 사용법: node forms.cjs <방식…>   →  $BENCH_DIR/forms.json
//   tables     행이 2개 이상인 표 (table, role=table|grid)
//   rowGroups  표는 아니지만 같은 태그의 자식 3개 이상이 모두 숫자를 담은 묶음 (시간표, 장부, 목록 형태)
//   times      시각이나 영업시간으로 읽히는 글 조각
//   hairlines  1px 이하 실선 테두리가 있는 요소와 hr
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const B=process.env.BENCH_DIR||path.resolve('refine-bench-out'),arms=process.argv.slice(2);
(async()=>{const b=await chromium.launch(),res={};
 for(const id of fs.readdirSync(path.join(B,'pages')))for(const arm of arms){
  const f=path.join(B,'pages',id,arm,'index.html');if(!fs.existsSync(f))continue;
  const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto('file://'+f,{waitUntil:'load'}).catch(()=>{});await p.waitForTimeout(300);
  (res[id]??={})[arm]=await p.evaluate(()=>{
   const fold=innerHeight,vis=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>4&&r.height>4&&r.top<fold&&r.bottom>0&&s.visibility!=='hidden'&&s.display!=='none';};
   const all=[...document.body.querySelectorAll('*')].filter(vis);
   const tables=all.filter(el=>el.matches('table,[role=table],[role=grid]')&&el.querySelectorAll('tr,[role=row]').length>=2).length;
   const rowGroups=all.filter(el=>!el.closest('table,nav')&&!el.matches('body,main,header,section')&&el.children.length>=3&&[...el.children].every(c=>c.tagName===el.children[0].tagName&&/\d/.test(c.textContent)&&c.textContent.trim().length<160)).length;
   const time=/\b\d{1,2}[:：]\d{2}\b|\b\d{1,2}\s?(am|pm)\b|\d{1,2}\s?時|\d{1,2}\s?시|午前|午後|오전|오후/i;
   const times=all.filter(el=>!el.children.length&&time.test(el.textContent)).length;
   const hairlines=all.filter(el=>{if(el.tagName==='HR')return true;const s=getComputedStyle(el);return ['Top','Right','Bottom','Left'].some(k=>s['border'+k+'Style']==='solid'&&parseFloat(s['border'+k+'Width'])>0&&parseFloat(s['border'+k+'Width'])<=1&&!/rgba\(.*, 0\)|transparent/.test(s['border'+k+'Color']));}).length;
   return {tables,rowGroups,times,hairlines};});
  await p.close();console.log(id,arm,JSON.stringify(res[id][arm]));}
 await b.close();fs.writeFileSync(path.join(B,'forms.json'),JSON.stringify(res,null,1)+'\n');})();
