import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {measureMotion,compactMotion,summarizeMotion} from '../src/motion.mjs';

const raw=(o={})=>({vw:1440,vh:900,videos:[],frames:[],carousels:[],change:0,below:40,hidden:0,revealed:0,revealLibs:[],
 headerFixed:false,headerBlur:false,bgFixed:0,loops:0,marquee:0,intro:false,smooth:[],canvas:0,lottie:false,
 transitions:{n:0,ms:[],all:0,easings:{}},...o});

test('motion: compact classifies hero video, hero slides, reveals and the rest', () => {
 const still=compactMotion(raw());
 assert.equal(still.heroVideo,false);assert.equal(still.heroSlides,false);assert.equal(still.reveal,false);assert.equal(still.headerBlur,false);
 const video=compactMotion(raw({videos:[{area:.8,loop:true,muted:true,autoplay:true,playing:false}],change:.4}));
 assert.equal(video.heroVideo,true);assert.equal(video.heroSlides,false,'a moving video hero is not a slider');
 assert.equal(compactMotion(raw({videos:[{area:.1,loop:true,muted:true,autoplay:true}]})).heroVideo,false,'a small video is not a hero');
 assert.equal(compactMotion(raw({frames:[{area:.7,kind:'youtube'}]})).heroVideo,true);
 const slides=compactMotion(raw({change:.3,carousels:['swiper']}));
 assert.equal(slides.heroSlides,true);assert.equal(slides.carousel,true);
 assert.equal(compactMotion(raw({change:.05})).heroSlides,false,'small changes (a blinking caret, a clock) do not count');
 const rev=compactMotion(raw({below:40,hidden:12,revealed:10}));
 assert.equal(rev.reveal,true);assert.equal(rev.revealShare,.25);
 assert.equal(compactMotion(raw({revealed:1})).reveal,false,'one element is not a reveal habit');
 const t=compactMotion(raw({transitions:{n:4,ms:[0,200,300,400],all:2,easings:{ease:3,'cubic-bezier(0.23, 1, 0.32, 1)':1}}}));
 assert.equal(t.transitionMs,300);assert.equal(t.transitionShare,.75);assert.equal(t.transitionAll,.67);assert.equal(t.easing,'ease');
});

test('motion: summary gives shares per group', () => {
 const recs=[{g:'KR 1',m:compactMotion(raw({videos:[{area:.9,autoplay:true}]}))},{g:'KR 1',m:compactMotion(raw())},{g:'JP 2',m:compactMotion(raw({headerFixed:true,headerBlur:true}))}];
 const s=summarizeMotion(recs.map(r=>({...r.m,group:r.g})),r=>r.group);
 assert.equal(s['KR 1'].n,2);assert.equal(s['KR 1'].heroVideo,.5);assert.equal(s['JP 2'].headerBlur,1);
 assert.equal(s.all.n,3);
});

const themes=fileURLToPath(new URL('../skills/ui-refiner-agent/reference/themes/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.mp4':'video/mp4','.json':'application/json'};

test('motion: measures the effects of the jp-place-photo sample in a real browser', {timeout:120000}, async () => {
 const server=http.createServer(async (req,res)=>{
  const f=path.join(themes,decodeURIComponent(new URL(req.url,'http://x').pathname));
  try{const b=await fs.readFile(f);res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});res.end(b);}
  catch{res.writeHead(404);res.end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/jp-place-photo/sample.html`;
 const {chromium}=await import('playwright');
 const browser=await chromium.launch();
 const run=async (q,watchMs,page0=base)=>{
  const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  try{const page=await ctx.newPage();await page.goto(page0+q,{waitUntil:'load'});return compactMotion(await measureMotion(page,{watchMs}));}
  finally{await ctx.close();}
 };
 try{
  const big=base.replace('jp-place-photo','jp-creative-bigtype');
  const [still,all,slides,strip,noStrip]=await Promise.all([run('',3000),run('?fx=all',3000),run('?fx=hero-slides',7500),run('?fx=marquee',2000,big),run('',2000,big)]);
  assert.equal(strip.marquee,true,'the marquee strip');assert.equal(noStrip.marquee,false);assert.equal(all.marquee,false);
  assert.equal(still.heroVideo,false);assert.equal(still.heroSlides,false);assert.equal(still.reveal,false);
  assert.equal(still.headerFixed,true);assert.equal(still.headerBlur,false);
  assert.equal(all.heroVideo,true);assert.equal(all.reveal,true);assert.ok(all.revealed>=3,`revealed ${all.revealed}`);
  assert.equal(all.headerBlur,true);
  assert.equal(slides.heroVideo,false);assert.equal(slides.heroSlides,true,`change ${slides.change}`);
 }finally{await browser.close();server.close();}
});
