#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(process.argv[2]||'.'),repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(repo,'skills/ui-refiner-agent'),destination=path.join(root,'.agents/skills/ui-refiner-agent');
try{
 if(await fs.stat(destination).catch(()=>null))throw Error(`Skill already exists: ${destination}. Review changes before replacing it.`);
 await fs.mkdir(path.dirname(destination),{recursive:true});await fs.cp(source,destination,{recursive:true,errorOnExist:true,force:false});
 const wrapper=path.join(destination,'scripts/post-edit-hook.mjs');await fs.mkdir(path.dirname(wrapper),{recursive:true});
 await fs.writeFile(wrapper,`#!/usr/bin/env node\nimport ${JSON.stringify(new URL('scripts/post-edit-hook.mjs',pathToFileURL(repo+path.sep)).href)};\n`);
 // Merge Claude's supported hook configuration without replacing existing hooks/settings.
 const settingsPath=path.join(root,'.claude/settings.json');
 let settings={};try{settings=JSON.parse(await fs.readFile(settingsPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const quote=s=>`'${s.replaceAll("'","'\\''")}'`;
 const command=`node ${process.platform==='win32'?'"'+wrapper+'"':quote(wrapper)}`;
 settings.hooks??={};settings.hooks.PostToolUse??=[];
 if(!settings.hooks.PostToolUse.some(x=>x.hooks?.some(h=>h.command===command)))settings.hooks.PostToolUse.push({matcher:'Write|Edit|MultiEdit|apply_patch',hooks:[{type:'command',command,timeout:15}]});
 await fs.mkdir(path.dirname(settingsPath),{recursive:true});await fs.writeFile(settingsPath,JSON.stringify(settings,null,2)+'\n');
 // Portable wiring for hosts with their own hook registration UI; do not invent Codex config fields.
 await fs.writeFile(path.join(destination,'hook-registration.json'),JSON.stringify({event:'PostToolUse',tools:['Write','Edit','MultiEdit','apply_patch'],command:['node',wrapper],timeoutSeconds:15,source:'bundled suta'},null,2)+'\n');
 console.log(`Installed agent skill and Claude post-edit hook: ${destination}\nOther hosts: register hook-registration.json through their supported hook UI. A hook is not a full QA gate.`);
}catch(e){console.error(`Could not install skill: ${e.message}`);process.exitCode=2;}