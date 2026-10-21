import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import {resolveInside} from './config.mjs';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
// Bump when comparison semantics change; this is independent of finding/baseline IDs.
const schemaVersion=1;
export async function comparisonContexts(config,routes,root,reviewedValues){
 const [pkg,vendor,policy,plans]=await Promise.all([
  fs.readFile(new URL('../package.json',import.meta.url),'utf8').then(JSON.parse),
  fs.readFile(new URL('../vendor/UPSTREAM.json',import.meta.url),'utf8').then(JSON.parse),
  fs.readFile(resolveInside(root,config.browser.policyPath,'browser.policyPath'),'utf8').catch(()=>null),
  Promise.all(routes.map(route=>route.interactionsPath?fs.readFile(resolveInside(root,route.interactionsPath,'route.interactionsPath'),'utf8').catch(()=>null):null))
 ]);
 const engine={refiner:pkg.version,dependencies:pkg.dependencies,vendor:hash(vendor.lintapple)};
 // Effective values, including single-page ready, are the same ones passed to the runner.
 // URLs stay conservative here; port-independent baseline identity is a separate contract.
 const browser={engine,enabled:config.browser.enabled,locale:config.locale||'en-US',policy,
  routes:routes.map((route,i)=>({name:route.name,url:route.url,routeKey:route.routeKey??null,ready:route.ready??null,plan:plans[i]}))};
 const browserDebt=hash({browser,reviewedValues:reviewedValues.content});
 return {schemaVersion,
  findings:hash({browserDebt,renderedMetrics:!!config.browser.renderedMetrics,
   static:{enabled:config.static.enabled,auditPath:config.static.auditPath,targets:config.static.targets,vendor:hash(vendor.suta)}}),
  browserDebt,
  // Image capture and rendered observations do not change ARIA semantics or browser debt.
  aria:hash({browser,captureAriaSnapshots:!!config.browser.captureAriaSnapshots,masks:config.browser.ariaSnapshotMasks||[]})};
}

export function comparisonUnavailable(previous,current,kind,{scope,full=false}={}){
 if(!previous)return 'No previous report';
 if(previous.fingerprintVersion!==2||!Array.isArray(previous.findings))return 'Incompatible finding metadata';
 if(!previous.comparisonContexts||previous.comparisonContexts.schemaVersion!==schemaVersion)return 'Missing or incompatible comparison metadata; run full QA to establish a new reference';
 if(!['PASS','FAIL','SCOPED_PASS'].includes(previous.automatedStatus))return 'Previous report did not complete required checks';
 if(full&&previous.scope?.mode!=='full')return 'Browser debt requires a completed full report';
 if(scope&&(previous.scope?.mode!==scope.mode||previous.scope?.baseRef!==scope.baseRef))return 'Report scope changed';
 if(previous.comparisonContexts[kind]!==current[kind])return `${kind} comparison context changed`;
 return null;
}
