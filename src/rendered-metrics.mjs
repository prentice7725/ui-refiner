// Heuristics, not accessibility rules. Never enforce or baseline these observations.
export function collectRenderedMetrics(){
 const limit=10000,all=[...document.querySelectorAll('body *')];
 const visible=el=>{const r=el.getBoundingClientRect();return el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&!el.closest('[inert]')&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;};
 const elements=all.slice(0,limit).filter(visible);
 const selector=el=>{const parts=[];while(el&&el!==document.body){const siblings=[...el.parentElement.children].filter(x=>x.tagName===el.tagName);parts.unshift(`${el.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(el)+1})`);el=el.parentElement;}return 'body'+(parts.length?' > '+parts.join(' > '):'');};
 const opaque=color=>{const m=color.match(/^rgba?\(([^)]+)\)/);if(!m)return false;const nums=m[1].split(',').map(Number);return nums.length===3||nums[3]>.05;};
 const top=elements.filter(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return ['fixed','sticky'].includes(s.position)&&parseFloat(s.top)===0&&r.top<=1&&r.bottom>0&&r.width*r.height<innerWidth*innerHeight*.5&&!el.closest('dialog,[role="dialog"],[aria-modal="true"],[data-ui-backdrop],[data-ui-overlay]');});
 const headers=top.filter(el=>!top.some(parent=>parent!==el&&parent.contains(el)));
 const buttons=elements.filter(el=>el.matches('button,[role="button"],input[type="button"],input[type="submit"]'));
 const color=value=>{const m=value.match(/^rgba?\(([^)]+)\)$/);if(!m)return null;const parts=m[1].split(',').map(Number);return parts.length>=3&&parts.every(Number.isFinite)?[...parts.slice(0,3),parts[3]??1]:null;};
 const blend=(fg,bg)=>fg.slice(0,3).map((n,i)=>n*fg[3]+bg[i]*(1-fg[3]));
 const backdrop=el=>{
  const layers=[];
  for(let parent=el.parentElement;parent;parent=parent.parentElement){
   const s=getComputedStyle(parent);if(s.backgroundImage!=='none')return null;
   const c=color(s.backgroundColor);if(!c)return null;layers.push(c);
   if(c[3]>=.999){let result=c.slice(0,3);for(const layer of layers.slice(0,-1).reverse())result=blend(layer,result);return result;}
  }
  return null; // Unknown canvas background: do not assert that a button is visually filled.
 };
 const luminance=rgb=>rgb.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
 const unknownButtons=[],contrastThreshold=1.5;
 const filled=buttons.filter(el=>{
  const s=getComputedStyle(el),bg=backdrop(el),c=color(s.backgroundColor);
  if(!bg||!c||s.backgroundImage!=='none'){unknownButtons.push(el);return false;}
  const a=luminance(blend(c,bg)),b=luminance(bg);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=contrastThreshold;
 });
 const actions=new Map();
 const name=el=>el.getAttribute('aria-label')||(el.getAttribute('aria-labelledby')||'').split(/\s+/).map(id=>document.getElementById(id)?.textContent||'').join(' ').trim()||el.innerText||el.value||'';
 for(const el of elements.filter(el=>el.matches('button,[role="button"],a[href],input[type="button"],input[type="submit"]'))){
  const label=name(el).replace(/\s+/g,' ').trim();if(!label)continue;
  const destination=el.matches('a[href]')?new URL(el.getAttribute('href'),location.href).href:'';
  const key=JSON.stringify([el.matches('a[href]')?'link':'button',label,destination]);
  if(!actions.has(key))actions.set(key,{name:label,destination,targets:[]});actions.get(key).targets.push(selector(el));
 }
 const hues=new Set();
 for(const el of elements)for(const color of [getComputedStyle(el).color,getComputedStyle(el).backgroundColor,getComputedStyle(el).borderTopColor]){
  if(!opaque(color))continue;const rgb=color.match(/[\d.]+/g)?.slice(0,3).map(n=>Number(n)/255);if(!rgb||rgb.length<3)continue;
  const [r,g,b]=rgb,max=Math.max(...rgb),min=Math.min(...rgb),d=max-min;
  if(d<.15||max<.15)continue;
  let hue=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;
  hues.add(Math.round(hue*60/15)%24);
 }
 const duplicates=[...actions.values()].filter(x=>x.targets.length>1);
 return {status:all.length>limit?'limited':'complete',candidateLimit:limit,totalElements:all.length,inspectedElements:Math.min(all.length,limit),visibleElements:elements.length,targetSampleLimit:10,duplicateGroupSampleLimit:20,duplicateActionGroups:duplicates.length,actionNameMethod:'DOM label/text approximation; consult ARIA YAML for accessible names',visibilityMethod:'checkVisibility plus viewport bounding-box intersection; occlusion is not modeled',topPinned:{count:headers.length,targets:headers.slice(0,10).map(selector)},filledButtons:{count:filled.length,contrastThreshold,unknownBackgrounds:unknownButtons.length,unknownTargets:unknownButtons.slice(0,10).map(selector),targets:filled.slice(0,10).map(selector)},duplicateActions:duplicates.map(x=>({...x,count:x.targets.length,targets:x.targets.slice(0,10)})).slice(0,20),chromaticHueBuckets:{count:hues.size,degreesPerBucket:15,buckets:[...hues].sort((a,b)=>a-b)}};
}
export function metricFindings(metrics,state){
 const observations=[];
 if(metrics.topPinned.count>1)observations.push(['render-top-pinned',metrics.topPinned,'Review competing top-pinned regions; nested elements are counted once.']);
 if(metrics.filledButtons.count>1)observations.push(['render-filled-buttons',metrics.filledButtons,'Review primary-action hierarchy against the SOT; multiple filled buttons may be intentional.']);
 if(metrics.duplicateActions.length)observations.push(['render-duplicate-actions',metrics.duplicateActions,'Review repeated action names and destinations; repeated row actions may be intentional.']);
 return observations.map(([rule,actual,fix])=>({rule,selector:'body',advisory:true,identity:{key:'body',stable:true},message:'Rendered design heuristic; advisory only, not a proven violation.',actual,fix,viewport:state.viewport,colorScheme:state.colorScheme,state:state.name,route:state.route,routeUrl:state.routeUrl,routeKey:state.routeKey}));
}
