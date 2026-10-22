import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {PNG} from 'pngjs';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {validateConfig,loadConfig} from '../src/config.mjs';
import {visualOptions} from '../src/visual-config.mjs';
import {compareVisualPng,decodeVisualPng,visualHash} from '../src/visual-png.mjs';
import {visualKey} from '../src/visual.mjs';
import {createVisualCandidate,approveVisualCandidate,loadVisualBaseline} from '../src/visual-baseline.mjs';
import {imageWriter} from '../src/image-evidence.mjs';
import {runGate,exitCode} from '../src/gate.mjs';
import {comparisonContexts} from '../src/comparison.mjs';

async function temp(fn){const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-visual-contract-'));try{await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy));await fn(root);}finally{await fs.rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}}
function png(width=20,height=20,color=255){const image=new PNG({width,height});for(let i=0;i<image.data.length;i+=4){image.data[i]=image.data[i+1]=image.data[i+2]=color;image.data[i+3]=255;}return PNG.sync.write(image);}
const dimensions={route:'home',routeKey:'["home","/"]',state:'initial',viewport:{width:20,height:20},colorScheme:'light',locale:'en-US',capture:'viewport',environmentProfile:'test-font-image-v1'};
const compatibility={schemaVersion:1,environment:{declaredProfile:'test-font-image-v1'},comparator:{threshold:0.1,maxDiffPixels:0,maxDiffRatio:0}};

test('visual is disabled/advisory by default; config validates masks, tolerances, profiles and paths',()=>temp(async root=>{
 const c=makePreset();assert.equal(c.visual.enabled,false);assert.equal(c.visual.mode,'advisory');validateConfig(c);delete c.visual;validateConfig(c);assert.equal(visualOptions(c).enabled,false);
 for(const bad of [{enabled:'yes'},{mode:'auto'},{masks:['']},{masks:Array(21).fill('#clock')},{threshold:NaN},{maxDiffRatio:2},{maxDiffPixels:-1},{stabilityAttempts:1},{capture:'resize'},{unknown:true},{enabled:true,mode:'enforce'}]){c.visual=bad;assert.throws(()=>validateConfig(c));}
 c.visual={enabled:true,mode:'advisory',baselineDir:'../outside'};await fs.writeFile(path.join(root,'config.json'),JSON.stringify(c));await assert.rejects(()=>loadConfig(path.join(root,'config.json')),/within project root/);
 c.visual={enabled:true};c.browser.enabled=false;assert.throws(()=>validateConfig(c),/requires browser/);
}));

test('PNG adapter reports real pixel counts/tolerances, size changes and malformed/oversized inputs',()=>{
 const options=visualOptions(makePreset()),white=png(),black=png(20,20,0);
 assert.equal(compareVisualPng(white,white,options).status,'matched');
 const changed=compareVisualPng(black,white,options);assert.equal(changed.status,'different');assert.equal(changed.diffPixels,400);assert.equal(changed.diffRatio,1);assert.ok(changed.diff.length);
 assert.equal(compareVisualPng(black,white,{...options,maxDiffPixels:400}).status,'matched');assert.equal(compareVisualPng(black,white,{...options,maxDiffRatio:1}).status,'matched');
 const size=compareVisualPng(png(21),white,options);assert.equal(size.status,'different');assert.equal(size.diff,null);assert.equal(size.diffPixels,null);assert.match(size.reason,/dimensions changed/);
 assert.throws(()=>decodeVisualPng(Buffer.from('invalid')),/PNG/);const large=Buffer.from(white);large.writeUInt32BE(16000001,16);assert.throws(()=>decodeVisualPng(large),/pixel limit/);
});

test('visual keys distinguish dimensions/profile and visual options do not reset finding or ARIA compatibility',()=>temp(async root=>{
 for(const change of [{state:'saved'},{routeKey:'["home","/?a=1"]'},{locale:'ja-JP'},{capture:'fullPage'},{environmentProfile:'other'},{colorScheme:'dark'},{viewport:{width:21,height:20}}])assert.notEqual(visualKey(dimensions),visualKey({...dimensions,...change}));
 const c=makePreset(),routes=[{name:'home',url:c.browser.url,ready:null}],values={content:null};const before=await comparisonContexts(c,routes,root,values);
 c.visual={...c.visual,enabled:true,masks:['#clock'],threshold:0.2};assert.deepEqual(await comparisonContexts(c,routes,root,values),before);
}));

test('advisory/enforced result matrix preserves errors, incomplete baselines and human review',()=>temp(async root=>{
 const c=makePreset();c.visual.enabled=true;c.visual.environmentProfile='test-font-image-v1';
 const check=async(status,mode='advisory')=>{c.visual.mode=mode;return runGate({root,config:c,staticRunner:async()=>({findings:[]}),browserRunner:async()=>({findings:[],visualEntries:[{key:visualKey(dimensions),dimensions,compatibility,status,reason:status==='error'?'capture failed':undefined}]})});};
 for(const status of ['matched','different','needs-baseline','not-comparable']){const r=await check(status);assert.equal(r.automatedStatus,'PASS');assert.equal(r.status,'REVIEW_REQUIRED');assert.equal(r.visual.status,status);}
 for(const [status,outcome,code] of [['matched','PASS',0],['different','FAIL',1],['needs-baseline','INCOMPLETE',2],['not-comparable','INCOMPLETE',2],['error','ERROR',2]]){const r=await check(status,'enforce');assert.equal(r.automatedStatus,outcome);assert.equal(exitCode(r),code);}
 assert.equal((await check('error')).automatedStatus,'ERROR');
 const noOutput=await runGate({root,config:c,writeReports:false,staticRunner:async()=>({findings:[]}),browserRunner:async()=>({findings:[]})});assert.equal(noOutput.automatedStatus,'ERROR');
 c.visual.mode='advisory';c.gate.manualVisualReview=false;const review=await check('different');assert.equal(review.status,'REVIEW_REQUIRED');assert.equal(review.visual.reviewRequired,true);assert.match(await fs.readFile(path.join(root,c.reportDir,'report.md'),'utf8'),/Human visual review: REQUIRED/);
 c.visual.enabled=false;assert.equal((await check('matched')).visual.status,'not-requested');
}));

test('candidate → explicit approval copies verified images; check never approves; updates preserve manual files',()=>temp(async root=>{
 const dir=path.join(root,'reports');await fs.mkdir(dir);const write=await imageWriter(dir),image=await write('render-test',png(),dimensions,'visual-actual');
 const report={scope:{mode:'full'},stages:[{engine:'suta',status:'complete'},{engine:'lintapple',status:'complete'}],visual:{enabled:true,entries:[{key:visualKey(dimensions),dimensions,compatibility,status:'needs-baseline',actual:image,maskRegions:[]}]}};
 const file=path.join(dir,'report.json');await fs.writeFile(file,JSON.stringify(report));const out=path.join(root,'candidate'),approved=path.join(root,'approved');
 const candidate=await createVisualCandidate(file,out);assert.equal(candidate.kind,'candidate');assert.equal(await loadVisualBaseline(approved),null);
 await approveVisualCandidate(path.join(out,'manifest.json'),approved);const baseline=await loadVisualBaseline(approved);assert.equal(baseline.kind,'approved');assert.equal(baseline.entries[0].image.sha256,image.sha256);
 await fs.writeFile(path.join(approved,'manual.png'),'manual');
 const unknownName='a'.repeat(64)+'-'+'b'.repeat(64)+'.png';await fs.writeFile(path.join(approved,unknownName),'manual');
 const manifestBefore=await fs.readFile(path.join(approved,'manifest.json'));
 assert.deepEqual(await fs.readFile(path.join(approved,baseline.entries[0].image.file)),await fs.readFile(path.join(dir,image.file)));
 await assert.rejects(()=>createVisualCandidate(file,out),/already exists/);
 const image2=await write('render-test-next',png(20,20,0),dimensions,'visual-actual');report.visual.entries[0].actual=image2;await fs.writeFile(file,JSON.stringify(report));
 const out2=path.join(root,'candidate2');await createVisualCandidate(file,out2);assert.deepEqual(await fs.readFile(path.join(approved,'manifest.json')),manifestBefore);
 await approveVisualCandidate(path.join(out2,'manifest.json'),approved);assert.equal((await loadVisualBaseline(approved)).entries[0].image.sha256,image2.sha256);
 await assert.rejects(()=>fs.access(path.join(approved,baseline.entries[0].image.file)));assert.equal(await fs.readFile(path.join(approved,'manual.png'),'utf8'),'manual');assert.equal(await fs.readFile(path.join(approved,unknownName),'utf8'),'manual');
 report.scope.mode='changed-only';await fs.writeFile(file,JSON.stringify(report));await assert.rejects(()=>createVisualCandidate(file,path.join(root,'partial')),/full/);
}));

test('approval refuses unverified profiles and corrupted candidate bytes without replacing an existing baseline',()=>temp(async root=>{
 const dir=path.join(root,'report');await fs.mkdir(dir);const write=await imageWriter(dir),image=await write('render-test',png(),dimensions,'visual-actual');
 const report={scope:{mode:'full'},stages:[{engine:'suta',status:'complete'},{engine:'lintapple',status:'complete'}],visual:{enabled:true,entries:[{key:visualKey(dimensions),dimensions,compatibility:{...compatibility,environment:{declaredProfile:null}},status:'needs-baseline',actual:image}]}};
 const file=path.join(dir,'report.json'),out=path.join(root,'candidate');await fs.writeFile(file,JSON.stringify(report));await createVisualCandidate(file,out);
 await assert.rejects(()=>approveVisualCandidate(path.join(out,'manifest.json'),path.join(root,'approved')),/Declare and review/);
 const manifest=JSON.parse(await fs.readFile(path.join(out,'manifest.json'),'utf8'));manifest.entries[0].compatibility=compatibility;await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest));
 await fs.writeFile(path.join(out,manifest.entries[0].image.file),png(20,20,0));await assert.rejects(()=>approveVisualCandidate(path.join(out,'manifest.json'),path.join(root,'approved')),/hash or byte/);
 assert.equal(await loadVisualBaseline(path.join(root,'approved')),null);
}));
