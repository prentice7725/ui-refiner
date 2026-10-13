#!/usr/bin/env node
// Real browser test: clean fixture must pass; deliberately bad font must fail.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {once} from 'node:events';
import {createDemoServer} from '../examples/demo-server.mjs';
import {lintapplePolicy} from '../src/presets.mjs';
import {identify,normalizeBrowser,browserCoverage} from '../src/normalize.mjs';
import {launchBrowser} from '../vendor/lintapple/src/browser.js';
import {verifyRecordedContract} from '../src/contracts.mjs';
import {checkPage,checkUrl} from '../vendor/lintapple/src/index.js';
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
 await fs.mkdir('artifacts/upstream-contracts',{recursive:true});
 await fs.writeFile('artifacts/upstream-contracts/lintapple.recorded.json',JSON.stringify(failing,null,2)+'\n');
 await verifyRecordedContract('lintapple',failing);
 const coverage=browserCoverage(passing);
 assert.ok(coverage.some(c=>c.rule==='layout-alignment'&&c.status==='not-tested'&&c.targets===0));
 assert.ok(coverage.some(c=>c.rule==='layout-gap'&&c.status==='not-tested'&&c.targets===0));
 const browser=await launchBrowser();
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(url+'/negative-control');
  const audit=async()=>{
   const raw=await checkPage(page,lintapplePolicy);
   return identify(normalizeBrowser({runs:[{}],findings:raw.findings.map(f=>({...f,viewport:{width:390,height:844},colorScheme:'light',state:'initial'}))}));
  };
  const before=(await audit()).find(f=>f.rule==='font-family'&&f.selector==='[data-qa="primary-action"]');
  assert.ok(before?.baselineEligible);
  await page.evaluate(()=>{
   const button=document.querySelector('[data-qa="primary-action"]');
   button.before(document.createElement('button'));
   button.style.fontFamily='Arial';
  });
  const after=(await audit()).find(f=>f.rule==='font-family'&&f.selector==='[data-qa="primary-action"]');
  assert.equal(before.id,after.id,'DOM insertion and changed measured font must preserve fingerprint');
  assert.equal(after.actual,'Arial');
  // Unmarked semantic identity also survives an unrelated same-tag sibling insertion.
  await page.setContent('<body><span>Stable text</span></body>');
  const first=(await audit()).find(f=>f.rule==='font-family');
  assert.ok(first?.baselineEligible);
  await page.evaluate(()=>document.querySelector('span').before(Object.assign(document.createElement('span'),{textContent:'Unrelated'})));
  const second=(await audit()).find(f=>f.rule==='font-family'&&f.identity.key===first.identity.key);
  assert.equal(first.id,second.id);
  await page.setContent('<html style="background:white"><body style="font-family:system-ui"><div onclick="void 0" data-qa="click-div">Run action</div><button>Native action</button></body></html>');
  const clickable=await audit();
  assert.ok(clickable.some(f=>f.rule==='keyboard-operation'&&f.selector==='[data-qa="click-div"]'));
  assert.ok(clickable.some(f=>f.rule==='control-state'&&f.selector==='[data-qa="click-div"]'));
  await page.evaluate(()=>{
   const property=document.createElement('div');property.setAttribute('data-qa','react-property');property.textContent='React-style action';property.onclick=()=>{};document.body.append(property);
   const listener=document.createElement('div');listener.setAttribute('data-qa','direct-listener');listener.textContent='Registered action';listener.addEventListener('click',()=>{});document.body.append(listener);
   const root=document.createElement('div');root.setAttribute('data-qa','react-root');root['__reactContainer$fixture']={};root.addEventListener('click',()=>{});root.textContent='Delegated root';document.body.append(root);
  });
  const dynamic=await audit();
  for(const target of ['react-property','direct-listener'])assert.ok(dynamic.some(f=>f.rule==='keyboard-operation'&&f.selector===`[data-qa="${target}"]`),target);
  assert.ok(!dynamic.some(f=>f.details.phase==='clickable-focus'&&f.selector==='[data-qa="react-root"]'));
  const inspected=await checkPage(page,lintapplePolicy);assert.equal(inspected.clickListenerCoverage.status,'direct-listeners-tested');
  await page.setContent('<body>'+[':r0:',':r1:','«r0»','«R1»','_r_0_','_r_1_','radix-menu-1','radix-menu-2','headlessui-dialog-1','headlessui-dialog-2'].map(id=>`<span id="${id}">Repeated</span>`).join('')+'<span id=":r9:" data-ui-id="explicit-app-anchor">Explicit</span></body>');
  const generated=await audit();const repeated=generated.filter(f=>f.rule==='font-family'&&f.identity.key.includes('Repeated'));
  assert.equal(repeated.length,10);assert.ok(repeated.every(f=>!f.baselineEligible&&!f.identity.stable));assert.ok(repeated.every(f=>!/:r\d|«[rR].*»|radix-|headlessui-|_r_/.test(f.identity.key)));
  // Tail actions must be inspected before a large plain-content list exhausts the CDP cap.
  await page.setContent('<html style="background:white"><body style="font-family:system-ui">'+Array.from({length:1600},(_,i)=>`<div>Row ${i}</div>`).join('')+'<div data-qa="tail-action-1" style="cursor:pointer">Tail 1</div><div data-qa="tail-action-2" style="cursor:pointer">Tail 2</div></body></html>');
  await page.evaluate(()=>{for(const el of document.querySelectorAll('[data-qa^="tail-action"]'))el.addEventListener('click',()=>{});});
  const large=await audit();
  for(const target of ['tail-action-1','tail-action-2'])assert.ok(large.some(f=>f.rule==='keyboard-operation'&&f.selector===`[data-qa="${target}"]`),target);
  const largeCoverage=(await checkPage(page,lintapplePolicy)).clickListenerCoverage;assert.equal(largeCoverage.status,'limited');assert.equal(largeCoverage.inspected,500);assert.match(largeCoverage.priority,/cursor:pointer/);
  assert.ok(generated.some(f=>f.rule==='font-family'&&f.identity.key==='[data-ui-id="explicit-app-anchor"]'&&f.baselineEligible));
  assert.ok(!clickable.some(f=>f.details.phase==='clickable-focus'&&f.selector.includes('button')));

 }finally{await browser.close();}
 console.log(`PASS: default fixture 0 findings, negative control ${failing.findings.length} findings`);
}finally{
 await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
}
