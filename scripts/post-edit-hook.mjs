#!/usr/bin/env node
// Reuse pinned suta's edit-range logic while running the single bundled source.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {repoRoot} from '../src/vendor.mjs';
if(process.env.UI_REFINER_HOOK==='off')process.exit(0);
try{
 let text='';for await(const chunk of process.stdin){text+=chunk;if(text.length>2_000_000)throw Error('Hook input exceeds limit');}
 const input=JSON.parse(text),cwd=path.resolve(input.cwd||process.cwd());
 const {editedFiles,changedLines,hookResponse}=await import(pathToFileURL(path.join(repoRoot,'vendor/suta/skills/suta/scripts/hookCore.ts')));
 const {auditAll,isAuditTarget}=await import(pathToFileURL(path.join(repoRoot,'vendor/suta/skills/suta/scripts/auditAll.ts')));
 const sources=[],changed=new Map();
 for(const file of editedFiles({input,cwd})){
  if(!isAuditTarget(file)||!(await fs.stat(file).catch(()=>null))?.isFile())continue;
  const text=await fs.readFile(file,'utf8'),shown=path.relative(cwd,file).replaceAll(path.sep,'/');
  sources.push({file:shown,text});changed.set(shown,changedLines({input,file,text}));
 }
 const response=hookResponse({findings:auditAll(sources),changed});
 if(response.stdout)process.stdout.write(response.stdout);if(response.stderr)process.stderr.write(response.stderr);
 process.exitCode=response.exitCode;
}catch(e){console.error(`UI Refiner post-edit hook unavailable: ${e.message}. Run a full check before approval.`);process.exitCode=0;}
