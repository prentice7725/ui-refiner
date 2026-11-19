// Worst-case data check: a page that looks right with its own copy is fed realistic worst-case values (long button
// labels, long unbroken headings, long emails and URLs, big numbers) at 320, 390 and 1440px, and every break the new
// values cause is reported with the CSS that usually fixes it. Idea from Emil Kowalski's break-ui skill (MIT); the
// values are Korean, Japanese and English ones a real site could get, never random strings.
// On a built page the rendered text is the data boundary, so values are swapped in the DOM's text nodes, never in
// markup or CSS. Only breaks that were not there before the swap count: a page that already overflows is the scan's job.
import fs from 'node:fs/promises';
import path from 'node:path';
import {launchBrowser} from '../vendor/lintapple/src/browser.js';
import {scanTarget} from './scan.mjs';

export const STRESS_WIDTHS=[320,390,1440];
export const STRESS_KINDS=['labels','headings','tokens','numbers'];

/**
 * Realistic worst-case values per language. Emails and URLs use .example domains. Headings keep their own words and
 * get a realistic second clause appended, so the test stays plausible for any trade (a company name dropped into a
 * clinic's heading is the "nonsense data" break-ui warns about: the designer rightly says it never happens).
 */
export const WORST={
 ko:{
  labels:['온라인 진료 예약 신청하기','자세한 안내 전체 보기','카카오톡 채널로 문의하기','오시는 길·주차 안내 보기','개인정보처리방침 및 이용약관'],
  headings:' — 처음 오시는 분도 이해하기 쉽도록 하나하나 자세히 안내해 드립니다',
  email:'reservation.team@hankook-general-logistics-solutions.example.com',
  url:'https://www.example.com/board/notice/view?idx=20261119&category=holiday-schedule',
  phone:'031-0000-0000 (내선 1234)',
  numbers:['12,345,678원','1,234명','99,999+']
 },
 ja:{
  labels:['オンラインでのご予約はこちらから','よくあるご質問を一覧で見る','LINE公式アカウントで相談する','アクセス・駐車場のご案内','個人情報保護方針・利用規約'],
  headings:'：初めての方にもわかりやすく、ひとつひとつ丁寧にご案内いたします',
  email:'reservation.center@global-logistics-solutions-japan.example.com',
  url:'https://www.example.com/news/detail/?id=20261119&category=holiday-schedule',
  phone:'03-0000-0000（内線1234）',
  numbers:['¥12,345,678','1,234名','99,999件']
 },
 en:{
  labels:['Request an appointment online','See every frequently asked question','Benachrichtigungseinstellungen','Directions and parking','Privacy and security settings'],
  headings:': explained step by step for first-time visitors, with Benachrichtigungseinstellungen-length words',
  email:'bartholomew.fitzgerald@northwind-industries-holdings.example.com',
  url:'https://www.example.com/workspaces/acme/projects/q3-launch/docs/9f8e7d6c5b4a?tab=comments',
  phone:'+1 (555) 000-0000 ext. 1234',
  numbers:['$12,345,678.90','1,284 members','99,999+']
 }
};

/** What usually fixes each kind of break (the failure signatures in break-ui, in our words). */
export const FIXES={
 'page-overflow':'the page scrolls sideways: give flex and grid text children `min-width: 0` (`minmax(0, 1fr)` in grid), and `overflow-wrap: anywhere` on emails, URLs and long unbroken words',
 offscreen:'the text runs past the screen edge: `min-width: 0` on its flex or grid column, `overflow-wrap: anywhere` for strings with no break opportunity',
 clipped:'a box with a fixed height or `overflow: hidden` cuts the text: use `min-height`, let the box grow, or clamp on purpose with `line-clamp` and a way to read the rest',
 overlap:'the longer text now lies on another element: avoid absolute positions and fixed widths for text, let the row wrap (`flex-wrap: wrap`)',
 'label-wrap':'a button or nav label breaks onto more lines: size the button from its content (`min-width`, never a fixed `width`), `white-space: nowrap` with `flex-shrink: 0` where it must stay one line, and decide what yields instead',
 squished:'an image or icon changed its proportions: `flex-shrink: 0` on fixed-size boxes, `object-fit: cover` on photos'
};
export const SEVERITY={'page-overflow':'broken',offscreen:'broken',clipped:'broken',overlap:'broken','label-wrap':'ugly',squished:'ugly'};

/** Picks the report language from the page text: Hangul, then kana, else English. */
export function stressLang(text){
 const s=String(text||''),ko=(s.match(/[가-힣]/g)||[]).length,ja=(s.match(/[ぁ-ゖァ-ヺ]/g)||[]).length;
 return ko>=20&&ko>=ja?'ko':ja>=20?'ja':'en';
}

