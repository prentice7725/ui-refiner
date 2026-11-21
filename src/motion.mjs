// Motion on a live page: what moves by itself on the first screen (hero video, slides), what appears on scroll,
// whether the fixed header is blurred, and the transitions on links and buttons. Used to measure how often
// human-made Korean and Japanese sites use the optional theme effects (scripts/collect-motion.mjs).
import {PNG} from 'pngjs';

// In the page, right after load: the first screen, the libraries, and every content block below the fold that is
// hidden now (opacity, visibility or clip-path), marked so the scroll pass can see whether it appears.
function firstLook(){
 const vw=innerWidth,vh=innerHeight,area=r=>Math.max(0,Math.min(r.right,vw)-Math.max(r.left,0))*Math.max(0,Math.min(r.bottom,vh)-Math.max(r.top,0))/(vw*vh);
 const videos=[...document.querySelectorAll('video')].map(v=>({area:+area(v.getBoundingClientRect()).toFixed(2),autoplay:v.autoplay,loop:v.loop,muted:v.muted,playing:!v.paused&&v.currentTime>0})).filter(v=>v.area>0);
 const frames=[...document.querySelectorAll('iframe')].map(f=>{const s=f.src||'';return {area:+area(f.getBoundingClientRect()).toFixed(2),kind:/youtube|youtu\.be/.test(s)?'youtube':/vimeo/.test(s)?'vimeo':null};}).filter(f=>f.kind&&f.area>0);
 const has=sel=>{try{return !!document.querySelector(sel);}catch{return false;}};
 const carousels=Object.entries({swiper:'.swiper,.swiper-container',slick:'.slick-slider',splide:'.splide',owl:'.owl-carousel',flickity:'.flickity-enabled',glide:'.glide',keen:'.keen-slider',bxslider:'.bx-wrapper',slider:'[class*="slider"][class*="active"],.slide.active,.is-active[class*="slide"]'}).filter(([,s])=>has(s)).map(([k])=>k);
 const revealLibs=[['aos',has('[data-aos]')],['wow',has('.wow')],['sal',has('[data-sal]')],['scrollreveal',!!window.ScrollReveal],['gsap',!!window.gsap||!!window.TweenMax],['scrolltrigger',!!window.ScrollTrigger],['inview',has('[class*="fadein"],[class*="fade-in"],[class*="js-fade"],[class*="inview"],[class*="scroll-anim"]')]].filter(x=>x[1]).map(x=>x[0]);
 const smooth=[['lenis',has('html.lenis,.lenis-smooth')||!!window.Lenis],['locomotive',has('[data-scroll-container]')||!!window.LocomotiveScroll],['css-smooth',getComputedStyle(document.documentElement).scrollBehavior==='smooth']].filter(x=>x[1]).map(x=>x[0]);
 // Clipped away: an inset of half or more on any side (the clip-path reveal, inset(0 0 100% 0)).
 const clipped=cp=>/^inset\(/.test(cp)&&(cp.match(/[\d.]+%/g)||[]).some(v=>parseFloat(v)>=50);
 const op=el=>{let o=1;for(let e=el;e&&e.nodeType===1;e=e.parentElement){const s=getComputedStyle(e);o*=+s.opacity;if(s.visibility==='hidden'||clipped(s.clipPath))return 0;}return o;};
 let below=0,hidden=0,i=0;
 for(const el of document.querySelectorAll('img,video,picture,h2,h3,p,figure,li')){
  const r=el.getBoundingClientRect();
  if(r.width<40||r.height<16||r.top<vh+10)continue;
  const s=getComputedStyle(el);if(s.display==='none')continue;
  if(el.closest('nav,header,footer,[aria-hidden="true"],.swiper-slide:not(.swiper-slide-active),.slick-slide:not(.slick-active)'))continue;
  below++;
  if(op(el)<0.1){hidden++;el.dataset.uirMotion=String(i++);}
  if(below>=600)break;
 }
 const bgFixed=[...document.querySelectorAll('body *')].slice(0,4000).filter(e=>{const s=getComputedStyle(e);return s.backgroundAttachment.includes('fixed')&&s.backgroundImage!=='none'&&e.offsetWidth*e.offsetHeight>=0.3*vw*vh;}).length;
 // A cover at load: a fixed or absolute box over at least 90% of the screen with an opaque background.
 const cover=[...document.querySelectorAll('body *')].slice(0,4000).find(e=>{const s=getComputedStyle(e);if(!/fixed|absolute/.test(s.position)||s.display==='none'||s.visibility==='hidden'||+s.opacity<0.9)return false;
  const r=e.getBoundingClientRect();if(area(r)<0.9)return false;const m=s.backgroundColor.match(/[\d.]+/g);return m&&(m.length<4||+m[3]>=0.9)&&!(e.querySelector('video,img')&&e.closest('main,section,[class*="hero"],[class*="mv"],[class*="visual"]'));});
 if(cover)cover.dataset.uirCover='1';
 const links=[...document.querySelectorAll('a,button,[role="button"]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;}).slice(0,80);
 const tr={n:links.length,ms:[],all:0,easings:{}};
 for(const e of links){const s=getComputedStyle(e);const d=s.transitionDuration.split(',').map(x=>parseFloat(x)*(x.includes('ms')?1:1000));const ms=Math.max(0,...d);tr.ms.push(Math.round(ms));
  if(ms>0){if(/\ball\b/.test(s.transitionProperty))tr.all++;const f=s.transitionTimingFunction.split(',')[0].trim();tr.easings[f]=(tr.easings[f]||0)+1;}}
 return {vw,vh,videos,frames,carousels,below,hidden,revealLibs,smooth,bgFixed,coverAtLoad:!!cover,transitions:tr,
  canvas:[...document.querySelectorAll('canvas')].filter(c=>area(c.getBoundingClientRect())>=0.3).length,
  lottie:has('lottie-player,dotlottie-player,[class*="lottie"]')||!!window.lottie||!!window.bodymovin};
}

// In the page, after watching: infinite animations, whether the cover went away, and whether videos now play.
function afterWatch(){
 const vw=innerWidth,vh=innerHeight;
 let loops=0,marquee=0;
 for(const a of document.getAnimations?document.getAnimations():[]){
  const t=a.effect&&a.effect.getTiming&&a.effect.getTiming();if(!t||t.iterations!==Infinity||!['running','paused'].includes(a.playState))continue;
  const el=a.effect.target;if(!el||!el.getClientRects().length)continue;loops++;
  // A marquee: a strip at least 80% of the screen wide that slides sideways at a steady speed, 4 s or slower a lap
  // (a spinning loader or a pulsing dot is a loop, not a marquee).
  const k=JSON.stringify(a.effect.getKeyframes?a.effect.getKeyframes():[]),w=el.getBoundingClientRect().width;
  if(/translate(X|3d)?\(\s*-?[1-9]|translate(X|3d)?\(\s*-?0?\.\d*[1-9]/.test(k)&&/linear/.test(t.easing+k)&&+t.duration>=4000&&w>=0.8*vw)marquee++;
 }
 const c=document.querySelector('[data-uir-cover]');let coverGone=false;
 if(c){const r=c.getBoundingClientRect(),s=getComputedStyle(c);coverGone=!c.isConnected||s.display==='none'||s.visibility==='hidden'||+s.opacity<0.1||r.width*r.height<0.5*vw*vh||r.bottom<=0;}
 const playing=[...document.querySelectorAll('video')].map(v=>!v.paused&&v.currentTime>0);
 return {loops,marquee,coverGone:!document.querySelector('[data-uir-cover]')?true:coverGone,playing};
}

// In the page: scroll down step by step; a marked block that was hidden counts as revealed once it is on screen and
// at least half visible. The fixed header is checked at every step.
async function scrollPass(stepWait){
 const vw=innerWidth,vh=innerHeight,max=Math.min(document.documentElement.scrollHeight,24000),revealed=new Set();
 const clipped=cp=>/^inset\(/.test(cp)&&(cp.match(/[\d.]+%/g)||[]).some(v=>parseFloat(v)>=50);
 const op=el=>{let o=1;for(let e=el;e&&e.nodeType===1;e=e.parentElement){const s=getComputedStyle(e);o*=+s.opacity;if(s.visibility==='hidden'||clipped(s.clipPath))return 0;}return o;};
 let headerFixed=false,headerBlur=false;
 const header=()=>{for(const e of document.elementsFromPoint(vw/2,8)){const s=getComputedStyle(e);if(!/fixed|sticky/.test(s.position))continue;const r=e.getBoundingClientRect();
  if(r.top<=5&&r.width>=0.9*vw&&r.height>=30&&r.height<=240){headerFixed=true;if(/blur/.test(s.backdropFilter||s.webkitBackdropFilter||''))headerBlur=true;return;}}};
 header();
 for(let y=0;y<=max;y+=Math.round(vh*0.7)){
  scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,stepWait));header();
  for(const el of document.querySelectorAll('[data-uir-motion]')){if(revealed.has(el))continue;const r=el.getBoundingClientRect();if(r.bottom>0&&r.top<vh&&op(el)>=0.5)revealed.add(el);}
 }
 scrollTo({top:0,behavior:'instant'});
 return {revealed:revealed.size,headerFixed,headerBlur};
}

function changed(a,b){
 const A=PNG.sync.read(a),B=PNG.sync.read(b);if(A.width!==B.width||A.height!==B.height)return 1;
 let n=0,t=0;for(let i=0;i<A.data.length;i+=4*7){t++;if(Math.abs(A.data[i]-B.data[i])+Math.abs(A.data[i+1]-B.data[i+1])+Math.abs(A.data[i+2]-B.data[i+2])>60)n++;}
 return n/t;
}

// Measures a loaded page. watchMs: how long the first screen is watched for changes (slides turn every 4-7 s).
export async function measureMotion(page,{watchMs=8000,stepWait=350}={}){
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(1000);
 const first=await page.evaluate(firstLook);
 const shot=()=>page.screenshot({clip:{x:0,y:0,width:first.vw,height:first.vh},type:'png',animations:'allow'}).catch(()=>null);
 const shots=[await shot()];
 for(const ms of [watchMs/2,watchMs/2]){await page.waitForTimeout(ms);shots.push(await shot());}
 const later=await page.evaluate(afterWatch);
 const change=shots.slice(1).reduce((m,s)=>s&&shots[0]?Math.max(m,changed(shots[0],s)):m,0);
 const pass=await page.evaluate(scrollPass,stepWait);
 const videos=first.videos.map((v,i)=>({...v,playing:v.playing||!!later.playing[i]}));
 return {...first,videos,change:+change.toFixed(3),revealed:pass.revealed,headerFixed:pass.headerFixed,headerBlur:pass.headerBlur,
  loops:later.loops,marquee:later.marquee,intro:first.coverAtLoad&&later.coverGone};
}

const median=a=>{a=a.filter(x=>x>0).sort((x,y)=>x-y);return a.length?a[Math.floor(a.length/2)]:null;};

// One site's record: what the theme effects are compared with.
export function compactMotion(r){
 const heroVideo=r.videos.some(v=>v.area>=0.3&&(v.autoplay||v.playing||(v.loop&&v.muted)))||r.frames.some(f=>f.area>=0.3);
 const moving=r.change>=0.12;
 const ms=r.transitions.ms,timed=ms.filter(x=>x>0).length;
 const top=Object.entries(r.transitions.easings).sort((a,b)=>b[1]-a[1])[0];
 return {heroVideo,heroSlides:moving&&!heroVideo,carousel:r.carousels.length>0,carousels:r.carousels,change:r.change,
  reveal:r.revealed>=2,revealed:r.revealed,revealShare:r.below?+(r.revealed/r.below).toFixed(2):0,revealLibs:r.revealLibs,
  headerFixed:r.headerFixed,headerBlur:r.headerBlur,parallax:r.bgFixed>0,loops:r.loops,marquee:r.marquee>0,intro:!!r.intro,
  smooth:r.smooth.filter(s=>s!=='css-smooth'),canvas:r.canvas>0,lottie:!!r.lottie,
  transitionMs:median(ms),transitionShare:ms.length?+(timed/ms.length).toFixed(2):0,transitionAll:timed?+(r.transitions.all/timed).toFixed(2):0,easing:top?top[0]:null};
}

const SHARES=['heroVideo','heroSlides','carousel','reveal','headerFixed','headerBlur','parallax','marquee','intro','canvas','lottie'];
// Share of sites with each effect, per group and over all; medians for the transition timing.
export function summarizeMotion(records,groupOf){
 const groups={};
 for(const r of records){for(const g of [groupOf(r),'all'])(groups[g]||=[]).push(r);}
 const out={};
 for(const [g,rs] of Object.entries(groups)){
  const o={n:rs.length};
  for(const k of SHARES)o[k]=+(rs.filter(r=>r[k]).length/rs.length).toFixed(2);
  o.smoothScroll=+(rs.filter(r=>r.smooth.length).length/rs.length).toFixed(2);
  o.loops=+(rs.filter(r=>r.loops>0).length/rs.length).toFixed(2);
  o.transitionMs=median(rs.map(r=>r.transitionMs||0));
  const reveals=rs.filter(r=>r.reveal);o.revealShareMedian=reveals.length?median(reveals.map(r=>Math.round(r.revealShare*100)))/100:null;
  const e={};for(const r of rs)if(r.easing)e[r.easing]=(e[r.easing]||0)+1;o.easings=Object.entries(e).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>`${k} ${Math.round(100*v/rs.length)}%`);
  out[g]=o;
 }
 return out;
}
