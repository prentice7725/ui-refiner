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
 ko:{title:'디자인 방향 비교',lead:'시안을 비교하고 하나를 고르세요. 섞어도 됩니다(예: A의 히어로에 B의 색).',concept:'콘셉트',type:'서체',palette:'색',signature:'고유 요소',score:'AI 티 지수',quality:'기본 품질 문제',ja:'일본어 조판 문제',signals:'신호',desktop:'데스크톱',mobile:'모바일',none:'없음',ask:'어느 방향으로 갈지 정해 주세요: '},
 ja:{title:'デザイン方針の比較',lead:'案を見比べて1つ選んでください。組み合わせも可能です（例：Aのヒーローに Bの配色）。',concept:'コンセプト',type:'書体',palette:'配色',signature:'固有の要素',score:'AI感指数',quality:'基本品質の問題',ja:'日本語組版の問題',signals:'サイン',desktop:'デスクトップ',mobile:'モバイル',none:'なし',ask:'どの方針で進めるか選んでください：'},
 en:{title:'Design directions',lead:'Compare the directions and pick one. Mixing is fine (for example A\'s hero with B\'s palette).',concept:'Concept',type:'Type',palette:'Palette',signature:'Signature element',score:'AI-look index',quality:'Baseline quality issues',ja:'Japanese typesetting issues',signals:'Signals',desktop:'Desktop',mobile:'Mobile',none:'none',ask:'Choose a direction: '}
};

/** Markdown sheet for a chat reply or a README-style file. */
export function renderDirectionsMarkdown(items,lang='en'){
 const x=L[lang]||L.en,lines=[`# ${x.title}`,'',x.lead,''];
 for(const d of items){
  lines.push(`## ${d.label}. ${d.note?.concept||d.file}`,'');
  for(const k of ['type','palette','signature'])if(d.note?.[k])lines.push(`- ${x[k]}: ${d.note[k]}`);
  lines.push(`- ${x.score}: ${d.score}/100 · ${x.quality}: ${d.quality}${d.ja!=null?` · ${x.ja}: ${d.ja}`:''}`);
  if(d.signals.length)lines.push(`- ${x.signals}: ${d.signals.join(', ')}`);
  lines.push(`- ${x.desktop}: [${d.desktop}](${d.desktop}) · ${x.mobile}: [${d.mobile}](${d.mobile})`,'');
 }
 lines.push(x.ask+items.map(d=>d.label).join(' / '));
 return lines.join('\n')+'\n';
}

/** Self-contained HTML sheet with the screenshots side by side (relative image paths). */
export function renderDirectionsHtml(items,lang='en'){
 const x=L[lang]||L.en;
 const card=d=>`<article><header><b>${esc(d.label)}</b><h2>${esc(d.note?.concept||d.file)}</h2></header>
<dl>${['type','palette','signature'].filter(k=>d.note?.[k]).map(k=>`<dt>${x[k]}</dt><dd>${esc(d.note[k])}</dd>`).join('')}
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
.scroll{height:520px;overflow:auto;border:1px solid var(--line);border-radius:6px;background:#fff}.scroll img{display:block;width:100%;height:auto}</style></head>
<body><h1>${x.title}</h1><p class="lead">${x.lead}</p><main>${items.map(card).join('\n')}</main></body></html>
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
  const {result:r}=await scanUrl(path.join(root,file),{out,lang,compare:false,timeoutMs});
  sheetLang??=r.lang;
  const rel=v=>path.relative(root,path.join(out,`scan-${v}.png`)).split(path.sep).join('/');
  items.push({label:String.fromCharCode(65+i),file,note:parseDirectionNote(await fs.readFile(path.join(root,file),'utf8')),
   score:r.aiLook.score,signals:r.aiLook.signals.filter(s=>s.weight>0).map(s=>s.title),
   quality:r.quality.reduce((n,q)=>n+(q.count??0),0),ja:r.japanese?.japanese?r.japanese.issues.length:null,desktop:rel('desktop'),mobile:rel('mobile')});
 }
 const sheetLangKey=['ko','ja','en'].includes(sheetLang)?sheetLang:'en';
 await fs.writeFile(path.join(root,`${SHEET}.html`),renderDirectionsHtml(items,sheetLangKey));
 await fs.writeFile(path.join(root,`${SHEET}.md`),renderDirectionsMarkdown(items,sheetLangKey));
 return {items,lang:sheetLangKey,html:path.join(root,`${SHEET}.html`),markdown:path.join(root,`${SHEET}.md`)};
}
