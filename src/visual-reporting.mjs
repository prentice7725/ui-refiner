const text=value=>String(value??'').replace(/[\r\n]+/g,' ').slice(0,240).replace(/[\\`*_{}\[\]()<>#!|]/g,'\\$&');
const link=(image,label)=>image?.file&&!image.file.split(/[\\/]/).some(part=>part==='..'||part==='')&&!/[:\\]/.test(image.file)?`[${label}](${image.file.split('/').map(encodeURIComponent).join('/')})`:'';
export function visualReviewSummary(visual){
 if(!visual?.enabled)return 'Visual image comparison: not-requested (disabled).';
 const counts=Object.entries(visual.counts).map(([key,value])=>`${key}=${value}`).join(', ');
 return `Visual image comparison: ${visual.status}; mode=${visual.mode}; ${counts}.${visual.reason?' '+text(visual.reason)+'.':''} Human visual review requirements remain in effect.`;
}
export function visualComparisonMarkdown(visual,{limit=20}={}){
 const rows=[visualReviewSummary(visual)];
 if(!visual?.enabled)return rows[0];
 for(const entry of visual.entries.slice(0,limit)){
  const d=entry.dimensions;
  rows.push(`- **${entry.status}** — ${[d.route,d.state,`${d.viewport.width}x${d.viewport.height}`,d.colorScheme,d.locale,d.capture].map(text).join(' / ')}\n  ${[link(entry.actual,'Actual'),link(entry.expected,'Expected'),link(entry.diff,'Diff')].filter(Boolean).join(' · ')}${entry.reason?'\n  '+text(entry.reason):''}${entry.diffPixels!=null?'\n  Different pixels: '+entry.diffPixels+'/'+entry.totalPixels+' ('+(entry.diffRatio*100).toFixed(4)+'%); allowed='+entry.allowedDiffPixels+', pixel threshold='+entry.compatibility.comparator.threshold:entry.comparisonDimensions?'\n  Image dimensions: '+text(JSON.stringify(entry.comparisonDimensions)):''}${entry.maskRegions?.length?'\n  Declared masks: '+entry.maskRegions.length+' region(s); exact selectors/boxes in report.json.':''}`);
 }
 if(visual.entries.length>limit)rows.push(`- ${visual.entries.length-limit} additional visual states in report.json.`);
 rows.push(`Comparison metrics: ${visual.metrics.compareMs.toFixed(1)} ms; generated image bytes=${visual.metrics.artifactBytes}; sampled worker RSS=${visual.metrics.maxObservedWorkerRssBytes} bytes (browser process tree excluded).`);
 return rows.join('\n\n');
}
