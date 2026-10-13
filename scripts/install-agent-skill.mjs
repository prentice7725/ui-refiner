#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(process.argv[2]||'.');
const here=path.dirname(fileURLToPath(import.meta.url));
const source=path.join(here,'../skills/ui-refiner-agent');
const destination=path.join(root,'.agents/skills/ui-refiner-agent');
try{
  await fs.mkdir(path.dirname(destination),{recursive:true});
  await fs.cp(source,destination,{recursive:true,errorOnExist:true,force:false});
  console.log(`Installed agent skill: ${destination}`);
}catch(e){console.error(`Could not install skill: ${e.message}`);process.exitCode=2;}
