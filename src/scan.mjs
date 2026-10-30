// Zero-config design scan of any page: AI-look signals, basic rendered quality, screenshots and a
// proposal-oriented DESIGN_REVIEW.md. Advisory only; it never touches the gate, baselines or policy.
import fs from 'node:fs/promises';
import path from 'node:path';
import {existsSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {launchBrowser} from '../vendor/lintapple/src/browser.js';
import {checkPage} from '../vendor/lintapple/src/index.js';
import {collectAiTells,evaluateAiTells,scoreSignals,signalTitle} from './ai-tells.mjs';
import {spawnBounded} from './execute.mjs';
import {collectJaTypography,evaluateJaTypography} from './ja-typography.mjs';
import {jaReport} from './ja-copy.mjs';
import {compareScans,findAutoPrevious,keepBeforeImages,loadPreviousScan,renderComparison} from './scan-compare.mjs';

// Universal checks only. Font/size/copy/contract rules depend on a project policy, and content-clipping is
// too noisy on marketing pages (marquees, carousels), so a scan skips them.
export const scanRules=['text-contrast','accessible-name','form-label','aria-reference','label-consistency','control-state','target-size','horizontal-overflow','viewport-bounds','content-overflow','font-loading'];
export const scanLangs=['ko','ja','en'];
const browserLocale={ko:'ko-KR',ja:'ja-JP',en:'en-US'};
export const scanViewports=[{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}];

export function scanTarget(input){
 let u;
 if(existsSync(input)&&/.html?$/i.test(input))return pathToFileURL(path.resolve(input)).href;
 try{u=new URL(input);}catch{u=null;}
 if(!u||!['http:','https:','file:'].includes(u.protocol)){
  // Bare host ("example.com") or a local HTML file path.
  if(/^[\w.-]+\.[a-z]{2,}(?::\d+)?(\/.*)?$/i.test(input))u=new URL('https://'+input);
  else throw Error(`Use an http(s) URL, host name or file path: ${input}`);
 }
 if(u.username||u.password)throw Error('Credentials inside URL are not allowed');
 return u.toString();
}

async function settle(page){
 // Walk the page so lazy images and scroll-reveal content become visible before measuring.
 await page.evaluate(async()=>{const step=Math.max(400,innerHeight*.8),max=Math.min(document.documentElement.scrollHeight,30000);for(let y=0;y<max;y+=step){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}scrollTo(0,0);await document.fonts.ready;await new Promise(r=>setTimeout(r,500));});
}

async function staticSource(source){
 const audit=fileURLToPath(new URL('../vendor/suta/skills/suta/scripts/audit.mjs',import.meta.url));
 const run=await spawnBounded(process.execPath,[audit,path.resolve(source),'--json'],{cwd:process.cwd(),timeoutMs:60000});
 if(run.error||![0,1].includes(run.code))return {error:`suta failed (${run.error||run.code}): ${run.stderr.slice(-400)}`};
 try{const raw=JSON.parse(run.stdout);return {files:raw.files,errors:raw.errors,warnings:raw.warnings,findings:raw.findings.map(f=>({file:path.join(path.basename(path.resolve(source)),path.relative(path.resolve(source),f.file)).replaceAll(path.sep,'/'),line:f.line,rule:f.rule,severity:f.severity,message:f.message,fix:f.fix}))};}
 catch{return {error:'suta did not return JSON'};}
}

// Before the page is loaded only the host hints at its language; the report language is settled after loading.
export function hintLocale(url){
 const host=(()=>{try{return new URL(url).hostname;}catch{return '';}})();
 return /\.jp$/i.test(host)?'ja-JP':/\.kr$/i.test(host)?'ko-KR':'en-US';
}

/** Report language for lang 'auto': Japanese or Korean text on the page, then <html lang>, else English. */
export function detectLang(view){
 if(view.ja?.japanese)return 'ja';
 const text=(view.metrics?.text||'').replace(/\s/g,''),hangul=(text.match(/[가-힣]/g)||[]).length;
 if(text.length&&hangul/text.length>=.15)return 'ko';
 const declared=(view.ja?.lang||'').toLowerCase().slice(0,2);
 return ['ja','ko'].includes(declared)?declared:'en';
}

export async function scanUrl(input,{out='ui-refiner-scan',lang='auto',locale=null,source=null,compare=null,timeoutMs=45000}={}){
 if(lang!=='auto'&&!scanLangs.includes(lang))throw Error(`Unsupported report language: ${lang}`);
 const url=scanTarget(input),dir=path.resolve(out),browserLoc=locale||(lang==='auto'?hintLocale(url):browserLocale[lang]);
 // Load the previous scan and keep its screenshots before this run can overwrite them in the same folder.
 // 'auto' reuses the last scan of the same page in the output folder and stays quiet otherwise.
 const previous=compare==='auto'?await findAutoPrevious(dir,url):compare?await loadPreviousScan(compare):null;
 await fs.mkdir(dir,{recursive:true});
 const beforeImages=previous?await keepBeforeImages(previous,dir):null;
 if(previous)await fs.writeFile(path.join(dir,'previous-scan.json'),JSON.stringify(previous.scan,null,2)+'\n');
 const browser=await launchBrowser({timeout:timeoutMs}),views=[];
 try{
  for(const vp of scanViewports){
   const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},reducedMotion:'no-preference',locale:browserLoc,deviceScaleFactor:1,serviceWorkers:'block'});
   const view={viewport:vp.name,width:vp.width,height:vp.height};
   try{
    const page=await context.newPage();page.setDefaultTimeout(timeoutMs);
    const response=await page.goto(url,{waitUntil:'load',timeout:timeoutMs});
    if(response&&!response.ok())throw Error(`HTTP ${response.status()} at ${response.url()}`);
    await page.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});
    await settle(page);
    view.screenshot=`scan-${vp.name}.png`;
    await page.screenshot({path:path.join(dir,view.screenshot),fullPage:true,timeout:timeoutMs});
    view.metrics=await page.evaluate(collectAiTells);
    view.ja=await page.evaluate(collectJaTypography);
    Object.assign(view.metrics,{japanese:view.ja.japanese,japaneseFontCoverage:view.ja.japanese?1-view.ja.fontFallback.ratio:0});
    try{
     const raw=await checkPage(page,{bannedCopy:[],viewports:[{width:vp.width,height:vp.height}],colorSchemes:['light']});
     view.quality=raw.findings.filter(f=>scanRules.includes(f.rule)).map(f=>({rule:f.rule,selector:f.selector,message:f.message,actual:f.actual,expected:f.expected}));
    }catch(e){view.qualityError=e.message;}
   }catch(e){view.error=e.message;}
   finally{await context.close();}
   views.push(view);
  }
 }finally{await browser.close();}
 const ok=views.filter(v=>v.metrics);
 if(!ok.length)throw Error(`Could not load ${url}: ${views.map(v=>v.error).join('; ')}`);
 // Desktop drives the design read; mobile adds any signal desktop missed.
 const langSource=lang==='auto'?'page':'option';
 if(lang==='auto')lang=detectLang(ok[0]);
 const tells=evaluateAiTells(ok[0].metrics,{lang});
 for(const v of ok.slice(1))for(const s of evaluateAiTells(v.metrics,{lang}).signals)if(!tells.signals.some(x=>x.id===s.id))tells.signals.push({...s,viewport:v.viewport});
 tells.absent=tells.absent.filter(id=>!tells.signals.some(s=>s.id===id));
 Object.assign(tells,scoreSignals(tells.signals,tells.craft));
 const quality=groupQuality(views),japanese=mergeJa(ok,lang);
 const result={schemaVersion:1,tool:'ui-refiner scan',advisory:true,blocking:false,url,scannedAt:new Date().toISOString(),lang,langSource,locale:browserLoc,aiLook:tells,quality,japanese,
  views:views.map(({metrics,quality,ja,...v})=>({...v,typography:metrics?.typography,inspectedElements:metrics?.inspected,totalElements:metrics?.total})),
  static:source?await staticSource(source):null};
 if(previous)result.comparison={...compareScans(previous.scan,result,{lang}),mode:compare==='auto'?'auto':'explicit',images:Object.keys(beforeImages).length?beforeImages:null};
 await fs.writeFile(path.join(dir,'scan.json'),JSON.stringify(result,null,2)+'\n');
 await fs.writeFile(path.join(dir,'DESIGN_REVIEW.md'),renderScan(result));
 return {result,dir};
}

