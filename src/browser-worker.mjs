import {visualOptions} from './visual-config.mjs';
import {inspectVisualState} from './visual.mjs';
// Dedicated process bounds the entire browser session, including checks and evidence capture.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {browserRoutes,resolveInside} from './config.mjs';
import {checkRoutes} from './browser-session.mjs';
import {collectRenderedMetrics,metricFindings} from './rendered-metrics.mjs';
import {maskAriaSnapshot} from './aria-evidence.mjs';
import {captureImages} from './image-evidence.mjs';
try{
 const {config,root,evidenceRunId}=JSON.parse(process.argv[2]);
 const routes=browserRoutes(config);
 const policy=JSON.parse(await fs.readFile(resolveInside(root,config.browser.policyPath,'browser.policyPath'),'utf8'));
 for(const route of routes)route.interactions=route.interactionsPath?JSON.parse(await fs.readFile(resolveInside(root,route.interactionsPath,'route.interactionsPath'),'utf8')):undefined;
 const dir=resolveInside(root,config.reportDir,'reportDir'),artifacts=[],captures=[],imageArtifacts=[],ariaSnapshots=[],renderedMetrics=[],advisory=[],visualEntries=[];
 if(config.browser.captureScreenshots||config.browser.captureAriaSnapshots||config.visual?.enabled)await fs.mkdir(dir,{recursive:true});
 const onState=async(page,state)=>{
  const label=state.name.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,40);
  const suffix=createHash('sha256').update(JSON.stringify([state.routeKey||'',state.name])).digest('hex').slice(0,8);
  const stem=`render-${state.route}-${state.viewport.width}x${state.viewport.height}-${state.colorScheme}-${label}-${suffix}`;
  const dimensions={route:state.route,routeUrl:state.routeUrl,routeKey:state.routeKey,state:state.name,viewport:state.viewport,colorScheme:state.colorScheme};
  if(config.browser.renderedMetrics){const metrics=await page.evaluate(collectRenderedMetrics);renderedMetrics.push({...dimensions,...metrics});advisory.push(...metricFindings(metrics,state));}
  if(config.browser.captureAriaSnapshots){
   const original=await page.locator('body').ariaSnapshot({timeout:config.browser.timeoutMs});
   if(Buffer.byteLength(original)>2_000_000)throw Error('ARIA snapshot exceeded the 2 MB evidence limit');
   const snapshot=maskAriaSnapshot(original,config.browser.ariaSnapshotMasks);
   if(Buffer.byteLength(snapshot)>2_000_000)throw Error('Masked ARIA snapshot exceeded the 2 MB evidence limit');
   const sha256=createHash('sha256').update(snapshot).digest('hex');
   const file=stem+'-'+sha256.slice(0,16)+'.aria.yml';await fs.writeFile(path.join(dir,file),snapshot+'\n');artifacts.push(file);
   ariaSnapshots.push({...dimensions,file,sha256,bytes:Buffer.byteLength(snapshot)});
  }
  if(config.browser.captureScreenshots){
  const images=await captureImages(page,state,{dir,runId:evidenceRunId,locale:config.locale||'en-US',timeoutMs:config.browser.timeoutMs});
  artifacts.push(...images.artifacts);imageArtifacts.push(...images.imageArtifacts);captures.push(images.capture);
  }
  if(config.visual?.enabled){
   const route=routes.find(r=>r.name===state.route);
   const visual=await inspectVisualState(page,state,{config,route,dir,baselineDir:resolveInside(root,visualOptions(config).baselineDir,'visual.baselineDir'),runId:evidenceRunId});
   visualEntries.push(visual.entry);artifacts.push(...visual.artifacts);imageArtifacts.push(...visual.imageArtifacts);
   if(visual.entry.status==='error')throw Error(visual.entry.reason);
  }

 };
 const rawReport=await checkRoutes(routes,policy,{allowedHosts:config.gate.allowedHosts,timeout:config.browser.timeoutMs,onState,locale:config.locale||'en-US'});
 rawReport.findings.push(...advisory);
 console.log(JSON.stringify({rawReport,artifacts,captures,imageArtifacts,ariaSnapshots,renderedMetrics,visualEntries}));
}catch(e){console.error(e.stack||e.message);process.exitCode=2;}
