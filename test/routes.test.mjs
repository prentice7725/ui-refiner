import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {makePreset,lintapplePolicy} from '../src/presets.mjs';
import {validateConfig,browserRoutes,loadConfig} from '../src/config.mjs';
import {browserBudget} from '../src/browser-budget.mjs';
import {identify,normalizeBrowser,browserCoverage} from '../src/normalize.mjs';
import {runGate,baselineFromReport} from '../src/gate.mjs';
import {ariaDiff,groupedHandoff} from '../src/reporting.mjs';
import {checkRoutes} from '../src/browser-session.mjs';
import {metricFindings} from '../src/rendered-metrics.mjs';
import {loadValueExceptions} from '../src/value-exceptions.mjs';
async function temp(fn){const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-routes-'));try{await fs.writeFile(path.join(root,'ui-policy.json'),JSON.stringify(lintapplePolicy));await fn(root);}finally{await fs.rm(root,{recursive:true,force:true});}}
const routes=[{name:'home',url:'/'},{name:'settings',url:'/settings',ready:'[data-ready]',interactionsPath:null}];
test('route validation resolves root paths, inherits plans, rejects unsafe hosts/names/keys and out-of-root plans',()=>temp(async root=>{
 const c=makePreset();c.browser.routes=structuredClone(routes);c.browser.interactionsPath='shared.json';validateConfig(c);
 const resolved=browserRoutes(c);assert.equal(resolved[1].url,'http://127.0.0.1:5173/settings');assert.equal(resolved[0].interactionsPath,'shared.json');assert.equal(resolved[1].interactionsPath,null);
 for(const bad of [[{name:'home',url:'//example.com'}],[...routes,routes[0]],[{name:'../home',url:'/'}],[{name:'a',url:'relative'}],[{name:'a',url:'/',typo:true}],[]]){c.browser.routes=bad;assert.throws(()=>validateConfig(c));}
 c.browser.routes=[{name:'home',url:'/',interactionsPath:'../outside.json'}];await fs.writeFile(path.join(root,'config.json'),JSON.stringify(c));await assert.rejects(()=>loadConfig(path.join(root,'config.json')),/within project root/);
 delete c.browser.routes;assert.equal(browserRoutes(c)[0].routeKey,undefined);assert.equal(browserRoutes(c)[0].name,'default');
}));
const rawFinding={rule:'font-family',selector:'#save',identity:{key:'#save',stable:true},viewport:{width:390,height:844},colorScheme:'light',state:'initial',actual:'serif',fix:'Use approved font'};
test('route-aware fingerprints distinguish identical selectors across pages without changing legacy single-page IDs',()=>{
 const one=identify(normalizeBrowser({runs:[{}],findings:[rawFinding]}))[0];
 const legacy=identify(normalizeBrowser({runs:[{}],findings:[{...rawFinding,route:'default',routeUrl:'http://localhost/'}]}))[0];assert.equal(one.id,legacy.id);
 const ids=identify(normalizeBrowser({runs:[{}],findings:routes.map(r=>({...rawFinding,route:r.name,routeKey:JSON.stringify([r.name,r.url])}))}));assert.notEqual(ids[0].id,ids[1].id);assert.ok(ids.every(f=>f.baselineEligible));
 const coverage=browserCoverage({runs:[{route:'settings',viewport:rawFinding.viewport,colorScheme:'light',states:[{name:'initial',ruleCoverage:{'layout-gap':0}}]}]});assert.equal(coverage[0].route,'settings');
 assert.match(groupedHandoff(ids),/home \/ #save/);assert.match(groupedHandoff(ids),/settings \/ #save/);
});
test('route and evidence counts increase session budgets, while explicit total timeout remains authoritative',()=>{
 const c=makePreset();c.browser.timeoutMs=1000;const one=browserBudget(c,lintapplePolicy);
 c.browser.routes=routes;c.browser.captureAriaSnapshots=true;
 const multi=browserBudget(c,lintapplePolicy,[undefined,{states:[{name:'open'}]}]);assert.equal(multi.routeCount,2);assert.equal(multi.plannedRuns,one.plannedRuns*2);assert.ok(multi.sessionTimeoutMs>one.sessionTimeoutMs);
 c.browser.sessionTimeoutMs=1234;assert.equal(browserBudget(c,lintapplePolicy).sessionTimeoutMs,1234);
});
test('rendered heuristics are visible but cannot block, enter a baseline or weaken actual violations',()=>temp(async root=>{
 const c=makePreset();c.gate.maxStaticWarnings=0;
 const metrics={topPinned:{count:2,targets:['header','nav']},filledButtons:{count:3,targets:['button']},duplicateActions:[{name:'Edit',count:2,targets:['button']} ]};
 const observations=metricFindings(metrics,{name:'initial',viewport:rawFinding.viewport,colorScheme:'light',route:'home'});
 assert.equal(observations.length,3);
 const options={root,config:c,staticRunner:async()=>({findings:[]}),browserRunner:async()=>({findings:normalizeBrowser({runs:[{}],findings:observations})})};
 const report=await runGate(options);assert.equal(report.automatedStatus,'PASS');assert.ok(report.findings.every(f=>f.advisory&&!f.blocking&&!f.baselineEligible));
 const file=path.join(root,c.reportDir,'report.json'),baseline=path.join(root,'baseline.json');assert.equal(await baselineFromReport(file,baseline),0);
 const mixed=await runGate({...options,browserRunner:async()=>({findings:normalizeBrowser({runs:[{}],findings:[...observations,rawFinding]})})});assert.equal(mixed.automatedStatus,'FAIL');assert.equal(mixed.summary.blockers,1);
}));
const snapshot=(route,hash)=>({route,routeKey:route,viewport:rawFinding.viewport,colorScheme:'light',state:'initial',file:route+'-'+hash+'.aria.yml',sha256:hash});
test('ARIA changes separate added/removed/changed dimensions and retain original snapshot paths',()=>{
 const diff=ariaDiff({ariaSnapshots:[snapshot('home','a'),snapshot('settings','b'),snapshot('old','c')]},[snapshot('home','a'),snapshot('settings','d'),snapshot('new','e')]);
 assert.equal(diff.unchanged.length,1);assert.equal(diff.changed.length,1);assert.equal(diff.changed[0].previousFile,'settings-b.aria.yml');assert.equal(diff.added.length,1);assert.equal(diff.removed.length,1);
 assert.equal(ariaDiff(null,[snapshot('a','b')]).status,'unavailable');assert.equal(ariaDiff({ariaSnapshots:[snapshot('a','b')]},[]).status,'unavailable');
});
test('gate persists ARIA metadata and comparisons but rejects comparisons after routes or plans change',()=>temp(async root=>{
 const config=makePreset();config.browser.routes=routes;
 let hash='a';const options={root,config,staticRunner:async()=>({findings:[]}),browserRunner:async()=>({findings:[],ariaSnapshots:[snapshot('home',hash)],renderedMetrics:[{route:'home',filledButtons:{count:2}}]})};
 const first=await runGate(options);assert.equal(first.ariaDiff.status,'unavailable');hash='b';
 const second=await runGate(options);assert.equal(second.ariaDiff.changed.length,1);assert.equal(second.automatedStatus,'PASS');assert.equal(second.renderedMetrics[0].route,'home');assert.equal(second.scope.routes.length,2);
 config.browser.routes=[{name:'other',url:'/'}];const changed=await runGate(options);assert.equal(changed.ariaDiff.status,'unavailable');assert.equal(changed.diff.status,'unavailable');
 const md=await fs.readFile(path.join(root,config.reportDir,'VISUAL_REVIEW.md'),'utf8');assert.match(md,/ARIA structure/);
}));
test('route adapter uses a single browser with isolated contexts and closes every context on failure',async()=>{
 const c=makePreset();c.browser.routes=routes;const resolved=browserRoutes(c);const visits=[],contexts=[],observed=[];let closed=false;
 const launch=async()=>({close:async()=>{closed=true;},newContext:async()=>{
  const item={closed:false};contexts.push(item);
  const page={setDefaultTimeout(){},goto:async url=>{item.url=url;visits.push(url);return {ok:()=>true};},url:()=>item.url,locator:()=>({waitFor:async()=>{}})};
  return {route:async()=>{},newPage:async()=>page,close:async()=>{item.closed=true;}};
 }});
 const audit=async()=>({findings:[rawFinding],suppressed:[],accessibilityCoverage:{}});
 const r=await checkRoutes(resolved,lintapplePolicy,{launch,audit,timeout:1000,locale:'ja-JP',allowedHosts:c.gate.allowedHosts,onState:async(page,state)=>observed.push(state)});
 assert.equal(r.runs.length,4);assert.equal(contexts.length,4);assert.ok(contexts.every(x=>x.closed));assert.ok(closed);assert.equal(observed[2].route,'settings');assert.equal(r.findings[2].route,'settings');assert.equal(visits.length,4);
 closed=false;await assert.rejects(()=>checkRoutes(resolved,lintapplePolicy,{launch,audit:async()=>{throw Error('audit failed');},timeout:1000,allowedHosts:c.gate.allowedHosts}),/Route home: audit failed/);assert.ok(closed);assert.ok(contexts.every(x=>x.closed));
});
test('reviewed value exceptions preserve evidence, require exact values/scopes/reasons and cannot waive accessibility',()=>temp(async root=>{
 const config=makePreset();config.gate.valueExceptionsPath='values.json';
 const exception={engine:'lintapple',rule:'font-family',actual:'Brand Sans',route:'home',selector:'#save',reason:'Approved wordmark in SOT'};
 const write=async exceptions=>fs.writeFile(path.join(root,'values.json'),JSON.stringify({schemaVersion:1,exceptions}));
 await write([exception]);const f={...rawFinding,actual:'Brand Sans',route:'home'};
 const options={root,config,staticRunner:async()=>({findings:[]}),browserRunner:async()=>({findings:normalizeBrowser({runs:[{}],findings:[f]})})};
 const allowed=await runGate(options);assert.equal(allowed.automatedStatus,'PASS');assert.equal(allowed.summary.reviewedExceptions,1);assert.equal(allowed.summary.baselined,0);assert.equal(allowed.findings[0].actual,'Brand Sans');assert.equal(allowed.findings[0].reviewedException.reason,exception.reason);
 assert.ok(allowed.groups[0].reviewedException);assert.ok(!groupedHandoff(allowed.findings).includes('Use approved font'));
 assert.equal(await baselineFromReport(path.join(root,config.reportDir,'report.json'),path.join(root,'values-baseline.json')),0,'A value-specific waiver must never broaden into a value-independent baseline');
 const md=await fs.readFile(path.join(root,config.reportDir,'report.md'),'utf8');assert.match(md,/reviewed value exception/);assert.match(md,/Approved wordmark/);
 for(const change of [{actual:'Other Sans'},{route:'settings'},{selector:'#other'}]){const report=await runGate({...options,browserRunner:async()=>({findings:normalizeBrowser({runs:[{}],findings:[{...f,...change}]})})});assert.equal(report.automatedStatus,'FAIL');}
 for(const bad of [{...exception,reason:''},{...exception,rule:'text-contrast'},{...exception,actual:{}},{...exception,typo:true}]){await write([bad]);await assert.rejects(()=>loadValueExceptions(config,root));}
}));
