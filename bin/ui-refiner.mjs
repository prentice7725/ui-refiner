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
import {scanUrl,scanLangs} from '../src/scan.mjs';
import {compareDirections,verifyApplied} from '../src/directions.mjs';
import {dealDirections,recordChoice} from '../src/refine-log.mjs';
import {fetchStandIns} from '../src/photos.mjs';
import {recordKeep,checkKeep} from '../src/keep.mjs';

const help=`UI Refiner 0.6.0 — de-AI web design review and UI quality gate
  ui-refiner scan <url|host|file> [--out ui-refiner-scan] [--lang auto|ko|ja|en] [--locale ja-JP] [--source src] [--compare previous-scan-dir|scan.json | --no-compare] [--json]
      zero-config design review of any page; report language follows the page unless --lang or UI_REFINER_LANG is set;
      a rescan of the same page into the same --out folder is compared with the previous scan automatically
  ui-refiner directions <folder of .html mocks> [--lang auto|ko|ja|en] [--json]
      scans each design-direction mock and writes DIRECTIONS.html and DIRECTIONS.md side by side, so a person can choose one;
      warns when mocks share a surface, type pair or hero layout, ignore their deal, or repeat a choice made for another project
  ui-refiner directions deal <folder> [--kind software|service|place|public|company|studio|media] [--lang en|ja|ko] [--no-photo] [--log file] [--json]
      assigns each of three mocks a hero structure (as common on human-made sites of that kind), a type pairing, an accent family
      and a surface, avoiding what was chosen recently for other projects;
      --no-photo skips structures that need a real photo
  ui-refiner directions record <folder> --pick A|B|C [--page name] [--log file]
      remembers the picked direction (default log: ~/.ui-refiner/refine-log.json, or UI_REFINER_HOME)
  ui-refiner directions verify <folder> <applied page> [--pick A|B|C] [--json]
      checks that the applied page kept the chosen mock's hero structure, surface and type (exit 1 on drift)
  ui-refiner photos "<subject>" [--out assets/stand-in] [--count 6] [--orientation landscape|portrait|any] [--lang en|ja|ko] [--json]
      saves openly licensed stand-in photographs from Wikimedia Commons with credits.json and a footer credit line;
      mark each on the page with data-stand-in, never present it as the client's own, replace it with real photos
  ui-refiner keep record <page> [--out ui-refiner-keep.json]
  ui-refiner keep check <page> [--from ui-refiner-keep.json] [--json]
      records link targets, forms, fields, contact links and facts before a redesign, then fails (exit 1) when the
      redesigned page lost any of them; facts that appear only afterwards are listed to check they are real
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
  if(a==='--no-compare'){out.noCompare=true;continue;}
  if(a==='--no-photo'){out.noPhoto=true;continue;}
  if(a==='--help'){out.help=true;continue;}
  if(!['--preset','--dir','--config','--url','--from','--out','--locale','--base','--format','--report','--query','--limit','--lang','--source','--compare','--pick','--page','--log','--kind','--count','--orientation'].includes(a))throw new Error(`Unknown flag ${a}`);
  const value=args[++i];if(!value||value.startsWith('--'))throw new Error(`Missing value for ${a}`);
  const key=a.slice(2);if(out[key])throw new Error(`Duplicate flag ${a}`);out[key]=value;
}return out;}
try{
  const args=parse(process.argv.slice(2));
  const [command,sub]=args._;
  if(!command||args.help||command==='help'){console.log(help);process.exitCode=0;}
  else if(command==='scan'&&args._.length===2){
    // --lang wins over UI_REFINER_LANG; without either the report follows the page language.
    const lang=args.lang||process.env.UI_REFINER_LANG||'auto';
    if(lang!=='auto'&&!scanLangs.includes(lang))throw Error(`${args.lang?'--lang':'UI_REFINER_LANG'} must be auto or one of ${scanLangs.join(', ')}`);
    if(args.compare&&args.noCompare)throw Error('Use either --compare or --no-compare');
    const {result,dir}=await scanUrl(sub,{out:args.out||'ui-refiner-scan',lang,locale:args.locale||null,source:args.source||null,compare:args.noCompare?null:args.compare||'auto'});
    const c=result.comparison,delta=n=>n>0?`+${n}`:`${n}`;
    if(args.json)console.log(JSON.stringify(result,null,2));
    else console.log(`[SCAN] AI-look ${result.aiLook.score}/100 (${result.aiLook.band}); signals=${result.aiLook.signals.map(s=>s.id).join(',')||'none'}; quality issues=${result.quality.reduce((n,q)=>n+q.count,0)};${result.japanese.japanese?` ja-typography=${result.japanese.issues.map(i=>i.id).join(',')||'ok'};`:''} report=${result.lang};${c?` vs ${c.mode==='auto'?'last scan':'previous'} ${c.previous.score}→${c.current.score} (${delta(c.scoreDelta)}), resolved=${c.signals.resolved.length}, new=${c.signals.added.length}${c.warnings.length?`, warnings=${c.warnings.join(',')}`:''};`:''} ${path.join(dir,'DESIGN_REVIEW.md')}`);
  }
  else if(command==='keep'&&sub==='record'&&args._.length===3){
    const r=await recordKeep(args._[2],{out:args.out||'ui-refiner-keep.json'});
    console.log(`[KEEP] ${r.inventory.links.length} links, ${r.inventory.forms.length} forms, ${r.inventory.fields.length} fields, ${r.inventory.facts.length} facts → ${r.file}`);
  }
  else if(command==='keep'&&sub==='check'&&args._.length===3){
    const r=await checkKeep(args._[2],{from:args.from||'ui-refiner-keep.json'});
    if(args.json)console.log(JSON.stringify(r,null,2));
    else{const part=(k,label)=>r[k].length?`\n  ${label}: ${r[k].join(', ')}`:'';console.log((r.ok?'[KEPT] links, forms, fields and facts are all still there':'[LOST] the redesign dropped:')+part('links','links')+part('forms','forms')+part('fields','fields')+part('facts','facts')+(r.added.length?`\n  new facts to confirm (not on the original page): ${r.added.join(', ')}`:''));}
    process.exitCode=r.ok?0:1;
  }
  else if(command==='photos'&&args._.length===2){
    const r=await fetchStandIns(sub,{out:args.out||'assets/stand-in',count:args.count?Number(args.count):6,orientation:args.orientation||'landscape',lang:args.lang&&args.lang!=='auto'?args.lang:'en'});
    if(args.json)console.log(JSON.stringify(r,null,2));
    else console.log(r.photos.map(p=>`${p.file}  ${p.width}x${p.height}  ${p.author} (${p.licence})  ${p.source}`).join('\n')+`\n[PHOTOS] ${r.photos.length} stand-ins in ${r.dir} (credits.json)\nCredit line for the footer:\n${r.credit}`);
  }
  else if(command==='directions'&&sub==='deal'&&args._.length===3){
    const r=await dealDirections(args._[2],{log:args.log,noPhoto:!!args.noPhoto,kind:args.kind,lang:args.lang&&args.lang!=='auto'?args.lang:'en'});
    if(args.json)console.log(JSON.stringify(r,null,2));
    else console.log(r.structures.map(d=>`${d.label}: ${d.key} — ${d.brief}
   type: ${d.type.display} + ${d.type.text} (${d.type.voice}); accent: ${d.accent.family} — ${d.accent.brief}; surface: ${d.surface.brief}`).join('\n')+`\n[DEAL] ${r.file}`);
  }
  else if(command==='directions'&&sub==='record'&&args._.length===3){
    if(!args.pick)throw Error('directions record requires --pick');
    const r=await recordChoice(args._[2],{pick:args.pick,page:args.page,log:args.log});
    console.log(`[RECORD] ${r.entry.label} ${r.entry.hero??'-'} ${(r.entry.fonts||[]).join(' + ')||'-'} → ${r.file}`);
  }
  else if(command==='directions'&&sub==='verify'&&args._.length===4){
    const r=await verifyApplied(args._[2],args._[3],{pick:args.pick,log:args.log});
    if(args.json)console.log(JSON.stringify(r,null,2));
    else console.log(r.drift.length?`[DRIFT] ${r.label}: ${r.drift.map(d=>`${d.id} ${d.chosen} → ${d.applied}`).join('; ')}`:`[VERIFY] ${r.label}: hero ${r.applied.hero}, surface and type kept`);
    if(r.problems?.length)console.log(`[FIRST SCREEN] ${r.problems.join(', ')}: the first screen needs a one-line claim, as its largest text, and the main action`);
    process.exitCode=r.drift.length||r.problems?.length?1:0;
  }
  else if(command==='directions'&&args._.length===2){
    const lang=args.lang||process.env.UI_REFINER_LANG||'auto';
    if(lang!=='auto'&&!scanLangs.includes(lang))throw Error(`${args.lang?'--lang':'UI_REFINER_LANG'} must be auto or one of ${scanLangs.join(', ')}`);
    const r=await compareDirections(sub,{lang,log:args.log});
    if(args.json)console.log(JSON.stringify(r,null,2));
    else console.log(`[DIRECTIONS] ${r.items.map(d=>`${d.label}=${d.file} (AI-look ${d.score}, quality ${d.quality}${d.ja!=null?`, ja ${d.ja}`:''})`).join("; ")}${r.warnings.length?`; warnings=${r.warnings.map(w=>w.id+(w.a?`(${w.a},${w.b})`:"")).join(",")}`:""}; ${r.html}`);
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
