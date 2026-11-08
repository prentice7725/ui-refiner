// Side-by-side sheet of design directions so a person can choose before a refine is applied.
// Each direction is an .html mock in one folder; an optional first comment carries its description:
//   <!-- direction: The clinic's front desk | type: Bricolage Grotesque + Public Sans | palette: deep green, marigold | signature: today's hours board -->
import fs from 'node:fs/promises';
import path from 'node:path';
import {scanUrl} from './scan.mjs';

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
 ko:{title:'디자인 방향 비교',lead:'시안을 비교하고 하나를 고르세요. 섞어도 됩니다(예: A의 히어로에 B의 색).',concept:'콘셉트',type:'서체',palette:'색',signature:'고유 요소',score:'AI 티 지수',quality:'기본 품질 문제',ja:'일본어 조판 문제',signals:'신호',desktop:'데스크톱',mobile:'모바일',none:'없음',ask:'어느 방향으로 갈지 정해 주세요: ',surface:'바탕색',fonts:'측정된 서체',warn:'시안끼리 너무 비슷합니다',sameSurface:'{a}와 {b}의 바탕색이 거의 같습니다({c}).',sameFonts:'{a}와 {b}가 같은 서체 조합을 씁니다({c}).',allTinted:'모든 시안이 옅은 미색 바탕입니다. 사람이 만든 사이트는 대부분 순백이니, 적어도 하나는 순백이나 분명한 색 바탕으로 바꾸세요.',redo:'경고가 있으면 겹치는 시안을 다시 만든 뒤 보여 주세요.'},
 ja:{title:'デザイン方針の比較',lead:'案を見比べて1つ選んでください。組み合わせも可能です（例：Aのヒーローに Bの配色）。',concept:'コンセプト',type:'書体',palette:'配色',signature:'固有の要素',score:'AI感指数',quality:'基本品質の問題',ja:'日本語組版の問題',signals:'サイン',desktop:'デスクトップ',mobile:'モバイル',none:'なし',ask:'どの方針で進めるか選んでください：',surface:'地色',fonts:'計測した書体',warn:'案同士が似すぎています',sameSurface:'{a}と{b}の地色がほぼ同じです（{c}）。',sameFonts:'{a}と{b}が同じ書体の組み合わせです（{c}）。',allTinted:'すべての案が薄いオフホワイトの地色です。人が作ったサイトの多くは純白なので、少なくとも1つは純白かはっきりした色の地色にしてください。',redo:'警告があれば、重なっている案を作り直してから見せてください。'},
 en:{title:'Design directions',lead:'Compare the directions and pick one. Mixing is fine (for example A\'s hero with B\'s palette).',concept:'Concept',type:'Type',palette:'Palette',signature:'Signature element',score:'AI-look index',quality:'Baseline quality issues',ja:'Japanese typesetting issues',signals:'Signals',desktop:'Desktop',mobile:'Mobile',none:'none',ask:'Choose a direction: ',surface:'Surface',fonts:'Measured type',warn:'Directions are too alike',sameSurface:'{a} and {b} use nearly the same background ({c}).',sameFonts:'{a} and {b} use the same type pair ({c}).',allTinted:'Every direction sits on a faint off-white surface. Most human-made sites use plain white, so make at least one plain white or a clear colour.',redo:'If there is a warning, redo the overlapping direction before showing the sheet.'}
};

const hex=rgb=>rgb?'#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join(''):null;
// Near-white (#f7f7f7 and lighter, almost no tint) reads as plain white, the human default (70–87% of calibration sites).
const nearWhite=rgb=>Math.min(...rgb)>=247&&Math.max(...rgb)-Math.min(...rgb)<=8;
const tinted=rgb=>!!rgb&&!nearWhite(rgb)&&Math.max(...rgb)>=236&&Math.min(...rgb)>=200&&Math.max(...rgb)-Math.min(...rgb)<=45;

