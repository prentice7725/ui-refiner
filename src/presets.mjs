/** Web-app only. Do not reuse these rules for Canvas/HUD/native-game UIs. */
import {readFile} from 'node:fs/promises';
// One canonical policy source, shared with the vendored auditor.
export const lintapplePolicy = JSON.parse(await readFile(new URL('../vendor/lintapple/ui-policy.json',import.meta.url),'utf8'));
export const locales = ['en-US','ko-KR','ja-JP'];
export function makePolicy(locale='en-US'){
 if(!locales.includes(locale))throw Error(`Unsupported locale: ${locale}`);
 const policy=structuredClone(lintapplePolicy);
 if(locale==='ja-JP'){
  policy.fonts.push('Hiragino Sans','Hiragino Kaku Gothic ProN','Hiragino Kaku Gothic Pro','Noto Sans JP','Meiryo','Yu Gothic');
  policy.bannedCopy.push('可能性を解き放つ','シームレスに');
 }
 if(locale==='ko-KR'){
  policy.fonts.push('Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo','Pretendard');
  policy.bannedCopy.push('잠재력을 깨우세요','게임 체인저');
 }
 return policy;
}
export const presets = ['web'];
export function makePreset(preset='web',locale='en-US') {
  makePolicy(locale);
  if (preset !== 'web') throw new Error(`Unsupported profile: ${preset}. UI Refiner supports only web. Game UI is a separate research project.`);
  return {
    schemaVersion: 1,
    locale,
    name: 'my-web-app',
    preset:'web',
    sot: {path: null},
    static: {enabled:true, auditPath:'bundled', targets:['src'], timeoutMs:60000, enforcement:'enforce'},
    browser: {enabled:true, url:'http://127.0.0.1:5173', policyPath:'ui-policy.json', ready:null, interactionsPath:null, timeoutMs:120000, sessionTimeoutMs:null, routeTimeoutMs:null, captureScreenshots:false, captureAriaSnapshots:false, ariaSnapshotMasks:[], renderedMetrics:false, enforcement:'enforce'},
    gate: {maxStaticWarnings:null, allowedHosts:['localhost','127.0.0.1','[::1]'], baselinePath:null, valueExceptionsPath:null, manualVisualReview:true},
    reportDir:'artifacts/ui-refiner'
  };
}
