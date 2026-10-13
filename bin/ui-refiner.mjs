#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import {initProject,loadConfig} from '../src/config.mjs';
import {runGate,exitCode,baselineFromReport} from '../src/gate.mjs';
import {doctor} from '../src/doctor.mjs';
import {upstreamCheck} from '../src/vendor.mjs';
import {presets} from '../src/presets.mjs';

const help=`UI Refiner 0.3.0 — web-app UI quality gate
  ui-refiner init [--preset ${presets.join('|')}] [--dir path] [--locale en-US|ko-KR|ja-JP]
  ui-refiner check [--config ui-refiner.config.json] [--url http://127.0.0.1:5173] [--changed-only] [--base ref]
  ui-refiner doctor [--config ui-refiner.config.json]
  ui-refiner upstream check
  ui-refiner baseline create --from artifacts/ui-refiner/report.json --out ui-refiner.baseline.json
Exit 0: automated checks pass (manual visual review may remain), 1: findings, 2: infrastructure/error/uncovered, 3: scoped pass only (never full approval)`;
function parse(args){const out={_:[]};for(let i=0;i<args.length;i++){
  const a=args[i];if(!a.startsWith('--')){out._.push(a);continue;}
  if(a==='--changed-only'){out.changedOnly=true;continue;}
  if(a==='--help'){out.help=true;continue;}
  if(!['--preset','--dir','--config','--url','--from','--out','--locale','--base'].includes(a))throw new Error(`Unknown flag ${a}`);
  const value=args[++i];if(!value||value.startsWith('--'))throw new Error(`Missing value for ${a}`);
  const key=a.slice(2);if(out[key])throw new Error(`Duplicate flag ${a}`);out[key]=value;
}return out;}
try{
  const args=parse(process.argv.slice(2));
  const [command,sub]=args._;
  if(!command||args.help||command==='help'){console.log(help);process.exitCode=0;}
  else if(command==='init'&&args._.length===1){
    const root=path.resolve(args.dir||'.');const statuses=await initProject(root,args.preset||'web',args.locale||'en-US');console.log(statuses.join('\n'));console.log('Configure SOT; use bundled source of both auditors, then run ui-refiner check.');
  }else if(command==='check'&&args._.length===1){
    const {root,config}=await loadConfig(args.config);
    if(args.url)config.browser.url=args.url;
    const report=await runGate({root,config,changedOnly:!!args.changedOnly,baseRef:args.base});
    console.log(`[${report.status}] new blockers=${report.summary.blockers}, findings=${report.summary.total}; ${path.join(root,config.reportDir,'report.md')}`);
    for(const s of report.stages)if(s.error)console.error(`[${s.engine}] ${s.error}`);
    process.exitCode=exitCode(report);
  }else if(command==='doctor'&&args._.length===1){
    const {root,config}=await loadConfig(args.config);
    const result=await doctor({root,config});console.log(result.lines.join('\n'));process.exitCode=result.errors?2:0;
  }else if(command==='upstream'&&sub==='check'&&args._.length===2){
    for(const row of await upstreamCheck())console.log(`${row.name}: ${row.status} — pinned=${row.pinned} HEAD=${row.head}`);
  }else if(command==='baseline'&&sub==='create'&&args._.length===2){
    if(!args.from||!args.out)throw new Error('baseline create requires --from and --out');
    const count=await baselineFromReport(args.from,args.out);
    console.log(`Baseline created: ${count} finding IDs. Review this suppression list before using it.`);
  }else throw new Error(help);
}catch(e){console.error(`UI Refiner: ${e.message}`);process.exitCode=2;}
