// Side-by-side sheet of design directions so a person can choose before a refine is applied.
// Each direction is an .html mock in one folder; an optional first comment carries its description:
//   <!-- direction: The clinic's front desk | type: Bricolage Grotesque + Public Sans | palette: deep green, marigold | signature: today's hours board -->
import fs from 'node:fs/promises';
import path from 'node:path';
import {scanUrl} from './scan.mjs';
import {readLog,readDeal,historyWarnings,projectOf,humanHeroShare,SHEET_JSON} from './refine-log.mjs';


const SHEET='DIRECTIONS';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/** Reads the `<!-- direction: … | key: value -->` comment at the top of a mock. */
export function parseDirectionNote(html){
 const m=String(html).match(/<!--\s*direction:\s*([\s\S]*?)-->/i);if(!m)return null;
 const [concept,...rest]=m[1].split('|').map(s=>s.trim()).filter(Boolean);
 const note={concept};for(const part of rest){const i=part.indexOf(':');if(i>0)note[part.slice(0,i).trim().toLowerCase()]=part.slice(i+1).trim();}
 return note;
}

const L={
 ko:{title:'디자인 방향 비교',lead:'시안을 비교하고 하나를 고르세요. 섞어도 됩니다(예: A의 히어로에 B의 색).',concept:'콘셉트',type:'서체',palette:'색',signature:'고유 요소',score:'AI 티 지수',quality:'기본 품질 문제',ja:'일본어 조판 문제',signals:'신호',desktop:'데스크톱',mobile:'모바일',none:'없음',ask:'어느 방향으로 갈지 정해 주세요: ',surface:'바탕색',hero:'히어로 구조',onHuman:'실제 사이트 {n}%',sameHero:'{a}와 {b}의 히어로 구조가 같습니다({c}).',fonts:'측정된 서체',warn:'시안끼리 너무 비슷합니다',sameSurface:'{a}와 {b}의 바탕색이 거의 같습니다({c}).',sameFonts:'{a}와 {b}가 같은 서체 조합을 씁니다({c}).',allTinted:'모든 시안이 옅은 미색 바탕입니다. 사람이 만든 사이트는 대부분 순백이니, 적어도 하나는 순백이나 분명한 색 바탕으로 바꾸세요.',redo:'경고가 있으면 겹치는 시안을 다시 만든 뒤 보여 주세요.',dealMismatch:'{a}는 배정된 구조({c})가 아니라 {d}로 만들어졌습니다.',repeatHero:'{a}의 히어로 구조({c})는 최근 다른 프로젝트({p})에서 고른 것과 같습니다.',repeatFonts:'{a}의 서체 조합({c})은 다른 프로젝트({p})에서 이미 골랐습니다.',repeatSurface:'{a}의 바탕색({c})은 다른 프로젝트({p})에서 고른 것과 거의 같습니다.',repeatAccent:'{a}의 강조색({c})은 다른 프로젝트({p})에서 고른 것과 같은 계열입니다.',accent:'강조색',dealType:'{a}는 배정된 서체({c}) 대신 {d}를 씁니다.',dealAccent:'{a}의 강조색 계열이 배정된 {c}가 아니라 {d}입니다.'},
 ja:{title:'デザイン方針の比較',lead:'案を見比べて1つ選んでください。組み合わせも可能です（例：Aのヒーローに Bの配色）。',concept:'コンセプト',type:'書体',palette:'配色',signature:'固有の要素',score:'AI感指数',quality:'基本品質の問題',ja:'日本語組版の問題',signals:'サイン',desktop:'デスクトップ',mobile:'モバイル',none:'なし',ask:'どの方針で進めるか選んでください：',surface:'地色',hero:'ヒーローの構成',onHuman:'実在サイトの{n}%',sameHero:'{a}と{b}のヒーローの構成が同じです（{c}）。',fonts:'計測した書体',warn:'案同士が似すぎています',sameSurface:'{a}と{b}の地色がほぼ同じです（{c}）。',sameFonts:'{a}と{b}が同じ書体の組み合わせです（{c}）。',allTinted:'すべての案が薄いオフホワイトの地色です。人が作ったサイトの多くは純白なので、少なくとも1つは純白かはっきりした色の地色にしてください。',redo:'警告があれば、重なっている案を作り直してから見せてください。',dealMismatch:'{a}は割り当てた構成（{c}）ではなく{d}で作られています。',repeatHero:'{a}のヒーローの構成（{c}）は、最近ほかのプロジェクト（{p}）で選んだものと同じです。',repeatFonts:'{a}の書体の組み合わせ（{c}）は、ほかのプロジェクト（{p}）ですでに選んでいます。',repeatSurface:'{a}の地色（{c}）は、ほかのプロジェクト（{p}）で選んだものとほぼ同じです。',repeatAccent:'{a}のアクセント色（{c}）は、ほかのプロジェクト（{p}）で選んだものと同じ系統です。',accent:'アクセント色',dealType:'{a}は割り当てた書体（{c}）ではなく{d}を使っています。',dealAccent:'{a}のアクセント色は割り当てた{c}系ではなく{d}系です。'},
 en:{title:'Design directions',lead:'Compare the directions and pick one. Mixing is fine (for example A\'s hero with B\'s palette).',concept:'Concept',type:'Type',palette:'Palette',signature:'Signature element',score:'AI-look index',quality:'Baseline quality issues',ja:'Japanese typesetting issues',signals:'Signals',desktop:'Desktop',mobile:'Mobile',none:'none',ask:'Choose a direction: ',surface:'Surface',hero:'Hero layout',onHuman:'{n}% of human-made sites',sameHero:'{a} and {b} share the same hero layout ({c}).',fonts:'Measured type',warn:'Directions are too alike',sameSurface:'{a} and {b} use nearly the same background ({c}).',sameFonts:'{a} and {b} use the same type pair ({c}).',allTinted:'Every direction sits on a faint off-white surface. Most human-made sites use plain white, so make at least one plain white or a clear colour.',redo:'If there is a warning, redo the overlapping direction before showing the sheet.',dealMismatch:'{a} was dealt {c} but was built as {d}.',repeatHero:'{a} repeats the hero layout ({c}) chosen recently for another project ({p}).',repeatFonts:'{a} repeats the type pair ({c}) already chosen for another project ({p}).',repeatSurface:'{a} repeats the surface ({c}) chosen for another project ({p}).',repeatAccent:'{a} repeats the accent hue ({c}) chosen for another project ({p}).',accent:'Accent',dealType:'{a} uses {d} instead of the dealt type ({c}).',dealAccent:'{a} uses a {d} accent instead of the dealt {c}.'}
};

