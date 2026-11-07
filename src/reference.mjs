// Reference-site data: compact measurements per site, a fixed tune/holdout split, robots.txt reading
// and distribution summaries. Pure except for nothing; the collector script does the I/O.
import crypto from 'node:crypto';

/** Fixed split from the host (www ignored): ~70% tune, ~30% holdout. Stable across runs and machines. */
export const splitOf=host=>parseInt(crypto.createHash('sha1').update(String(host).replace(/^www\./,'')).digest('hex').slice(0,8),16)%10<7?'tune':'holdout';

/** robots.txt for the "*" group: the longest matching Allow/Disallow wins, Allow wins ties; * and $ supported. */
export function robotsAllows(txt,pathname='/'){
 const groups=[];let cur=null,lastWasAgent=false;
 for(const raw of String(txt).split(/\r?\n/)){
  const line=raw.replace(/#.*/,'').trim(),m=line.match(/^([a-z-]+)\s*:\s*(.*)$/i);if(!m)continue;
  const k=m[1].toLowerCase(),v=m[2].trim();
  if(k==='user-agent'){if(!lastWasAgent){cur={agents:[],rules:[]};groups.push(cur);}cur.agents.push(v.toLowerCase());lastWasAgent=true;continue;}
  lastWasAgent=false;if(cur&&(k==='allow'||k==='disallow')&&v)cur.rules.push({allow:k==='allow',path:v});
 }
 const toRe=p=>new RegExp('^'+p.replace(/[.+?^{}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*'));
 let best=null;
 for(const r of groups.filter(g=>g.agents.includes('*')).flatMap(g=>g.rules))
  if(toRe(r.path).test(pathname)&&(!best||r.path.length>best.path.length||(r.path.length===best.path.length&&r.allow)))best=r;
 return !best||best.allow;
}

const r2=v=>v==null?null:+(+v).toFixed(2);

/** Numeric/categorical measurements only: no page text, no selectors, no screenshots. */
export function compactSite(result){
 const d=result.raw?.[0],m=d?.metrics,ja=d?.ja,a=result.aiLook;
 const t=m?.typography;
 return {
  lang:result.lang,score:a.score,band:a.band,signals:a.signals.map(s=>s.id),scored:a.signals.filter(s=>s.weight>0).map(s=>s.id),craft:a.craft||[],measures:a.measures,
  type:t?{families:t.families.map(f=>f.name).slice(0,4),sizes:t.sizes,weights:t.weights,body:t.body,h1:t.h1,display:t.display,ratio:r2(t.ratio),webfonts:(m.craft?.loadedFonts||[]).length}:null,
  color:m?{hues:m.hueBuckets,rootBg:m.rootBackground?.rgb||null,dark:!!m.rootBackground?.dark}:null,
  layout:m?{centered:r2(m.centered.ratio),rounded:r2(m.rounding.ratio),cardGrids:m.cardGrids.count,largeGradients:m.gradients.large,glass:m.glass.count,tracked:m.editorial?.tracked??null}:null,
  ja:ja?.japanese?{jaRatio:r2(ja.jaRatio),fontFallback:ja.fontFallback.ratio,lineHeight:ja.lineHeight.median??null,bodySize:r2(ja.lineHeight.bodySize),
   tightShare:ja.lineHeight.paragraphs?r2(ja.lineHeight.tight/ja.lineHeight.paragraphs):null,phraseAware:ja.phraseAware??null,issues:(result.japanese?.issues||[]).map(i=>i.id)}:null,
  quality:Object.fromEntries((result.quality||[]).map(q=>[q.rule,q.count]))
 };
}

const quant=(xs,p)=>{const s=xs.filter(v=>v!=null&&!Number.isNaN(v)).sort((a,b)=>a-b);return s.length?s[Math.min(s.length-1,Math.floor(p*s.length))]:null;};
const dist=xs=>({n:xs.filter(v=>v!=null).length,p10:quant(xs,.1),p50:quant(xs,.5),p90:quant(xs,.9)});
const share=(xs,f)=>xs.length?r2(xs.filter(f).length/xs.length):null;
const counts=xs=>Object.entries(xs.reduce((o,k)=>(o[k]=(o[k]||0)+1,o),{})).sort((a,b)=>b[1]-a[1]);
// First family of a font stack, normalized: '"Noto Sans JP", sans-serif' → 'noto sans jp'.
export const firstFamily=stack=>String(stack||'').split(',')[0].replace(/["']/g,'').trim().toLowerCase()||null;

function summarizeGroup(sites){
 const ja=sites.filter(s=>s.ja);
 const signalIds=[...new Set(sites.flatMap(s=>s.signals))].sort();
 return {
  n:sites.length,
  score:{...dist(sites.map(s=>s.score)),flagged20:share(sites,s=>s.score>=20),flagged30:share(sites,s=>s.score>=30)},
  signals:Object.fromEntries(signalIds.map(id=>[id,share(sites,s=>s.signals.includes(id))]).sort((a,b)=>b[1]-a[1])),
  type:{bodySize:dist(sites.map(s=>s.type?.body)),displayRatio:dist(sites.map(s=>s.type?.ratio)),sizes:dist(sites.map(s=>s.type?.sizes)),weights:dist(sites.map(s=>s.type?.weights)),webfontShare:share(sites,s=>s.type?.webfonts>0)},
  color:{hues:dist(sites.map(s=>s.color?.hues)),darkShare:share(sites,s=>s.color?.dark)},
  layout:{centered:dist(sites.map(s=>s.layout?.centered)),rounded:dist(sites.map(s=>s.layout?.rounded)),trackedAny:share(sites,s=>s.layout?.tracked>0),tracked:dist(sites.map(s=>s.layout?.tracked))},
  japanese:ja.length?{n:ja.length,lineHeight:dist(ja.map(s=>s.ja.lineHeight)),bodySize:dist(ja.map(s=>s.ja.bodySize)),noJaFontShare:share(ja,s=>s.ja.fontFallback>.5),
   tightShare:share(ja,s=>s.ja.tightShare>.5),phraseAware:share(ja,s=>s.ja.phraseAware>0),
   topFamilies:counts(ja.map(s=>firstFamily(s.type?.families?.[0])).filter(Boolean)).slice(0,10),
   issues:Object.fromEntries(counts(ja.flatMap(s=>[...new Set(s.ja.issues)])).map(([k,v])=>[k,r2(v/ja.length)]))}:null
 };
}

export function summarizeReference(results){
 const ok=results.filter(r=>r.status==='ok');
 const cats=[...new Set(ok.map(r=>r.category))].sort();
 return {
  generatedAt:new Date().toISOString(),
  attempted:results.length,ok:ok.length,skippedRobots:results.filter(r=>r.status==='robots').map(r=>r.url),errors:results.filter(r=>r.status==='error').map(r=>({url:r.url,error:r.error})),
  split:{tune:ok.filter(r=>r.split==='tune').length,holdout:ok.filter(r=>r.split==='holdout').length},
  all:summarizeGroup(ok),
  byCategory:Object.fromEntries(cats.map(c=>[c,summarizeGroup(ok.filter(r=>r.category===c))]))
 };
}

const d3=d=>d?.n?`${d.p10} / ${d.p50} / ${d.p90}`:'—';
export function renderReferenceSummary(s){
 const cats=Object.keys(s.byCategory),groups=[['all',s.all],...cats.map(c=>[c,s.byCategory[c]])];
 const row=(label,f)=>`| ${label} | ${groups.map(([,g])=>f(g)??'—').join(' | ')} |`;
 const head=`| | ${groups.map(([k,g])=>`${k} (${g.n})`).join(' | ')} |`,sep=`|---|${groups.map(()=>'---:').join('|')}|`;
 const sigIds=Object.keys(s.all.signals);
 return ['# Japanese reference sites','',
  `${s.ok}/${s.attempted} sites measured (${s.skippedRobots.length} skipped by robots.txt, ${s.errors.length} failed). Split: ${s.split.tune} tune / ${s.split.holdout} holdout.`,
  'Values are p10 / p50 / p90 unless marked as a share. Measured at 1440px; signals merge 1440px and 390px.','',
  '## Overview','',head,sep,
  row('AI-look score',g=>d3(g.score)),row('score ≥ 20 (share)',g=>g.score.flagged20),
  row('body text px',g=>d3(g.type.bodySize)),row('display / body ratio',g=>d3(g.type.displayRatio)),row('font sizes used',g=>d3(g.type.sizes)),row('webfont loaded (share)',g=>g.type.webfontShare),
  row('hue groups',g=>d3(g.color.hues)),row('dark background (share)',g=>g.color.darkShare),
  row('tracked caps labels (any, share)',g=>g.layout.trackedAny),
  row('JA body line-height',g=>d3(g.japanese?.lineHeight)),row('JA body px',g=>d3(g.japanese?.bodySize)),row('JA: no Japanese font in stack (share)',g=>g.japanese?.noJaFontShare),
  row('JA: mostly tight line-height (share)',g=>g.japanese?.tightShare),row('JA: phrase-aware headings (share)',g=>g.japanese?.phraseAware),'',
  '## AI-look signal hit rate','',head,sep,...sigIds.map(id=>row(id,g=>g.signals[id]??0)),'',
  '## Japanese typesetting issue rate','',head,sep,...Object.keys(s.all.japanese?.issues||{}).map(id=>row(id,g=>g.japanese?.issues[id]??0)),'',
  '## Most used font family on Japanese pages','',...(s.all.japanese?.topFamilies||[]).map(([f,n])=>`- ${f}: ${n}`),''].join('\n');
}
