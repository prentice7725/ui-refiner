#!/usr/bin/env node
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {realBrowser} from '../src/execute.mjs';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-session-budget-'));
const server=http.createServer((req,res)=>{setTimeout(()=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('<html style="background:white"><body style="font-family:system-ui"><p>Slow navigation</p></body></html>');},1800);});
server.listen(0,'127.0.0.1');await once(server,'listening');
try{
 const config=makePreset();config.browser.url=`http://127.0.0.1:${server.address().port}`;config.browser.timeoutMs=3000;
 await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy));
 const start=Date.now(),result=await realBrowser(config,root);
 assert.equal(result.rawReport.runs.length,2);assert.ok(Date.now()-start>3000,'Combined runs should exceed the per-step timeout');assert.ok(result.budgets.sessionTimeoutMs>3000);assert.equal(result.budgets.stepTimeoutMs,3000);
 assert.equal(result.findings.length,0);console.log('PASS: two individually valid 1.8s navigations survive a 3s step budget within the derived total session budget');
 config.browser.sessionTimeoutMs=1000;const timed=await realBrowser(config,root);assert.ok(timed.errors.some(e=>/timeout/.test(e.error)));console.log('PASS: explicit total session timeout still bounds a slow run');
}finally{await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:250});}
