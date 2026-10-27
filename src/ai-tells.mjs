// Rendered "AI-made look" signals. Heuristics for design review only: never enforced, never baselined.
// collectAiTells runs inside the page (page.evaluate) and must stay self-contained.
import {jaSignals} from './ja-copy.mjs';

export function collectAiTells(){
 const limit=8000,all=[...document.querySelectorAll('body *')];
 const visible=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});};
 const els=all.slice(0,limit).filter(visible),style=new Map(els.map(el=>[el,getComputedStyle(el)]));
 const css=el=>style.get(el)||getComputedStyle(el);
 const sel=el=>{const parts=[];for(let n=el;n&&n!==document.body&&parts.length<4;n=n.parentElement){let p=n.tagName.toLowerCase();if(n.id){parts.unshift(p+'#'+CSS.escape(n.id));break;}const c=[...n.classList].slice(0,2).map(x=>'.'+CSS.escape(x)).join('');parts.unshift(p+c);}return parts.join(' > ');};
 const sample=list=>list.slice(0,8).map(sel);
 const rgba=v=>{const m=String(v).match(/rgba?\(([^)]+)\)/);if(!m)return null;const n=m[1].split(/[\s,/]+/).filter(Boolean).map(Number);return n.length>=3?[n[0],n[1],n[2],n[3]??1]:null;};
 const hsl=([r,g,b])=>{r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;if(d<.08)return {h:null,s:0,l};const s=d/(1-Math.abs(2*l-1));let h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360;return {h,s,l};};
 const colorsIn=v=>(String(v).match(/rgba?\([^)]+\)/g)||[]).map(rgba).filter(Boolean);
 const purple=c=>{const x=hsl(c);return x.h!==null&&x.s>.3&&x.h>=230&&x.h<=330;};
 const lum=([r,g,b])=>[r,g,b].map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
 const area=el=>{const r=el.getBoundingClientRect();return r.width*r.height;};
 const page=Math.max(1,document.documentElement.scrollWidth*Math.max(innerHeight,document.documentElement.scrollHeight));
 const boxy=el=>{const s=css(el),bg=rgba(s.backgroundColor),pbg=el.parentElement?rgba(css(el.parentElement).backgroundColor):null;return s.boxShadow!=='none'||parseFloat(s.borderTopWidth)>0&&(rgba(s.borderTopColor)?.[3]??0)>.05||(bg&&bg[3]>.02&&(!pbg||bg.some((n,i)=>Math.abs(n-pbg[i])>3)))||s.backgroundImage!=='none';};
 // Decorative graphics (illustrations, aria-hidden art, svg internals) are crafted on purpose; judge only surfaces behind real text.
 const graphic=el=>!!el.closest('svg,[aria-hidden="true"],canvas,picture,video,[role=img],[class*=graphic],[class*=illustration]');
 const pinned=el=>{for(let n=el;n&&n!==document.body;n=n.parentElement)if(['fixed','sticky'].includes(css(n).position))return true;return false;};
 const hasText=el=>(el.innerText||'').trim().length>=12;
 // Gradients, gradient text, glass, glow.
 const gradients=els.filter(el=>/gradient\(/.test(css(el).backgroundImage)&&css(el).backgroundClip!=='text'&&css(el).webkitBackgroundClip!=='text'&&!graphic(el));
 const textGradients=gradients.filter(el=>hasText(el)||el.parentElement&&hasText(el.parentElement)&&area(el)>=area(el.parentElement)*.8);
 const largeGradients=textGradients.filter(el=>el.getBoundingClientRect().width>=innerWidth*.5&&area(el)>=innerWidth*innerHeight*.15);
 // Purple counts only when most color stops are purple/indigo/pink, not when one stop happens to be.
 const purpleGradients=largeGradients.filter(el=>{const cs=colorsIn(css(el).backgroundImage).filter(c=>c[3]>.15&&hsl(c).h!==null);return cs.length>=1&&cs.filter(purple).length/cs.length>=.5;});
 const gradientText=els.filter(el=>(css(el).backgroundClip==='text'||css(el).webkitBackgroundClip==='text')&&/gradient\(/.test(css(el).backgroundImage));
 const gradientHeadings=gradientText.filter(el=>el.closest('h1,h2,h3'));
 // A blurred floating nav is a normal pattern; repeated blurred content boxes are the tell.
 const glass=els.filter(el=>{const s=css(el);return [s.backdropFilter,s.webkitBackdropFilter].some(v=>v&&v!=='none'&&/blur/.test(v))&&!pinned(el)&&!graphic(el)&&area(el)>=4000;});
 const glow=els.filter(el=>{const s=css(el).boxShadow;if(s==='none'||graphic(el))return false;return s.split(/,(?![^(]*\))/).some(part=>{const nums=(part.replace(/rgba?\([^)]+\)/,'').match(/-?[\d.]+px/g)||[]).map(parseFloat);const c=rgba(part);const x=c&&hsl(c);return x&&x.h!==null&&x.s>.4&&c[3]>.2&&(nums[2]||0)>=12;});});
 const transitionAll=els.filter(el=>{if(el.closest('svg'))return false;const s=css(el);const props=s.transitionProperty.split(',').map(x=>x.trim()),d=s.transitionDuration.split(',').map(parseFloat);return props.some((p,i)=>p==='all'&&(d[i]??d[0])>0);});
 // Emoji used as icons or decoration in headings, buttons, badges.
 const pictographic=/\p{Extended_Pictographic}/u;
 const emojiEls=els.filter(el=>pictographic.test([...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').replace(/[©®™]/g,'')));
 // Icons are standalone or leading glyphs; emoji inside user-written titles are content, not decoration.
 const emojiIcons=emojiEls.filter(el=>{const t=el.textContent.trim();return t.length<=3||/^\p{Extended_Pictographic}/u.test(t)&&el.matches('h1,h2,h3,h4,button,a,[role=button],li,span')||parseFloat(css(el).fontSize)>=28&&t.length<=6;});
 // Text alignment.
 const blocks=els.filter(el=>el.matches('p,h1,h2,h3,h4,li,blockquote')&&el.textContent.trim().length>20);
 const centered=blocks.filter(el=>css(el).textAlign==='center');
 // Uniform card grids: 3+ sibling boxes with the same structure, rounded, boxed.
 const cardGroups=[];
 for(const parent of new Set(els.map(el=>el.parentElement).filter(Boolean))){
  const kids=[...parent.children].filter(el=>style.has(el));if(kids.length<3)continue;
  const sig=el=>el.tagName+'|'+[...el.classList].sort().join('.')+'|'+[...el.children].map(c=>c.tagName).join(',');
  const counts=new Map();for(const k of kids)counts.set(sig(k),(counts.get(sig(k))||0)+1);
  const [best,n]=[...counts].sort((a,b)=>b[1]-a[1])[0];if(n<3)continue;
  const cards=kids.filter(k=>sig(k)===best);
  // Feature-card trios: boxed, rounded, sitting in one row, each carrying a heading and a sentence.
  if(!cards.every(c=>boxy(c)&&parseFloat(css(c).borderTopLeftRadius)>=8))continue;
  const rects=cards.map(c=>c.getBoundingClientRect());
  if(rects.some(r=>r.width<160||r.height<120))continue;
  if(new Set(rects.map(r=>Math.round(r.top/8))).size>Math.ceil(cards.length/3))continue;
  if(!cards.every(c=>c.querySelector('h2,h3,h4,h5,strong,b,[class*=title],[class*=heading]')&&(c.innerText||'').trim().length>=40))continue;
  const iconLed=cards.every(c=>{const first=c.firstElementChild;return first&&(first.matches('svg,img,i,[class*=icon]')||pictographic.test(first.textContent)||first.querySelector?.('svg'));});
  cardGroups.push({count:cards.length,iconLed,centered:cards.filter(c=>css(c).textAlign==='center').length,target:sel(parent)});
 }
 // Eyebrow pill badges above the first heading.
 const h1=document.querySelector('h1');
 const pills=els.filter(el=>{const r=el.getBoundingClientRect(),s=css(el);return r.height>0&&r.height<40&&parseFloat(s.borderTopLeftRadius)>=r.height/2-1&&el.textContent.trim().length>0&&el.textContent.trim().length<48&&boxy(el)&&!el.matches('button,a,[role=button],input');});
 const h1Top=h1?.getBoundingClientRect().top;
 const eyebrowPills=h1?pills.filter(el=>{const r=el.getBoundingClientRect();return el.compareDocumentPosition(h1)&Node.DOCUMENT_POSITION_FOLLOWING&&r.bottom<=h1Top+2&&h1Top-r.bottom<160;}):[];
 // Rounding.
 const containers=els.filter(el=>boxy(el)&&area(el)>=6000&&!el.matches('button,a,input,select,textarea,img'));
 const rounded=containers.filter(el=>parseFloat(css(el).borderTopLeftRadius)>=16);
 // Typography.
 const textEls=els.filter(el=>!el.matches('button,input,select,textarea,code,pre,kbd')&&[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
 const families=new Map(),sizes=new Map(),chars=new Map();
 for(const el of textEls){const f=css(el).fontFamily.split(',')[0].replace(/["']/g,'').trim().toLowerCase();families.set(f,(families.get(f)||0)+1);const z=Math.round(parseFloat(css(el).fontSize));chars.set(z,(chars.get(z)||0)+[...el.childNodes].filter(n=>n.nodeType===3).reduce((n,t)=>n+t.textContent.trim().length,0));sizes.set(z,(sizes.get(z)||0)+1);}
 // Many sites put the logo in a small h1, so the type scale uses the largest heading-like text instead.
 const body=[...chars].sort((a,b)=>b[1]-a[1])[0]?.[0]||16,h1Size=h1?parseFloat(getComputedStyle(h1).fontSize):null;
 const display=Math.max(0,...textEls.filter(el=>(el.innerText||'').trim().length>=2).map(el=>parseFloat(css(el).fontSize)));
 const weights=new Set(textEls.map(el=>css(el).fontWeight));
 // Buttons, accents, hues.
 const buttons=els.filter(el=>el.matches('button,[role=button],input[type=submit],input[type=button],a[class*=btn],a[class*=button]'));
 const accents=[];for(const el of [...buttons,...els.filter(el=>el.matches('a[href]'))]){for(const v of [css(el).backgroundColor,css(el).color]){const c=rgba(v);if(c&&c[3]>.5&&hsl(c).h!==null)accents.push(c.slice(0,3));}}
 const hues=new Set();for(const el of els.filter(el=>!graphic(el)))for(const v of [css(el).color,css(el).backgroundColor,parseFloat(css(el).borderTopWidth)>0?css(el).borderTopColor:'']){const c=rgba(v);if(!c||c[3]<.1)continue;const x=hsl(c);if(x.h!==null&&x.s>.25)hues.add(Math.round(x.h/30)%12);}
 // Craft counter-signals: a chosen webfont and real imagery suggest deliberate design.
 const loadedFonts=[...new Set([...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family.replace(/["']/g,'').trim().toLowerCase()))];
 const imagery=[...document.querySelectorAll('img,video,picture,canvas,svg')].filter(el=>!el.parentElement?.closest('svg')&&area(el)>=40000&&visible(el)).length;
 // Copy and generic calls to action.
 const text=(document.body.innerText||'').replace(/\s+/g,' ');
 const labels=buttons.concat(els.filter(el=>el.matches('a[href]'))).map(el=>(el.innerText||el.value||'').trim().toLowerCase()).filter(Boolean);
 const rootBg=rgba(getComputedStyle(document.body).backgroundColor)?.[3]>.5?rgba(getComputedStyle(document.body).backgroundColor):rgba(getComputedStyle(document.documentElement).backgroundColor);
 return {
  url:location.href,viewport:{width:innerWidth,height:innerHeight},inspected:Math.min(all.length,limit),total:all.length,
  gradients:{count:gradients.length,large:largeGradients.length,purple:purpleGradients.length,coverage:Math.min(1,largeGradients.reduce((n,el)=>n+area(el),0)/page),targets:sample(largeGradients.length?largeGradients:gradients)},
  gradientText:{count:gradientText.length,headings:gradientHeadings.length,targets:sample(gradientText)},
  glass:{count:glass.length,targets:sample(glass)},
  glow:{count:glow.length,targets:sample(glow)},
  transitionAll:{count:transitionAll.length,targets:sample(transitionAll)},
  emoji:{count:emojiEls.length,icons:emojiIcons.length,targets:sample(emojiIcons)},
  centered:{blocks:blocks.length,centered:centered.length,ratio:blocks.length?centered.length/blocks.length:0,targets:sample(centered)},
  cardGrids:{count:cardGroups.length,groups:cardGroups.slice(0,8)},
  eyebrowPills:{count:eyebrowPills.length,targets:sample(eyebrowPills)},
  rounding:{containers:containers.length,rounded:rounded.length,ratio:containers.length?rounded.length/containers.length:0},
  typography:{families:[...families].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,count])=>({name,count})),sizes:sizes.size,weights:weights.size,body,h1:h1Size,display,ratio:display?display/body:null},
  accents:accents.slice(0,60),hueBuckets:hues.size,craft:{loadedFonts:loadedFonts.slice(0,12),imagery,fontSizes:sizes.size},
  rootBackground:rootBg?{rgb:rootBg.slice(0,3),dark:lum(rootBg)<.05}:null,
  text:text.slice(0,20000),labels:labels.slice(0,200)
 };
}

const genericFonts=['inter','roboto','poppins','montserrat','open sans','lato','manrope','plus jakarta sans','dm sans','system-ui','-apple-system','blinkmacsystemfont','segoe ui','helvetica','helvetica neue','arial','sans-serif','pretendard','noto sans kr','noto sans jp','noto sans'];
// Tailwind/Bootstrap default accents that read as "nobody chose this color".
const defaultAccents={'Tailwind indigo-500':[99,102,241],'Tailwind indigo-600':[79,70,229],'Tailwind violet-500':[139,92,246],'Tailwind violet-600':[124,58,237],'Tailwind purple-500':[168,85,247],'Tailwind blue-500':[59,130,246],'Tailwind blue-600':[37,99,235],'Bootstrap primary':[13,110,253],'Bootstrap 4 primary':[0,123,255]};
const phrases={
 en:['unlock your potential','unlock the power','supercharge','seamless','seamlessly','effortless','effortlessly','harness the power','elevate your','revolutionize','revolutionary','next-level','next level','cutting-edge','blazing fast','lightning fast','all-in-one','game-changing','game changer','empower','transform your','take your','to the next level','built for the future','reimagine','unleash','10x','ai-powered','powered by ai','in seconds','like never before','say goodbye to'],
 ko:['잠재력','혁신적인','차원이 다른','새로운 경험','손쉽게','한 번에','게임 체인저','완벽한 솔루션','미래를 여는','당신의 가능성','지금 바로 시작','스마트한','올인원','획기적인'],
 // Phrase forms, not bare words: 次世代 or 革新 alone appear in honest Japanese copy.
 ja:['可能性を解き放つ','可能性を最大化','シームレスな','シームレスに','革新的な','次世代の','ワンランク上の','新しい体験を','圧倒的な','ビジネスを加速','未来を切り拓く','未来を切り開く','新たな価値を創造','最先端の','誰でも簡単に','魔法のように','革命を起こす','パワフルな','唯一無二の','かつてない','次のステージへ','想像を超える','もっと自由に','ゲームチェンジャー','aiの力で','数秒で','オールインワン','さあ、始めよう']
};
const genericCtas=['learn more','get started','get started for free','start free trial','try it free','sign up free','read more','discover more','explore','자세히 보기','더 알아보기','시작하기','무료로 시작하기','더보기','詳しく見る','詳細はこちら','詳細を見る','もっと見る','もっと詳しく','続きを読む','今すぐ始める','無料で始める','無料ではじめる'];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

const copy={
 'purple-gradient':{ko:['보라·남색 그라데이션 배경','AI 생성 화면의 대표 신호. 브랜드가 정한 색이 아니라 "기본값"으로 읽힌다.','그라데이션을 걷고 단색 면(브랜드 1색 또는 무채색)으로. 히어로는 그라데이션 대신 실제 제품 화면·사진·타이포 크기로 위계를 만든다.'],en:['Purple/indigo gradient backgrounds','The most recognisable AI-generated tell; it reads as a default rather than a brand choice.','Replace with a flat surface (one brand color or neutral). Let the hero carry real product imagery or typographic scale instead of a gradient wash.']},
 'large-gradient':{ko:['넓은 면적의 그라데이션','큰 면을 그라데이션으로 채우면 장식이 내용보다 먼저 보인다.','그라데이션은 화면당 한 곳 이하, 작은 면적에만. 섹션 구분은 단색 면과 간격으로.'],en:['Large gradient surfaces','Big gradient fields put decoration ahead of content.','Keep at most one small gradient per screen; separate sections with flat surfaces and spacing.']},
 'gradient-text':{ko:['그라데이션 글자','강조가 아니라 장식으로 읽히고 대비 계산도 불안정하다.','단색 글자로 바꾸고 크기·굵기로 위계를 준다.'],en:['Gradient text','Reads as decoration, not emphasis, and makes contrast unreliable.','Use solid text; build hierarchy with size and weight.']},
 'glass':{ko:['유리(backdrop-filter blur) 효과 반복','글래스모피즘 반복은 2023년식 AI 템플릿 인상을 준다.','유리 효과는 내비게이션처럼 콘텐츠 위에 뜨는 한 곳만. 나머지는 불투명 면과 얇은 선으로.'],en:['Repeated glassmorphism','Repeated backdrop blur reads as a stock AI template.','Keep blur for one floating layer (e.g. nav); use opaque surfaces and hairlines elsewhere.']},
 'glow':{ko:['크고 색이 있는 그림자(글로우)','모든 요소가 떠 있으면 무엇도 떠 보이지 않는다.','그림자는 1~2단계(작게·옅게, 무채색)만. 카드 구분은 선이나 배경 명도로.'],en:['Large or colored glow shadows','When everything floats, nothing stands out.','Use one or two small neutral elevation levels; separate cards with hairlines or tone.']},
 'emoji-icons':{ko:['이모지를 아이콘으로 사용','✨🚀⚡ 같은 이모지 아이콘은 AI 생성 화면의 강한 신호이며 기기마다 모양이 다르다.','한 벌의 선 아이콘(같은 크기·선 굵기)으로 바꾸거나, 아이콘 없이 제목만으로 충분한지 먼저 본다.'],en:['Emoji used as icons','✨🚀⚡ icons are a strong AI tell and render differently per platform.','Swap for one consistent line-icon set, or drop icons where the heading already says enough.']},
 'card-grid':{ko:['똑같은 카드 3~4개 나열(아이콘+제목+설명)','"기능 카드 3개"는 AI 랜딩의 정형 구조. 내용의 경중이 사라진다.','가장 중요한 기능 하나를 크게, 나머지는 목록/표로. 카드 대신 실제 화면 캡처, 수치, 사용 사례로 구체화한다.'],en:['Uniform 3–4 card grid (icon + title + blurb)','The "three feature cards" block is the stock AI landing structure; it flattens importance.','Feature the single most important capability large; list the rest. Replace generic cards with screenshots, numbers or real use cases.']},
 'centered':{ko:['대부분의 문단이 가운데 정렬','전부 가운데 정렬이면 읽는 시작점이 매 줄 바뀌고 템플릿처럼 보인다.','본문·목록은 왼쪽 정렬, 가운데 정렬은 짧은 제목 한두 곳만. 좌측 정렬 그리드로 긴장감을 만든다.'],en:['Most text blocks centered','Centering everything moves the reading start every line and looks templated.','Left-align body and lists; reserve centering for one or two short headings.']},
 'eyebrow-pill':{ko:['제목 위 알약 배지("✨ New" 류)','히어로 위 알약 배지는 AI 랜딩의 상투 장식이다.','실제 공지가 있을 때만 텍스트 링크로. 없다면 제거하고 제목을 바로 시작한다.'],en:['Pill badge above the headline','The "✨ New" eyebrow pill is a stock AI landing ornament.','Use a plain text link only for a real announcement; otherwise remove it.']},
 'over-rounded':{ko:['거의 모든 상자가 16px 이상 둥근 모서리','큰 반경 일색은 장난감 같고 구분이 흐려진다.','반경을 2~3단계(예: 4/8/12)로 정하고 바깥이 안쪽보다 크거나 같게. 큰 면은 덜 둥글게.'],en:['Nearly every box is ≥16px rounded','Uniformly large radii look toy-like and blur structure.','Define 2–3 radius steps (e.g. 4/8/12); larger surfaces get less rounding.']},
 'generic-type':{ko:['개성 없는 기본 서체 하나로 전부','Inter·Roboto·시스템 서체 단일 사용은 "아무도 고르지 않은" 인상을 준다(업무용 화면이면 정상일 수 있음).','브랜드·목적에 맞는 서체 쌍을 고른다(예: 제목에 개성 있는 세리프/그로테스크, 본문은 가독성 서체). 업무형 화면은 시스템 서체 유지하되 크기·굵기 대비를 키운다.'],en:['One generic typeface for everything','Inter/Roboto/system-only typography reads as "nobody chose this" (fine for dense operational UIs).','Pick a deliberate pairing (characterful display face + readable text face). For work tools keep system fonts but strengthen size/weight contrast.']},
 'flat-scale':{ko:['제목과 본문 크기 차이가 작음','위계가 약해 모든 것이 같은 무게로 보인다.','제목:본문 비율을 2.5배 이상으로(예: 16→40/48px), 중간 단계는 줄인다.'],en:['Weak type scale','Heading and body sizes are too close; everything weighs the same.','Aim for ≥2.5× heading-to-body ratio and fewer intermediate steps.']},
 'default-accent':{ko:['프레임워크 기본 강조색','Tailwind indigo/violet, Bootstrap 파랑 그대로는 "기본값" 신호다.','브랜드에서 한 색을 정해 채도·명도를 조정하고, 주 버튼 한 곳에만 쓴다.'],en:['Framework default accent color','Untouched Tailwind indigo/violet or Bootstrap blue signals defaults.','Choose one brand hue, tune it, and spend it on the primary action only.']},
 'many-hues':{ko:['유채색 계열이 많음','색이 많으면 강조가 사라진다.','무채색 + 강조색 1 + 오류 빨강. 상태는 글자·아이콘 모양으로 구분.'],en:['Too many hues','Many hues cancel emphasis.','Neutrals + one accent + error red; distinguish states by label and shape.']},
 'transition-all':{ko:['transition: all','의도치 않은 속성까지 움직이고 레이아웃이 흔들린다(AI 코드의 흔한 습관).','transform·opacity 등 움직일 속성만 나열하고 reduced-motion 블록을 둔다.'],en:['transition: all','Animates unintended properties and causes jank — a common AI-code habit.','List only transform/opacity and add a reduced-motion block.']},
 'buzzword-copy':{ko:['상투적 마케팅 문구','"잠재력을 깨우세요", "seamless" 같은 문구는 AI 카피의 대표 신호이며 아무 정보도 주지 않는다.','무엇을, 누구를 위해, 얼마나 빨리/싸게 하는지 구체적 사실과 숫자로 다시 쓴다.'],en:['Buzzword copy','"Unlock your potential", "seamless" etc. are classic AI copy and carry no information.','Rewrite with concrete facts: what it does, for whom, with numbers.']},
 'generic-cta':{ko:['같은 일반 CTA 반복("Learn more" 등)','같은 문구의 버튼이 여러 번 나오면 무엇을 눌러야 할지 흐려진다.','주 행동 하나를 정하고, 나머지는 목적지를 말하는 구체적 링크 문구로("요금제 비교", "API 문서 보기").'],en:['Repeated generic CTAs','Many identical "Learn more" buttons blur the primary action.','Pick one primary action; make the rest specific ("Compare plans", "Read the API docs").']}
};
for(const [id,text] of Object.entries(jaSignals))copy[id].ja=text;
const langKey=lang=>['en','ja'].includes(lang)?lang:'ko';

export const signalTitle=(id,lang='ko')=>copy[id]?.[langKey(lang)][0];

/** Weighted sum of signals, dampened 15% per craft signal. */
export function scoreSignals(signals,craft=[]){
 const raw=signals.reduce((n,s)=>n+s.weight,0),score=Math.min(100,Math.round(raw*100/18*(1-.15*craft.length)));
 return {score,band:score>=60?'high':score>=30?'medium':signals.length?'low':'none'};
}

/** Turns raw page metrics into ranked, explained signals. Pure; safe to unit-test. */
export function evaluateAiTells(m,{lang='ko'}={}){
 const L=langKey(lang),out=[];
 const add=(id,strength,evidence,targets=[])=>{const [title,why,fix]=copy[id][L];out.push({id,strength,weight:{strong:3,moderate:2,weak:1}[strength],title,why,fix,evidence,targets});};
 if(m.gradients.purple>0&&(m.gradients.large>0||m.gradients.purple>=2))add('purple-gradient','strong',{purple:m.gradients.purple,large:m.gradients.large},m.gradients.targets);
 else if(m.gradients.large>=2||m.gradients.coverage>.3)add('large-gradient','moderate',{large:m.gradients.large,coverage:+m.gradients.coverage.toFixed(2)},m.gradients.targets);
 if(m.gradientText.count)add('gradient-text',m.gradientText.headings?'strong':'weak',{count:m.gradientText.count,headings:m.gradientText.headings},m.gradientText.targets);
 if(m.emoji.icons>=2)add('emoji-icons','strong',{icons:m.emoji.icons,total:m.emoji.count},m.emoji.targets);
 const grid=m.cardGrids.groups.find(g=>g.iconLed)||m.cardGrids.groups[0];
 if(grid)add('card-grid',grid.iconLed?'strong':'moderate',{groups:m.cardGrids.count,cards:grid.count,iconLed:grid.iconLed},m.cardGrids.groups.map(g=>g.target));
 if(m.glass.count>=3)add('glass',m.glass.count>=6?'strong':'moderate',{count:m.glass.count},m.glass.targets);
 if(m.glow.count>=3)add('glow',m.glow.count>=6?'moderate':'weak',{coloredGlows:m.glow.count},m.glow.targets);
 if(m.eyebrowPills.count)add('eyebrow-pill','moderate',{count:m.eyebrowPills.count},m.eyebrowPills.targets);
 if(m.centered.blocks>=4&&m.centered.ratio>=.6)add('centered','moderate',{centered:m.centered.centered,blocks:m.centered.blocks,ratio:+m.centered.ratio.toFixed(2)},m.centered.targets);
 if(m.rounding.containers>=4&&m.rounding.ratio>=.75)add('over-rounded','weak',{rounded:m.rounding.rounded,containers:m.rounding.containers});
 const fams=m.typography.families,top=fams[0]?.name;
 // Japanese pages with a real Japanese stack (Hiragino, Noto Sans JP …) follow local convention, not a template default.
 if(top&&genericFonts.includes(top)&&fams.filter(f=>f.count>=3).length<=1&&!(m.japanese&&m.japaneseFontCoverage>=.5))add('generic-type','weak',{families:fams.map(f=>f.name)});
 // Dense Japanese portals and stores use modest heading sizes by convention; that is not a template tell.
 if(m.typography.ratio&&m.typography.ratio<2&&!m.japanese)add('flat-scale','weak',{display:m.typography.display,body:m.typography.body,ratio:+m.typography.ratio.toFixed(2)});
 const hits=new Map();for(const c of m.accents)for(const [name,ref] of Object.entries(defaultAccents))if(dist(c,ref)<14)hits.set(name,(hits.get(name)||0)+1);
 if([...hits.values()].reduce((a,b)=>a+b,0)>=2)add('default-accent','moderate',{matches:Object.fromEntries(hits)});
 if(m.hueBuckets>=5)add('many-hues','weak',{hueBuckets30deg:m.hueBuckets});
 if(m.transitionAll.count)add('transition-all',m.transitionAll.count>=3?'moderate':'weak',{count:m.transitionAll.count},m.transitionAll.targets);
 const lower=m.text.toLowerCase(),found=[...phrases.en,...phrases.ko,...phrases.ja].filter(p=>lower.includes(p));
 // One stock phrase can be honest copy; several together is the template voice.
 if(found.length>=2)add('buzzword-copy',found.length>=4?'strong':'moderate',{phrases:found.slice(0,12)});
 const counts=new Map();for(const l of m.labels)if(genericCtas.includes(l))counts.set(l,(counts.get(l)||0)+1);
 const repeated=[...counts].filter(([,n])=>n>=2);
 if(repeated.length)add('generic-cta','weak',{repeated:Object.fromEntries(repeated)});
 out.sort((a,b)=>b.weight-a.weight);
 // Craft does not cancel tells, but a chosen webfont, real imagery and a rich type scale make them more likely deliberate.
 const c=m.craft||{},craft=[];
 if((c.loadedFonts||[]).some(f=>!genericFonts.includes(f)&&!/icon|awesome|material|symbol/.test(f)))craft.push('custom-webfont');
 if((c.imagery||0)>=3)craft.push('imagery');
 if((c.fontSizes||0)>=7)craft.push('type-scale');
 const {score,band}=scoreSignals(out,craft);
 const absent=Object.keys(copy).filter(id=>!out.some(s=>s.id===id)&&!(id==='large-gradient'&&out.some(s=>s.id==='purple-gradient')));
 return {heuristic:true,blocking:false,score,band,craft,signals:out,absent};
}