const hex=rgb=>rgb?'#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join(''):null;
// Near-white (#f7f7f7 and lighter, almost no tint) reads as plain white, the human default (70–87% of calibration sites).
const nearWhite=rgb=>Math.min(...rgb)>=247&&Math.max(...rgb)-Math.min(...rgb)<=8;
const tinted=rgb=>!!rgb&&!nearWhite(rgb)&&Math.max(...rgb)>=236&&Math.min(...rgb)>=200&&Math.max(...rgb)-Math.min(...rgb)<=45;

/** A key for the first-screen skeleton measured by the collector (hero): alignment of the main headline plus what sits beside it. */
export function heroSkeleton(h){
 if(!h)return null;if(h.align==='below-fold')return 'below-fold';if(h.fullBleed)return 'full-bleed';
 return `${h.align}+${h.side?.kind??'stacked'}`;
}
// A page measured without a visible h1 opens with content: count it as "below-fold", as the human reference does.
const heroOf=m=>heroSkeleton(m.hero)??'below-fold';
/** The most used saturated colour on buttons and links: the page's accent. */
export function accentOf(m){
 const hsl=([r,g,b])=>{r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,l=(mx+mn)/2;if(d<.04)return {s:0,l};return {s:d/(1-Math.abs(2*l-1)),l};};
 const c=new Map();for(const a of m?.accents??[]){const x=hsl(a);if(x.s<.25||x.l<.1||x.l>.88)continue;const k=a.join(',');c.set(k,(c.get(k)||0)+1);}
 const top=[...c].sort((a,b)=>b[1]-a[1])[0];return top?top[0].split(',').map(Number):null;
}
const HERO={
 ko:{'below-fold':'첫 화면에 제목 없음','full-bleed':'화면 가득 찬 사진·영상',left:'왼쪽 제목',wide:'화면 폭 제목',center:'가운데 제목',right:'오른쪽 제목',panel:'옆에 패널',media:'옆에 이미지',stacked:'아래로 쌓음'},
 ja:{'below-fold':'ファーストビューに見出しなし','full-bleed':'全面の写真・動画',left:'左寄せの見出し',wide:'幅いっぱいの見出し',center:'中央の見出し',right:'右寄せの見出し',panel:'横にパネル',media:'横に画像',stacked:'縦に積む'},
 en:{'below-fold':'no headline on the first screen','full-bleed':'full-bleed photo or video',left:'left headline',wide:'full-width headline',center:'centred headline',right:'right headline',panel:'panel beside it',media:'image beside it',stacked:'stacked below'}};
