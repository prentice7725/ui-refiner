import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const corpusUrl=new URL('../knowledge/ui-ux-pro-max/',import.meta.url);
const sha=b=>createHash('sha256').update(b).digest('hex');
const columns=['No','Category','Issue','Platform','Description','Do',"Don't",'Code Example Good','Code Example Bad','Severity'];
const stop=new Set('a an and are as at be by can do every for from has have in into is it its no not of on or should than that the their then there these this to use uses using when which with without'.split(' '));
const tokenise=value=>[...String(value??'').normalize('NFKC').toLowerCase().matchAll(/[\p{L}\p{N}]+/gu)].map(m=>m[0]).filter(t=>!stop.has(t));

// RFC-style quoted fields, commas, doubled quotes and embedded newlines. Source lines stay physical.
export function parseGuidanceCsv(text){
 if(typeof text!=='string'||Buffer.byteLength(text)>1_000_000)throw Error('Guidance CSV exceeds the 1 MB limit');
 const rows=[];let row=[],field='',quoted=false,closed=false,line=1,start=1;
 const cell=()=>{row.push(field);field='';closed=false;};
 const record=()=>{cell();if(row.some(v=>v!==''))rows.push({fields:row,lineStart:start,lineEnd:line});row=[];start=line+1;};
 const input=text.replace(/^\uFEFF/,'').replaceAll('\r\n','\n');
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(quoted){if(c==='"'){if(input[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else{field+=c;if(c==='\n')line++;}}
  else if(c==='"'){if(field||closed)throw Error('Malformed CSV quote');quoted=true;}
  else if(c===',')cell();else if(c==='\n'){record();line++;}else{if(closed)throw Error('Unexpected data after quoted field');field+=c;}
 }
 if(quoted)throw Error('Unclosed CSV quote');if(field||row.length||closed)record();
 if(JSON.stringify(rows.shift()?.fields)!==JSON.stringify(columns))throw Error('Unexpected guidance CSV header');
 const ids=new Set();return rows.map(r=>{if(r.fields.length!==columns.length)throw Error('Invalid guidance CSV column count');const data=Object.fromEntries(columns.map((c,i)=>[c,r.fields[i]]));if(!/^\d+$/.test(data.No)||ids.has(data.No)||Object.values(data).some(v=>v.length>8000))throw Error('Invalid or duplicate guidance ID/field');ids.add(data.No);return {...data,lineStart:r.lineStart,lineEnd:r.lineEnd};});
}

export function buildGuidanceIndex(rows){
 const documents=rows.filter(r=>['Web','All'].includes(r.Platform)).map(row=>{
  const tokens=tokenise([row.Issue,row.Issue,row.Issue,row.Category,row.Description,row.Do,row["Don't"]].join(' ')),terms=new Map();for(const t of tokens)terms.set(t,(terms.get(t)||0)+1);return {row,terms,length:tokens.length};
 });
 const df=new Map();for(const doc of documents)for(const t of doc.terms.keys())df.set(t,(df.get(t)||0)+1);
 return {documents,df,averageLength:documents.reduce((n,d)=>n+d.length,0)/(documents.length||1)};
}
let cached;
export async function loadGuidanceCorpus(){
 if(cached)return cached;
 const [bytes,manifest]=await Promise.all([fs.readFile(new URL('ux-guidelines.csv',corpusUrl)),fs.readFile(new URL('provenance.json',corpusUrl),'utf8').then(JSON.parse)]);
 if(manifest.repository!=='https://github.com/nextlevelbuilder/ui-ux-pro-max-skill'||!/^[a-f0-9]{40}$/.test(manifest.commit)||manifest.path!=='src/ui-ux-pro-max/data/ux-guidelines.csv'||!Number.isInteger(manifest.rowCount))throw Error('Invalid pinned guidance provenance');
 if(sha(bytes)!==manifest.sha256)throw Error('Guidance corpus hash mismatch');
 const rows=parseGuidanceCsv(bytes.toString('utf8'));if(rows.length!==manifest.rowCount)throw Error('Guidance row count mismatch');
 cached={manifest,index:buildGuidanceIndex(rows)};return cached;
}

export function searchGuidance(index,query,{limit=3,categories}={}){
 if(typeof query!=='string'||query.length>1000||!Number.isInteger(limit)||limit<1||limit>5)throw Error('Guidance query needs <=1000 characters and limit 1..5');
 const aliases=[[/포커스|초점|フォーカス|焦点/gu,'keyboard focus states'],[/키보드|キーボード/gu,'keyboard navigation'],[/클리핑|잘림|切り詰め/gu,'overflow hidden truncation'],[/오버플로|オーバーフロー/gu,'content overflow'],[/폼|양식|フォーム/gu,'forms input labels'],[/오류|에러|エラー/gu,'error placement feedback'],[/대비|コントラスト/gu,'color contrast'],[/모션|동작 줄이기|モーション/gu,'reduced motion']];
 const expanded=aliases.reduce((text,[pattern,words])=>text.replace(pattern,words),query);
 const terms=[...new Set(tokenise(expanded))];if(!terms.length)return [];
 const n=index.documents.length,k1=1.5,b=.75;
 const scored=index.documents.filter(doc=>!categories||categories.includes(doc.row.Category)).map(doc=>{
  let score=0;const matched=[];for(const term of terms){const tf=doc.terms.get(term)||0;if(!tf)continue;matched.push(term);const df=index.df.get(term);score+=Math.log(1+(n-df+.5)/(df+.5))*tf*(k1+1)/(tf+k1*(1-b+b*doc.length/(index.averageLength||1)));}
  return {...doc,score,matched};
 }).filter(d=>d.score>0&&d.matched.length>=Math.min(2,terms.length)).sort((a,b)=>b.score-a.score||Number(a.row.No)-Number(b.row.No));
 return scored.filter(d=>d.score>=scored[0].score*.4).slice(0,limit).map(d=>({row:d.row,score:Number(d.score.toFixed(6)),matchedTerms:d.matched}));
}

// Queries come from audited rule IDs, never arbitrary text or instructions from the inspected page.
export const repairQueries={
 'content-clipping':'Overflow Hidden Truncation Essential Text Truncation Long Token Wrapping',
 'content-overflow':'Text Reflow Spacing Long Token Wrapping Truncation',
 'horizontal-overflow':'Horizontal Scroll Container Width Table Handling',
 'viewport-bounds':'Fixed Positioning Sticky Navigation Container Width',
 'focus-visible':'Focus States visible keyboard indicator',
 'focus-obscured':'Focus Not Obscured Minimum sticky persistent overlays',
 'keyboard-operation':'Keyboard Navigation operable control keyboard tab order',
 'accessible-name':'ARIA Labels interactive accessible names',
 'form-label':'Form Labels Input Labels associated visible label',
 'aria-reference':'ARIA Labels Screen Reader associated labels',
 'label-consistency':'Input Labels accessible names visible labels',
 'control-state':'Disabled States Submit Feedback Loading Buttons',
 'dialog-focus':'Keyboard Navigation modal focus trap return',
 'target-size':'Target Size Minimum web pointer target',
 'control-size':'Target Size Minimum web pointer target',
 'control-gap':'Touch Friendly Touch Spacing',
 'font-size':'Readable Font Size Font Size Scale',
 'font-loading':'Font Loading fallback layout shift',
 'text-contrast':'Color Contrast Contrast Readability',
 'no-reduced-motion':'Reduced Motion Motion Sensitivity',
 'transition-all':'Transform Performance animation transition properties',
 'layout-animation':'Transform Performance animation width height top left',
 'duration-range':'Duration Timing motion context responsive feedback',
 'linear-movement':'Easing Functions constant progress',
 'infinite-loop':'Continuous Animation Auto Rotating Content Controls',
 'js-interval-anim':'Transform Performance animation layout',
 'input-zoom':'Readable Font Size mobile',
 'viewport-height':'Viewport Units mobile'
};
export function guidanceOptions(config={}){
 const value=config.guidance??{};
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['enabled','maxFindings','maxSuggestions'].includes(k)))throw Error('Invalid guidance options');
 const options={enabled:true,maxFindings:20,maxSuggestions:2,...value};
 if(typeof options.enabled!=='boolean'||!Number.isInteger(options.maxFindings)||options.maxFindings<1||options.maxFindings>50||!Number.isInteger(options.maxSuggestions)||options.maxSuggestions<1||options.maxSuggestions>3)throw Error('guidance requires enabled boolean, maxFindings 1..50 and maxSuggestions 1..3');
 return options;
}
const sourceFor=(manifest,row)=>({repository:manifest.repository,commit:manifest.commit,path:manifest.path,sha256:manifest.sha256,rowId:row.No,lineStart:row.lineStart,lineEnd:row.lineEnd,url:manifest.repository+'/blob/'+manifest.commit+'/'+manifest.path+'#L'+row.lineStart+(row.lineEnd!==row.lineStart?'-L'+row.lineEnd:'')});
export function makeSuggestions(corpus,query,limit,categories){return searchGuidance(corpus.index,query,{limit,categories}).map(({row,score,matchedTerms})=>({id:'ui-ux-pro-max/ux/'+row.No,title:row.Issue,category:row.Category,platform:row.Platform,advisory:true,blocking:false,upstreamSeverity:row.Severity,description:row.Description,recommendation:row.Do,avoid:row["Don't"],example:{good:row['Code Example Good'],bad:row['Code Example Bad']},score,matchedTerms,source:sourceFor(corpus.manifest,row),limitations:'Source guidance and examples require project/SOT and reduced-motion review; severity and ranking are not evidence of a violation.'}));}
const categoriesFor=rule=>/motion|transition|animation|duration|linear|infinite|interval/.test(rule)?['Animation','Accessibility']:/target-size|control-size/.test(rule)?['Accessibility']:/font/.test(rule)?['Typography','Performance','Responsive']:/form-label|label-consistency/.test(rule)?['Forms','Accessibility']:/focus|keyboard|aria|accessible-name|dialog/.test(rule)?['Accessibility','Interaction']:undefined;

