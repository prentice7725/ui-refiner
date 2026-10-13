import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {demoHtml} from '../examples/demo-server.mjs';
import {lintapplePolicy} from '../src/presets.mjs';
test('source-integrated runtime dependencies and lockfile match',async()=>{
 const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
 const lock=JSON.parse(await readFile(new URL('../package-lock.json',import.meta.url),'utf8'));
 assert.equal(pkg.version,'0.3.0');
 assert.deepEqual(pkg.dependencies,{'axe-core':'4.14.0','playwright':'1.63.0'});
 assert.deepEqual(lock.packages[''].dependencies,pkg.dependencies);
 assert.equal(lock.version,pkg.version);
 assert.ok(!('lintapple' in pkg.dependencies));
});
test('bundled auditor source and upstream license files are present',async()=>{
 for(const path of ['../vendor/lintapple/src/index.js','../vendor/lintapple/LICENSE','../vendor/suta/skills/suta/scripts/audit.mjs','../vendor/suta/LICENSE']){
   assert.ok((await readFile(new URL(path,import.meta.url),'utf8')).length>0,path);
 }
});
test('default demo inherits approved family for native controls',()=>{
 assert.ok(lintapplePolicy.fonts.includes('system-ui'));
 assert.match(demoHtml,/button\{font-family:inherit;/);
 assert.match(demoHtml,/<body data-app-ready>/);
});
