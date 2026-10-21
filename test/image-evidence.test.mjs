import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID,createHash} from 'node:crypto';
import {atomicWrite,imageWriter,captureImages,completeImageRun,pruneImageEvidence} from '../src/image-evidence.mjs';
import {runGate,exitCode} from '../src/gate.mjs';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {realBrowser} from '../src/execute.mjs';

const a=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWqkAAAAASUVORK5CYII=','base64');
const b=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const finding={engine:'lintapple',rule:'font-family',selector:'#save',identity:{key:'#save',stable:true},severity:'error',viewport:{width:390,height:844},colorScheme:'light',state:'initial',actual:'serif'};
const state={name:'initial',route:'default',routeUrl:'http://localhost/',viewport:finding.viewport,colorScheme:'light',findings:[finding]};
async function temp(fn){const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-image-evidence-'));try{await fn(root);}finally{await fs.rm(root,{recursive:true,force:true});}}
function page(bytes=a){return {screenshot:async options=>{assert.equal(options.path,undefined);return bytes;},locator:selector=>({count:async()=>selector==='#missing'?0:1,isVisible:async()=>true,screenshot:async()=>bytes})};}

test('PNG evidence preserves bytes across runs and changes, deduplicates exact repeats and rejects corrupt destinations',()=>temp(async dir=>{
 const write=await imageWriter(dir),first=await write('render-test',a,{},'state');
 const changed=await write('render-test',b,{},'state'),repeat=await write('render-test',a,{},'state');
 const other=await(await imageWriter(dir))('render-test',b,{},'state');
 assert.notEqual(first.file,changed.file);assert.notEqual(changed.file,other.file);assert.equal(repeat.file,first.file);
 for(const [image,bytes] of [[first,a],[changed,b],[other,b]]){assert.deepEqual(await fs.readFile(path.join(dir,image.file)),bytes);assert.equal(image.sha256,hash(bytes));assert.equal(image.bytes,bytes.length);}
 await fs.writeFile(path.join(dir,first.file),b);
 await assert.rejects(()=>write('render-test',a,{},'state'),/different bytes/);
}));

test('same-state captures link full images and distinct crops with dimensions, hashes and unavailable reasons',()=>temp(async dir=>{
 const images=await captureImages(page(),{...state,findings:[finding,finding,{selector:'#missing'}]},{dir,runId:randomUUID(),locale:'ja-JP',timeoutMs:1000});
 assert.equal(images.imageArtifacts.length,2);assert.equal(images.capture.crops.length,2);
 for(const image of images.imageArtifacts){assert.equal(image.sha256,hash(a));assert.equal(image.bytes,a.length);assert.equal(image.locale,'ja-JP');assert.deepEqual(image.viewport,state.viewport);assert.ok(image.artifactId);}
 assert.equal(images.capture.crops[1].status,'unavailable');assert.match(images.capture.crops[1].reason,/not uniquely visible/);
 await assert.rejects(()=>captureImages({...page(),screenshot:async()=>{throw Error('capture failed');}},state,{dir,runId:randomUUID(),timeoutMs:1000}),/capture failed/);
}));

test('gate keeps current, previous and last-full image bytes on partial failures and publishes an atomic manifest',()=>temp(async root=>{
 const config=makePreset();config.browser.captureScreenshots=true;await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy));
 const dir=path.join(root,config.reportDir);let bytes=a,failed=false;
 const options={root,config,staticRunner:async()=>({findings:[]}),browserRunner:async(config,root,{evidenceRunId})=>{
  const images=await captureImages(page(bytes),state,{dir,runId:evidenceRunId,timeoutMs:1000});
  return {findings:[finding],...images,captures:[images.capture],capturesIntegrated:true,errors:failed?[{error:'other route failed'}]:[]};
 }};
 const first=await runGate(options);bytes=b;const second=await runGate(options);
 assert.notEqual(first.captures[0].image,second.captures[0].image);
 assert.deepEqual(await fs.readFile(path.join(dir,first.captures[0].image)),a);
 assert.equal(second.findings[0].imageEvidence.length,2);assert.equal(second.findings[0].imageEvidence[1].kind,'crop');
 const previous=JSON.parse(await fs.readFile(path.join(dir,'previous-report.json'),'utf8'));assert.equal(previous.captures[0].image,first.captures[0].image);
 failed=true;bytes=a;const third=await runGate(options);assert.equal(exitCode(third),2);
 const full=JSON.parse(await fs.readFile(path.join(dir,'last-full-report.json'),'utf8'));assert.equal(full.runId,second.runId);
 assert.deepEqual(await fs.readFile(path.join(dir,full.captures[0].image)),b);
 assert.deepEqual(await fs.readFile(path.join(dir,third.captures[0].image)),a);
 await assert.rejects(()=>fs.access(path.join(dir,first.captures[0].image)),{code:'ENOENT'});
 const fourth=await runGate(options);assert.equal(fourth.imageRetention.retainedRuns,3);
 for(const report of [second,third,fourth])await fs.access(path.join(dir,report.captures[0].image));
 const manifest=JSON.parse(await fs.readFile(path.join(dir,'image-artifacts.json'),'utf8'));assert.equal(manifest.runId,fourth.runId);assert.deepEqual(manifest.images,fourth.imageArtifacts);
 assert.equal((await fs.readdir(dir)).filter(name=>name.endsWith('.tmp')).length,0);
}));

