import fs from 'node:fs/promises';
import os from 'node:os';
import {performance} from 'node:perf_hooks';
import {visualOptions} from './visual-config.mjs';
import {imageWriter} from './image-evidence.mjs';
import {visualHash,decodeVisualPng,readVisualFile,compareVisualPng,maxVisualPixels} from './visual-png.mjs';
import {loadVisualBaseline} from './visual-baseline.mjs';

const pkg=JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url),'utf8'));
export function visualKey(dimensions){return visualHash(JSON.stringify(dimensions));}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

async function stableCapture(page,options,timeout){
 await page.waitForFunction(()=>document.fonts.status==='loaded'&&[...document.images].filter(img=>img.getBoundingClientRect().width&&img.getBoundingClientRect().height&&img.currentSrc).every(img=>img.complete),null,{timeout});
 await page.evaluate(async()=>{
  await document.fonts.ready;
  await Promise.all([...document.images].filter(img=>img.getBoundingClientRect().width&&img.getBoundingClientRect().height&&img.currentSrc).map(img=>img.decode()));
 });
 const size=await page.evaluate(fullPage=>({width:fullPage?Math.max(document.documentElement.scrollWidth,innerWidth):innerWidth,height:fullPage?Math.max(document.documentElement.scrollHeight,innerHeight):innerHeight}),options.capture==='fullPage');
 if(size.width*size.height>maxVisualPixels)throw Error('Visual capture exceeds the 16 million pixel limit');
 const masks=[],maskRegions=[];
 for(const selector of options.masks){
  const locator=page.locator(selector),count=await locator.count();
  if(!count||count>100)throw Error('Visual mask must match 1..100 elements: '+selector);
  let visible=0;
  for(let i=0;i<count;i++){
   const item=locator.nth(i);if(!await item.isVisible())continue;
   const box=await item.boundingBox();if(!box)continue;visible++;
   masks.push(item);maskRegions.push({selector,index:i,box,coordinates:'viewport CSS pixels before screenshot'});
  }
  if(!visible)throw Error('Visual mask has no visible target: '+selector);
 }
 const screenshot={fullPage:options.capture==='fullPage',animations:'disabled',caret:'hide',scale:'css',mask:masks,maskColor:'#ff00ff',timeout};
 let previous;
 for(let attempt=1;attempt<=options.stabilityAttempts;attempt++){
  const bytes=await page.screenshot(screenshot);decodeVisualPng(bytes);
  if(previous?.equals(bytes))return {bytes,maskRegions,stability:{status:'stable',attempts:attempt,criterion:'two consecutive equal PNG byte streams',fonts:'document.fonts.ready',images:'visible image decode',animations:'disabled',caret:'hide'}};
  previous=bytes;
 }
 throw Error('Visual stabilization failed: consecutive screenshots differ');
}

