import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnBounded} from './execute.mjs';
export const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function inventory(dir){
 const result={};
 async function walk(base){for(const item of await fs.readdir(base,{withFileTypes:true})){
  const file=path.join(base,item.name);
  if(item.isSymbolicLink())throw Error(`Vendor symlinks are not allowed: ${file}`);
  if(item.isDirectory())await walk(file);
  else if(item.isFile())result[path.relative(dir,file).replaceAll(path.sep,'/')]=sha256(await fs.readFile(file));
 }}
 await walk(dir);return Object.fromEntries(Object.entries(result).sort(([a],[b])=>a.localeCompare(b,'en')));
}
export async function verifyVendor(root=repoRoot){
 const manifest=JSON.parse(await fs.readFile(path.join(root,'vendor/UPSTREAM.json'),'utf8')),drift=[];
 for(const name of ['suta','lintapple']){
  const expected=manifest[name].sha256;if(!expected||!Object.keys(expected).length)throw Error(`Missing SHA-256 manifest for ${name}`);
  const actual=await inventory(path.join(root,'vendor',name));
  for(const file of new Set([...Object.keys(expected),...Object.keys(actual)]))if(expected[file]!==actual[file])drift.push(`${name}/${file}: ${actual[file]===undefined?'missing':expected[file]===undefined?'unexpected':'modified'}`);
  for(const patch of manifest[name].patches||[])if(sha256(await fs.readFile(path.join(root,'vendor',patch.path)))!==patch.sha256)drift.push(`${patch.path}: modified patch`);
 }
 return drift;
}
export async function sutaCopyDrift(projectRoot){
 const installed=path.join(projectRoot,'.agents/skills/suta');
 if(!await fs.stat(installed).catch(()=>null))return null;
 const a=await inventory(installed),b=await inventory(path.join(repoRoot,'vendor/suta/skills/suta'));
 return [...new Set([...Object.keys(a),...Object.keys(b)])].filter(p=>a[p]!==b[p]);
}
export async function upstreamCheck({runner=spawnBounded}={}){
 const manifest=JSON.parse(await fs.readFile(path.join(repoRoot,'vendor/UPSTREAM.json'),'utf8')),out=[];
 for(const name of ['suta','lintapple']){
  const pin=manifest[name],url=`https://github.com/${pin.owner}/${pin.repo}.git`;
  const result=await runner('git',['ls-remote',url,'HEAD'],{timeoutMs:20000});
  if(result.code!==0||result.error)throw Error(`${name} upstream check failed: ${result.error||result.stderr}`);
  const head=result.stdout.trim().split(/\s+/)[0];if(!/^[a-f0-9]{40}$/.test(head))throw Error(`${name} returned an invalid HEAD`);
  out.push({name,pinned:pin.sha,head,status:head===pin.sha?'current':'update-available'});
 }
 return out;
}
