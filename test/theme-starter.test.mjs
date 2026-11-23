import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {listThemes,rootTokens,brandTokens,brandValues,photoSlots,contrast,parseHex,suggestFix,themeStarter,THEMES_DIR} from '../src/theme-starter.mjs';

const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));

test('theme starter: the catalog lists every theme folder', async () => {
 const themes=await listThemes();
 const folders=(await fs.readdir(THEMES_DIR,{withFileTypes:true})).filter(d=>d.isDirectory()&&/^(kr|jp)-/.test(d.name)).map(d=>d.name).sort();
 assert.deepEqual(themes.map(t=>t.id).sort(),folders);
 assert.ok(themes.every(t=>t.sites>0&&t.basis.includes('·')));
});

test('theme starter: brand tokens are found and derived tokens keep the theme\'s steps', () => {
 const tokens=rootTokens(':root{ --ground:#ffffff; /* note */ --brand: #0055b8; --brand-deep: #00438f; --brand-soft: #e8f0fa; --text: "Pretendard", sans-serif; }\n.a{color:red}');
 assert.deepEqual(brandTokens(tokens),{main:'--brand',derived:['--brand-soft','--brand-deep']});
 const values=brandValues(tokens,'#c8102e');
 assert.equal(values['--brand'],'#c8102e');
 assert.ok(contrast(rgb(values['--brand-deep']),[255,255,255])>contrast(rgb('#c8102e'),[255,255,255]),'deep stays darker than the brand colour');
 assert.ok(contrast(rgb(values['--brand-soft']),[255,255,255])<1.25,'soft stays a pale tint');
 assert.equal(brandTokens(rootTokens(':root{--ground:#0a0a0a;--ink:#0a0a0a;}')),null);
 assert.equal(parseHex('#abc'),'#aabbcc');assert.equal(parseHex('0B5CAB'),'#0b5cab');assert.equal(parseHex('blue'),null);
});

test('theme starter: photograph slots carry section, ratio and size', () => {
 const slots=photoSlots('<!-- 2. Hero -->\n<img src="a.jpg" width="1920" height="1080" alt="공장" data-generated>\n<!-- 5. Doctor\n more -->\n<img src="b.jpg" width="1200" height="1600" alt="">\n<img src="logo.svg" alt="logo">');
 assert.deepEqual(slots,[{section:'Hero',width:1920,height:1080,ratio:'16:9',shows:'공장',generated:true},{section:'Doctor',width:1200,height:1600,ratio:'3:4',shows:'',generated:false}]);
});

test('theme starter: a fix is the nearest brand shade that passes, or ink on a brand fill', () => {
 const brandColours=['#ffd400'];
 const onWhite=suggestFix({colour:'#ffd400',on:'#ffffff',needs:4.5},{brandColours,ink:'#191c1f'});
 assert.ok(contrast(rgb(onWhite.use),[255,255,255])>=4.5);
 const text=suggestFix({colour:'#ffffff',on:'#ffd400',needs:4.5},{brandColours,ink:'#191c1f'});
 assert.equal(text.use,'#191c1f');
 assert.equal(suggestFix({colour:'#777777',on:'#888888',needs:4.5},{brandColours}),null);
});

test('theme starter: writes the theme, brand.css and STARTER.md for every theme, and no sample page or image', async () => {
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ui-refiner-starter-'));
 try{
  for(const theme of await listThemes()){
   const css=await fs.readFile(path.join(THEMES_DIR,theme.id,'theme.css'),'utf8'),hasColour=!!brandTokens(rootTokens(css));
   const out=path.join(tmp,theme.id);
   if(!hasColour){await assert.rejects(themeStarter(theme.id,{out,brand:'#c8102e',render:false}),/no colour of its own/);}
   const r=await themeStarter(theme.id,{out,brand:hasColour?'#c8102e':undefined,face:'SUIT',render:false});
   assert.deepEqual((await fs.readdir(out)).sort(),['STARTER.md','brand.css','theme.css','theme.md']);
   assert.equal(await fs.readFile(path.join(out,'theme.css'),'utf8'),css,`${theme.id}: theme.css copied unchanged`);
   const brand=await fs.readFile(path.join(out,'brand.css'),'utf8'),doc=await fs.readFile(path.join(out,'STARTER.md'),'utf8');
   assert.match(brand,/--text: "SUIT", /);
   if(hasColour)assert.match(brand,/: #c8102e; \/\* theme: #[0-9a-f]{6} \*\//);
   assert.equal(r.literal,0,`${theme.id}: the theme colour is written only in the tokens`);
   assert.ok(r.photos.length>0&&doc.includes('## Photographs the theme needs'),`${theme.id}: photograph slots`);
   assert.ok(!/assets\/generated/.test(doc+brand),`${theme.id}: no generated image is carried`);
  }
  await assert.rejects(themeStarter('kr-nothing-here',{out:tmp}),/Unknown theme/);
  await assert.rejects(themeStarter('kr-care-white',{out:tmp,brand:'green',render:false}),/hex colour/);
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
});

test('theme starter: a pale brand colour is reported where it breaks contrast on the sample', async () => {
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ui-refiner-starter-'));
 try{
  const pale=await themeStarter('kr-care-white',{out:tmp,brand:'#ffd400'});
  if(pale.contrast.skipped)return; // no browser on this machine
  assert.equal(pale.ok,false);
  assert.ok(pale.contrast.failures.some(f=>f.kind==='text'&&f.on==='#ffd400'&&f.fix.includes('ink')));
  assert.deepEqual(pale.contrast.widths,[1440,390]);
  assert.ok(pale.contrast.failures.every(f=>f.widths.length&&f.widths.every(w=>[1440,390].includes(w))));
  const dark=await themeStarter('kr-care-white',{out:tmp,brand:'#0b5cab'});
  assert.equal(dark.ok,true);assert.ok(dark.contrast.checked>0);
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
});