const heroText=(key,lang)=>{if(!key)return null;const x=HERO[lang]||HERO.en;return key.split('+').map(k=>x[k]??k).join(lang==='ja'?'＋':' + ');};
const heroLine=(d,x,lang)=>heroText(d.hero,lang)+(d.heroHuman!=null?` (${x.onHuman.replace('{n}',Math.round(d.heroHuman*100))})`:'');

/** Pairs of directions that share a surface or a type pair, and whether none leaves the off-white default. */
export function directionWarnings(items){
 const w=[];
 for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
  const a=items[i],b=items[j];
  if(a.bg&&b.bg&&!(nearWhite(a.bg)&&nearWhite(b.bg))&&a.bg.every((v,k)=>Math.abs(v-b.bg[k])<=10))w.push({id:'same-surface',a:a.label,b:b.label,c:`${hex(a.bg)} / ${hex(b.bg)}`});
  if(a.hero&&a.hero===b.hero)w.push({id:'same-hero',a:a.label,b:b.label,c:a.hero});
  if(a.fonts?.length&&b.fonts?.length&&a.fonts.slice(0,2).join('+')===b.fonts.slice(0,2).join('+'))w.push({id:'same-fonts',a:a.label,b:b.label,c:a.fonts.slice(0,2).join(' + ')});
 }
 if(items.length>=2&&items.every(d=>tinted(d.bg)))w.push({id:'all-tinted'});
 return w;
}
const MSG={'same-surface':'sameSurface','same-hero':'sameHero','same-fonts':'sameFonts','deal-mismatch':'dealMismatch','repeat-hero':'repeatHero','repeat-fonts':'repeatFonts','repeat-surface':'repeatSurface','repeat-accent':'repeatAccent','deal-type':'dealType','deal-accent':'dealAccent'};
const heroish=new Set(['same-hero','deal-mismatch','repeat-hero']);
const warnText=(x,w,lang)=>w.id==='all-tinted'?x.allTinted:x[MSG[w.id]].replace('{a}',w.a).replace('{b}',w.b??'').replace('{c}',heroish.has(w.id)?heroText(w.c,lang):Array.isArray(w.c)?hex(w.c):w.c).replace('{d}',w.id==='deal-mismatch'?heroText(w.d,lang)??'':w.d??'').replace('{p}',w.page??'');

/** Markdown sheet for a chat reply or a README-style file. */
export function renderDirectionsMarkdown(items,lang='en',warnings=directionWarnings(items)){
 const x=L[lang]||L.en,lines=[`# ${x.title}`,'',x.lead,''];
 if(warnings.length)lines.push(`> **${x.warn}**`,...warnings.map(w=>`> - ${warnText(x,w,lang)}`),`> ${x.redo}`,'');
 for(const d of items){
  lines.push(`## ${d.label}. ${d.note?.concept||d.file}`,'');
  for(const k of ['type','palette','signature'])if(d.note?.[k])lines.push(`- ${x[k]}: ${d.note[k]}`);
  if(d.bg||d.fonts?.length||d.hero)lines.push(`- ${x.surface}: ${hex(d.bg)??'-'} · ${x.fonts}: ${d.fonts?.join(' + ')||'-'} · ${x.hero}: ${d.hero?heroLine(d,x,lang):'-'}${d.accent?` · ${x.accent}: ${hex(d.accent)}`:''}`);
  lines.push(`- ${x.score}: ${d.score}/100 · ${x.quality}: ${d.quality}${d.ja!=null?` · ${x.ja}: ${d.ja}`:''}`);
  if(d.signals.length)lines.push(`- ${x.signals}: ${d.signals.join(', ')}`);
  lines.push(`- ${x.desktop}: [${d.desktop}](${d.desktop}) · ${x.mobile}: [${d.mobile}](${d.mobile})`,'');
 }
 lines.push(x.ask+items.map(d=>d.label).join(' / '));
 return lines.join('\n')+'\n';
}

