import test from 'node:test';
import assert from 'node:assert/strict';
import {robotsAllows,splitOf,compactSite,summarizeReference,renderReferenceSummary,firstFamily} from '../src/reference.mjs';

test('robots.txt: only the * group applies, longest rule wins, Allow wins ties', () => {
 assert.equal(robotsAllows('User-agent: *\nDisallow: /'),false);
 assert.equal(robotsAllows('User-agent: *\nDisallow: /admin\n'),true);
 assert.equal(robotsAllows('User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\nDisallow: /*.php$'),true,'another bot\'s group does not apply');
 assert.equal(robotsAllows('User-agent: *\nDisallow: /\nAllow: /$'),true,'Allow: /$ opens only the top page');
 assert.equal(robotsAllows('User-agent: *\nDisallow: /\nAllow: /$','/news/'),false);
 assert.equal(robotsAllows('User-agent: a\nUser-agent: *\nDisallow: /ja/','/ja/'),false,'grouped agents share rules');
 assert.equal(robotsAllows(''),true);
});

test('split is fixed per host and ignores www', () => {
 assert.equal(splitOf('www.example.co.jp'),splitOf('example.co.jp'));
 const hosts=Array.from({length:400},(_,i)=>`site${i}.jp`),tune=hosts.filter(h=>splitOf(h)==='tune').length/hosts.length;
 assert.ok(tune>.6&&tune<.8,`tune share ${tune}`);
});

const scan=(over={})=>({lang:'ja',aiLook:{score:12,band:'low',craft:['imagery'],signals:[{id:'card-grid',weight:2},{id:'transition-all',weight:0}],measures:{tracked:1}},
 japanese:{issues:[{id:'ja-tiny'}]},quality:[{rule:'text-contrast',count:3}],
 raw:[{viewport:'desktop',metrics:{typography:{families:[{name:'"Noto Sans JP", sans-serif',count:9}],sizes:7,weights:3,body:16,h1:40,display:40,ratio:2.5},craft:{loadedFonts:['Noto Sans JP']},
  hueBuckets:2,rootBackground:{rgb:[255,255,255],dark:false},centered:{ratio:.2},rounding:{ratio:.1},cardGrids:{count:1},gradients:{large:0},glass:{count:0},editorial:{tracked:1},text:'本文テキスト'},
  ja:{japanese:true,jaRatio:.9,fontFallback:{ratio:0},lineHeight:{paragraphs:4,tight:1,median:1.8,bodySize:15.984},phraseAware:2}}],...over});

test('compactSite keeps measurements and drops page text', () => {
 const c=compactSite(scan());
 assert.deepEqual(c.scored,['card-grid']);
 assert.equal(c.ja.lineHeight,1.8);assert.equal(c.ja.bodySize,15.98);assert.equal(c.ja.tightShare,.25);
 assert.equal(c.type.webfonts,1);assert.deepEqual(c.quality,{'text-contrast':3});
 assert.ok(!JSON.stringify(c).includes('本文テキスト'),'no page text');
 assert.equal(compactSite(scan({raw:null})).type,null);
});

test('summary groups by category and renders a table', () => {
 const sites=[{category:'gov',url:'https://a.jp/',status:'ok',split:'tune',...compactSite(scan())},
  {category:'corp',url:'https://b.jp/',status:'ok',split:'holdout',...compactSite(scan())},
  {category:'corp',url:'https://c.jp/',status:'robots',split:'tune'}];
 const s=summarizeReference(sites);
 assert.equal(s.ok,2);assert.deepEqual(s.skippedRobots,['https://c.jp/']);assert.deepEqual(s.split,{tune:1,holdout:1});
 assert.equal(s.all.japanese.lineHeight.p50,1.8);assert.deepEqual(s.all.japanese.topFamilies,[['noto sans jp',2]]);
 assert.equal(firstFamily("'Hiragino Sans', sans-serif"),'hiragino sans');
 const md=renderReferenceSummary(s);
 assert.match(md,/\| all \(2\) \| corp \(1\) \| gov \(1\) \|/);assert.match(md,/JA body line-height \| 1\.8 \/ 1\.8 \/ 1\.8/);
});
