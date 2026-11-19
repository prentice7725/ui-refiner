import test from 'node:test';
import assert from 'node:assert/strict';
import {measureColours,cellClass} from '../src/first-screen-colour.mjs';
import {fit} from '../scripts/refine-bench/trade-fit.mjs';

test('first-screen colours: a page of photos reads as image, a white page with blue links as light/blue', () => {
 assert.equal(cellClass('image'),'image');
 const photo=measureColours({cells:Array(336).fill('image'),acc:[],rootBg:[255,255,255]});
 assert.equal(photo.ground,'image');assert.equal(photo.accent,'ink');
 const plain=measureColours({cells:Array(336).fill([255,255,255]),acc:Array(5).fill([20,90,220]),rootBg:[255,255,255]});
 assert.equal(plain.ground,'light');assert.equal(plain.accent,'blue');
});

test('trade fit scores a mock by how common its choices are in the measured group', () => {
 const g={hero:{share:{'full-bleed':.7,'below-fold':.3}},colour:{ground:{image:.6,light:.4},accent:{blue:.5,ink:.5}},type:{body:15,displayRatio:2.4,serifDisplay:.33}};
 const typical=fit({hero:'full-bleed',ground:'image',accent:'blue',body:16,ratio:2.6,serif:true},g);
 assert.equal(typical.typical,.6);assert.equal(typical.matches,3);assert.equal(typical.of,3);
 const odd=fit({hero:'left+panel',ground:'dark',accent:'purple',body:18,ratio:4,serif:false},g);
 assert.equal(odd.typical,0);assert.equal(odd.matches,0);
});

test('first-screen colours see a cover photo under its overlay, and not one hidden by a panel', async () => {
 const {chromium}=await import('playwright'),{colourProbe}=await import('../src/first-screen-colour.mjs');
 const gif='data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
 const b=await chromium.launch();
 try{
  const p=await b.newPage({viewport:{width:1440,height:900}}),ground=async html=>{await p.setContent(`<body style="margin:0">${html}</body>`);return measureColours(await p.evaluate(colourProbe)).ground;};
  // A sibling overlay and a ::after overlay both sit above the photo; the box's fallback colour is not the ground.
  assert.equal(await ground(`<section style="position:relative;height:900px;background:#2a4fa0"><img src="${gif}" style="width:100%;height:100%"><div style="position:absolute;inset:0;background:linear-gradient(#0003,#0006)"></div></section>`),'image');
  assert.equal(await ground(`<style>.h{position:relative;height:900px;background:#2a4fa0}.h::after{content:"";position:absolute;inset:0;background:linear-gradient(#0000,#0008)}</style><section class=h><img src="${gif}" style="width:100%;height:100%"></section>`),'image');
  assert.equal(await ground(`<div style="height:900px;background:#1e40af"></div>`),'blue');
  assert.equal(await ground(`<img src="${gif}" style="position:absolute;width:100%;height:900px"><div style="position:relative;height:900px;background:#1e40af"></div>`),'blue');
  // Some pages have no body element (seen on Korean public sites); the probe still measures them.
  await p.setContent('<body></body>');await p.evaluate(()=>{const d=document.createElement('div');d.style.cssText='height:900px;background:#1e40af';document.body.replaceWith(d);});
  assert.equal(measureColours(await p.evaluate(colourProbe)).ground,'blue');
 }finally{await b.close();}
});
