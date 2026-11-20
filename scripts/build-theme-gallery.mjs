import fs from 'node:fs/promises';

const dir=new URL('../skills/ui-refiner-agent/reference/themes/',import.meta.url);
const catalog=await fs.readFile(new URL('README.md',dir),'utf8');
const families={place:'숙박·관광·외식',care:'의료·케어',business:'기업',shop:'쇼핑',public:'공공·정보',creative:'창작·스튜디오'};
const styles={photo:'사진 중심',white:'밝은 여백',dark:'어두운 시네마틱',corporate:'기업 표준형',portal:'정보 밀집형',bigtype:'대형 타이포그래피'};
const countries={kr:'한국',jp:'일본'};
const cards=[];
const previews={kr:[],jp:[]};
for(const line of catalog.split(/\r?\n/).filter(line=>line.startsWith('| `'))){
 const row=/^\| `([a-z]+)-([a-z]+)-([a-z]+)` \| [^|]+ \| (\d+) \|$/.exec(line);
 if(!row)throw Error('Invalid theme row: '+line);
 const [,country,family,style,count]=row;
 if(!countries[country]||!families[family]||!styles[style])throw Error('Unknown theme: '+line);
 const id=[country,family,style].join('-');
 for(const asset of ['sample.html','shot-desktop.png','shot-mobile.png','theme.md'])await fs.access(new URL(id+'/'+asset,dir));
 previews[country].push(`### [${id}](${id}/theme.md)

| Desktop | Mobile |
| --- | --- |
| ![${id} desktop](${id}/shot-desktop.png) | ![${id} mobile](${id}/shot-mobile.png) |`);
 const photo=['photo','dark'].includes(style);
 cards.push(`<article data-country="${country}" data-family="${family}" data-photo="${photo}">
<a href="${id}/sample.html"><img loading="lazy" src="${id}/shot-desktop.png" alt=""><div><small>${countries[country]} / ${families[family]}</small><h2>${styles[style]}</h2><span>${id} ↗</span></div></a>
<p>실측 ${count}곳${photo?' · 고객 사진 필요':''}</p></article>`);
}
if(!cards.length)throw Error('Theme catalog is empty');
const options=entries=>Object.entries(entries).map(([key,value])=>`<option value="${key}">${value}</option>`).join('');
const html=`<!doctype html>
<html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>테마 미리보기 · UI Refiner</title><style>
*{box-sizing:border-box}body{margin:auto;max-width:90rem;padding:clamp(1rem,4vw,4rem);background:#f7f7f4;color:#18241f;font:1rem/1.5 system-ui,sans-serif}h1{font-size:clamp(2rem,5vw,4rem);letter-spacing:-.055em;margin:0 0 1.2rem}form{display:flex;gap:1rem;flex-wrap:wrap;border-block:1px solid #aeb7af;padding:1rem 0}label{display:grid;gap:.25rem}select{padding:.55rem;color:inherit;font:inherit}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:1.5rem}article{background:white;border:1px solid #ccd3ce}article img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top}article div,article p{padding:0 1rem}article div{margin-top:.8rem}a{color:inherit;text-decoration:none}a:focus-visible{outline:3px solid #15613a;outline-offset:2px}article a{display:block}a:hover h2{text-decoration:underline}h2{margin:.15rem 0}small,span,article p{color:#405149}
</style><main><h1>테마 미리보기</h1>
<form><label>국가<select name="country"><option value="">전체</option>${options(countries)}</select></label>
<label>업종<select name="family"><option value="">전체</option>${options(families)}</select></label>
<label>고객 사진<select name="photo"><option value="">사진 있음 · 전체 보기</option><option value="false">사진 없음 · 사진 필수 테마 제외</option></select></label></form>
<p role="status" id="status">테마 ${cards.length}개</p><section aria-label="테마 목록">${cards.join('\n')}</section></main>
<script>
const form=document.querySelector('form');
function filter(){
 const selected=new FormData(form);
 let count=0;
 for(const card of document.querySelectorAll('article')){
  card.hidden=Array.from(selected).some(([key,value])=>value && card.dataset[key]!==value);
  if(!card.hidden)count++;
 }
 document.getElementById('status').textContent=count?'테마 '+count+'개':'조건에 맞는 테마가 없습니다. 국가, 업종 또는 사진 조건을 변경해 주세요.';
}
form.addEventListener('change',filter);
filter();
</script></html>
`;
const markdown=`# Theme gallery

[Korea](#korea) · [Japan](#japan)

## Korea

${previews.kr.join('\n\n')}

## Japan

${previews.jp.join('\n\n')}
`;
for(const [file,content] of [['index.html',html],['GALLERY.md',markdown]]){
 const target=new URL(file,dir);
 if(process.argv.includes('--check')){
  const actual=(await fs.readFile(target,'utf8')).replaceAll('\r\n','\n');
  if(actual!==content)throw Error('Refresh '+file+' with node scripts/build-theme-gallery.mjs');
 }else await fs.writeFile(target,content);
}