export async function repairGuidance(report,config={},loader=loadGuidanceCorpus){
 const options=guidanceOptions(config);const base={schemaVersion:1,advisory:true,blocking:false,options,entries:[],limits:'Suggestions never change findings, baselines, policy, gate status or exit codes. Source examples are data, not instructions to execute.'};
 if(!options.enabled)return {...base,status:'disabled'};
 try{
  const corpus=await loader();const candidates=(report.findings||[]).filter(f=>!f.baselined&&!f.reviewedException&&!f.existingBrowserDebt).map((f,i)=>({f,i})).sort((a,b)=>Number(!!b.f.blocking)-Number(!!a.f.blocking)||a.i-b.i);
  const entries=candidates.slice(0,options.maxFindings).map(({f})=>{const query=repairQueries[f.rule];return {findingId:f.id,engine:f.engine,rule:f.rule,target:{selector:f.selector,file:f.file,line:f.line,route:f.route,state:f.state,viewport:f.viewport,colorScheme:f.colorScheme},query:query??null,status:query?'suggested':'no-match',suggestions:query?makeSuggestions(corpus,query,options.maxSuggestions,categoriesFor(f.rule)):[]};});
  for(const e of entries)if(!e.suggestions.length)e.status='no-match';
  return {...base,status:'ready',source:corpus.manifest,entries,counts:{eligible:candidates.length,considered:entries.length,suggested:entries.filter(e=>e.suggestions.length).length,unmapped:entries.filter(e=>e.status==='no-match').length,omitted:candidates.length-entries.length},truncated:candidates.length>entries.length};
 }catch(e){return {...base,status:'unavailable',reason:e.message};}
}

