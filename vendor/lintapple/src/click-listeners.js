// Chromium CDP discovers direct click listeners without instrumenting or changing app code.
// Delegated root handlers cannot identify every actionable descendant; report that limit explicitly.
export async function discoverClickListeners(page,{limit=500}={}){
 let session,array;
 const handles=[];
 try{
  session=await page.context().newCDPSession(page);
  array=await session.send('Runtime.evaluate',{expression:`Array.from(document.querySelectorAll('body *')).filter(el => !el.matches('button,input,select,textarea,a[href],summary,[contenteditable="true"]') && !Object.keys(el).some(k=>k.startsWith('__reactContainer$')||k==='__vue_app__') && typeof el.onclick !== 'function' && !el.matches('[onclick],[data-ui-clickable]') && (el.getBoundingClientRect().width || el.getBoundingClientRect().height)).map((el,index)=>({el,index,pointer:getComputedStyle(el).cursor==='pointer'})).sort((a,b)=>Number(b.pointer)-Number(a.pointer)||a.index-b.index).map(item=>item.el).slice(0,${limit+1})`,objectGroup:'ui-refiner-click-discovery'});
  if(!array.result.objectId)throw Error('No element array returned');
  const properties=await session.send('Runtime.getProperties',{objectId:array.result.objectId,ownProperties:true});
  const candidates=properties.result.filter(p=>/^\d+$/.test(p.name)&&p.value?.objectId);
  for(const candidate of candidates.slice(0,limit)){
   const listeners=await session.send('DOMDebugger.getEventListeners',{objectId:candidate.value.objectId});
   if(listeners.listeners.some(l=>l.type==='click')){
    // Transfer the node by backendNodeId instead of writing marker attributes into the page.
    const described=await session.send('DOM.describeNode',{objectId:candidate.value.objectId});
    handles.push(described.node.backendNodeId);
   }
  }
  // Handles remain within this CDP session; obtain the nodes as a page JSHandle for the audit.
  const nodes=[];
  for(const backendNodeId of handles){
   const resolved=await session.send('DOM.resolveNode',{backendNodeId,objectGroup:'ui-refiner-click-discovery'});
   // Find the node's document order index without assigning any application property.
   const index=await session.send('Runtime.callFunctionOn',{objectId:resolved.object.objectId,functionDeclaration:'function(){ return Array.from(document.querySelectorAll("body *")).indexOf(this); }',returnByValue:true});
   if(Number.isInteger(index.result.value)&&index.result.value>=0)nodes.push(index.result.value);
  }
  return {indices:nodes,coverage:{method:'DOM properties + Chromium CDP direct listeners',status:candidates.length>limit?'limited':'direct-listeners-tested',inspected:Math.min(candidates.length,limit),limit,priority:'cursor:pointer first, then document order',note:'Delegated handlers and listeners beyond the candidate cap are not fully attributed; use explicit data-ui-clickable markers and interaction plans.'}};
 }catch(e){return {indices:[],coverage:{method:'DOM properties only',status:'CDP-unavailable',reason:e.message,note:'Direct addEventListener registrations were not enumerated.'}};}
 finally{if(session){await session.send('Runtime.releaseObjectGroup',{objectGroup:'ui-refiner-click-discovery'}).catch(()=>{});await session.detach().catch(()=>{});}}
}