/** In-page: marks the elements one kind of value would replace, without changing them yet. Self-contained. */
export function markTargets(kind){
 const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0;};
 const longestText=el=>{let best=null;const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);for(let n=w.nextNode();n;n=w.nextNode())if(n.nodeValue.trim()&&(!best||n.nodeValue.trim().length>best.nodeValue.trim().length))best=n;return best;};
 const out=[];let id=0;
 const mark=(el,extra)=>{if(el.closest('[data-uir-stress]')||el.querySelector('[data-uir-stress]'))return;el.setAttribute('data-uir-stress',String(id));out.push({id:String(id++),tag:el.tagName.toLowerCase(),text:el.innerText.trim().slice(0,80),...extra});};
 if(kind==='labels'){
  // Buttons (and links styled as buttons), and at most two menu links. Not the logo link, not links inside a sentence:
  // those wrap with the text around them, as they should.
  const styled=el=>{const s=getComputedStyle(el);return /^(button|input)$/i.test(el.tagName)||el.getAttribute('role')==='button'||(s.backgroundColor!=='rgba(0, 0, 0, 0)'&&s.backgroundColor!=='transparent')||parseFloat(s.borderTopWidth)>0&&parseFloat(s.borderBottomWidth)>0;};
  const logo=el=>{const h=el.getAttribute('href')||'';return el.querySelector('img,svg')||/^(\/|\.\/|#|#top|index\.html?)$/i.test(h)||/logo|brand/i.test(el.className+' '+(el.parentElement?.className||''));};
  const inSentence=el=>{const p=el.parentElement;return p&&/^(P|LI|SPAN|SMALL|TD)$/.test(p.tagName)&&p.innerText.trim().length>(el.innerText||'').trim().length+8;};
  let menu=0;
  for(const el of document.querySelectorAll('button,a,[role=button],input[type=submit]')){
   const t=(el.value||el.innerText||'').trim();
   if(out.length>=10||!visible(el)||!t||t.length>20||/^\+?[\d\s()-]{7,}$/.test(t)||logo(el)||inSentence(el)||el.hasAttribute('aria-expanded')||el.hasAttribute('aria-controls')||!(el.tagName==='INPUT'||longestText(el)))continue;
   if(styled(el))mark(el,{role:'label'});
   else if(el.closest('nav,header')&&menu<2){menu++;mark(el,{role:'label'});}
  }
 }else if(kind==='headings'){
  for(const el of document.querySelectorAll('h1,h2,h3'))if(out.length<6&&visible(el)&&longestText(el))mark(el,{role:'heading'});
 }else{
  const re=kind==='tokens'?/[\w.+-]+@[\w-]+\.[\w.-]+|https?:\/\/\S+|\+?\d{2,4}[-.\s)]\d{3,4}[-.\s]\d{4}/:/(?:[$¥₩€£]\s?)?\d{1,3}(?:,\d{3})+(?:\.\d+)?\s?(?:원|円|万円|명|名|件|개|人)?|\d+\s?(?:원|円|명|名|件)/;
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  for(let n=w.nextNode();n&&out.length<10;n=w.nextNode()){
   const el=n.parentElement;if(!el||['SCRIPT','STYLE','NOSCRIPT'].includes(el.tagName)||!visible(el))continue;
   const m=n.nodeValue.match(re);if(m)mark(el,{role:kind,match:m[0]});
  }
 }
 return out;
}

