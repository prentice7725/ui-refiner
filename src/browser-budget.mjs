export function browserBudget(config,policy,interactions){
 const stepTimeoutMs=config.browser.timeoutMs;
 const routeCount=config.browser.routes?.length||1;
 const plannedRuns=policy.viewports.length*policy.colorSchemes.length*routeCount;
 // Navigation + initial audit; interactions may wait, inspect intermediate states and audit again.
 const weights={states:2,focus:3,buttons:3,tooltips:4,dialogs:5,tabs:6,menus:6};
 const plans=Array.isArray(interactions)?interactions:[interactions];
 const checksPerRun=Math.max(...plans.map(plan=>2+Object.entries(weights).reduce((n,[kind,weight])=>n+(plan?.[kind]?.length||0)*weight,0)));
 const states=Math.max(0,...plans.map(plan=>plan?.states?.length||0));
 const captureAllowance=(config.browser.captureScreenshots||config.browser.captureAriaSnapshots||config.visual?.enabled)?plannedRuns*(1+states)*30000:0;
 const derived=Math.min(600000,30000+plannedRuns*checksPerRun*stepTimeoutMs+captureAllowance);
 const sessionTimeoutMs=config.browser.sessionTimeoutMs??derived;
 return {stepTimeoutMs,sessionTimeoutMs,sessionTimeoutSource:config.browser.sessionTimeoutMs==null?'derived':'configured',routeCount,plannedRuns,checksPerRun,routeTimeoutMs:config.browser.routeTimeoutMs??Math.floor(sessionTimeoutMs/routeCount),routeTimeoutSource:config.browser.routeTimeoutMs==null?'fair-share':'configured',averageRunBudgetMs:Math.floor(sessionTimeoutMs/plannedRuns)};
}
