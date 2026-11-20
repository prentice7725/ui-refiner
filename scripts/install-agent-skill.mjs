#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {createHash,randomUUID} from 'node:crypto';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(repo,'skills/ui-refiner-agent');
const metadata='.ui-refiner-install.json';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

async function read(file){
 try{return await fs.readFile(file);}
 catch(e){if(e.code==='ENOENT')return null;throw e;}
}
async function write(file,bytes){
 await fs.mkdir(path.dirname(file),{recursive:true});
 const temp=file+'.'+randomUUID()+'.tmp';
 try{await fs.writeFile(temp,bytes);await fs.rename(temp,file);}
 finally{await fs.rm(temp,{force:true});}
}
async function* files(dir,prefix=''){
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const name=prefix+entry.name;
  if(entry.isDirectory())yield* files(path.join(dir,entry.name),name+'/');
  else if(entry.isFile())yield name;
 }
}

async function installSkill(root,folder,version,portable,update){
 const dest=path.join(root,folder);
 const previous=JSON.parse(await read(path.join(dest,metadata))||'null');
 const existing=!!(await fs.stat(dest).catch(e=>{if(e.code!=='ENOENT')throw e;}));
 const dry=existing&&!update;
 console.log(folder+' · '+(existing?(previous?.version||'legacy / unknown')+' → ':'')+version);
 const recorded={...previous?.files};
 const put=async(name,bytes)=>{
  const current=await read(path.join(dest,name));
  const next=hash(bytes);
  if(current&&hash(current)===next){recorded[name]=next;return;}
  if(current&&hash(current)!==recorded[name]){
   console.log('  review locally changed or untracked file: '+name);
   return;
  }
  if(existing)console.log('  '+(current?'update ':'add ')+name);
  if(!dry){await write(path.join(dest,name),bytes);recorded[name]=next;}
 };
 for await(const name of files(source))await put(name,await fs.readFile(path.join(source,name)));
 for(const hook of ['post-edit-hook.mjs','refine-gate-hook.mjs']){
  const relative=path.relative(path.join(dest,'scripts'),path.join(repo,'scripts',hook)).replaceAll(path.sep,'/');
  const fallback=portable?JSON.stringify(relative):JSON.stringify('../../../../tools/ui-refiner/scripts/'+hook);
  await put('scripts/'+hook,`#!/usr/bin/env node
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const target=process.env.UI_REFINER_HOME?pathToFileURL(path.resolve(process.env.UI_REFINER_HOME,'scripts/${hook}')):new URL(${fallback},import.meta.url);
await import(target.href);
`);
 }
 const registration={event:'PostToolUse',tools:['Write','Edit','MultiEdit','apply_patch'],command:['node',folder+'/scripts/post-edit-hook.mjs'],cwd:'project root',timeoutSeconds:15,source:'bundled suta',...(portable?{}:{note:'External checkout: UI_REFINER_HOME is configured only in settings.local.json; other hosts must supply it locally.'})};
 await put('hook-registration.json',JSON.stringify(registration,null,2)+'\n');
 if(!dry)await write(path.join(dest,metadata),JSON.stringify({version,files:recorded},null,2)+'\n');
 else console.log('  Compared files. Use --update to apply available updates.');
 return !dry;
}

async function configureClaude(root,folder,portable){
 const settingsPath=path.join(root,'.claude',portable?'settings.json':'settings.local.json');
 const settings=JSON.parse(await read(settingsPath)||'{}');
 if(!portable){settings.env??={};settings.env.UI_REFINER_HOME=repo;}
 settings.hooks??={};
 settings.hooks.PostToolUse??=[];
 settings.hooks.Stop??=[];
 for(const [event,script] of [['PostToolUse','post-edit-hook.mjs'],['Stop','refine-gate-hook.mjs']]){
  const command='node "${CLAUDE_PROJECT_DIR}/'+folder+'/scripts/'+script+'"';
  const installed=['.agents','.claude'].map(host=>'node "${CLAUDE_PROJECT_DIR}/'+host+'/skills/ui-refiner-agent/scripts/'+script+'"');
  if(!settings.hooks[event].some(group=>group.hooks?.some(h=>installed.includes(h.command)))){
   const group={hooks:[{type:'command',command,timeout:15}]};
   if(event==='PostToolUse')group.matcher='Write|Edit|MultiEdit|apply_patch';
   settings.hooks[event].push(group);
  }
 }
 await write(settingsPath,JSON.stringify(settings,null,2)+'\n');
 for(const name of ['ui-review.md','ui-refine.md']){
  const target=path.join(root,'.claude/commands',name);
  if(!await read(target))await write(target,await fs.readFile(path.join(repo,'commands',name)));
 }
 console.log('Claude Code: /ui-review, /ui-refine, post-edit and finish hooks registered.');
}

try{
 const {values,positionals}=parseArgs({allowPositionals:true,options:{host:{type:'string',default:'both'},update:{type:'boolean'},help:{type:'boolean'}}});
 if(values.help)console.log('node scripts/install-agent-skill.mjs [project] [--host codex|claude|both] [--update]');
 else{
  if(positionals.length>1||!['codex','claude','both'].includes(values.host))throw Error('Choose --host codex, claude or both and one project directory.');
  const root=path.resolve(positionals[0]||'.');
  const portable=repo===root||repo.startsWith(root+path.sep);
  const pkg=JSON.parse(await read(path.join(repo,'package.json'))||'{}');
  const version=pkg.version||'development';
  const codex='.agents/skills/ui-refiner-agent',claude='.claude/skills/ui-refiner-agent';
  if(values.host!=='claude')await installSkill(root,codex,version,portable,values.update);
  if(values.host!=='codex'&&await installSkill(root,claude,version,portable,values.update)){
   await configureClaude(root,values.host==='both'?codex:claude,portable);
  }
 }
}catch(e){console.error('Could not install skill: '+e.message);process.exitCode=2;}