/** In-page: geometry of every marked element and of the images, for a before/after comparison. Self-contained. */
export function measureTargets(){
 const vw=document.documentElement.clientWidth,rect=el=>{const r=el.getBoundingClientRect();return {x:r.left,y:r.top+scrollY,w:r.width,h:r.height,r:r.right};};
 const clipBox=el=>{for(let a=el.parentElement,i=0;a&&i<4;a=a.parentElement,i++){const s=getComputedStyle(a);if(/hidden|clip/.test(s.overflow+s.overflowX+s.overflowY))return a;}return null;};
 const items={};
 for(const el of document.querySelectorAll('[data-uir-stress]')){
  const s=getComputedStyle(el),lh=parseFloat(s.lineHeight)||parseFloat(s.fontSize)*1.4,b=rect(el),clip=clipBox(el);
  const own=/hidden|clip/.test(s.overflow+s.overflowX+s.overflowY)&&(el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+2);
  let clipped=own;if(!clipped&&clip){const c=clip.getBoundingClientRect(),r=el.getBoundingClientRect();clipped=r.right>c.right+1||r.bottom>c.bottom+2||r.left<c.left-1;}
  items[el.getAttribute('data-uir-stress')]={box:b,lines:Math.max(1,Math.round((el.getBoundingClientRect().height-(parseFloat(s.paddingTop)||0)-(parseFloat(s.paddingBottom)||0))/lh)),offscreen:b.r>vw+1||b.x<-1,clipped};
 }
 // Overlap: a marked element whose box crosses another visible text or control it is not part of.
 // Fixed and sticky bars are left out: content scrolls under them by design (a phone bar at the bottom, a header).
 const pinned=el=>{for(let a=el;a&&a!==document.body;a=a.parentElement){const p=getComputedStyle(a).position;if(p==='fixed'||p==='sticky')return true;}return false;};
 // A changed element inside such a bar is compared only with what shares the bar.
 const shown=[...document.querySelectorAll('a,button,h1,h2,h3,h4,p,li,label,input,[data-uir-stress]')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden';});
 const bar=el=>{let top=null;for(let a=el;a&&a!==document.body;a=a.parentElement){const p=getComputedStyle(a).position;if(p==='fixed'||p==='sticky')top=a;}return top;};
 const others=shown.filter(el=>!pinned(el));
 for(const el of document.querySelectorAll('[data-uir-stress]')){
  const own=bar(el),pool=own?shown.filter(o=>own.contains(o)):others;
  const a=el.getBoundingClientRect(),hit=pool.find(o=>o!==el&&!o.contains(el)&&!el.contains(o)&&(()=>{const b=o.getBoundingClientRect(),x=Math.min(a.right,b.right)-Math.max(a.left,b.left),y=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);return x>3&&y>3;})());
  items[el.getAttribute('data-uir-stress')].overlap=hit?(hit.innerText||hit.getAttribute('aria-label')||hit.tagName).trim().slice(0,40):null;
 }
 const images=[...document.images].filter(i=>i.naturalWidth&&i.getBoundingClientRect().width>8).map((i,n)=>{const r=i.getBoundingClientRect(),fit=getComputedStyle(i).objectFit;return {n,src:(i.currentSrc||i.src).split('/').pop().slice(0,60),ratio:r.width/r.height,natural:i.naturalWidth/i.naturalHeight,fit};});
 return {overflow:document.documentElement.scrollWidth-vw,items,images};
}

/** In-page: swaps the worst-case values into the marked elements' longest text node. Self-contained. */
export function applyWorst({kind,values}){
 const longestText=el=>{let best=null;const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);for(let n=w.nextNode();n;n=w.nextNode())if(n.nodeValue.trim()&&(!best||n.nodeValue.trim().length>best.nodeValue.trim().length))best=n;return best;};
 const out={};let i=0;
 for(const el of document.querySelectorAll('[data-uir-stress]')){
  const id=el.getAttribute('data-uir-stress');let v;
  if(kind==='tokens'||kind==='numbers'){
   const re=kind==='tokens'?/[\w.+-]+@[\w-]+\.[\w.-]+|https?:\/\/\S+|\+?\d{2,4}[-.\s)]\d{3,4}[-.\s]\d{4}/:/(?:[$¥₩€£]\s?)?\d{1,3}(?:,\d{3})+(?:\.\d+)?\s?(?:원|円|万円|명|名|件|개|人)?|\d+\s?(?:원|円|명|名|件)/;
   // The text node that holds the match (the one markTargets found), not the element's longest one.
   let n=null;for(const c of el.childNodes)if(c.nodeType===3&&re.test(c.nodeValue)){n=c;break;}
   if(!n)continue;const m=n.nodeValue.match(re)[0];
   v=kind==='numbers'?values.numbers[i++%values.numbers.length]:m.includes('@')?values.email:/^https?:/.test(m)?values.url:values.phone;
   n.nodeValue=n.nodeValue.replace(m,v);
  }
  else if(el.tagName==='INPUT'){v=values[kind][i++%values[kind].length];el.value=v;}
  else if(kind==='headings'){
   // After the heading's last line, where a longer heading would continue.
   let n=null;const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);for(let c=w.nextNode();c;c=w.nextNode())if(c.nodeValue.trim())n=c;
   n.nodeValue=n.nodeValue.trimEnd()+values.headings;v=el.innerText.replace(/\s+/g,' ').trim();
  }
  else{const n=longestText(el);v=values[kind][i++%values[kind].length];n.nodeValue=v;}
  out[id]=v;
 }
 return out;
}