/** Self-contained HTML sheet with the screenshots side by side (relative image paths). */
export function renderDirectionsHtml(items,lang='en',warnings=directionWarnings(items)){
 const x=L[lang]||L.en;
 const card=d=>`<article><header><b>${esc(d.label)}</b><h2>${esc(d.note?.concept||d.file)}</h2></header>
<dl>${['type','palette','signature'].filter(k=>d.note?.[k]).map(k=>`<dt>${x[k]}</dt><dd>${esc(d.note[k])}</dd>`).join('')}
${d.bg||d.fonts?.length?`<dt>${x.surface}</dt><dd>${d.bg?`<span class="sw" style="background:${hex(d.bg)}"></span>${hex(d.bg)}`:'-'}</dd><dt>${x.fonts}</dt><dd>${esc(d.fonts?.join(' + ')||'-')}</dd>`:''}${d.hero?`<dt>${x.hero}</dt><dd>${esc(heroLine(d,x,lang))}</dd>`:''}${d.accent?`<dt>${x.accent}</dt><dd><span class="sw" style="background:${hex(d.accent)}"></span>${hex(d.accent)}</dd>`:''}
<dt>${x.score}</dt><dd>${d.score}/100</dd><dt>${x.quality}</dt><dd>${d.quality}</dd>${d.ja!=null?`<dt>${x.ja}</dt><dd>${d.ja}</dd>`:''}
<dt>${x.signals}</dt><dd>${d.signals.length?esc(d.signals.join(', ')):x.none}</dd></dl>
<div class="shots"><figure class="d"><figcaption>${x.desktop}</figcaption><div class="scroll"><img src="${esc(d.desktop)}" alt="${esc(d.label)} ${x.desktop}"></div></figure>
<figure class="m"><figcaption>${x.mobile}</figcaption><div class="scroll"><img src="${esc(d.mobile)}" alt="${esc(d.label)} ${x.mobile}"></div></figure></div></article>`;
 return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${x.title}</title>
<style>:root{--bg:#f5f6f8;--panel:#fff;--fg:#17191e;--muted:#5d6370;--line:#dde0e6;--accent:#1f6f5c}
@media (prefers-color-scheme:dark){:root{--bg:#121418;--panel:#1b1e24;--fg:#e8eaee;--muted:#9aa1ad;--line:#2d323b;--accent:#5fc2a6;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 system-ui,-apple-system,"Hiragino Sans","Noto Sans JP","Apple SD Gothic Neo","Malgun Gothic",sans-serif;padding:24px max(16px,3vw)}
h1{margin:0 0 6px;font-size:26px}p.lead{margin:0 0 20px;color:var(--muted)}
main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:16px}
article{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:16px;min-width:0;display:flex;flex-direction:column;gap:12px}
header b{display:inline-block;font-size:13px;color:var(--accent);border:1px solid var(--accent);border-radius:4px;padding:0 7px}h2{margin:6px 0 0;font-size:18px;line-height:1.35}
dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 12px;margin:0;font-size:14px}dt{color:var(--muted)}dd{margin:0;min-width:0}
.shots{display:grid;grid-template-columns:3fr 1fr;gap:10px}figure{margin:0;min-width:0}figcaption{font-size:12px;color:var(--muted);margin-bottom:4px}
.scroll{height:520px;overflow:auto;border:1px solid var(--line);border-radius:6px;background:#fff}.scroll img{display:block;width:100%;height:auto}
.sw{display:inline-block;width:12px;height:12px;border:1px solid var(--line);border-radius:2px;margin-right:6px;vertical-align:-1px}
.warn{border:1px solid #c98a00;background:color-mix(in srgb,#f2b400 12%,var(--panel));border-radius:8px;padding:10px 14px;margin:0 0 16px}.warn ul{margin:4px 0;padding-left:20px}</style></head>
<body><h1>${x.title}</h1><p class="lead">${x.lead}</p>${warnings.length?`<div class="warn" role="note"><b>${x.warn}</b><ul>${warnings.map(w=>`<li>${esc(warnText(x,w,lang))}</li>`).join('')}</ul>${x.redo}</div>`:''}<main>${items.map(card).join('\n')}</main></body></html>
`;
}

/** Scans every .html mock in `dir` and writes DIRECTIONS.html and DIRECTIONS.md next to them. */
export async function compareDirections(dir,{lang='auto',timeoutMs=45000,log}={}){
 const root=path.resolve(dir);
 const files=(await fs.readdir(root)).filter(f=>/\.html?$/i.test(f)&&!f.startsWith(SHEET)).sort();
 if(files.length<2)throw new Error(`Put at least two .html mocks in ${dir} (found ${files.length}).`);
 const items=[],share=await humanHeroShare();let sheetLang=lang==='auto'?null:lang;
 for(const [i,file] of files.entries()){
  const out=path.join(root,'_scans',file.replace(/\.html?$/i,''));
  const {result:r}=await scanUrl(path.join(root,file),{out,lang,compare:false,timeoutMs,keepRaw:true});
  sheetLang??=r.lang;
  const m=r.raw?.find(v=>v.viewport==='desktop')?.metrics??r.raw?.[0]?.metrics;delete r.raw;
  const rel=v=>path.relative(root,path.join(out,`scan-${v}.png`)).split(path.sep).join('/');
  items.push({label:String.fromCharCode(65+i),file,note:parseDirectionNote(await fs.readFile(path.join(root,file),'utf8')),
   score:r.aiLook.score,signals:r.aiLook.signals.filter(s=>s.weight>0).map(s=>s.title),
   bg:m?.rootBackground?.rgb??null,accent:m?accentOf(m):null,hero:m?heroOf(m):null,heroHuman:share&&m?(share[heroOf(m)]??0):null,fonts:(m?.typography?.families??[]).filter(f=>f.count>=2).slice(0,2).map(f=>f.name),
   quality:r.quality.reduce((n,q)=>n+(q.count??0),0),ja:r.japanese?.japanese?r.japanese.issues.length:null,desktop:rel('desktop'),mobile:rel('mobile')});
 }
 const sheetLangKey=['ko','ja','en'].includes(sheetLang)?sheetLang:'en',warnings=[...directionWarnings(items),...historyWarnings(items,await readLog(log),projectOf(root),await readDeal(root))];
 await fs.writeFile(path.join(root,`${SHEET}.html`),renderDirectionsHtml(items,sheetLangKey,warnings));
 await fs.writeFile(path.join(root,`${SHEET}.md`),renderDirectionsMarkdown(items,sheetLangKey,warnings));
 await fs.writeFile(path.join(root,SHEET_JSON),JSON.stringify({schemaVersion:1,items,warnings},null,1)+'\n');
 return {items,warnings,lang:sheetLangKey,html:path.join(root,`${SHEET}.html`),markdown:path.join(root,`${SHEET}.md`)};
}

/**
 * After the chosen direction is applied to the real page, checks that the page kept the chosen mock's
 * hero structure, surface and type pair. Agents tend to drift back to their habit while building the
 * full page (benchmark: 5 of 8 chosen directions ended as "left headline, stacked").
 * The pick comes from `pick`, else from the last log entry recorded for this project.
 */
export async function verifyApplied(dir,target,{pick,log,lang='auto',timeoutMs=45000}={}){
 const root=path.resolve(dir);
 let sheet;try{sheet=JSON.parse(await fs.readFile(path.join(root,SHEET_JSON),'utf8'));}catch{throw new Error(`Run "ui-refiner directions ${dir}" first; ${SHEET_JSON} is missing.`);}
 const label=(pick||[...await readLog(log)].reverse().find(e=>e.project===projectOf(root))?.label||'').toUpperCase();
 const chosen=sheet.items.find(d=>d.label===label);
 if(!chosen)throw new Error('No chosen direction: pass --pick or run "ui-refiner directions record" first.');
 const {result:r}=await scanUrl(target,{out:path.join(root,'_scans','applied'),lang,compare:false,timeoutMs,keepRaw:true});
 const m=r.raw?.find(v=>v.viewport==='desktop')?.metrics??r.raw?.[0]?.metrics;
 const applied={hero:m?heroOf(m):null,bg:m?.rootBackground?.rgb??null,fonts:(m?.typography?.families??[]).filter(f=>f.count>=2).slice(0,2).map(f=>f.name),score:r.aiLook.score};
 const drift=[];
 if(chosen.hero&&applied.hero&&chosen.hero!==applied.hero)drift.push({id:'hero',chosen:chosen.hero,applied:applied.hero});
 const white=c=>c&&Math.min(...c)>=247&&Math.max(...c)-Math.min(...c)<=8;
 if(chosen.bg&&applied.bg&&!(white(chosen.bg)&&white(applied.bg))&&!chosen.bg.every((v,k)=>Math.abs(v-applied.bg[k])<=16))drift.push({id:'surface',chosen:hex(chosen.bg),applied:hex(applied.bg)});
 if(chosen.fonts?.length&&applied.fonts.length&&!chosen.fonts.some(f=>applied.fonts.includes(f)))drift.push({id:'type',chosen:chosen.fonts.join(' + '),applied:applied.fonts.join(' + ')});
 return {label,chosen:{hero:chosen.hero,bg:chosen.bg,fonts:chosen.fonts},applied,drift};
}
