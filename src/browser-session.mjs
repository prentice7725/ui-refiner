import {launchBrowser} from '../vendor/lintapple/src/browser.js';
import {checkPage,checkInteractions,validatePolicy,ruleIds} from '../vendor/lintapple/src/index.js';
import {validateInteractions} from '../vendor/lintapple/src/interactions.js';
import {checkUrl} from './config.mjs';

async function boundedCheck(page,policy,timeout){
 let timer;
 try{return await Promise.race([checkPage(page,policy),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Page checks exceeded the time limit.')),timeout);})]);}
 finally{clearTimeout(timer);}
}
// App-owned adapter: upstream engines stay unchanged and retain their integrity manifests.
export async function checkRoutes(routes,input,{allowedHosts,timeout,locale,onState,launch=launchBrowser,audit=checkPage,interact=checkInteractions}={}){
 const policy=validatePolicy(input);
 for(const route of routes){checkUrl(route.url,allowedHosts);if(route.interactions!==undefined)validateInteractions(route.interactions);}
 const browser=await launch({timeout});
 const report={url:routes[0].url,routes:routes.map(({interactions,...route})=>route),rules:ruleIds,runs:[],findings:[],errors:[]};
 try{
  for(const route of routes)for(const viewport of policy.viewports)for(const colorScheme of policy.colorSchemes){
   let context;
   const run={viewport,colorScheme,route:route.name,routeUrl:route.url,routeKey:route.routeKey,status:'running',states:[],suppressed:[]};
   run.plannedStates=['initial',...(route.interactions?.states||[]).map(s=>s.name)].map(name=>({name,status:'not-run',started:false}));
   run.plannedStates[0]={name:'initial',status:'failed',started:true};
   report.runs.push(run);
   let navigationError;
   try{
    context=await browser.newContext({viewport,colorScheme,reducedMotion:'reduce',locale,timezoneId:'UTC',deviceScaleFactor:1,serviceWorkers:'block'});
    // Check redirected and interaction-driven document requests before allowing network navigation.
    await context.route('**/*',async handler=>{
     const request=handler.request();
     if(request.isNavigationRequest()){
      try{
       checkUrl(request.url(),allowedHosts);
       // Playwright routing can skip redirected requests. Do not follow an unchecked chain.
       const response=await handler.fetch({maxRedirects:0,timeout});
       try{
        const location=response.headers().location;
        if([301,302,303,307,308].includes(response.status())&&location){
         checkUrl(new URL(location,request.url()).toString(),allowedHosts);
         throw Error('Navigation redirects are not supported; configure the final URL explicitly');
        }
        await handler.fulfill({response});return;
       }finally{await response.dispose();}
      }catch(e){navigationError=e;await handler.abort();return;}
     }
     await handler.continue();
    });
    const page=await context.newPage();page.setDefaultTimeout(timeout);
    const response=await page.goto(route.url,{waitUntil:'load',timeout});
    if(navigationError)throw navigationError;
    if(response&&!response.ok())throw Error(`Page returned HTTP ${response.status()} at ${response.url()}.`);
    if(route.ready)await page.locator(route.ready).waitFor({state:'visible'});
    const result=audit===checkPage?await boundedCheck(page,policy,timeout):await audit(page,policy);
    const append=(name,result)=>{
     run.states.push({name,url:page.url(),...result});
     report.findings.push(...result.findings.map(f=>({...f,state:name,viewport,colorScheme,route:route.name,routeUrl:route.url,routeKey:route.routeKey})));
     run.suppressed.push(...result.suppressed.map(f=>({...f,state:name})));
    };
    Object.assign(run,{...result,findings:undefined,states:run.states,suppressed:run.suppressed});
    append('initial',result);
    const capture=async(page,state)=>{
     checkUrl(page.url(),allowedHosts);if(navigationError)throw navigationError;
     if(onState)await onState(page,{...state,viewport,colorScheme,route:route.name,routeUrl:route.url,routeKey:route.routeKey});
    };
    await capture(page,{name:'initial',...result});
    run.plannedStates[0].status='completed';
    const accessibilityCoverage={...result.accessibilityCoverage};
    run.accessibilityCoverage=accessibilityCoverage;
    if(route.interactions!==undefined){
     const interaction=await interact(page,route.interactions,policy,{timeout,onState:async(page,state)=>{const planned=run.plannedStates.find(s=>s.name===state.name);if(planned)Object.assign(planned,{status:'failed',started:true});append(state.name,state);await capture(page,state);if(planned)planned.status='completed';}});
     if(navigationError)throw navigationError;
     // Audited states were recorded immediately; add interaction-only failures without duplicating them.
     const recorded=new Set(run.states.map(s=>s.name));
     report.findings.push(...interaction.findings.filter(f=>!recorded.has(f.state)).map(f=>({...f,viewport,colorScheme,route:route.name,routeUrl:route.url,routeKey:route.routeKey})));
     run.suppressed.push(...interaction.suppressed.filter(f=>!recorded.has(f.state)));
     accessibilityCoverage.interactions=interaction.checks;
     accessibilityCoverage.interactionRules=interaction.checks.length?'only listed interactions tested':interaction.states.length?'not tested: page-state actions only':'not tested: empty interaction plan';
    }
    run.status='complete';
   }catch(e){const failed=run.plannedStates.find(s=>e.message.startsWith('State "'+s.name+'" could not be checked:'));if(failed)Object.assign(failed,{status:'failed',started:true});for(const state of run.plannedStates)if(!failed&&run.plannedStates[0].status==='completed'&&state.name!=='initial'&&state.status==='not-run')Object.assign(state,{status:'unknown',started:null});run.status='error';run.error=`Route ${route.name}: ${navigationError?.message||e.message}`;report.errors.push({route:route.name,viewport,colorScheme,error:run.error});}
   finally{try{await context?.close();}catch(e){run.status='error';report.errors.push({route:route.name,viewport,colorScheme,error:`Context close failed: ${e.message}`});}}
  }
  return report;
 }finally{await browser.close();}
}