test('cleanup removes orphan audit images but protects report references, manual files, unknown directories and symlinks',()=>temp(async dir=>{
 const orphan=await(await imageWriter(dir))('render-orphan',a,{},'state');
 const retained=await(await imageWriter(dir))('render-retained',a,{},'state');
 const manual=await(await imageWriter(dir))('render-manual',a,{},'state');
 await completeImageRun(dir,orphan.runId);await completeImageRun(dir,manual.runId);
 await fs.writeFile(path.join(dir,path.dirname(manual.file),'notes.txt'),'manual');
 const unknown='images-'+randomUUID();await fs.mkdir(path.join(dir,unknown));await fs.writeFile(path.join(dir,unknown,'notes.txt'),'manual');
 await fs.writeFile(path.join(dir,'legacy.png'),a);
 const alias='images-'+randomUUID();await fs.symlink(path.join(dir,path.dirname(retained.file)),path.join(dir,alias),'dir');
 const result=await pruneImageEvidence(dir,[{diff:{resolved:[{imageEvidence:[{image:retained.file}]}]}}]);
 assert.equal(result.removedRuns,1);assert.equal(result.removedImages,1);assert.equal(result.retainedRuns,1);assert.equal(result.skippedRuns,2);
 await assert.rejects(()=>fs.access(path.join(dir,orphan.file)),{code:'ENOENT'});
 for(const name of [retained.file,manual.file,unknown+'/notes.txt','legacy.png',alias])await fs.access(path.join(dir,name));
}));

test('failed fallback capture preserves last completed full report and atomic write failure leaves no temporary files',()=>temp(async root=>{
 const config=makePreset(),options={root,config,staticRunner:async()=>({findings:[]}),browserRunner:async()=>({findings:[]})};
 const full=await runGate(options);config.browser.captureScreenshots=true;
 const failed=await runGate({...options,captureRunner:async()=>{throw Error('screenshot failed');}});assert.equal(exitCode(failed),2);
 const kept=JSON.parse(await fs.readFile(path.join(root,config.reportDir,'last-full-report.json'),'utf8'));assert.equal(kept.runId,full.runId);
 const target=path.join(root,'directory');await fs.mkdir(target);
 await assert.rejects(()=>atomicWrite(target,'new report'));
 assert.equal((await fs.readdir(root)).filter(name=>name.endsWith('.tmp')).length,0);assert.ok((await fs.stat(target)).isDirectory());
}));

test('cleanup defers fresh interrupted image runs and reclaims stale unreferenced runs after the grace period',()=>temp(async dir=>{
 const image=await(await imageWriter(dir))('render-interrupted',a,{},'state');
 const fresh=await pruneImageEvidence(dir,[]);assert.equal(fresh.removedRuns,0);assert.equal(fresh.skippedRuns,1);
 const marker=path.join(dir,path.dirname(image.file),'.ui-refiner-images.json');
 const ownership=JSON.parse(await fs.readFile(marker,'utf8'));ownership.createdAt=Date.now()-700000;await fs.writeFile(marker,JSON.stringify(ownership));
 const stale=await pruneImageEvidence(dir,[]);assert.equal(stale.removedRuns,1);await assert.rejects(()=>fs.access(path.join(dir,image.file)),{code:'ENOENT'});
}));

test('route worker transport shares the audit run ID and merges image metadata without losing references',()=>temp(async root=>{
 const config=makePreset();config.browser.captureScreenshots=true;config.browser.routes=[{name:'home',url:'/'},{name:'settings',url:'/settings'}];
 await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy));
 const received=[];
 const worker=async(bin,args)=>{
  const {config:selected,evidenceRunId}=JSON.parse(args[1]);received.push(evidenceRunId);
  const route=selected.browser.routes[0].name;
  const images=await captureImages(page(),{...state,route},{dir:path.join(root,config.reportDir),runId:evidenceRunId,timeoutMs:1000});
  return {code:0,stderr:'',stdout:JSON.stringify({rawReport:{runs:[{route,status:'complete'}],findings:[]},artifacts:images.artifacts,captures:[images.capture],imageArtifacts:images.imageArtifacts})};
 };
 const report=await runGate({root,config,staticRunner:async()=>({findings:[]}),browserRunner:(c,r,options)=>realBrowser(c,r,{...options,runner:worker})});
 assert.deepEqual(received,[report.runId,report.runId]);assert.equal(report.imageArtifacts.length,4);assert.equal(new Set(report.artifacts).size,4);
 for(const image of report.imageArtifacts)assert.deepEqual(await fs.readFile(path.join(root,config.reportDir,image.file)),a);
}));
