// Japanese typesetting checks for rendered pages. Advisory: they explain readability problems,
// they never block. collectJaTypography runs inside the page and must stay self-contained.
export function collectJaTypography(){
 const kana=/[ぁ-ヿ]/g,jaChar=/[ぁ-ヿ㐀-鿿ｦ-ﾟ]/g;
 const body=(document.body.innerText||'').slice(0,40000),letters=body.replace(/\s/g,'');
 const kanaCount=(body.match(kana)||[]).length,jaCount=(body.match(jaChar)||[]).length;
 const result={japanese:kanaCount>=20&&jaCount/Math.max(1,letters.length)>=.15,kanaCount,jaRatio:+(jaCount/Math.max(1,letters.length)).toFixed(2),lang:document.documentElement.lang||null};
 if(!result.japanese)return result;
 const sel=el=>{const parts=[];for(let n=el;n&&n!==document.body&&parts.length<4;n=n.parentElement){let p=n.tagName.toLowerCase();if(n.id){parts.unshift(p+'#'+CSS.escape(n.id));break;}const c=[...n.classList].slice(0,2).map(x=>'.'+CSS.escape(x)).join('');parts.unshift(p+c);}return parts.join(' > ');};
 const ownText=el=>[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('');
 const hasJa=t=>/[ぁ-ヿ㐀-鿿]/.test(t);
 const els=[...document.querySelectorAll('body *')].slice(0,8000).filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&hasJa(ownText(el));});
 // Families that actually contain Japanese glyphs. Anything else means the OS picks a fallback per device.
 const jaFonts=/noto (sans|serif) (jp|cjk)|hiragino|ヒラギノ|yu ?gothic|yu ?mincho|游ゴシック|游明朝|meiryo|メイリオ|ms ?p?gothic|ms ?p?mincho|ｍｓ|biz ud|m plus|zen |kosugi|sawarabi|source han|源ノ|shippori|murecho|line seed jp|ibm plex sans jp|kaisei|klee|dela gothic|rocknroll|mochiy|kiwi maru|hina mincho|yomogi|potta|morisawa|新ゴ|リュウミン|a1ゴシック|a-otf|fot-|tbud|udshingo|ryumin|toppan|ipa[ex]?(gothic|mincho)|takao|vl gothic|sazanami|osaka|kozuka|小塚|tsukushi|筑紫|pretendard jp|jp$/i;
 const stack=el=>getComputedStyle(el).fontFamily;
 const noJaFont=els.filter(el=>!stack(el).split(',').some(f=>jaFonts.test(f.replace(/["']/g,'').trim())));
 const stacks=new Map();for(const el of noJaFont){const s=stack(el);stacks.set(s,(stacks.get(s)||0)+1);}
 // Body text: Japanese reads best around 1.6–2.0 line height.
 // Body-size copy only: display subheads (20px+) are set tighter on purpose.
 const paragraphs=els.filter(el=>el.matches('p,li,dd,td,blockquote,figcaption')&&parseFloat(getComputedStyle(el).fontSize)<20&&(el.innerText||'').replace(/\s/g,'').length>=40);
 const lh=el=>{const s=getComputedStyle(el),size=parseFloat(s.fontSize);return s.lineHeight==='normal'?null:parseFloat(s.lineHeight)/size;};
 const tight=paragraphs.filter(el=>{const v=lh(el);return v!==null&&v<1.45;});
 const normalLh=paragraphs.filter(el=>lh(el)===null);
 const italic=els.filter(el=>/italic|oblique/.test(getComputedStyle(el).fontStyle));
 const tiny=els.filter(el=>parseFloat(getComputedStyle(el).fontSize)<12&&!el.closest('footer,small,sup,sub,[role=contentinfo],[class*=copyright],[class*=footer]'));
 const tracking=els.filter(el=>{const s=getComputedStyle(el),ls=parseFloat(s.letterSpacing);return Number.isFinite(ls)&&ls/parseFloat(s.fontSize)<=-.02;});
 const halfKana=els.filter(el=>/[ｦ-ﾟ]/.test(ownText(el)));
 const fullAlnum=els.filter(el=>/[０-９Ａ-Ｚａ-ｚ]{2,}/.test(ownText(el)));
 // Headings: a last line holding one or two characters (泣き別れ) and naive break-all.
 // Visually hidden or clipped headings break per character and would read as false orphans.
 const shown=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>=parseFloat(s.fontSize)*3&&s.textOverflow!=='ellipsis'&&!/rect\(/.test(s.clip)&&s.clipPath==='none';};
 const headings=els.filter(el=>(el.matches('h1,h2,h3')||parseFloat(getComputedStyle(el).fontSize)>=24)&&shown(el));
 const orphans=[],breakAll=[];let phraseAware=0;
 for(const el of new Set(headings.map(h=>h.closest('h1,h2,h3')||h))){
  const s=getComputedStyle(el);
  if(s.wordBreak==='break-all')breakAll.push(el);
  if(s.wordBreak==='auto-phrase'||/balance|pretty/.test(s.textWrap||s.textWrapStyle||''))phraseAware++;
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),lines=new Map();let n,count=0;
  while((n=walker.nextNode())&&count<240)for(let i=0;i<n.textContent.length&&count<240;i++){
   const ch=n.textContent[i];if(/\s/.test(ch))continue;count++;
   const range=document.createRange();range.setStart(n,i);range.setEnd(n,i+1);const r=range.getClientRects()[0];if(!r)continue;
   const key=Math.round(r.top/4);if(!lines.has(key))lines.set(key,'');lines.set(key,lines.get(key)+ch);
  }
  const rows=[...lines.entries()].sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  const last=rows.at(-1)?.replace(/[。、．，！？!?」』）)・…ー]/g,'')||'';
  if(rows.length>=2&&last.length>0&&last.length<=2&&hasJa(rows.at(-1)))orphans.push({target:sel(el),lastLine:rows.at(-1),lines:rows.length});
 }
 const sample=list=>list.slice(0,6).map(sel);
 return {...result,textElements:els.length,
  fontFallback:{count:noJaFont.length,ratio:+(noJaFont.length/Math.max(1,els.length)).toFixed(2),stacks:[...stacks].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([stack,count])=>({stack,count})),targets:sample(noJaFont)},
  lineHeight:{paragraphs:paragraphs.length,tight:tight.length,normal:normalLh.length,values:[...new Set(tight.map(el=>+lh(el).toFixed(2)))].slice(0,5),targets:sample(tight)},
  italic:{count:italic.length,targets:sample(italic)},tiny:{count:tiny.length,targets:sample(tiny)},tracking:{count:tracking.length,targets:sample(tracking)},
  orphans:{count:orphans.length,headings:headings.length,examples:orphans.slice(0,6)},breakAll:{count:breakAll.length,targets:sample(breakAll)},phraseAware,
  halfWidthKana:{count:halfKana.length,targets:sample(halfKana)},fullWidthAlnum:{count:fullAlnum.length,targets:sample(fullAlnum)}
 };
}

const copy={
 'ja-font-fallback':{ja:['和文書体が指定されていない','font-familyに日本語を含む書体がなく、端末ごとに別のフォールバック書体（Windowsでは游ゴシックやMSゴシック等）で表示される。AI生成の「Inter, sans-serif」指定でよく起きる。','欧文書体の後ろに和文書体を明示する（例：Inter, "Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", sans-serif）。ブランドに合う和文Webフォントの採用も検討する。'],ko:['일본어 서체가 지정되지 않음','font-family에 일본어 글리프가 있는 서체가 없어 기기마다 다른 대체 서체로 보인다. AI가 만든 "Inter, sans-serif" 지정에서 흔하다.','영문 서체 뒤에 일본어 서체를 명시한다(예: Inter, "Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", sans-serif).'],en:['No Japanese typeface specified','The font stack has no family with Japanese glyphs, so each OS substitutes its own fallback. Common with AI-generated "Inter, sans-serif" stacks.','Name a Japanese family after the Latin one (e.g. Inter, "Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", sans-serif).']},
 'ja-line-height':{ja:['本文の行間が狭い','日本語は字面が大きく、行間が1.45未満だと長文が詰まって読みにくい。','本文はline-height 1.7〜2.0を目安に。見出しは1.3〜1.5。'],ko:['일본어 본문 행간이 좁음','일본어는 글자면이 커서 1.45 미만 행간은 긴 글이 답답하다.','본문 line-height 1.7~2.0, 제목 1.3~1.5.'],en:['Tight Japanese body line height','Japanese glyphs fill the em box; below 1.45 long text feels cramped.','Use line-height 1.7–2.0 for body text and 1.3–1.5 for headings.']},
 'ja-orphans':{ja:['見出しの泣き別れ（最終行が1〜2文字）','単語の途中や1〜2文字だけが次の行に落ち、AIが組んだ未調整の見出しに見える。','見出しにword-break: auto-phrase（Chrome）やBudouX、<wbr>で文節改行し、text-wrap: balanceで行長を揃える。'],ko:['제목 마지막 줄에 1~2글자만 남음','단어 중간이나 1~2글자만 다음 줄로 떨어져 다듬지 않은 제목으로 보인다.','word-break: auto-phrase(Chrome)나 BudouX, <wbr>로 문절 단위 줄바꿈을 하고 text-wrap: balance를 쓴다.'],en:['Heading orphans (last line of 1–2 characters)','A word splits or one or two characters drop to a new line; the heading looks unadjusted.','Break at phrases with word-break: auto-phrase (Chrome), BudouX or <wbr>, and balance lines with text-wrap: balance.']},
 'ja-break-all':{ja:['見出しにword-break: break-all','文節を無視してどこでも改行され、読みのまとまりが崩れる。','見出しはword-break: auto-phraseかkeep-all＋<wbr>に。break-allはURLなど長い英数字だけに。'],ko:['제목에 word-break: break-all','문절을 무시하고 아무 곳에서나 줄이 바뀐다.','제목은 auto-phrase 또는 keep-all + <wbr>. break-all은 URL 같은 긴 영숫자에만.'],en:['word-break: break-all on headings','Lines break anywhere, ignoring phrase boundaries.','Use auto-phrase or keep-all with <wbr> for headings; keep break-all for long URLs.']},
 'ja-italic':{ja:['日本語の斜体','和文書体に斜体はなく、ブラウザが機械的に傾けた汚い字形になる。','強調は太さ・色・傍点（text-emphasis）で。斜体は欧文だけに。'],ko:['일본어에 기울임꼴','일본어 서체에는 이탤릭이 없어 브라우저가 억지로 기울인다.','강조는 굵기·색·방점(text-emphasis)으로.'],en:['Italic Japanese text','Japanese fonts have no italics; the browser fakes a slant.','Emphasize with weight, color or text-emphasis; keep italics for Latin text.']},
 'ja-tracking':{ja:['日本語の字間を詰めすぎ','欧文向けのtracking-tight（負の字間）を和文に当てると文字がぶつかる。','和文は0〜0.05em程度。詰めるならfont-feature-settings: "palt"で約物だけを詰める。'],ko:['일본어 자간을 너무 좁힘','영문용 음수 자간을 일본어에 적용하면 글자가 부딪힌다.','일본어는 0~0.05em. 좁히려면 font-feature-settings: "palt".'],en:['Negative tracking on Japanese','Latin-style tight tracking makes Japanese glyphs collide.','Keep 0–0.05em; use font-feature-settings: "palt" to tighten punctuation only.']},
 'ja-tiny':{ja:['12px未満の日本語','画数の多い漢字が潰れて読めない。','日本語は最小12px、本文は15〜16px以上に。'],ko:['12px 미만 일본어','획이 많은 한자가 뭉개진다.','최소 12px, 본문 15~16px 이상.'],en:['Japanese text under 12px','Dense kanji become illegible.','Minimum 12px; 15–16px+ for body text.']},
 'ja-half-kana':{ja:['半角カナ','半角カナは古いシステムの印象を与え、読み上げや検索でも不利。','全角カナに統一する。'],ko:['반각 가나','오래된 시스템 인상을 주고 검색·낭독에 불리하다.','전각 가나로 통일한다.'],en:['Half-width katakana','Looks legacy and hurts search and screen readers.','Use full-width katakana.']},
 'ja-full-alnum':{ja:['全角英数字','全角英数字は字幅が不揃いになり、検索やコピーでも扱いにくい。','英数字は半角に統一する。'],ko:['전각 영숫자','폭이 들쭉날쭉하고 검색·복사에 불리하다.','영숫자는 반각으로 통일한다.'],en:['Full-width alphanumerics','Uneven widths; awkward for search and copy.','Use half-width letters and digits.']}
};

export const jaIssueTitle=(id,lang='ko')=>copy[id]?.[['ja','en'].includes(lang)?lang:'ko'][0];

export function evaluateJaTypography(m,{lang='ko'}={}){
 if(!m?.japanese)return {japanese:false,issues:[]};
 const L=['ja','en'].includes(lang)?lang:'ko',issues=[];
 const add=(id,severity,evidence,targets=[])=>{const [title,why,fix]=copy[id][L];issues.push({id,severity,title,why,fix,evidence,targets});};
 if(m.fontFallback.ratio>=.5)add('ja-font-fallback','high',{elements:m.fontFallback.count,ratio:m.fontFallback.ratio,stacks:m.fontFallback.stacks.map(s=>s.stack)},m.fontFallback.targets);
 if(m.lineHeight.tight>=2||m.lineHeight.paragraphs&&m.lineHeight.tight/m.lineHeight.paragraphs>=.3)add('ja-line-height','medium',{tight:m.lineHeight.tight,paragraphs:m.lineHeight.paragraphs,values:m.lineHeight.values},m.lineHeight.targets);
 if(m.orphans.count)add('ja-orphans',m.orphans.count>=2?'medium':'low',{orphans:m.orphans.count,headings:m.orphans.headings,examples:m.orphans.examples.map(o=>o.lastLine)},m.orphans.examples.map(o=>o.target));
 if(m.breakAll.count)add('ja-break-all','medium',{count:m.breakAll.count},m.breakAll.targets);
 if(m.italic.count)add('ja-italic','medium',{count:m.italic.count},m.italic.targets);
 if(m.tracking.count>=2)add('ja-tracking','low',{count:m.tracking.count},m.tracking.targets);
 if(m.tiny.count>=5)add('ja-tiny','low',{count:m.tiny.count},m.tiny.targets);
 if(m.halfWidthKana.count)add('ja-half-kana','low',{count:m.halfWidthKana.count},m.halfWidthKana.targets);
 if(m.fullWidthAlnum.count>=3)add('ja-full-alnum','low',{count:m.fullWidthAlnum.count},m.fullWidthAlnum.targets);
 const rank={high:0,medium:1,low:2};issues.sort((a,b)=>rank[a.severity]-rank[b.severity]);
 return {japanese:true,jaRatio:m.jaRatio,lang:m.lang,phraseAwareHeadings:m.phraseAware,issues};
}
