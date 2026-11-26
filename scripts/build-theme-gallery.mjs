import fs from 'node:fs/promises';

const dir=new URL('../skills/ui-refiner-agent/reference/themes/',import.meta.url);
const catalog=await fs.readFile(new URL('README.md',dir),'utf8');
// A theme's name carries its family and look, not a country: the country in its catalog row is where it was measured.
const archetypes={'photo-led':'photo','white quiet':'white','dark cinematic':'dark','standard corporate':'corporate','dense portal':'portal','big type':'bigtype'};
const familyTitles={place:'Place',care:'Care',business:'Business',public:'Public',shop:'Shop',creative:'Creative'};
// The gallery in three languages: index.html (English), index.ko.html, index.ja.html, each linking to the others.
const LANGS={
 en:{file:'index.html',name:'English',title:'Theme preview',
  intro:'Web design themes from <a href="https://github.com/prentice7725/ui-refiner">UI Refiner</a>, built from measurements of 2,326 Korean and Japanese sites. The businesses, people, figures and photographs in the samples are all made up.',
  families:{place:'Lodging, travel & dining',care:'Medical & care',business:'Business',shop:'Shopping',public:'Public & information',creative:'Creative & studio'},
  styles:{photo:'Photo-led',white:'White and quiet',dark:'Dark cinematic',corporate:'Standard corporate',portal:'Dense portal',bigtype:'Big type'},
  effects:{'hero-slides':'slides','hero-video':'video','reveal':'scroll reveal','header-blur':'header blur','marquee':'marquee','intro':'intro'},
  measured:(country,n)=>`Measured on ${n} ${country==='KR'?'Korean':'Japanese'} sites`,needsPhotos:'needs the client’s photographs',
  effectsLabel:'Effects',seeEffects:'see them on',trade:'Trade',all:'All',photos:'Client photos',hasPhotos:'Has photos · show all',noPhotos:'No photos · hide themes that need them',
  count:'n+" themes"',none:'No theme matches. Change the trade or photo filter.',list:'Themes',language:'Language'},
 ko:{file:'index.ko.html',name:'한국어',title:'테마 미리보기',
  intro:'한국·일본 사이트 2,326곳을 실측해 만든 <a href="https://github.com/prentice7725/ui-refiner">UI Refiner</a>의 웹 디자인 테마입니다. 견본 속 업체, 사람, 숫자와 사진은 모두 지어낸 것입니다.',
  families:{place:'숙박·관광·외식',care:'의료·케어',business:'기업',shop:'쇼핑',public:'공공·정보',creative:'창작·스튜디오'},
  styles:{photo:'사진 중심',white:'밝은 여백',dark:'어두운 시네마틱',corporate:'기업 표준형',portal:'정보 밀집형',bigtype:'대형 타이포그래피'},
  effects:{'hero-slides':'슬라이드','hero-video':'영상','reveal':'스크롤 등장','header-blur':'헤더 블러','marquee':'마키','intro':'인트로'},
  measured:(country,n)=>`${country==='KR'?'한국':'일본'} 사이트 ${n}곳 실측`,needsPhotos:'고객 사진 필요',
  effectsLabel:'효과',seeEffects:'효과 켜고 보기',trade:'업종',all:'전체',photos:'고객 사진',hasPhotos:'사진 있음 · 전체 보기',noPhotos:'사진 없음 · 사진 필수 테마 제외',
  count:'"테마 "+n+"개"',none:'조건에 맞는 테마가 없습니다. 업종 또는 사진 조건을 변경해 주세요.',list:'테마 목록',language:'언어'},
 ja:{file:'index.ja.html',name:'日本語',title:'テーマのプレビュー',
  intro:'韓国と日本のサイト2,326件を実測して作った<a href="https://github.com/prentice7725/ui-refiner">UI Refiner</a>のWebデザインテーマです。見本に登場する事業者、人物、数字、写真はすべて架空のものです。',
  families:{place:'宿泊・観光・飲食',care:'医療・介護',business:'企業',shop:'ショッピング',public:'公共・情報',creative:'クリエイティブ・スタジオ'},
  styles:{photo:'写真中心',white:'明るい余白',dark:'ダークシネマティック',corporate:'企業標準型',portal:'情報密集型',bigtype:'大型タイポグラフィ'},
  effects:{'hero-slides':'スライド','hero-video':'動画','reveal':'スクロール表示','header-blur':'ヘッダーぼかし','marquee':'マーキー','intro':'イントロ'},
  measured:(country,n)=>`${country==='KR'?'韓国':'日本'}のサイト${n}件を実測`,needsPhotos:'顧客の写真が必要',
  effectsLabel:'エフェクト',seeEffects:'エフェクトを見る',trade:'業種',all:'すべて',photos:'顧客の写真',hasPhotos:'写真あり・すべて表示',noPhotos:'写真なし・写真が必要なテーマを除く',
  count:'"テーマ"+n+"件"',none:'条件に合うテーマがありません。業種か写真の条件を変えてください。',list:'テーマ一覧',language:'言語'}
};
// The effects a theme offers (theme.md, "Effects"), and the address that turns them on in its sample, when it has one.
async function effectsOf(id){
 const md=await fs.readFile(new URL(id+'/theme.md',dir),'utf8'),sample=await fs.readFile(new URL(id+'/sample.html',dir),'utf8');
 const offer=/\*\*Offer\*\*[^:]*:(.*)/.exec(md);
 const names=offer?[...offer[1].matchAll(/`([a-z-]+)`/g)].map(m=>m[1]):[];
 const demo=/try (\?fx=[a-z,-]+)/.exec(sample);
 return {names,demo:demo?demo[1]:null};
}
const themes=[];
const previews=Object.fromEntries(Object.keys(familyTitles).map(f=>[f,[]]));
for(const line of catalog.split(/\r?\n/).filter(line=>line.startsWith('| `'))){
 const row=/^\| `(([a-z]+)-[a-z]+(?:-[a-z]+)?)` \| (KR|JP) · [^·]+ · ([a-z& -]+?)(?:;[^|]*)? \| (\d+) \|$/.exec(line);
 if(!row)throw Error('Invalid theme row: '+line);
 const [,id,family,country,archetype,count]=row,style=archetypes[archetype];
 if(!familyTitles[family]||!style)throw Error('Unknown theme: '+line);
 for(const asset of ['sample.html','shot-desktop.jpg','shot-mobile.jpg','theme.md'])await fs.access(new URL(id+'/'+asset,dir));
 const fx=await effectsOf(id);
 previews[family].push(`### [${id}](${id}/theme.md)

Measured on ${count} ${country==='KR'?'Korean':'Japanese'} sites.
${fx.names.length?`
Effects offered: ${fx.names.map(n=>'`'+n+'`').join(', ')}${fx.demo?` (open \`sample.html${fx.demo}\` from a checkout to see them)`:''}.
`:''}
| Desktop | Mobile |
| --- | --- |
| ![${id} desktop](${id}/shot-desktop.jpg) | ![${id} mobile](${id}/shot-mobile.jpg) |`);
 themes.push({id,family,country,style,count,fx,photo:['photo','dark'].includes(style)});
}
if(!themes.length)throw Error('Theme catalog is empty');
const options=entries=>Object.entries(entries).map(([key,value])=>`<option value="${key}">${value}</option>`).join('');
const page=lang=>{
 const t=LANGS[lang];
 const cards=themes.map(({id,family,country,style,count,fx,photo})=>`<article data-family="${family}" data-photo="${photo}">
<a href="${id}/sample.html"><img loading="lazy" src="${id}/shot-desktop.jpg" alt=""><div><small>${t.families[family]}</small><h2>${t.styles[style]}</h2><span>${id} ↗</span></div></a>
<p>${t.measured(country,count)}${photo?' · '+t.needsPhotos:''}</p>${fx.names.length?`<p class="fx">${t.effectsLabel}: ${fx.names.map(n=>t.effects[n]||n).join(' · ')}${fx.demo?` · <a href="${id}/sample.html${fx.demo}">${t.seeEffects}</a>`:''}</p>`:''}</article>`);
 const alternates=Object.entries(LANGS).map(([code,l])=>`<link rel="alternate" hreflang="${code}" href="${l.file}">`).join('');
 const nav=Object.entries(LANGS).map(([code,l])=>`<a href="${l.file}" lang="${code}" hreflang="${code}"${code===lang?' aria-current="page"':''}>${l.name}</a>`).join(' ');
 return `<!doctype html>
<html lang="${lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t.title} · UI Refiner</title>${alternates}<style>
*{box-sizing:border-box}body{margin:auto;max-width:90rem;padding:clamp(1rem,4vw,4rem);background:#f7f7f4;color:#18241f;font:1rem/1.5 system-ui,sans-serif}h1{font-size:clamp(2rem,5vw,4rem);letter-spacing:-.055em;margin:0 0 1.2rem}form{display:flex;gap:1rem;flex-wrap:wrap;border-block:1px solid #aeb7af;padding:1rem 0}label{display:grid;gap:.25rem}select{padding:.55rem;color:inherit;font:inherit}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:1.5rem}article{background:white;border:1px solid #ccd3ce}article img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top}article div,article p{padding:0 1rem}article div{margin-top:.8rem}a{color:inherit;text-decoration:none}a:focus-visible{outline:3px solid #15613a;outline-offset:2px}article a{display:block}a:hover h2{text-decoration:underline}h2{margin:.15rem 0}small,span,article p{color:#405149}article .fx a,.intro a{color:inherit;text-decoration:underline;text-underline-offset:.2em}.intro{max-width:44rem;margin:0 0 1.5rem;color:#405149}.lang{display:flex;gap:1rem;justify-content:flex-end;margin:0 0 1rem;font-size:.9rem}.lang a{color:#405149}.lang a[aria-current]{color:inherit;font-weight:600;text-decoration:underline;text-underline-offset:.2em}:lang(ko){font-family:"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",system-ui,sans-serif}:lang(ja){font-family:"Hiragino Sans","Yu Gothic UI","Yu Gothic",Meiryo,"Noto Sans JP",system-ui,sans-serif}
</style><nav class="lang" aria-label="${t.language}">${nav}</nav><main><h1>${t.title}</h1>
<p class="intro">${t.intro}</p>
<form><label>${t.trade}<select name="family"><option value="">${t.all}</option>${options(t.families)}</select></label>
<label>${t.photos}<select name="photo"><option value="">${t.hasPhotos}</option><option value="false">${t.noPhotos}</option></select></label></form>
<p role="status" id="status"></p><section aria-label="${t.list}">${cards.join('\n')}</section></main>
<script>
const form=document.querySelector('form');
function filter(){
 const selected=new FormData(form);
 let n=0;
 for(const card of document.querySelectorAll('article')){
  card.hidden=Array.from(selected).some(([key,value])=>value && card.dataset[key]!==value);
  if(!card.hidden)n++;
 }
 document.getElementById('status').textContent=n?${t.count}:${JSON.stringify(t.none)};
}
form.addEventListener('change',filter);
filter();
</script></html>
`;
};
const markdown=`# Theme gallery

Themes are grouped by what a visitor comes to do. Each was measured in Korea or Japan and can be used for either.

${Object.entries(familyTitles).map(([f,title])=>`[${title}](#${f})`).join(' · ')}

${Object.entries(familyTitles).filter(([f])=>previews[f].length).map(([f,title])=>`## ${title}\n\n${previews[f].join('\n\n')}`).join('\n\n')}
`;
for(const [file,content] of [...Object.keys(LANGS).map(lang=>[LANGS[lang].file,page(lang)]),['GALLERY.md',markdown]]){
 const target=new URL(file,dir);
 if(process.argv.includes('--check')){
  const actual=await fs.readFile(target,'utf8').then(text=>text.replaceAll('\r\n','\n'),()=>null);
  if(actual!==content)throw Error('Refresh '+file+' with node scripts/build-theme-gallery.mjs');
 }else await fs.writeFile(target,content);
}
