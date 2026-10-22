// Planned page audits only. Generated interaction snapshots are observations, not plan states.
export const inspectionLimits = {
 appDiscovery: 'not performed; denominator contains configured routes only',
 axeContrast: {rules:['color-contrast'], iframes:false, scope:'visible main-document audit elements'},
 axeAccessibility: 'selected naming, labeling, ARIA, keyboard and target-size rules mapped by accessibility.js; main-document elements only',
 ownAccessibility: 'custom rules; not a complete axe or WCAG audit',
 interactions: 'explicit plans only; targets must belong to the main document',
 iframe: 'excluded; configure frame document URL as a route when applicable',
 shadowDom: 'excluded from custom document.querySelectorAll audits and interaction targets',
 delegatedEvents: 'not inferred reliably; use explicit markers and interaction plans',
 workerTermination: 'in-memory progress unavailable until worker returns; unconfirmed states are unknown'
};
export function inspectionScope(routes,policy,plans,runs=[],routeResults=[]){
 const states=[];
 for(const [index,route] of routes.entries())for(const viewport of policy.viewports)for(const colorScheme of policy.colorSchemes){
  const run=runs.find(r=>r.route===route.name&&r.viewport?.width===viewport.width&&r.viewport?.height===viewport.height&&r.colorScheme===colorScheme);
  const outcome=routeResults.find(r=>r.route===route.name);
  const names=['initial',...(plans[index]?.states||[]).map(s=>s.name)];
  for(const name of names){
   const observed=run?.states?.find(s=>s.name===name);
   const progress=run?.plannedStates?.find(s=>s.name===name);
   const status=progress?.status||(observed?'completed':run?(run.status==='error'&&name==='initial'?'failed':'not-run'):outcome?.started?'unknown':'not-run');
   states.push({route:route.name,routeKey:route.routeKey,viewport,colorScheme,state:name,kind:name==='initial'?'initial':'named',status,started:progress?progress.started:observed?true:run&&name==='initial'?true:null,accessibilityCoverage:observed?.accessibilityCoverage,reason:status==='unknown'?'State progress could not be confirmed after worker or interaction failure':undefined});
  }
 }
 const counts={requested:states.length,started:states.filter(s=>s.started===true).length,completed:0,failed:0,'not-run':0,unknown:0};
 for(const s of states)counts[s.status]++;
 return {schemaVersion:1,planComplete:!plans.some(p=>p?.loadError),planningErrors:plans.flatMap((p,index)=>p?.loadError?[{route:routes[index].name,error:p.loadError}]:[]),denominator:'configured route × viewport × colorScheme × (initial + named states)',counts,completionRate:counts.requested&&!plans.some(p=>p?.loadError)?counts.completed/counts.requested:null,states,
  intermediateStates:runs.flatMap(r=>(r.states||[]).filter(s=>!['initial',...(plans[routes.findIndex(route=>route.name===r.route)]?.states||[]).map(s=>s.name)].includes(s.name)).map(s=>({route:r.route,viewport:r.viewport,colorScheme:r.colorScheme,state:s.name,kind:'interaction-intermediate'}))),limits:inspectionLimits};
}
