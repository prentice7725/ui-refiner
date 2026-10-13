#!/usr/bin/env node
// Real browser test: clean fixture must pass; deliberately bad font must fail.
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createDemoServer} from '../examples/demo-server.mjs';
import {lintapplePolicy} from '../src/presets.mjs';
import {checkUrl} from '../vendor/lintapple/src/index.js';
const server=createDemoServer();
server.listen(0,'127.0.0.1');
await once(server,'listening');
const url=`http://127.0.0.1:${server.address().port}`;
try{
 const passing=await checkUrl(url,lintapplePolicy,{ready:'[data-app-ready]'});
 assert.equal(passing.runs.length,lintapplePolicy.viewports.length*lintapplePolicy.colorSchemes.length,'Every viewport/theme is covered');
 if(passing.findings.length)console.error(JSON.stringify({url,findings:passing.findings},null,2));
 assert.equal(passing.findings.length,0,'The default demo must satisfy its own policy');
 const failing=await checkUrl(url+'/negative-control',lintapplePolicy,{ready:'[data-app-ready]'});
 assert.ok(failing.findings.some(x=>x.rule==='font-family'),'Deliberate serif font violation must be detected');
 console.log(`PASS: default fixture 0 findings, negative control ${failing.findings.length} findings`);
}finally{
 await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
}
