import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {parseMaterial,loadMaterials,dealMaterials} from '../src/materials.mjs';

const TONES=['calm','warm','technical','bold'],KINDS=['software','service','place','public','company','studio','media'];

test('materials: every file has complete front matter and all seven sections', async () => {
 const all=await loadMaterials();
 assert.ok(all.length>=9,'at least nine materials');
 const pairs=JSON.parse(await fs.readFile(new URL('../data/type-pairs.json',import.meta.url),'utf8'));
 for(const m of all){
  assert.ok(m.name&&m.brief.length>40,`${m.slug}: name and brief`);
  assert.ok(m.tones.length&&m.tones.every(t=>TONES.includes(t)),`${m.slug}: tones`);
  assert.ok(m.kinds.length&&m.kinds.every(k=>KINDS.includes(k)),`${m.slug}: kinds`);
  assert.ok(['white','tint','colour','dark'].includes(m.ground),`${m.slug}: ground`);
  assert.ok(m.accent in pairs.accents,`${m.slug}: accent family`);
  for(const script of ['latin','ko','ja'])assert.ok(m.faces[script]?.display&&m.faces[script].text,`${m.slug}: ${script} faces`);
  const src=(await fs.readFile(m.file,'utf8')).replace(/\r\n/g,'\n');
  for(const h of ['Tokens','Type','Surfaces','Controls','Range','Photos','Never'])assert.ok(src.includes(`\n## ${h}\n`),`${m.slug}: section ${h}`);
  assert.ok(/```css\s*\n:root\s*\{/.test(src),`${m.slug}: token block`);
 }
 assert.equal(parseMaterial('# no front matter'),null);
});

test('materials: every tone and kind can be dealt three that fit the tone', async () => {
 const all=await loadMaterials();
 for(const tone of TONES)for(const kind of KINDS)for(let seed=0;seed<10;seed++){
  const d=dealMaterials(all,[],null,{seed,kind,tone});
  assert.equal(new Set(d.map(m=>m.slug)).size,3,`${tone}/${kind}: three different`);
  assert.ok(d.every(m=>m.tones.includes(tone)),`${tone}/${kind}: all fit the tone (${d.map(m=>m.slug)})`);
  if(kind==='software')assert.ok(d.every(m=>m.ground!=='dark'),'no dark ground on software pages');
 }
});

test('materials: recent picks for other projects go last, photo-only materials need photos', async () => {
 const all=await loadMaterials();
 const first=dealMaterials(all,[],'/p/a',{seed:1,kind:'service',tone:'calm'}).map(m=>m.slug);
 const log=[{project:'/p/other',material:first[0]}];
 const next=dealMaterials(all,log,'/p/a',{seed:1,kind:'service',tone:'calm'}).map(m=>m.slug);
 assert.ok(next.indexOf(first[0])>0||!next.includes(first[0]),'the material another project just took is no longer dealt first');
 assert.deepEqual(dealMaterials(all,log.map(e=>({...e,project:'/p/a'})),'/p/a',{seed:1,kind:'service',tone:'calm'}).map(m=>m.slug),first,'own project history is ignored');
 for(let seed=0;seed<20;seed++)assert.ok(!dealMaterials(all,[],null,{seed,kind:'place',tone:'bold',noPhoto:true}).some(m=>m.photo==='required'));
});
