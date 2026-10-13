#!/usr/bin/env node
// Actual Chromium adapter, not mocked findings: routes, interaction evidence and security.
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {runGate} from '../src/gate.mjs';
import {realBrowser} from '../src/execute.mjs';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-multi-route-'));let title='Home';
const server=http.createServer((req,res)=>{
 if(req.url==='/redirect'){res.writeHead(302,{Location:'http://example.com/blocked'});res.end();return;}
 if(req.url==='/missing'){res.writeHead(404);res.end('Missing');return;}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
 res.end(`<html lang="ja" style="background:white"><style>body{font-family:system-ui;font-size:16px;padding-top:48px}button{font-family:inherit;font-size:16px;min-width:80px;min-height:48px;background:#222;color:white;margin:8px}header{position:fixed;top:0;width:40%;height:32px;background:#222;color:white}header.second{right:0}</style><body><header>Navigation</header><header class="second">Account</header><h1>${req.url==='/settings'?'Settings':title}</h1><p data-ui-id="shared" style="font-family:serif">Typography fixture</p><button data-ui-id="save" onclick="document.getElementById('result').textContent='Saved'">Save</button><button>Save</button><p id="result">Ready</p></body></html>`);
});
server.listen(0,'127.0.0.1');await once(server,'listening');
try{
 const config=makePreset('web','ja-JP');config.browser.url=`http://127.0.0.1:${server.address().port}`;
 config.browser.captureScreenshots=true;config.browser.captureAriaSnapshots=true;config.browser.renderedMetrics=true;
 config.browser.routes=[{name:'home',url:'/',interactionsPath:'home.json'},{name:'settings',url:'/settings',interactionsPath:null}];
 await fs.mkdir(path.join(root,'src'));await fs.writeFile(path.join(root,'src/app.css'),':root { color: #222; background: #fff; }\n');
 await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy));
 await fs.writeFile(path.join(root,'home.json'),JSON.stringify({states:[{name:'saved',action:'click',selector:'[data-ui-id=save]',ready:{selector:'#result',expectedText:'Saved'}}]}));
 const first=await runGate({root,config});assert.equal(first.automatedStatus,'FAIL',JSON.stringify(first.stages));
 assert.ok(first.stages.every(s=>s.status!=='error'));
 const fonts=first.findings.filter(f=>f.rule==='font-family'&&f.selector==='[data-ui-id="shared"]'&&f.viewport.width===390&&f.state==='initial');
 assert.equal(fonts.length,2);assert.notEqual(fonts[0].id,fonts[1].id);assert.ok(fonts.every(f=>f.baselineEligible));
 assert.equal(first.ariaSnapshots.length,6);assert.equal(first.captures.length,6);assert.equal(first.renderedMetrics.length,6);
 assert.equal(new Set(first.artifacts).size,first.artifacts.length,'Routes/states must never overwrite one another');
 assert.ok(first.renderedMetrics.every(m=>m.topPinned.count===2&&m.filledButtons.count===2&&m.duplicateActions.some(a=>a.name==='Save')));
 assert.ok(first.findings.filter(f=>f.advisory).every(f=>!f.blocking&&!f.baselineEligible));
 const saved=first.ariaSnapshots.find(s=>s.route==='home'&&s.state==='saved');assert.match(await fs.readFile(path.join(root,config.reportDir,saved.file),'utf8'),/Saved/);
 title='Updated heading';const second=await runGate({root,config});assert.equal(second.ariaDiff.status,'compared');assert.equal(second.ariaDiff.changed.length,4);assert.equal(second.ariaDiff.unchanged.length,2);
 for(const s of second.ariaDiff.changed){assert.notEqual(s.file,s.previousFile);assert.match(await fs.readFile(path.join(root,config.reportDir,s.previousFile),'utf8'),/Home/);}
 config.browser.routes=[{name:'redirect',url:'/redirect'}];await assert.rejects(()=>realBrowser(config,root),/Host example.com is not allowed/);
 config.browser.routes=[{name:'missing',url:'/missing'}];await assert.rejects(()=>realBrowser(config,root),/Route missing: Page returned HTTP 404/);
 await fs.mkdir('artifacts/upstream-contracts',{recursive:true});
 await fs.writeFile('artifacts/upstream-contracts/multi-route.report.json',JSON.stringify(second,null,2)+'\n');
 console.log('PASS: real multi-route IDs, six same-session ARIA/screenshots, advisory metrics, compatible structure comparisons, forbidden redirect and 404 rejection');
}finally{await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});}
