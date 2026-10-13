// Dedicated process bounds the entire browser session, including checks and evidence capture.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {checkUrl as allowedUrl,resolveInside} from './config.mjs';
import {checkUrl} from '../vendor/lintapple/src/index.js';
try{
 const {config,root}=JSON.parse(process.argv[2]);
 const url=allowedUrl(config.browser.url,config.gate.allowedHosts);
 const policy=JSON.parse(await fs.readFile(resolveInside(root,config.browser.policyPath,'browser.policyPath'),'utf8'));
 const interactions=config.browser.interactionsPath?JSON.parse(await fs.readFile(resolveInside(root,config.browser.interactionsPath,'browser.interactionsPath'),'utf8')):undefined;
 const dir=resolveInside(root,config.reportDir,'reportDir'),artifacts=[],captures=[];
 if(config.browser.captureScreenshots)await fs.mkdir(dir,{recursive:true});
 const onState=config.browser.captureScreenshots?async(page,state)=>{
  const label=state.name.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,40);
  const suffix=createHash('sha256').update(state.name).digest('hex').slice(0,8);
  const stem=`render-${state.viewport.width}x${state.viewport.height}-${state.colorScheme}-${label}-${suffix}`;
  const image=stem+'.png';await page.screenshot({path:path.join(dir,image),fullPage:true});artifacts.push(image);
  const capture={image,state:state.name,viewport:state.viewport,colorScheme:state.colorScheme,reducedMotion:'reduce',locale:config.locale||'en-US',crops:[]};
  const selectors=[...new Set(state.findings.map(f=>f.selector))].slice(0,5);
  for(const [index,selector] of selectors.entries()){
   try{
    const locator=page.locator(selector);if(await locator.count()!==1||!await locator.isVisible())throw Error('target is not uniquely visible');
    const crop=`${stem}-finding-${index+1}.png`;await locator.screenshot({path:path.join(dir,crop),timeout:Math.min(config.browser.timeoutMs,5000)});
    artifacts.push(crop);capture.crops.push({selector,image:crop});
   }catch(e){capture.crops.push({selector,status:'unavailable',reason:e.message});}
  }
  captures.push(capture);
 }:undefined;
 const rawReport=await checkUrl(url,policy,{ready:config.browser.ready??undefined,timeout:config.browser.timeoutMs,interactions,onState,locale:config.locale||'en-US'});
 console.log(JSON.stringify({rawReport,artifacts,captures}));
}catch(e){console.error(e.stack||e.message);process.exitCode=2;}
