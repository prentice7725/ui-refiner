import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {compareScans,keepBeforeImages,loadPreviousScan,renderComparison} from '../src/scan-compare.mjs';

const scan=(over={})=>({schemaVersion:1,tool:'ui-refiner scan',url:'https://example.com/pricing',scannedAt:'2026-10-28T00:00:00Z',locale:'ja-JP',
 aiLook:{score:80,band:'high',signals:[{id:'purple-gradient',strength:'strong'},{id:'glass',strength:'strong'},{id:'generic-cta',strength:'weak'}]},
 quality:[{rule:'text-contrast',count:5},{rule:'target-size',count:2}],japanese:{japanese:true,issues:[{id:'ja-orphans',severity:'medium'}]},views:[{viewport:'desktop',screenshot:'scan-desktop.png'}],...over});

test('comparison lists resolved, new and persisting signals with direction and quality deltas',()=>{
 const after=scan({url:'http://127.0.0.1:5173/pricing',scannedAt:'2026-10-28T01:00:00Z',aiLook:{score:20,band:'low',signals:[{id:'glass',strength:'moderate'},{id:'transition-all',strength:'weak'}]},quality:[{rule:'text-contrast',count:1},{rule:'target-size',count:2}],japanese:{japanese:true,issues:[{id:'ja-line-height',severity:'medium'}]}});
 const c=compareScans(scan(),after,{lang:'ja'});
 assert.equal(c.scoreDelta,-60);assert.deepEqual(c.warnings,['different-host']);
 assert.deepEqual(c.signals.resolved.map(s=>s.id),['purple-gradient','generic-cta']);
 assert.deepEqual(c.signals.added.map(s=>s.id),['transition-all']);
 assert.deepEqual(c.signals.persisting,[{id:'glass',title:'すりガラス（backdrop-filter blur）の多用',before:'strong',after:'moderate',change:'better'}]);
 assert.deepEqual(c.quality,[{rule:'text-contrast',before:5,after:1}]);assert.deepEqual(c.qualityTotal,{before:7,after:3});
 assert.deepEqual(c.japanese.resolved.map(s=>s.id),['ja-orphans']);assert.deepEqual(c.japanese.added.map(s=>s.id),['ja-line-height']);
});

test('different pages and locales are flagged instead of silently compared',()=>{
 const c=compareScans(scan(),scan({url:'https://example.com/about',locale:'ko-KR'}));
 assert.deepEqual(c.warnings,['different-page','different-locale']);assert.equal(c.japanese.resolved.length,0);
 assert.equal(compareScans(scan({japanese:{japanese:false,issues:[]}}),scan({japanese:{japanese:false,issues:[]}})).japanese,null);
});

test('rendered comparison is localized, links before/after images and says "none" for empty lists',()=>{
 const c={...compareScans(scan(),scan({aiLook:{score:0,band:'none',signals:[]}}),{lang:'ko'}),images:{desktop:'before-scan-desktop.png'}};
 const md=renderComparison(c,'ko',t=>`## 1. ${t}`).join('\n');
 assert.match(md,/## 1\. 이전 스캔과 비교/);assert.match(md,/AI 티 지수: 80 → 0 \(-80\)/);assert.match(md,/\[이전\]\(before-scan-desktop\.png\) \/ \[이후\]\(scan-desktop\.png\)/);
 assert.match(md,/✓ 보라·남색 그라데이션 배경/);assert.match(md,/\*\*새로 생긴 신호\*\*\n- 없음/);
 const ja=renderComparison(compareScans(scan(),scan({aiLook:{score:80,band:'high',signals:[{id:'glass',strength:'weak'}]}}),{lang:'ja'}),'ja',t=>t).join('\n');
 assert.match(ja,/すりガラス.*\(強 → 弱, 改善\)/);
});

test('previous scan loads from a folder, rejects other JSON and keeps screenshots before they are overwritten',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-refiner-compare-'));
 try{
  await assert.rejects(loadPreviousScan(root),/file not found/);
  await fs.writeFile(path.join(root,'scan.json'),JSON.stringify({tool:'other'}));
  await assert.rejects(loadPreviousScan(root),/not a ui-refiner scan/);
  await fs.writeFile(path.join(root,'scan.json'),JSON.stringify(scan()));await fs.writeFile(path.join(root,'scan-desktop.png'),'old-image');
  const previous=await loadPreviousScan(root);assert.equal(previous.scan.aiLook.score,80);
  assert.deepEqual(await keepBeforeImages(previous,root),{desktop:'before-scan-desktop.png'});
  assert.equal(await fs.readFile(path.join(root,'before-scan-desktop.png'),'utf8'),'old-image');
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
