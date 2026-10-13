/** Web-app only. Do not reuse these rules for Canvas/HUD/native-game UIs. */
export const lintapplePolicy = {
  fonts: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display'],
  fontSizes: [12, 14, 16, 18, 20, 24, 32, 40, 48, 64],
  typeRules: [{selector: 'h1', sizes:[24,32,40,48,64]}, {selector:'h2',sizes:[20,24,32]}, {selector:'h3',sizes:[18,20,24]}, {selector:'button, [role=button]',sizes:[14,16]}],
  minControlSize: 15, controlSizeRules: [], minControlGap: 8,
  minControlInset: 8, controlContainers: ['[data-ui-container]'], minLayoutGap: 8,
  bannedCopy: ['unlock your potential', 'seamlessly', 'game-changing'],
  viewports: [{width:390,height:844},{width:1440,height:900}],
  colorSchemes: ['light'], exceptions: []
};
export const presets = ['web'];
export function makePreset(preset='web') {
  if (preset !== 'web') throw new Error(`Unsupported profile: ${preset}. UI Refiner supports only web. Game UI is a separate research project.`);
  return {
    schemaVersion: 1,
    name: 'my-web-app',
    preset:'web',
    sot: {path: null},
    static: {enabled:true, auditPath:'.agents/skills/suta/scripts/audit.mjs', targets:['src'], timeoutMs:60000, enforcement:'enforce'},
    browser: {enabled:true, url:'http://127.0.0.1:5173', policyPath:'ui-policy.json', ready:null, interactionsPath:null, timeoutMs:120000, captureScreenshots:false, enforcement:'enforce'},
    gate: {maxStaticWarnings:null, allowedHosts:['localhost','127.0.0.1','[::1]'], baselinePath:null, manualVisualReview:true},
    reportDir:'artifacts/ui-refiner'
  };
}
