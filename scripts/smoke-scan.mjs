#!/usr/bin/env node
// Real browser: the deliberately AI-looking fixture must score high; the plain demo must stay low.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {createDemoServer} from '../examples/demo-server.mjs';
import {fileURLToPath} from 'node:url';
import {scanUrl} from '../src/scan.mjs';

const slop=await fs.readFile(new URL('../examples/ai-slop-landing.html',import.meta.url),'utf8');
const slopServer=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(slop);});
const cleanServer=createDemoServer();
for(const s of [slopServer,cleanServer]){s.listen(0,'127.0.0.1');await once(s,'listening');}
const out=await fs.mkdtemp(path.join(os.tmpdir(),'ui-refiner-scan-'));
try{
 const bad=(await scanUrl(`http://127.0.0.1:${slopServer.address().port}`,{out:path.join(out,'slop')})).result;
 const good=(await scanUrl(`http://127.0.0.1:${cleanServer.address().port}`,{out:path.join(out,'clean'),lang:'en'})).result;
 const ids=bad.aiLook.signals.map(s=>s.id);
 for(const id of ['purple-gradient','gradient-text','emoji-icons','card-grid','buzzword-copy','eyebrow-pill','transition-all'])assert.ok(ids.includes(id),`missing ${id}: ${ids}`);
 assert.equal(bad.aiLook.band,'high');
 assert.ok(good.aiLook.score<20,`clean demo scored ${good.aiLook.score}: ${good.aiLook.signals.map(s=>s.id)}`);
 assert.ok(bad.quality.some(q=>q.rule==='text-contrast'),'baseline quality checks run during the scan');
 for(const v of bad.views)assert.ok((await fs.stat(path.join(out,'slop',v.screenshot))).size>1000);
 assert.match(await fs.readFile(path.join(out,'slop','DESIGN_REVIEW.md'),'utf8'),/AI 티 지수/);
 // Japanese fixture: AI tells plus Japanese typesetting problems, reported in Japanese.
 const ja=(await scanUrl(fileURLToPath(new URL('../examples/ai-slop-landing-ja.html',import.meta.url)),{out:path.join(out,'ja'),lang:'ja'})).result;
 assert.equal(ja.aiLook.band,'high');assert.ok(ja.aiLook.signals.some(s=>s.id==='buzzword-copy'));
 const jaIds=ja.japanese.issues.map(i=>i.id);
 for(const id of ['ja-font-fallback','ja-line-height','ja-break-all','ja-italic','ja-half-kana','ja-orphans'])assert.ok(jaIds.includes(id),`missing ${id}: ${jaIds}`);
 assert.equal(good.japanese.japanese,false,'English demo is not treated as Japanese');
 assert.match(await fs.readFile(path.join(out,'ja','DESIGN_REVIEW.md'),'utf8'),/日本語タイポグラフィ/);
 // Redesign loop: the fixed page compared with the slop scan. It also guards a well-made Japanese page against false positives.
 const fixed=(await scanUrl(fileURLToPath(new URL('../examples/redesign-landing-ja.html',import.meta.url)),{out:path.join(out,'fixed'),lang:'ja',compare:path.join(out,'ja')})).result;
 assert.ok(fixed.aiLook.score<10,`redesign scored ${fixed.aiLook.score}: ${fixed.aiLook.signals.map(s=>s.id)}`);
 assert.deepEqual(fixed.japanese.issues.map(i=>i.id),[],'redesign has no Japanese typesetting issues');
 assert.ok(fixed.comparison.scoreDelta<=-90&&fixed.comparison.signals.resolved.length>=10&&fixed.comparison.japanese.resolved.length===jaIds.length);
 for(const name of ['before-scan-desktop.png','previous-scan.json'])await fs.stat(path.join(out,'fixed',name));
 assert.match(await fs.readFile(path.join(out,'fixed','DESIGN_REVIEW.md'),'utf8'),/## 1\. 前回スキャンとの比較/);
 await fs.mkdir('artifacts/upstream-contracts',{recursive:true});
 await fs.writeFile('artifacts/upstream-contracts/scan.json',JSON.stringify({slop:{score:bad.aiLook.score,signals:ids},clean:{score:good.aiLook.score,signals:good.aiLook.signals.map(s=>s.id)},ja:{score:ja.aiLook.score,signals:ja.aiLook.signals.map(s=>s.id),typography:jaIds}},null,2)+'\n');
 console.log(`scan smoke ok: slop=${bad.aiLook.score} [${ids}], clean=${good.aiLook.score}, ja=${ja.aiLook.score} [${jaIds}], redesign=${fixed.aiLook.score} (${fixed.comparison.scoreDelta})`);
}finally{slopServer.close();cleanServer.close();await fs.rm(out,{recursive:true,force:true});}
