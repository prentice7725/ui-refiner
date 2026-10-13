import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
async function files(root){
  const out=[];
  for(const item of await readdir(root,{withFileTypes:true})){
    const p=path.join(root,item.name);
    if(item.isDirectory())out.push(...await files(p));
    else if(item.isFile())out.push(p);
  }
  return out;
}
test('full pinned suta skill tree has exactly 250 files and 57 patterns',async()=>{
 const root=path.resolve(here,'../vendor/suta/skills/suta');
 const inventory=await files(root);
 const patterns=inventory.filter(p=>p.endsWith('PATTERN.md'));
 assert.equal(inventory.length,250,'upstream 412bd62 pinned skill tree drifted');
 assert.equal(patterns.length,57,'all 57 UI patterns must be available');
 for(const p of patterns) {
   const content=await readFile(p,'utf8');
   assert.match(content,/./,'pattern document cannot be empty');
 }
});
test('all lintapple runtime sources vendored with original licenses',async()=>{
 const root=path.resolve(here,'../vendor/lintapple');
 const inventory=await files(root);
 assert.equal(inventory.length,15);
 const notices=await Promise.all(['../vendor/suta/LICENSE','../vendor/lintapple/LICENSE'].map(p=>readFile(path.resolve(here,p),'utf8')));
 for(const license of notices)assert.match(license,/MIT License/);
 const pinned=JSON.parse(await readFile(path.resolve(here,'../vendor/UPSTREAM.json'),'utf8'));
 assert.equal(pinned.suta.sha,'412bd62e479ce249ef25ca31bc015cfb308aff10');
 assert.equal(pinned.lintapple.sha,'90ddc736af6f2712903d53dd9a463445e109f586');
});
