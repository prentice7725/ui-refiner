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