// Japanese headings wrap differently per width, so keep every viewport an issue appears in.
function mergeJa(views,lang){
 const merged={japanese:false,issues:[]};
 for(const v of views){const r=evaluateJaTypography(v.ja,{lang});if(!r.japanese)continue;
  Object.assign(merged,{japanese:true,jaRatio:r.jaRatio,lang:r.lang,phraseAwareHeadings:Math.max(merged.phraseAwareHeadings||0,r.phraseAwareHeadings)});
  for(const i of r.issues){const prev=merged.issues.find(x=>x.id===i.id);if(prev)prev.viewports.push(v.viewport);else merged.issues.push({...i,viewports:[v.viewport]});}}
 return merged;
}

function groupQuality(views){
 const groups=new Map();
 for(const v of views)for(const f of v.quality||[]){const g=groups.get(f.rule)||{rule:f.rule,count:0,viewports:new Set(),examples:[]};g.count++;g.viewports.add(v.viewport);if(g.examples.length<3)g.examples.push({selector:f.selector,message:f.message});groups.set(f.rule,g);}
 return [...groups.values()].map(g=>({...g,viewports:[...g.viewports]})).sort((a,b)=>b.count-a.count);
}

const t={
 ko:{jaType:'일본어 타이포그래피',jaNone:'일본어 조판에서 눈에 띄는 문제를 찾지 못했습니다.',craft:'의도된 디자인 신호',crafts:{'custom-webfont':'직접 고른 웹폰트','imagery':'실제 이미지·영상','type-scale':'풍부한 글자 크기 단계'},craftNote:'점수를 낮췄지만 신호가 사라지지는 않습니다',title:'디자인 점검',index:'AI 티 지수',bands:{high:'높음',medium:'보통',low:'낮음',none:'없음'},note:'휴리스틱 신호이며 차단 판정이 아닙니다. 승인된 브랜드 선택이면 유지하세요.',shots:'스크린샷',signals:'AI 티 신호 (강한 순)',none:'뚜렷한 AI 티 신호를 찾지 못했습니다.',strength:{strong:'강',moderate:'중',weak:'약'},evidence:'근거',targets:'대상',why:'왜',fix:'제안',quality:'기본 품질 (실제 렌더링 측정)',qnone:'측정한 보편 규칙에서 문제를 찾지 못했습니다.',rule:'규칙',count:'건수',vp:'뷰포트',ex:'예시',stat:'소스 정적 검사 (suta)',good:'피한 것',next:'에이전트가 이어서 할 일',steps:['위 스크린샷을 직접 열어 본다. 첫 화면에서 "무슨 서비스이고 무엇을 하라는지" 3초 안에 읽히는지, 시선이 어디서 시작해 어디로 가는지 적는다.','신호 목록을 그대로 나열하지 말고, 근본 원인 2~3개로 묶어 리디자인 방향을 제안한다(예: "장식으로 위계를 대신함" → 그라데이션·글로우·배지 제거 + 타이포 크기 대비).','각 제안에 보존할 것(문구의 사실, 링크 목적지, 폼 필드, 브랜드 색/서체)을 명시한다.','코드를 고칠 수 있으면 suta 패턴(vendor/suta/skills/suta)을 참고해 수정하고 `ui-refiner scan`을 다시 돌려 신호가 줄었는지 비교한다.','업무형 화면(대시보드·설정·표)은 시스템 서체·높은 밀도가 정상일 수 있다. 화면 목적에 맞지 않는 지적은 근거와 함께 기각한다.'],error:'불러오기 실패'},
 en:{jaType:'Japanese typography',jaNone:'No notable Japanese typesetting issues found.',craft:'Deliberate-design signals',crafts:{'custom-webfont':'chosen webfont','imagery':'real imagery','type-scale':'rich type scale'},craftNote:'score dampened; signals still apply',title:'Design scan',index:'AI-look index',bands:{high:'high',medium:'medium',low:'low',none:'none'},note:'Heuristic signals, not a blocking verdict. Keep anything that is an approved brand choice.',shots:'Screenshots',signals:'AI-look signals (strongest first)',none:'No clear AI-look signals found.',strength:{strong:'strong',moderate:'moderate',weak:'weak'},evidence:'Evidence',targets:'Targets',why:'Why',fix:'Suggestion',quality:'Baseline quality (rendered measurements)',qnone:'No issues in the universal rules measured.',rule:'Rule',count:'Count',vp:'Viewports',ex:'Example',stat:'Source static audit (suta)',good:'Avoided',next:'Next steps for the agent',steps:['Open the screenshots. Can you tell in three seconds what this is and what to do? Note where the eye starts and where it goes.','Do not just list signals: group them into 2–3 root causes and propose a redesign direction (e.g. "decoration replaces hierarchy" → drop gradients/glows/badges, strengthen type contrast).','For each proposal, state what must be preserved (factual copy, link targets, form fields, brand color/typeface).','If you can edit the code, use the suta patterns (vendor/suta/skills/suta), then rerun `ui-refiner scan` and compare signals.','Operational screens (dashboards, settings, tables) may legitimately use system fonts and high density. Reject findings that do not fit the surface purpose, with a reason.'],error:'load failed'},
 ja:jaReport
};
const severity={ko:{high:'높음',medium:'중간',low:'낮음'},ja:{high:'高',medium:'中',low:'低'},en:{high:'high',medium:'medium',low:'low'}};