export async function inspectVisualState(page,state,{config,route,dir,baselineDir,runId}){
 const options=visualOptions(config),started=performance.now();
 const routeKey=state.routeKey||JSON.stringify([state.route,new URL(state.routeUrl).pathname+new URL(state.routeUrl).search]);
 const dimensions={route:state.route,routeKey,state:state.name,viewport:state.viewport,colorScheme:state.colorScheme,locale:config.locale||'en-US',capture:options.capture,environmentProfile:options.environmentProfile};
 const key=visualKey(dimensions),entry={key,dimensions,status:'error'},imageArtifacts=[];
 try{
  const environment={declaredProfile:options.environmentProfile,profileSource:'user-declared font/execution image; provisioning not automatically verified',os:os.platform(),release:os.release(),architecture:os.arch(),browser:page.context().browser().version(),dpr:await page.evaluate(()=>devicePixelRatio),reducedMotion:'reduce',timezone:'UTC'};
  entry.compatibility={schemaVersion:1,engine:{refiner:pkg.version,playwright:pkg.dependencies.playwright,pixelmatch:pkg.dependencies.pixelmatch,pngjs:pkg.dependencies.pngjs},environment,scenario:{ready:route.ready??null,interactions:route.interactions??null},capture:{scope:options.capture,animations:'disabled',caret:'hide',scale:'css',masks:options.masks,maskColor:'#ff00ff',stabilityAttempts:options.stabilityAttempts},comparator:{threshold:options.threshold,maxDiffPixels:options.maxDiffPixels,maxDiffRatio:options.maxDiffRatio,includeAA:false}};
  const capture=await stableCapture(page,options,config.browser.timeoutMs);
  entry.actualSize={width:capture.bytes.readUInt32BE(16),height:capture.bytes.readUInt32BE(20)};
  entry.maskRegions=capture.maskRegions;entry.stability=capture.stability;entry.captureMs=performance.now()-started;
  const write=await imageWriter(dir,runId);
  entry.actual=await write('render-visual-actual-'+key,capture.bytes,dimensions,'visual-actual');imageArtifacts.push(entry.actual);
  const baseline=await loadVisualBaseline(baselineDir);
  const expected=baseline?.entries.find(e=>e.key===key);
  if(!expected){
   const withoutProfile=d=>({...d,environmentProfile:null});
   const otherProfile=baseline?.entries.find(e=>same(withoutProfile(e.dimensions),withoutProfile(dimensions)));
   entry.status=otherProfile?'not-comparable':'needs-baseline';entry.reason=otherProfile?'Declared environment profile changed':'No approved image for this route/state/dimensions';
  }else if(!environment.declaredProfile||!same(expected.compatibility,entry.compatibility)){
   entry.status='not-comparable';entry.reason='Capture scenario/options or recorded browser/OS/font profile differs from the approved image';
  }else{
   const comparisonStarted=performance.now(),expectedBytes=await readVisualFile(baselineDir,expected.image.file,expected.image);
   entry.expected=await write('render-visual-expected-'+key,expectedBytes,dimensions,'visual-expected');imageArtifacts.push(entry.expected);
   const {diff,...comparison}=compareVisualPng(capture.bytes,expectedBytes,options);Object.assign(entry,comparison,{dimensions,comparisonDimensions:comparison.dimensions});
   if(diff){entry.diff=await write('render-visual-diff-'+key,diff,dimensions,'visual-diff');imageArtifacts.push(entry.diff);}
   entry.compareMs=performance.now()-comparisonStarted;
  }
 }catch(e){entry.status='error';entry.reason=e.message;}
 entry.elapsedMs=performance.now()-started;entry.workerRssBytes=process.memoryUsage().rss;
 entry.artifactBytes=imageArtifacts.reduce((n,image)=>n+image.bytes,0);
 return {entry,imageArtifacts,artifacts:imageArtifacts.map(image=>image.file)};
}

export function summarizeVisual(config,entries,{error}={}){
 const options=visualOptions(config);
 if(!options.enabled)return {enabled:false,mode:options.mode,status:'not-requested',entries:[],reviewRequired:false};
 const counts={matched:0,different:0,'needs-baseline':0,'not-comparable':0,error:0};
 for(const entry of entries){if(Object.hasOwn(counts,entry.status))counts[entry.status]++;else counts.error++;}

 const status=error||!entries.length?'error':['error','not-comparable','needs-baseline','different','matched'].find(s=>counts[s])||'error';
 return {schemaVersion:1,enabled:true,mode:options.mode,status,counts,entries,reason:error||(!entries.length?'No requested visual captures completed':undefined),reviewRequired:options.mode==='advisory'&&status!=='matched',metrics:{elapsedMs:entries.reduce((n,e)=>n+(e.elapsedMs||0),0),compareMs:entries.reduce((n,e)=>n+(e.compareMs||0),0),artifactBytes:entries.reduce((n,e)=>n+(e.artifactBytes||0),0),maxObservedWorkerRssBytes:entries.reduce((n,e)=>Math.max(n,e.workerRssBytes||0),0),memoryScope:'sampled worker RSS, excluding browser process tree'}};
}
