#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(process.argv[2]||'.'),repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(repo,'skills/ui-refiner-agent'),destination=path.join(root,'.agents/skills/ui-refiner-agent');
try{
 if(await fs.stat(destination).catch(()=>null))throw Error(`Skill already exists: ${destination}. Review changes before replacing it.`);
 const portable=repo===root||repo.startsWith(root+path.sep);
 // Shared configuration is portable; an external personal checkout belongs only in local settings.
 const settingsPath=path.join(root,'.claude',portable?'settings.json':'settings.local.json');
 let settings={};try{settings=JSON.parse(await fs.readFile(settingsPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 await fs.mkdir(path.dirname(destination),{recursive:true});await fs.cp(source,destination,{recursive:true,errorOnExist:true,force:false});
 const wrapper=path.join(destination,'scripts/post-edit-hook.mjs');await fs.mkdir(path.dirname(wrapper),{recursive:true});
 let relative=portable?path.relative(path.dirname(wrapper),path.join(repo,'scripts/post-edit-hook.mjs')).replaceAll(path.sep,'/'):'../../../../tools/ui-refiner/scripts/post-edit-hook.mjs';
 if(!relative.startsWith('.'))relative='./'+relative;
 await fs.writeFile(wrapper,`#!/usr/bin/env node\nimport {pathToFileURL} from 'node:url';\nimport path from 'node:path';\nconst target=process.env.UI_REFINER_HOME?pathToFileURL(path.resolve(process.env.UI_REFINER_HOME,'scripts/post-edit-hook.mjs')):new URL(${JSON.stringify(relative)},import.meta.url);\nawait import(target.href);\n`);
 const command='node "${CLAUDE_PROJECT_DIR}/.agents/skills/ui-refiner-agent/scripts/post-edit-hook.mjs"';
 if(!portable){settings.env??={};settings.env.UI_REFINER_HOME=repo;}
 settings.hooks??={};settings.hooks.PostToolUse??=[];
 if(!settings.hooks.PostToolUse.some(x=>x.hooks?.some(h=>h.command===command)))settings.hooks.PostToolUse.push({matcher:'Write|Edit|MultiEdit|apply_patch',hooks:[{type:'command',command,timeout:15}]});
 await fs.mkdir(path.dirname(settingsPath),{recursive:true});await fs.writeFile(settingsPath,JSON.stringify(settings,null,2)+'\n');
 await fs.writeFile(path.join(destination,'hook-registration.json'),JSON.stringify({event:'PostToolUse',tools:['Write','Edit','MultiEdit','apply_patch'],command:['node','.agents/skills/ui-refiner-agent/scripts/post-edit-hook.mjs'],cwd:'project root',timeoutSeconds:15,source:'bundled suta',...(portable?{}:{note:'External checkout: UI_REFINER_HOME is configured only in settings.local.json; other hosts must supply it locally.'})},null,2)+'\n');
 // Codex reads .agents/skills; Claude Code discovers project skills under .claude/skills.
 const claudeSkill=path.join(root,'.claude/skills/ui-refiner-agent');
 if(!await fs.stat(claudeSkill).catch(()=>null)){await fs.mkdir(path.dirname(claudeSkill),{recursive:true});await fs.cp(destination,claudeSkill,{recursive:true,errorOnExist:true,force:false});}
 console.log(`Installed agent skill and ${portable?'portable':'local external-checkout'} Claude hook: ${destination} (+ ${claudeSkill})\nOther hosts: register hook-registration.json through their supported hook UI. A hook is not a full QA gate.`);
}catch(e){console.error(`Could not install skill: ${e.message}`);process.exitCode=2;}