export function renderScan(r){
 const L=scanLangs.includes(r.lang)?r.lang:'ko',x=t[L],a=r.aiLook;let n=0;const h=title=>`## ${++n}. ${title}`;
 const lines=[`# ${x.title}: ${r.url}`,'',`- **${x.index}: ${a.score}/100 (${x.bands[a.band]})** — ${x.note}`,...(a.craft?.length?[`- ${x.craft}: ${a.craft.map(c=>x.crafts[c]).join(', ')} (${x.craftNote})`]:[]),`- ${x.shots}: ${r.views.map(v=>v.screenshot?`[${v.viewport} ${v.width}px](${v.screenshot})`:`${v.viewport}: ${x.error} — ${v.error}`).join(' · ')}`,''];
 if(r.comparison)lines.push(...renderComparison(r.comparison,L,h));
 lines.push(h(x.signals),'');
 if(!a.signals.length)lines.push(x.none,'');
 for(const s of a.signals){
  lines.push(`### [${x.strength[s.strength]}] ${s.title}${s.viewport?` (${s.viewport})`:''}`,'',`- ${x.evidence}: \`${JSON.stringify(s.evidence)}\``);
  if(s.targets?.length)lines.push(`- ${x.targets}: ${s.targets.slice(0,4).map(v=>'`'+v+'`').join(', ')}`);
  lines.push(`- ${x.why}: ${s.why}`,`- **${x.fix}:** ${s.fix}`,'');
 }
 lines.push(h(x.quality),'');
 if(!r.quality.length)lines.push(x.qnone,'');
 else{lines.push(`| ${x.rule} | ${x.count} | ${x.vp} | ${x.ex} |`,'|---|---:|---|---|');for(const q of r.quality)lines.push(`| ${q.rule} | ${q.count} | ${q.viewports.join(', ')} | \`${q.examples[0].selector}\` — ${q.examples[0].message.replace(/\|/g,'\\|')} |`);lines.push('');}
 const qe=r.views.filter(v=>v.qualityError);if(qe.length)lines.push(...qe.map(v=>`- ${v.viewport}: ${v.qualityError}`),'');
 if(r.japanese?.japanese){
  lines.push(h(x.jaType),'');
  if(!r.japanese.issues.length)lines.push(x.jaNone,'');
  for(const i of r.japanese.issues){
   lines.push(`### [${severity[L][i.severity]}] ${i.title} (${i.viewports.join(', ')})`,'',`- ${x.evidence}: \`${JSON.stringify(i.evidence)}\``);
   if(i.targets?.length)lines.push(`- ${x.targets}: ${i.targets.slice(0,4).map(v=>'`'+v+'`').join(', ')}`);
   lines.push(`- ${x.why}: ${i.why}`,`- **${x.fix}:** ${i.fix}`,'');
  }
 }
 if(r.static){
  lines.push(h(x.stat),'');
  if(r.static.error)lines.push(r.static.error,'');
  else{const by=new Map();for(const f of r.static.findings){const g=by.get(f.rule)||[];g.push(f);by.set(f.rule,g);}
   for(const [rule,fs] of by)lines.push(`- **${rule}** (${fs.length}): ${fs[0].message} — ${fs.slice(0,3).map(f=>`\`${f.file}:${f.line}\``).join(', ')}`,`  - → ${fs[0].fix}`);lines.push('');}
 }
 const titles=a.absent.map(id=>signalTitle(id,r.lang)).filter(Boolean);
 if(titles.length)lines.push(h(x.good),'',titles.map(v=>`- ${v}`).join('\n'),'');
 lines.push(h(x.next),'',...x.steps.map((s,i)=>`${i+1}. ${s}`),'');
 return lines.join('\n');
}

