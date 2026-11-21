// The theme grid in the three READMEs: one first-screen thumbnail per theme, linked to its theme.md.
// node scripts/build-theme-grid.mjs          → docs/assets/themes/<id>.jpg and the grid between the markers
// node scripts/build-theme-grid.mjs --check  → fails when a README grid or a thumbnail is out of date with the catalog
import fs from 'node:fs/promises';

const root=new URL('../',import.meta.url),dir='skills/ui-refiner-agent/reference/themes/';
const catalog=await fs.readFile(new URL(dir+'README.md',root),'utf8');
const themes=[];
for(const line of catalog.split(/\r?\n/).filter(line=>line.startsWith('| `'))){
 const row=/^\| `((kr|jp)-([a-z]+)-[a-z]+)` \| [A-Z]+ · [^·]+ · ([a-z& -]+?)(?:;[^|]*)? \| (\d+) \|$/.exec(line);
 if(!row)throw Error('Invalid theme row: '+line);
 themes.push({id:row[1],country:row[2],family:row[3],type:row[4],sites:row[5]});
}
themes.sort((a,b)=>(a.country==='kr'?0:1)-(b.country==='kr'?0:1));
const words={
 'README.md':{kr:'Korea',jp:'Japan',sites:n=>n+' sites',alt:id=>'First screen of the '+id+' sample page'},
 'README_KO.md':{kr:'한국',jp:'일본',sites:n=>n+'곳',alt:id=>id+' 샘플 페이지의 첫 화면'},
 'README_JA.md':{kr:'韓国',jp:'日本',sites:n=>n+' 件',alt:id=>id+' のサンプルページの最初の画面'}
};
const START='<!-- theme-grid:start (node scripts/build-theme-grid.mjs) -->',END='<!-- theme-grid:end -->',COLUMNS=3;
const grid=w=>{
 const cells=themes.map(t=>`<td align="center" valign="top" width="33%">
<a href="${dir}${t.id}/theme.md"><img src="docs/assets/themes/${t.id}.jpg" alt="${w.alt(t.id)}" width="100%"></a><br>
<b><a href="${dir}${t.id}/theme.md">${t.id}</a></b><br>
<sub>${w[t.country]} · ${t.family} · ${t.type} ·&nbsp;${w.sites(t.sites).replace(' ','&nbsp;')}</sub>
</td>`);
 while(cells.length%COLUMNS)cells.push('<td width="33%"></td>');
 const rows=[];for(let i=0;i<cells.length;i+=COLUMNS)rows.push('<tr>\n'+cells.slice(i,i+COLUMNS).join('\n')+'\n</tr>');
 return `${START}\n<table>\n${rows.join('\n')}\n</table>\n${END}`;
};
const check=process.argv.includes('--check');
for(const [file,w] of Object.entries(words)){
 const target=new URL(file,root),text=(await fs.readFile(target,'utf8')).replaceAll('\r\n','\n');
 const a=text.indexOf(START),b=text.indexOf(END);
 if(a<0||b<a)throw Error(file+' has no theme grid markers');
 const next=text.slice(0,a)+grid(w)+text.slice(b+END.length);
 if(check){if(next!==text)throw Error('Refresh '+file+' with node scripts/build-theme-grid.mjs');}
 else await fs.writeFile(target,next);
}
if(check){for(const t of themes)await fs.access(new URL('docs/assets/themes/'+t.id+'.jpg',root));}
else{
 const {chromium}=await import('playwright');
 await fs.mkdir(new URL('docs/assets/themes/',root),{recursive:true});
 const browser=await chromium.launch();
 // The top 16:10 of the full-page desktop screenshot, at twice the width the grid shows it.
 const page=await browser.newPage({viewport:{width:640,height:400}});
 for(const t of themes){
  const shot=new URL(dir+t.id+'/shot-desktop.jpg',root);
  await page.setContent(`<body style="margin:0"><img src="data:image/jpeg;base64,${(await fs.readFile(shot)).toString('base64')}" style="display:block;width:640px;height:400px;object-fit:cover;object-position:top">`,{waitUntil:'load'});
  await page.screenshot({path:decodeURIComponent(new URL('docs/assets/themes/'+t.id+'.jpg',root).pathname).replace(/^\/([A-Za-z]:)/,'$1'),type:'jpeg',quality:80});
 }
 await browser.close();
}
