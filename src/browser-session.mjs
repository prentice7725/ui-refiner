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
 const report={url:routes[0].url,routes:routes.map(({interactions,...route})=>route),rules:ruleIds,runs:[],findings:[]};
 try{
  for(const route of routes)for(const viewport of policy.viewports)for(const colorScheme of policy.colorSchemes){
   const context=await browser.newContext({viewport,colorScheme,reducedMotion:'reduce',locale,timezoneId:'UTC',deviceScaleFactor:1,serviceWorkers:'block'});
   let navigationError;
   try{
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
    const capture=async(page,state)=>{
     checkUrl(page.url(),allowedHosts);if(navigationError)throw navigationError;
     if(onState)await onState(page,{...state,viewport,colorScheme,route:route.name,routeUrl:route.url,routeKey:route.routeKey});
    };
    await capture(page,{name:'initial',...result});
    const states=[{name:'initial',url:page.url(),...result}];
    const findings=result.findings.map(f=>({...f,state:'initial'})),suppressed=result.suppressed.map(f=>({...f,state:'initial'}));
    const accessibilityCoverage={...result.accessibilityCoverage};
    if(route.interactions!==undefined){
     const interaction=await interact(page,route.interactions,policy,{timeout,onState:capture});
     if(navigationError)throw navigationError;
     findings.push(...interaction.findings);suppressed.push(...interaction.suppressed);states.push(...interaction.states);
     accessibilityCoverage.interactions=interaction.checks;
     accessibilityCoverage.interactionRules=interaction.checks.length?'only listed interactions tested':interaction.states.length?'not tested: page-state actions only':'not tested: empty interaction plan';
    }
    report.runs.push({viewport,colorScheme,route:route.name,routeUrl:route.url,routeKey:route.routeKey,...result,findings:undefined,suppressed,accessibilityCoverage,states});
    report.findings.push(...findings.map(f=>({...f,viewport,colorScheme,route:route.name,routeUrl:route.url,routeKey:route.routeKey})));
   }catch(e){throw Error(`Route ${route.name}: ${navigationError?.message||e.message}`);}
   finally{await context.close();}
  }
  return report;
 }finally{await browser.close();}
}