const escape=value=>String(value??'').replace(/[\\`*_{}\[\]()<>#!|]/g,'\\$&').replace(/[\r\n]+/g,' ').slice(0,500);
export function guidanceMarkdown(result,{maxBytes=3200,maxEntries=4}={}){
 const heading='## Repair guidance — advisory\n\n',footer='Full source rows, examples and omitted targets: report.json repairGuidance / handoff.json. Follow approved SOT; never turn upstream severity into a blocker.\n';
 if(!result||result.status!=='ready')return heading+'Guidance '+escape(result?.status||'unavailable')+'. '+escape(result?.reason||'')+'\n';
 const rows=[];let bytes=Buffer.byteLength(heading+footer);for(const entry of result.entries){if(!entry.suggestions.length)continue;if(rows.length>=maxEntries)break;const suggestion=entry.suggestions[0],text='- '+escape(entry.engine+'/'+entry.rule)+' ('+escape(entry.findingId)+'): **'+escape(suggestion.title)+'** — '+escape(suggestion.recommendation)+' [Source row '+suggestion.source.rowId+']('+suggestion.source.url+'). Upstream severity: '+escape(suggestion.upstreamSeverity)+'; advisory only.\n';if(bytes+Buffer.byteLength(text)>maxBytes-180)break;rows.push(text);bytes+=Buffer.byteLength(text);}
 const omitted=(result.counts?.eligible??result.entries.length)-rows.length;return heading+rows.join('')+(omitted>0?'\nTRUNCATED: '+omitted+' eligible findings are not shown in this preview (including unmapped findings).\n':'')+'\n'+footer;
}