/** Pairs of directions that share a surface or a type pair, and whether none leaves the off-white default. */
export function directionWarnings(items){
 const w=[];
 for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
  const a=items[i],b=items[j];
  if(a.bg&&b.bg&&!(nearWhite(a.bg)&&nearWhite(b.bg))&&a.bg.every((v,k)=>Math.abs(v-b.bg[k])<=10))w.push({id:'same-surface',a:a.label,b:b.label,c:`${hex(a.bg)} / ${hex(b.bg)}`});
  if(a.fonts?.length&&b.fonts?.length&&a.fonts.slice(0,2).join('+')===b.fonts.slice(0,2).join('+'))w.push({id:'same-fonts',a:a.label,b:b.label,c:a.fonts.slice(0,2).join(' + ')});
 }
 if(items.length>=2&&items.every(d=>tinted(d.bg)))w.push({id:'all-tinted'});
 return w;
}
const warnText=(x,w)=>(w.id==='all-tinted'?x.allTinted:(w.id==='same-surface'?x.sameSurface:x.sameFonts).replace('{a}',w.a).replace('{b}',w.b).replace('{c}',w.c));

/** Markdown sheet for a chat reply or a README-style file. */
export function renderDirectionsMarkdown(items,lang='en',warnings=directionWarnings(items)){
 const x=L[lang]||L.en,lines=[`# ${x.title}`,'',x.lead,''];
 if(warnings.length)lines.push(`> **${x.warn}**`,...warnings.map(w=>`> - ${warnText(x,w)}`),`> ${x.redo}`,'');
 for(const d of items){
  lines.push(`## ${d.label}. ${d.note?.concept||d.file}`,'');
  for(const k of ['type','palette','signature'])if(d.note?.[k])lines.push(`- ${x[k]}: ${d.note[k]}`);
  if(d.bg||d.fonts?.length)lines.push(`- ${x.surface}: ${hex(d.bg)??'-'} · ${x.fonts}: ${d.fonts?.join(' + ')||'-'}`);
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
${d.bg||d.fonts?.length?`<dt>${x.surface}</dt><dd>${d.bg?`<span class="sw" style="background:${hex(d.bg)}"></span>${hex(d.bg)}`:'-'}</dd><dt>${x.fonts}</dt><dd>${esc(d.fonts?.join(' + ')||'-')}</dd>`:''}
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
<body><h1>${x.title}</h1><p class="lead">${x.lead}</p>${warnings.length?`<div class="warn" role="note"><b>${x.warn}</b><ul>${warnings.map(w=>`<li>${esc(warnText(x,w))}</li>`).join('')}</ul>${x.redo}</div>`:''}<main>${items.map(card).join('\n')}</main></body></html>
`;
}

/** Scans every .html mock in `dir` and writes DIRECTIONS.html and DIRECTIONS.md next to them. */
export async function compareDirections(dir,{lang='auto',timeoutMs=45000}={}){
 const root=path.resolve(dir);
 const files=(await fs.readdir(root)).filter(f=>/\.html?$/i.test(f)&&!f.startsWith(SHEET)).sort();
 if(files.length<2)throw new Error(`Put at least two .html mocks in ${dir} (found ${files.length}).`);
 const items=[];let sheetLang=lang==='auto'?null:lang;
 for(const [i,file] of files.entries()){
  const out=path.join(root,'_scans',file.replace(/\.html?$/i,''));
  const {result:r}=await scanUrl(path.join(root,file),{out,lang,compare:false,timeoutMs,keepRaw:true});
  sheetLang??=r.lang;
  const m=r.raw?.find(v=>v.viewport==='desktop')?.metrics??r.raw?.[0]?.metrics;delete r.raw;
  const rel=v=>path.relative(root,path.join(out,`scan-${v}.png`)).split(path.sep).join('/');
  items.push({label:String.fromCharCode(65+i),file,note:parseDirectionNote(await fs.readFile(path.join(root,file),'utf8')),
   score:r.aiLook.score,signals:r.aiLook.signals.filter(s=>s.weight>0).map(s=>s.title),
   bg:m?.rootBackground?.rgb??null,fonts:(m?.typography?.families??[]).filter(f=>f.count>=2).slice(0,2).map(f=>f.name),
   quality:r.quality.reduce((n,q)=>n+(q.count??0),0),ja:r.japanese?.japanese?r.japanese.issues.length:null,desktop:rel('desktop'),mobile:rel('mobile')});
 }
 const sheetLangKey=['ko','ja','en'].includes(sheetLang)?sheetLang:'en',warnings=directionWarnings(items);
 await fs.writeFile(path.join(root,`${SHEET}.html`),renderDirectionsHtml(items,sheetLangKey,warnings));
 await fs.writeFile(path.join(root,`${SHEET}.md`),renderDirectionsMarkdown(items,sheetLangKey,warnings));
 return {items,warnings,lang:sheetLangKey,html:path.join(root,`${SHEET}.html`),markdown:path.join(root,`${SHEET}.md`)};
}
