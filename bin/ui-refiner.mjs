#!/usr/bin/env node
import {createVisualCandidate,approveVisualCandidate} from '../src/visual-baseline.mjs';
import {exportHtmlBundle,exportSarif} from '../src/exporters.mjs';
import {reportToSarif} from '../src/sarif.mjs';
import {renderOfflineReport} from '../src/offline-report.mjs';
import {recordPreservation} from '../src/preservation.mjs';
import {ruleCatalog,workflowGuide} from '../src/rule-catalog.mjs';
import {createReviewPacket,validateDesignReview} from '../src/design-review.mjs';
import {loadGuidanceCorpus,makeSuggestions} from '../src/repair-guidance.mjs';
import path from 'node:path';
import fs from 'node:fs/promises';
import {initProject,loadConfig} from '../src/config.mjs';
import {runGate,exitCode,baselineFromReport} from '../src/gate.mjs';
import {doctor} from '../src/doctor.mjs';
import {upstreamCheck} from '../src/vendor.mjs';
import {presets} from '../src/presets.mjs';
import {scanUrl} from '../src/scan.mjs';

const help=`UI Refiner 0.3.0 — de-AI web design review and UI quality gate
  ui-refiner scan <url|host|file> [--out ui-refiner-scan] [--lang ko|en] [--source src] [--json]   zero-config design review of any page
  ui-refiner init [--preset ${presets.join('|')}] [--dir path] [--locale en-US|ko-KR|ja-JP]
  ui-refiner check [--config ui-refiner.config.json] [--url http://127.0.0.1:5173] [--changed-only] [--base ref]
  ui-refiner review packet --from report.json --out review-folder
  ui-refiner review validate --from review.json --report report.json [--out validated.json]
  ui-refiner guidance --query "keyboard focus" [--limit 3] [--json]
  ui-refiner rules [--json]
  ui-refiner guide audit|critique|polish|harden [--json]
  ui-refiner preserve record --from report.json --out preservation-reference.json
  ui-refiner export html|sarif --from report.json --out destination
  ui-refiner check [--format json|sarif|html|markdown]
  ui-refiner doctor [--config ui-refiner.config.json]
  ui-refiner upstream check
  ui-refiner baseline create --from artifacts/ui-refiner/report.json --out ui-refiner.baseline.json
  ui-refiner visual candidate --from artifacts/ui-refiner/report.json --out visual-candidate
  ui-refiner visual approve --from visual-candidate/manifest.json --out ui-visual-baseline
Exit 0: automated checks pass (manual visual review may remain), 1: findings, 2: infrastructure/error/uncovered, 3: scoped pass only (never full approval)`;
function parse(args){const out={_:[]};for(let i=0;i<args.length;i++){
  const a=args[i];if(!a.startsWith('--')){out._.push(a);continue;}
  if(a==='--changed-only'){out.changedOnly=true;continue;}
  if(a==='--json'){out.json=true;continue;}
  if(a==='--help'){out.help=true;continue;}
  if(!['--preset','--dir','--config','--url','--from','--out','--locale','--base','--format','--report','--query','--limit','--lang','--source'].includes(a))throw new Error(`Unknown flag ${a}`);
  const value=args[++i];if(!value||value.startsWith('--'))throw new Error(`Missing value for ${a}`);
  const key=a.slice(2);if(out[key])throw new Error(`Duplicate flag ${a}`);out[key]=value;
}return out;}
try{
  const args=parse(process.argv.slice(2));
  const [command,sub]=args._;
  if(!command||args.help||command==='help'){console.log(help);process.exitCode=0;}
  else if(command==='scan'&&args._.length===2){
    if(args.lang&&!['ko','en'].includes(args.lang))throw Error('--lang must be ko or en');
    const {result,dir}=await scanUrl(sub,{out:args.out||'ui-refiner-scan',lang:args.lang||'ko',source:args.source||null});
    if(args.json)console.log(JSON.stringify(result,null,2));
    else console.log(`[SCAN] AI-look ${result.aiLook.score}/100 (${result.aiLook.band}); signals=${result.aiLook.signals.map(s=>s.id).join(',')||'none'}; quality issues=${result.quality.reduce((n,q)=>n+q.count,0)}; ${path.join(dir,'DESIGN_REVIEW.md')}`);
  }
  else if(command==='guidance'&&args._.length===1){
    if(!args.query)throw Error('guidance requires --query');const limit=args.limit===undefined?3:Number(args.limit);const corpus=await loadGuidanceCorpus();const suggestions=makeSuggestions(corpus,args.query,limit);console.log(JSON.stringify({schemaVersion:1,advisory:true,blocking:false,query:args.query,status:suggestions.length?'matched':'no-match',suggestions},null,2));
  }
  else if(command==='rules'&&args._.length===1){const result=await ruleCatalog();console.log(args.json||args.format==='json'?JSON.stringify(result,null,2):result.rules.map(r=>r.engine+'/'+r.id+' ['+r.domain+'] '+r.phases.join('+')+' — '+r.enforcement).join('\n'));}
  else if(command==='guide'&&args._.length===2){const result=workflowGuide(sub);console.log(args.json||args.format==='json'?JSON.stringify(result,null,2):result.goal+'\n\n'+result.required.map(s=>'- '+s).join('\n'));}
  else if(command==='init'&&args._.length===1){
    const root=path.resolve(args.dir||'.');const statuses=await initProject(root,args.preset||'web',args.locale||'en-US');console.log(statuses.join('\n'));console.log('Configure SOT; use bundled source of both auditors, then run ui-refiner check.');
  }else if(command==='check'&&args._.length===1){
    const {root,config,file}=await loadConfig(args.config);
    if(args.format&&!["json","sarif","html","markdown"].includes(args.format))throw Error("Unknown output format");
    if(args.url)config.browser.url=args.url;
    const report=await runGate({root,config,configFile:file,changedOnly:!!args.changedOnly,baseRef:args.base});
    if(args.format)console.log(args.format==='json'?JSON.stringify(report,null,2):args.format==='sarif'?JSON.stringify(reportToSarif(report),null,2):args.format==='html'?renderOfflineReport(report):await fs.readFile(path.join(root,config.reportDir,'report.md'),'utf8'));
    else console.log(`[${report.status}] new blockers=${report.summary.blockers}, findings=${report.summary.total}, visual=${report.visual?.status||'not-requested'}; ${path.join(root,config.reportDir,'report.md')}`);
    for(const s of report.stages)if(s.error)console.error(`[${s.engine}] ${s.error}`);
    process.exitCode=exitCode(report);
  }else if(command==='review'&&['packet','validate'].includes(sub)&&args._.length===2){
    if(!args.from||sub==='packet'&&!args.out||sub==='validate'&&!args.report)throw Error('review requires --from and packet --out / validate --report');
    const result=sub==='packet'?await createReviewPacket(args.from,args.out):await validateDesignReview(args.from,args.report);
    if(sub==='validate'&&args.out)await fs.writeFile(args.out,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));
  }else if(command==='preserve'&&sub==='record'&&args._.length===2){
    if(!args.from||!args.out)throw Error('preserve record requires --from and --out');
    const value=await recordPreservation(args.from,args.out);console.log('Recorded '+value.entries.length+' inventories. Review the preservation reference before enforcing.');
  }else if(command==='export'&&['html','sarif'].includes(sub)&&args._.length===2){
    if(!args.from||!args.out)throw Error('export requires --from and --out');
    const report=await (sub==='html'?exportHtmlBundle:exportSarif)(args.from,args.out);
    console.log('Exported '+sub+'; original verdict '+report.status+'; exit '+exitCode(report));process.exitCode=exitCode(report);
  }else if(command==='doctor'&&args._.length===1){
    const {root,config}=await loadConfig(args.config);
    const result=await doctor({root,config});console.log(result.lines.join('\n'));process.exitCode=result.errors?2:0;
  }else if(command==='upstream'&&sub==='check'&&args._.length===2){
    for(const row of await upstreamCheck())console.log(`${row.name}: ${row.status} — pinned=${row.pinned} HEAD=${row.head}`);
  }else if(command==='visual'&&['candidate','approve'].includes(sub)&&args._.length===2){
    if(!args.from||!args.out)throw Error('visual '+sub+' requires --from and --out');
    const manifest=await (sub==='candidate'?createVisualCandidate:approveVisualCandidate)(args.from,args.out);
    console.log('Visual '+manifest.kind+': '+manifest.entries.length+' images. '+(sub==='candidate'?'Review images and environment before visual approve.':'Approved image manifest written; check never updates it.'));
  }else if(command==='baseline'&&sub==='create'&&args._.length===2){
    if(!args.from||!args.out)throw new Error('baseline create requires --from and --out');
    const count=await baselineFromReport(args.from,args.out);
    console.log(`Baseline created: ${count} finding IDs. Review this suppression list before using it.`);
  }else throw new Error(help);
}catch(e){console.error(`UI Refiner: ${e.message}`);process.exitCode=2;}
