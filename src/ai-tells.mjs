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
 // Card-in-card: a rounded, boxed surface sitting inside another one (controls, media and pinned bars excluded).
 const cardLike=containers.filter(el=>parseFloat(css(el).borderTopLeftRadius)>=8&&!el.matches('[role=button],video,picture,canvas,iframe')&&!graphic(el)&&!el.closest('nav,header,footer,dialog,[role=dialog]'));
 const cardSet=new Set(cardLike);
 const nestedCards=cardLike.filter(el=>{for(let n=el.parentElement;n&&n!==document.body;n=n.parentElement)if(cardSet.has(n))return area(n)>=area(el)*1.5;return false;});
 const outerOf=el=>{for(let n=el.parentElement;n;n=n.parentElement)if(cardSet.has(n))return n;};
 const nestedHosts=new Set(nestedCards.map(outerOf));
 // Icons in tinted rounded squares: a small square box (not a circle, not a control) holding only an icon.
 const iconBoxes=els.filter(el=>{
  if(el.matches('button,a,input,select,textarea,label,[role=button],img,svg')||el.closest('button,a,nav,header,footer'))return false;
  const r=el.getBoundingClientRect();if(r.width<28||r.width>96||Math.abs(r.width-r.height)>4)return false;
  const s=css(el),rad=parseFloat(s.borderTopLeftRadius),bg=rgba(s.backgroundColor);
  if(rad<4||rad>=r.width/2-1||!(bg&&bg[3]>.04||/gradient\(/.test(s.backgroundImage)))return false;
  const t=(el.innerText||'').trim();if(t.length>2)return false;
  const icon=el.querySelector('svg,img,i,[class*=icon]');
  if(!icon)return pictographic.test(t);
  const ir=icon.getBoundingClientRect();return ir.width>0&&ir.width<=r.width*.75;
 });
 // Typography.
 const textEls=els.filter(el=>!el.matches('button,input,select,textarea,code,pre,kbd')&&[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
 const families=new Map(),sizes=new Map(),chars=new Map();
 for(const el of textEls){const f=css(el).fontFamily.split(',')[0].replace(/["']/g,'').trim().toLowerCase();families.set(f,(families.get(f)||0)+1);const z=Math.round(parseFloat(css(el).fontSize));chars.set(z,(chars.get(z)||0)+[...el.childNodes].filter(n=>n.nodeType===3).reduce((n,t)=>n+t.textContent.trim().length,0));sizes.set(z,(sizes.get(z)||0)+1);}
 // Many sites put the logo in a small h1, so the type scale uses the largest heading-like text instead.
 const body=[...chars].sort((a,b)=>b[1]-a[1])[0]?.[0]||16,h1Size=h1?parseFloat(getComputedStyle(h1).fontSize):null;
 const display=Math.max(0,...textEls.filter(el=>(el.innerText||'').trim().length>=2).map(el=>parseFloat(css(el).fontSize)));
 const weights=new Set(textEls.map(el=>css(el).fontWeight));
 // 2025–26 "editorial" template: tiny tracked uppercase labels, numbered section labels,
 // short display headings ending in a period, serif display type on warm off-white paper.
 const latin=t=>/[A-Za-z]/.test(t)&&!/[ぁ-ヿ㐀-鿿가-힣]/.test(t);
 const ownText=el=>[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
 const tracked=textEls.filter(el=>{const s=css(el),z=parseFloat(s.fontSize),t=(el.innerText||'').trim(),ls=parseFloat(s.letterSpacing);
  return z<=13&&t.length>=3&&t.length<=60&&latin(t)&&Number.isFinite(ls)&&ls/z>=.06&&(s.textTransform==='uppercase'||t===t.toUpperCase()&&/[A-Z]{3}/.test(t));});
 const numbered=textEls.filter(el=>{const t=(el.innerText||'').trim();return parseFloat(css(el).fontSize)<=14&&t.length<=60&&(/^(0\d|\d{1,2})\s*[\/·.—–|:-]\s*\S/.test(t)&&/[A-Za-z]/.test(t)||/^step\s*\d+\b/i.test(t));});
 const displayHeads=textEls.filter(el=>(el.matches('h1,h2,h3')||parseFloat(css(el).fontSize)>=28)&&(el.innerText||'').trim().length>=4);
 const uniqueHeads=[...new Set(displayHeads.map(el=>el.closest('h1,h2,h3')||el))];
 const periodHeads=uniqueHeads.filter(el=>{const t=(el.innerText||'').trim().replace(/\s+/g,' ');return latin(t)&&/[a-z]\.$/i.test(t)&&!/\.\.$/.test(t)&&t.split(' ').length<=9;});
 const serifNames=/(^|\s)serif$|garamond|playfair|fraunces|instrument serif|cormorant|dm serif|baskerville|newsreader|source serif|lora|merriweather|crimson|spectral|georgia|times|tiempos|canela|gt sectra|editorial new|ivar|reckless|signifier|ogg|domaine|freight|bodoni|didot|caslon|libre caslon|young serif|gloock|bricolage serif|literata|ibm plex serif|noto serif|pt serif/i;
 const isSerif=el=>{const fams=css(el).fontFamily.split(',').map(f=>f.replace(/["']/g,'').trim().toLowerCase());return serifNames.test(fams[0])||fams[0]!=='sans-serif'&&fams.includes('serif')&&!fams.includes('sans-serif');};
 const bigHeads=uniqueHeads.filter(el=>parseFloat(css(el).fontSize)>=32);
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
 // Transparent body and html paint the default white canvas, not black.
 // Hero skeleton: where the main headline sits and what shares the first screen with it, so design directions can be told apart.
 const hero=(()=>{
  if(!h1||!visible(h1))return null;
  const abs=el=>{const r=el.getBoundingClientRect();return {l:r.left+scrollX,t:r.top+scrollY,r:r.right+scrollX,b:r.bottom+scrollY,w:r.width,h:r.height};};
  const rg=document.createRange();rg.selectNodeContents(h1);const tr=rg.getBoundingClientRect(),H=tr.width>0?{l:tr.left+scrollX,t:tr.top+scrollY,r:tr.right+scrollX,b:tr.bottom+scrollY,w:tr.width,h:tr.height}:abs(h1),W=innerWidth,fold=innerHeight;if(H.t>fold*1.2)return {align:'below-fold',side:null,fullBleed:false,stats:0,headlineWidth:+(H.w/W).toFixed(2)};
  const cx=(H.l+H.r)/2/W,align=css(h1).textAlign==='center'||Math.abs(cx-.5)<.04&&H.w<W*.6?'center':H.w>=W*.7?'wide':cx<.5?'left':'right';
  const media=el=>el.matches('img,video,picture,canvas,svg,iframe')||css(el).backgroundImage.includes('url(');
  let side=null;
  for(const el of els){if(el===h1||el.contains(h1)||h1.contains(el))continue;const R=abs(el);
   if(R.t>fold||R.w<W*.2||R.w>W*.62||R.h<140)continue;
   if(!(R.l>=H.r-12||R.r<=H.l+12))continue;if(R.b<H.t-220||R.t>H.b+260)continue;
   const isMedia=media(el)||[...el.querySelectorAll('img,video,canvas,picture')].some(m=>{const r=m.getBoundingClientRect();return r.width*r.height>=R.w*R.h*.5;});
   if(!isMedia&&!boxy(el)&&!el.querySelector('table'))continue;
   if(!side||R.w*R.h>side.area)side={kind:isMedia?'media':'panel',area:R.w*R.h,target:sel(el)};}
  const fullBleed=els.some(el=>{const R=abs(el);return R.t<fold&&R.w>=W*.9&&R.h>=fold*.4&&(media(el)&&!el.matches('svg'))&&!el.contains(h1)?true:(R.w>=W*.9&&R.h>=fold*.4&&el.contains(h1)&&css(el).backgroundImage.includes('url('));});
  // A stat strip: three or more siblings in one row whose text is mostly a figure, within the first 1.6 screens.
  const figure=el=>{const t=(el.innerText||'').trim();if(!t||t.length>60)return false;const first=t.split(/\n/)[0];return /\d/.test(first)&&first.replace(/[\d\s.,:%+\-/~×$¥₩€円원万만件人名年月日時分秒hmsk]/gi,'').length<=3;};
  let stats=0;for(const el of els){const R=abs(el);if(R.t>fold*1.6||R.w<W*.5)continue;const kids=[...el.children].filter(visible);if(kids.length<3||kids.length>6)continue;
   const tops=kids.map(k=>abs(k).t);if(Math.max(...tops)-Math.min(...tops)>12)continue;const n=kids.filter(figure).length;if(n>=3&&n>=kids.length-1)stats=Math.max(stats,n);}
  return {align,side:side?{kind:side.kind,target:side.target}:null,fullBleed,stats,headlineWidth:+(H.w/W).toFixed(2)};
 })();
 // One coloured word: a short span inside a heading set in a solid colour clearly different from the heading.
 const dist3=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
 const accentWords=[...document.querySelectorAll('h1,h2')].filter(visible).filter(h=>{const hc=rgba(css(h).color);if(!hc)return false;const total=(h.textContent||'').trim().length;
  return [...h.querySelectorAll('span,em,strong,mark,b,i')].some(sp=>{const t=(sp.textContent||'').trim();if(!t||t.length>total*.6)return false;const s=css(sp),c=rgba(s.color);
   return c&&s.backgroundClip!=='text'&&!String(s.webkitBackgroundClip||'').includes('text')&&dist3(c,hc)>90&&hsl(c).s>.25;});});
 // A newsletter box near the end: a lone email field in the last quarter of the page.
 const pageH=Math.max(1,document.documentElement.scrollHeight);
 const tailSignup=[...document.querySelectorAll('input[type=email]')].filter(visible).filter(inp=>{const r=inp.getBoundingClientRect(),top=r.top+scrollY;if(top<pageH*.72)return false;
  const box=inp.closest('form')||inp.parentElement?.parentElement;const fields=box?[...box.querySelectorAll('input,select,textarea')].filter(x=>!['hidden','submit','button'].includes(x.type)).length:1;return fields<=1;});
 // Empty frames: image-sized boxes with a fill or border but nothing in them (no text, image, video, canvas or svg).
 const emptyFrames=els.filter(el=>{if(graphic(el)||pinned(el))return false;const r=el.getBoundingClientRect();if(r.width<120||r.height<80||r.width>innerWidth*.95)return false;
  if((el.innerText||'').trim()||el.querySelector('img,video,canvas,svg,picture,iframe,input,button'))return false;const s=css(el);if(s.backgroundImage!=='none')return false;
  const bg=rgba(s.backgroundColor);return (bg&&bg[3]>.05)||parseFloat(s.borderTopWidth)>0&&(rgba(s.borderTopColor)?.[3]??0)>.05;}).filter((el,i,a)=>!a.some(o=>o!==el&&o.contains(el)));
 // Hero that misses its screen: the main headline starts on the first screen but its first call to action does not.
 const heroCta=(()=>{const h=document.querySelector('h1');if(!h||!visible(h))return null;const top=h.getBoundingClientRect().top+scrollY;if(top>innerHeight*.85)return null;
  const sec=h.closest('section,header,main>div,[class*=hero]')||h.parentElement;const cta=[...(sec?.querySelectorAll('a[href],button')||[])].filter(visible).find(el=>el.compareDocumentPosition(h)&Node.DOCUMENT_POSITION_PRECEDING&&(el.matches('button')||boxy(el)));
  if(!cta)return null;const ct=cta.getBoundingClientRect().top+scrollY;return {headlineTop:Math.round(top),ctaTop:Math.round(ct),fold:innerHeight,below:ct+20>innerHeight};})();
 // First screen, whatever the layout: a line that says what this is, and a main action outside the header.
 const firstScreen=(()=>{const fold=innerHeight,inFold=el=>{const r=el.getBoundingClientRect();return r.top+scrollY<fold&&r.bottom+scrollY>0;},chrome=el=>{if(el.closest('nav,[role=navigation]'))return true;const h=el.closest('header,[role=banner]');return !!h&&h.getBoundingClientRect().height<=fold*.35;};
  const own=el=>[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').replace(/\s+/g,' ').trim();
  const says=t=>{const letters=(t.match(/[\p{L}]/gu)||[]).length,cjk=(t.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)||[]).length;return cjk>=6||letters>=12;};
  const claim=[...document.querySelectorAll('h1,h2,p,div,span,strong,a')].filter(el=>!chrome(el)&&visible(el)&&inFold(el)&&parseFloat(css(el).fontSize)>=24&&says(el.innerText||own(el))).sort((a,b)=>parseFloat(css(b).fontSize)-parseFloat(css(a).fontSize))[0];
  const action=[...document.querySelectorAll('a[href],button')].filter(el=>!chrome(el)&&visible(el)&&!/skip|본문|本文/i.test((el.className||'')+' '+(el.innerText||''))&&el.getBoundingClientRect().bottom+scrollY<=fold&&(el.matches('button')||boxy(el))&&(el.innerText||'').trim().length>=2&&(el.innerText||'').trim().length<=40)[0];
  const vis=el=>{const r=el.getBoundingClientRect();return Math.max(0,Math.min(r.right,innerWidth)-Math.max(r.left,0))*Math.max(0,Math.min(r.bottom,fold)-Math.max(r.top,0));};
  const media=Math.min(1,[...document.querySelectorAll('img,video,picture,canvas,svg:not(svg svg)'),...[...document.querySelectorAll('body *')].slice(0,1500).filter(el=>/url\(/.test(css(el).backgroundImage))].filter(el=>visible(el)&&!chrome(el)&&el.getBoundingClientRect().width>=200).reduce((n,el)=>n+vis(el),0)/(innerWidth*fold));
  // Largest text on the first screen (short labels included), to tell whether the claim leads the screen.
  const big=[...document.querySelectorAll('body *')].slice(0,3000).filter(el=>own(el)&&!chrome(el)&&visible(el)&&inFold(el)).reduce((n,el)=>Math.max(n,parseFloat(css(el).fontSize)||0),0);
  const claimSize=claim?parseFloat(css(claim).fontSize):0;
  return {fold,media:+media.toFixed(2),claim:!!claim,claimSize,maxText:big,claimRatio:claim&&big?+(claimSize/big).toFixed(2):null,claimText:claim?(claim.innerText||'').trim().slice(0,80):null,action:!!action,actionText:action?(action.innerText||'').trim().slice(0,40):null};})();
 const rootBg=[document.body,document.documentElement].map(el=>rgba(getComputedStyle(el).backgroundColor)).find(c=>c?.[3]>.5)||[255,255,255,1];
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
  nestedCards:{count:nestedCards.length,hosts:nestedHosts.size,targets:sample(nestedCards)},
  iconBoxes:{count:iconBoxes.length,targets:sample(iconBoxes)},
  typography:{families:[...families].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,count])=>({name,count})),sizes:sizes.size,weights:weights.size,body,h1:h1Size,display,ratio:display?display/body:null},
  accents:accents.slice(0,60),hueBuckets:hues.size,craft:{loadedFonts:loadedFonts.slice(0,12),imagery,fontSizes:sizes.size},
  hero,
  accentWords:{count:accentWords.length,targets:sample(accentWords)},tailSignup:{count:tailSignup.length,targets:sample(tailSignup)},emptyFrames:{count:emptyFrames.length,targets:sample(emptyFrames)},heroCta,firstScreen,
  rootBackground:rootBg?{rgb:rootBg.slice(0,3),dark:lum(rootBg)<.05}:null,
  editorial:{tracked:tracked.length,numbered:numbered.length,headings:uniqueHeads.length,periodHeadings:periodHeads.length,serifDisplay:bigHeads.length?+(bigHeads.filter(isSerif).length/bigHeads.length).toFixed(2):0,paper:!!rootBg&&(([r,g,b])=>r>=g&&g>=b&&r-b>=6&&r-b<=45&&b>=195)(rootBg),targets:sample([...periodHeads,...tracked,...numbered])},
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
 'nested-cards':{ko:['카드 안의 카드','둥근 상자 안에 또 둥근 상자를 넣으면 테두리·그림자가 겹쳐 위계가 흐려진다. AI 화면이 정보를 묶을 때 흔히 쓰는 방식이다.','바깥 상자나 안쪽 상자 중 하나만 남긴다. 안쪽 묶음은 여백, 구분선, 제목 크기로 나눈다.'],ja:['カードの中のカード','角丸の箱の中にさらに角丸の箱を入れると、枠線や影が重なって階層がぼやける。AI生成の画面が情報をまとめるときによく使う形。','外側か内側のどちらか一方だけを箱にする。内側のまとまりは余白、区切り線、見出しのサイズで分ける。'],en:['Cards inside cards','Rounded boxes nested in rounded boxes stack borders and shadows and blur the hierarchy; a common AI way to group content.','Keep only one level of boxes. Separate the inner groups with spacing, rules or heading size.']},
 'boxed-icons':{ko:['둥근 사각형 안의 아이콘 반복','연한 색 둥근 사각형에 아이콘을 하나씩 넣어 늘어놓는 것은 AI 기능 소개 블록의 정형이다.','아이콘이 정말 필요한지 먼저 본다. 남긴다면 상자 없이 글자 크기에 맞춘 선 아이콘으로, 또는 실제 화면·사진으로 바꾼다.'],ja:['角丸の四角に入ったアイコンの繰り返し','薄い色の角丸の四角にアイコンをひとつずつ入れて並べるのは、AIが作る機能紹介ブロックの定型。','まずアイコンが本当に必要かを考える。残すなら箱なしで文字サイズに合わせた線のアイコンに、または実際の画面や写真に置き換える。'],en:['Icons in tinted rounded squares','A row of icons, each in its own pale rounded square, is the stock AI feature block.','Ask whether the icons are needed at all. If they stay, drop the boxes and size line icons to the text, or use real screenshots or photos.']},
 'tracked-labels':{ko:['자간 넓힌 작은 대문자 라벨 반복','"SOUTH-FACING CABINS · SLEEPS TWO" 같은 작은 대문자 라벨을 섹션마다 붙이는 것은 2025–26년 AI 사이트의 에디토리얼 템플릿 신호다.','라벨은 정보가 있을 때만(날짜, 카테고리). 장식용 눈썹 라벨은 지우고 제목이 스스로 말하게 한다.'],ja:['字間を広げた小さな大文字ラベルの多用','「SOUTH-FACING CABINS · SLEEPS TWO」のような小さな大文字ラベルを各セクションに付けるのは、2025〜26年のAIサイトに多いエディトリアル風テンプレートのサイン。','ラベルは日付・カテゴリなど情報があるときだけ。飾りの見出しラベルは外し、見出し自体で伝える。'],en:['Repeated tiny tracked uppercase labels','Small letter-spaced caps over every section ("SOUTH-FACING CABINS · SLEEPS TWO") are the 2025–26 editorial AI template.','Keep labels only when they carry information (date, category); drop decorative eyebrows and let headings speak.']},
 'numbered-labels':{ko:['번호 붙인 섹션 라벨("01 / REFERENCES")','"01 / …", "STEP 1 · …" 라벨은 순서가 없는 내용에도 붙는 AI 템플릿 장식이다.','실제 순서가 있는 절차에만 번호를 쓰고, 나머지는 번호 없이 제목만.'],ja:['番号付きのセクションラベル（「01 / REFERENCES」）','「01 / …」「STEP 1 · …」は順序のない内容にも付けられるAIテンプレートの飾り。','実際に手順があるところだけ番号を使い、ほかは見出しだけにする。'],en:['Numbered section labels ("01 / REFERENCES")','"01 / …" and "STEP 1 · …" labels get stamped on content with no real order — an AI template ornament.','Number only real sequences; elsewhere use plain headings.']},
 'period-headlines':{ko:['마침표로 끝나는 짧은 대형 제목 반복','"Stay by the sea." "Made slowly. Kept for years."처럼 모든 섹션 제목이 마침표 달린 짧은 문장이면 생성형 카피의 리듬으로 읽힌다.','제목 하나만 선언문으로 두고, 나머지는 내용을 설명하는 제목(명사구·질문)으로 바꾼다.'],ja:['ピリオドで終わる短い大見出しの連続','「Stay by the sea.」のように全セクションの見出しがピリオド付きの短文だと、生成AIのコピーのリズムに見える。','宣言文の見出しは一つだけにし、ほかは内容を説明する見出しにする。'],en:['Short display headings ending in a period','When every section headline is a clipped sentence with a period ("Stay by the sea."), it reads as generated copy rhythm.','Keep one declarative headline; make the rest descriptive (noun phrases, questions).']},
 'accent-word':{ko:['제목의 한 단어만 다른 색','제목 안에서 한 구절만 강조색으로 칠하는 것은 AI 랜딩 페이지의 단골 수법이다(그라데이션이 아닌 단색도 마찬가지).','강조는 글자 크기·굵기·줄바꿈이나 문장 자체로 만든다. 색은 행동 버튼과 상태 표시에 아낀다.'],ja:['見出しの一語だけ別の色','見出しの一部だけをアクセントカラーで塗るのは、AIランディングページの定番の手口（グラデーションでない単色でも同じ）。','強調は文字の大きさ・太さ・改行や文そのもので作る。色は行動ボタンや状態表示に取っておく。'],en:['One coloured word in a headline','Painting one phrase of a headline in the accent colour is a stock move of AI landing pages, solid colour as much as gradient.','Make emphasis with size, weight, line breaks or the sentence itself. Save colour for actions and states.']},
 'newsletter-tail':{ko:['페이지 끝의 이메일 구독란','내용과 상관없이 맨 끝에 붙는 이메일 하나짜리 구독 상자는 생성된 페이지의 기본 마무리다.','구독할 이유(정기 소식, 재입고 알림 등)가 실제로 있을 때만 두고, 페이지의 주 행동으로 끝낸다.'],ja:['ページ末尾のメール登録欄','内容と関係なく最後に付くメールアドレスだけの登録ボックスは、生成ページの定番の締め方。','登録する理由（定期のお知らせ、再入荷通知など）が本当にあるときだけ置き、ページの主な行動で締める。'],en:['Email sign-up box at the end','A lone email sign-up bolted to the bottom of the page, whatever the page is for, is the default ending of generated pages.','Keep it only when there is something to subscribe to, and end the page on its primary action.']},
 'empty-frames':{ko:['빈 이미지 틀','배경색이나 테두리만 있고 안이 빈 상자는 넣을 사진·화면이 없다는 표시다.','실제 사진이나 제품 화면을 넣거나, 출처를 밝힌 임시 사진(ui-refiner photos)을 쓰거나, 틀을 없애고 글과 표로 보여 준다.'],ja:['空の画像枠','背景色や枠線だけで中身のない箱は、入れる写真や画面がないことの表れ。','実際の写真や製品画面を入れるか、出典付きの仮写真（ui-refiner photos）を使うか、枠をやめて文章や表で見せる。'],en:['Empty image frames','Boxes with only a fill or border and nothing inside say there was no photo or screen to show.','Put in a real photo or product screen, use credited stand-ins (ui-refiner photos), or drop the frame and show the content as text or a table.']},
 'hero-cta-below':{ko:['첫 화면에서 잘린 히어로','제목은 첫 화면에 있는데 그 행동 버튼은 화면 아래로 밀려 있다. 1440×900에서 확인했다.','제목·소개문·여백을 줄여 주 행동을 첫 화면에 올리거나, 히어로를 한 화면 안에 맞춘다.'],ja:['ファーストビューで切れるヒーロー','見出しはファーストビューにあるのに、その行動ボタンが画面の下に押し出されている（1440×900で確認）。','見出し・リード文・余白を詰めて主な行動をファーストビューに上げるか、ヒーローを1画面に収める。'],en:["Hero that misses its screen","The headline is on the first screen but its call to action is pushed below it at 1440×900.","Tighten the headline, intro and spacing so the primary action is on the first screen, or fit the hero to one screen."]},
 'tinted-page':{ko:['흰색 대신 옅은 미색 배경','페이지 바탕이 순백이 아닌 옅은 회백·미색이다. 보정 데이터에서 사람이 만든 사이트는 70–87%가 순백이고 미색은 약 10%인데, AI 사이트는 25–40%가 미색이었다.','브랜드 근거가 없으면 순백을 쓰거나, 바탕색을 쓸 거라면 브랜드 색에서 온 분명한 색으로 정한다.'],ja:['白ではなく薄いオフホワイトの背景','ページの地が純白ではなく、ごく薄いグレーやクリーム色。校正データでは人が作ったサイトの70〜87%が純白でオフホワイトは約10%、AIサイトは25〜40%がオフホワイトだった。','ブランド上の根拠がなければ純白にするか、地色を使うならブランド色から決めたはっきりした色にする。'],en:['Faint off-white page instead of white','The page surface is a faint grey or cream rather than white. In the calibration data 70–87% of human-made sites use plain white and about 10% off-white; 25–40% of AI sites use off-white.','Without a brand reason use plain white, or if the page gets a surface colour, take a clear one from the brand.']},
 'paper-serif':{ko:['크림색 배경 + 세리프 대형 제목','따뜻한 오프화이트 배경에 세리프 디스플레이 제목은 2025–26년 AI 사이트의 기본 "고급" 룩이다(단독으로는 브랜드 선택일 수 있음).','브랜드 근거가 있으면 유지하되, 서체·배경 중 하나는 브랜드 고유의 것으로. 근거가 없으면 제품 사진·색으로 개성을 만든다.'],ja:['クリーム色の背景＋セリフの大見出し','温かいオフホワイトの背景にセリフ体の大見出しは、2025〜26年のAIサイトの定番「上質」ルック（単独ならブランドの選択の場合もある）。','ブランド上の根拠があれば維持し、書体か背景のどちらかはブランド固有のものにする。'],en:['Cream paper background with serif display type','Warm off-white plus a serif display face is the default "premium" look of 2025–26 AI sites (alone it may be a brand choice).','Keep it only with a brand reason, and make either the typeface or the surface specific to the brand.']},
 'buzzword-copy':{ko:['상투적 마케팅 문구','"잠재력을 깨우세요", "seamless" 같은 문구는 AI 카피의 대표 신호이며 아무 정보도 주지 않는다.','무엇을, 누구를 위해, 얼마나 빨리/싸게 하는지 구체적 사실과 숫자로 다시 쓴다.'],en:['Buzzword copy','"Unlock your potential", "seamless" etc. are classic AI copy and carry no information.','Rewrite with concrete facts: what it does, for whom, with numbers.']},
 'generic-cta':{ko:['같은 일반 CTA 반복("Learn more" 등)','같은 문구의 버튼이 여러 번 나오면 무엇을 눌러야 할지 흐려진다.','주 행동 하나를 정하고, 나머지는 목적지를 말하는 구체적 링크 문구로("요금제 비교", "API 문서 보기").'],en:['Repeated generic CTAs','Many identical "Learn more" buttons blur the primary action.','Pick one primary action; make the rest specific ("Compare plans", "Read the API docs").']}
};
for(const [id,text] of Object.entries(jaSignals))copy[id].ja=text;
const langKey=lang=>['en','ja'].includes(lang)?lang:'ko';

export const signalTitle=(id,lang='ko')=>copy[id]?.[langKey(lang)][0];

// Calibrated on 30 ChatGPT Sites vs 26 human sites (2026-11, scripts/calibrate-scan.mjs):
// transition: all and repeated generic CTAs fired more on human sites, so they are reported but not scored.
const UNSCORED=new Set(['transition-all','generic-cta','tinted-page','newsletter-tail','empty-frames','hero-cta-below','accent-word']);
const TH={tracked:6,trackedStrong:12,numbered:3,period:3,periodStrong:5,nested:3,nestedHosts:3,iconBoxes:3,emptyFrames:2};

/** Weighted sum of signals, dampened 15% per craft signal. */
export function scoreSignals(signals,craft=[]){
 const raw=signals.reduce((n,s)=>n+s.weight,0),score=Math.min(100,Math.round(raw*100/18*(1-.15*craft.length)));
 return {score,band:score>=60?'high':score>=30?'medium':signals.some(s=>s.weight>0)?'low':'none'};
}

/** Turns raw page metrics into ranked, explained signals. Pure; safe to unit-test. */
export function evaluateAiTells(m,{lang='ko'}={}){
 const L=langKey(lang),out=[];
 // weight 0 keeps a finding in the report without scoring it (calibrated as common on human-made sites).
 const add=(id,strength,evidence,targets=[],weight=null)=>{const [title,why,fix]=copy[id][L];out.push({id,strength,weight:weight??(UNSCORED.has(id)?0:{strong:3,moderate:2,weak:1}[strength]),...(weight===0||UNSCORED.has(id)?{scored:false}:{}),title,why,fix,evidence,targets});};
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
 // Scans saved before these collectors existed have no nestedCards/iconBoxes; skip rather than guess.
 if(m.nestedCards&&m.nestedCards.count>=TH.nested&&m.nestedCards.hosts>=TH.nestedHosts)add('nested-cards','moderate',{nested:m.nestedCards.count,hosts:m.nestedCards.hosts},m.nestedCards.targets);
 if(m.iconBoxes&&m.iconBoxes.count>=TH.iconBoxes)add('boxed-icons','moderate',{boxes:m.iconBoxes.count},m.iconBoxes.targets);
 const fams=m.typography.families,top=fams[0]?.name;
 // Japanese pages with a real Japanese stack (Hiragino, Noto Sans JP …) follow local convention, not a template default.
 if(top&&genericFonts.includes(top)&&fams.filter(f=>f.count>=3).length<=1&&!(m.japanese&&m.japaneseFontCoverage>=.5))add('generic-type','weak',{families:fams.map(f=>f.name)});
 // Dense Japanese portals and stores use modest heading sizes by convention; that is not a template tell.
 if(m.typography.ratio&&m.typography.ratio<2&&!m.japanese)add('flat-scale','weak',{display:m.typography.display,body:m.typography.body,ratio:+m.typography.ratio.toFixed(2)});
 const hits=new Map();for(const c of m.accents)for(const [name,ref] of Object.entries(defaultAccents))if(dist(c,ref)<14)hits.set(name,(hits.get(name)||0)+1);
 // Calibration (2026-11): plain blue defaults are as common on human sites; only indigo/violet/purple defaults score.
 if([...hits.values()].reduce((a,b)=>a+b,0)>=2)add('default-accent','moderate',{matches:Object.fromEntries(hits)},[],[...hits.keys()].some(k=>/indigo|violet|purple/.test(k))?null:0);
 const e=m.editorial;
 if(e){
  if(e.tracked>=TH.tracked)add('tracked-labels',e.tracked>=TH.trackedStrong?'strong':'moderate',{labels:e.tracked},e.targets);
  if(e.numbered>=TH.numbered)add('numbered-labels','moderate',{labels:e.numbered},e.targets);
  if(e.periodHeadings>=TH.period)add('period-headlines',e.periodHeadings>=TH.periodStrong?'strong':'moderate',{periodHeadings:e.periodHeadings,headings:e.headings},e.targets);
  if(e.paper&&e.serifDisplay>=.5)add('paper-serif','moderate',{serifDisplay:e.serifDisplay});
 }
 // Calibration (2026-11): faint off-white surfaces are ~10% of human sites and 25–40% of AI sites, but scoring it raised holdout human false positives 3%→7%, so it is reported only; refine uses it to keep directions apart.
 const bg=m.rootBackground?.rgb;
 if(bg&&!out.some(x=>x.id==='paper-serif')&&Math.min(...bg)>=236&&!(Math.min(...bg)>=247&&Math.max(...bg)-Math.min(...bg)<=8)&&Math.max(...bg)-Math.min(...bg)<=14)add('tinted-page','weak',{background:`rgb(${bg.join(',')})`});
 if(m.accentWords&&m.accentWords.count>=1)add('accent-word','weak',{headings:m.accentWords.count},m.accentWords.targets);
 if(m.tailSignup&&m.tailSignup.count>=1)add('newsletter-tail','weak',{count:m.tailSignup.count},m.tailSignup.targets);
 if(m.emptyFrames&&m.emptyFrames.count>=TH.emptyFrames)add('empty-frames','moderate',{frames:m.emptyFrames.count},m.emptyFrames.targets);
 if(m.heroCta?.below)add('hero-cta-below','weak',{headlineTop:m.heroCta.headlineTop,ctaTop:m.heroCta.ctaTop,fold:m.heroCta.fold});
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
 const {score,band}=scoreSignals(out,craft);
 const absent=Object.keys(copy).filter(id=>!out.some(s=>s.id===id)&&!(id==='large-gradient'&&out.some(s=>s.id==='purple-gradient')));
 return {heuristic:true,blocking:false,score,band,craft,signals:out,absent,measures:e?{tracked:e.tracked,numbered:e.numbered,periodHeadings:e.periodHeadings,headings:e.headings,serifDisplay:e.serifDisplay,paper:e.paper,...(m.nestedCards?{nestedCards:m.nestedCards.count,nestedHosts:m.nestedCards.hosts}:{}),...(m.iconBoxes?{iconBoxes:m.iconBoxes.count}:{})}:null};
}