/** Pure: the breaks the swap caused, from the before and after measurements of one kind at one width. */
export function compareStress(before,after,targets,swapped,{kind,width}){
 const out=[],t=Object.fromEntries(targets.map(x=>[x.id,x]));
 const add=(type,id,extra={})=>out.push({kind,width,type,severity:SEVERITY[type],element:id!=null?`${t[id]?.tag} “${t[id]?.text}”`:null,value:id!=null?swapped[id]??null:null,fix:FIXES[type],...extra});
 for(const [id,a] of Object.entries(after.items)){
  const b=before.items[id];if(!b)continue;
  if(a.offscreen&&!b.offscreen)add('offscreen',id);
  else if(a.clipped&&!b.clipped)add('clipped',id);
  if(a.overlap&&!b.overlap)add('overlap',id,{with:a.overlap});
  if(t[id]?.role==='label'&&a.lines>b.lines)add('label-wrap',id,{lines:`${b.lines} → ${a.lines}`});
 }
 for(const img of after.images){
  const was=before.images.find(x=>x.n===img.n);
  if(was&&img.fit==='fill'&&Math.abs(img.ratio/img.natural-1)>.15&&Math.abs(was.ratio/was.natural-1)<=.15)add('squished',null,{element:`img ${img.src}`});
 }
 // The page scrolling sideways is listed on its own only when no element row above already explains it.
 if(after.overflow>Math.max(4,before.overflow+4)&&!out.some(f=>f.type==='offscreen'))add('page-overflow',null,{by:Math.round(after.overflow)});
 return out;
}

/** Runs every kind at every width on a fresh load, and writes STRESS.md and stress.json into `out`. */
export async function stressPage(target,{out='ui-refiner-stress',lang,widths=STRESS_WIDTHS,kinds=STRESS_KINDS,timeoutMs=45000,shots=true}={}){
 const url=scanTarget(target),dir=path.resolve(out);await fs.mkdir(dir,{recursive:true});
 const browser=await launchBrowser({timeout:timeoutMs}),findings=[],tested={};
 let pageLang=lang;
 try{
  for(const width of widths){
   const ctx=await browser.newContext({viewport:{width,height:width<768?844:900},deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'});
   try{
    for(const kind of kinds){
     const page=await ctx.newPage();page.setDefaultTimeout(timeoutMs);
     await page.goto(url,{waitUntil:'load',timeout:timeoutMs});
     await page.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});
     await page.evaluate(async()=>{await document.fonts.ready;});
     if(!pageLang)pageLang=stressLang(await page.evaluate(()=>document.body.innerText));
     const targets=await page.evaluate(markTargets,kind);
     tested[kind]=Math.max(tested[kind]??0,targets.length);
     if(targets.length){
      const before=await page.evaluate(measureTargets);
      const swapped=await page.evaluate(applyWorst,{kind,values:WORST[pageLang]??WORST.en});
      await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
      const after=await page.evaluate(measureTargets);
      const found=compareStress(before,after,targets,swapped,{kind,width});
      if(found.length&&shots){const shot=path.join(dir,`stress-${kind}-${width}.png`);await page.screenshot({path:shot,fullPage:true}).catch(()=>{});for(const f of found)f.shot=path.basename(shot);}
      findings.push(...found);
     }
     await page.close();
    }
   }finally{await ctx.close();}
  }
 }finally{await browser.close();}
 findings.sort((a,b)=>(a.severity===b.severity?0:a.severity==='broken'?-1:1)||a.width-b.width);
 const result={schemaVersion:1,target,lang:pageLang,widths,tested,broken:findings.filter(f=>f.severity==='broken').length,ugly:findings.filter(f=>f.severity==='ugly').length,findings};
 await fs.writeFile(path.join(dir,'stress.json'),JSON.stringify(result,null,1)+'\n');
 await fs.writeFile(path.join(dir,'STRESS.md'),renderStress(result));
 return {...result,dir};
}

/** Markdown report: what broke, worst first, then what was tested and held. */
export function renderStress(r){
 const esc=s=>String(s??'').replace(/\|/g,'\\|');
 const lines=[`# Worst-case data: ${r.target}`,'',`Values for **${r.lang}** pages, swapped into the rendered text at ${r.widths.join(', ')}px. Only breaks the new values caused are listed.`,''];
 if(r.findings.length){
  lines.push('| # | Severity | Width | Kind | Element | Worst-case value | What happens | Fix |','|---|---|---|---|---|---|---|---|');
  r.findings.forEach((f,i)=>lines.push(`| ${i+1} | ${f.severity} | ${f.width} | ${f.kind} | ${esc(f.element)} | ${esc(f.value)} | ${f.type}${f.with?` (on “${esc(f.with)}”)`:''}${f.lines?` (${f.lines} lines)`:''}${f.by?` (+${f.by}px)`:''} | ${esc(f.fix)} |`));
 }else lines.push('Nothing broke.');
 lines.push('','## Tested','',...STRESS_KINDS.map(k=>`- ${k}: ${r.tested[k]?`${r.tested[k]} elements`:'none on this page'}${r.findings.some(f=>f.kind===k)?'':r.tested[k]?', held':''}`));
 lines.push('','Not covered: empty lists, a count of exactly 1, missing optional fields and broken images. Those enter through the data a page is built from, not its rendered text; check them in the component with its own fixtures.','');
 return lines.join('\n');
}
