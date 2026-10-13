#!/usr/bin/env node
// Stage upstream source, replay reviewed local patches, verify manifests and smoke before retaining changes.
import fs from 'node:fs/promises';
import path from 'node:path';
import {repoRoot,inventory,sha256,verifyVendor} from '../src/vendor.mjs';
import {spawnBounded} from '../src/execute.mjs';
const args=process.argv.slice(2),updates={};
for(let i=0;i<args.length;i++){
 const name=args[i].replace(/^--/,'');if(!['suta','lintapple'].includes(name)||updates[name]||!/^[a-f0-9]{40}$/.test(args[i+1]||''))throw Error('Usage: node scripts/sync-vendor.mjs --suta <40-char SHA> [--lintapple <40-char SHA>]');
 updates[name]=args[++i];
}
if(!Object.keys(updates).length)throw Error('Specify at least one upstream SHA');
const drift=await verifyVendor();if(drift.length)throw Error(`Unrecorded vendor changes would be lost: ${drift.join(', ')}. Record reviewed local patches and manifests before syncing.`);
const vendor=path.join(repoRoot,'vendor'),manifestFile=path.join(vendor,'UPSTREAM.json');
const old=await fs.readFile(manifestFile,'utf8'),manifest=JSON.parse(old);
const tmp=await fs.mkdtemp(path.join(repoRoot,'.vendor-sync-')),backups=[];
const run=async(bin,args,cwd,timeoutMs=120000)=>{const r=await spawnBounded(bin,args,{cwd,timeoutMs});if(r.code!==0||r.error)throw Error(`${bin} ${args[0]} failed: ${r.error||r.stderr||r.stdout}`);return r;};
try{
 // Stage every engine before changing the working tree.
 for(const [name,sha] of Object.entries(updates)){
  const gitDir=path.join(tmp,name+'-upstream'),stage=path.join(tmp,name+'-stage');await fs.mkdir(gitDir);
  const pin=manifest[name];await run('git',['init','-q'],gitDir);
  await run('git',['fetch','--depth','1',`https://github.com/${pin.owner}/${pin.repo}.git`,sha],gitDir);
  await run('git',['checkout','--detach','FETCH_HEAD'],gitDir);
  await fs.mkdir(stage);
  const selections=name==='suta'?['LICENSE','skills/suta']:['LICENSE','ui-policy.json','src','bin'];
  for(const rel of selections){await fs.mkdir(path.dirname(path.join(stage,rel)),{recursive:true});await fs.cp(path.join(gitDir,rel),path.join(stage,rel),{recursive:true});}
  pin.upstreamSha256=await inventory(stage);
  await run('git',['init','-q'],stage);
  for(const patch of pin.patches||[]){
   const file=path.join(vendor,patch.path);if(sha256(await fs.readFile(file))!==patch.sha256)throw Error(`Local patch changed without review: ${patch.path}`);
   await run('git',['apply','--check',file],stage);await run('git',['apply',file],stage);
  }
  await fs.rm(path.join(stage,'.git'),{recursive:true,force:true});
  pin.sha=sha;pin.sha256=await inventory(stage);
 }
 for(const name of Object.keys(updates)){
  const dest=path.join(vendor,name),backup=path.join(tmp,name+'-backup');await fs.rename(dest,backup);backups.push({dest,backup});await fs.rename(path.join(tmp,name+'-stage'),dest);
 }
 await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');
 for(const script of ['test','smoke:ui','smoke:gate'])await run(process.platform==='win32'?'npm.cmd':'npm',['run',script],repoRoot,300000);
 console.log('Vendor update verified. Review source, patch replay and manifest diff, then commit. No upstream update is auto-approved.');
}catch(e){
 for(const {dest,backup} of backups.reverse()){await fs.rm(dest,{recursive:true,force:true});await fs.rename(backup,dest);}
 await fs.writeFile(manifestFile,old);throw e;
}finally{await fs.rm(tmp,{recursive:true,force:true});}
