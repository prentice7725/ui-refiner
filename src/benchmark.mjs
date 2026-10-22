// Match labeled defect instances, counting duplicate findings once per rule/selector/state/dimensions.
export function evaluateBenchmark(labels,findings){
 const rows=labels.map(label=>{const matches=findings.filter(f=>f.route===label.route&&f.rule===label.rule&&(!label.selector||f.selector===label.selector));return {...label,detected:matches.length>0,rawFindings:matches.length,matched:(matches.length>0)===label.expected};});
 const scored=rows.filter(r=>r.kind==='defect-contract');
 const tp=scored.filter(r=>r.expected&&r.detected).length,fp=scored.filter(r=>!r.expected&&r.detected).length,fn=scored.filter(r=>r.expected&&!r.detected).length;
 return {schemaVersion:1,status:rows.every(r=>r.matched)?'PASS':'FAIL',rows,metrics:{unit:'labeled rule/target instances; duplicates collapsed; boundary probes excluded',tp,fp,fn,precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null}};
}
