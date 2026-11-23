// Theme starter: copies one theme's files into a project and writes brand.css, the stylesheet that sets the client's
// own colour and typeface on the theme's tokens. With a brand colour it renders the theme sample with that colour and
// lists every text or button whose contrast the colour broke (a warning: the files are written either way), and it lists the photographs the theme needs with their
// place and ratio. It writes no page: the sample's fictional copy and generated images are not carried over.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

export const THEMES_DIR=fileURLToPath(new URL('../skills/ui-refiner-agent/reference/themes/',import.meta.url));
// The token a theme uses for its own colour, in the order looked for; -soft, -deep and -dark follow it.
const BRAND_TOKENS=['brand','accent','signal','product','earth'];

export async function listThemes(dir=THEMES_DIR){
 const catalog=await fs.readFile(path.join(dir,'README.md'),'utf8'),themes=[];
 for(const line of catalog.split(/\r?\n/)){
  const row=/^\| `([a-z]+-[a-z]+-[a-z]+)` \| ([^|]+) \| (\d+) \|$/.exec(line);
  if(row)themes.push({id:row[1],basis:row[2].trim(),sites:Number(row[3])});
 }
 return themes;
}

const hexToRgb=hex=>{const h=hex.replace('#','');const full=h.length===3?[...h].map(c=>c+c).join(''):h;return [0,2,4].map(i=>parseInt(full.slice(i,i+2),16));};
const rgbToHex=rgb=>'#'+rgb.map(v=>Math.round(Math.min(255,Math.max(0,v))).toString(16).padStart(2,'0')).join('');
function rgbToHsl([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;
 if(!d)return [0,0,l];const s=d/(1-Math.abs(2*l-1));let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return [(h*60+360)%360,s,l];}
function hslToRgb([h,s,l]){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
 const [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return [r,g,b].map(v=>(v+m)*255);}
const luminance=rgb=>{const [r,g,b]=rgb.map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;});return .2126*r+.7152*g+.0722*b;};
export const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
export const parseHex=value=>/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value||'')?rgbToHex(hexToRgb(value)):null;

/** The custom properties of the theme's first :root block, in order. */
export function rootTokens(css){
 const root=/:root\s*\{([^}]*)\}/.exec(css);if(!root)return {};
 const tokens={};for(const m of root[1].replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi))tokens[m[1]]=m[2].trim();
 return tokens;
}

/** Which tokens carry the theme's own colour: the main one and those derived from it. */
export function brandTokens(tokens){
 const main=BRAND_TOKENS.map(n=>'--'+n).find(n=>parseHex(tokens[n]));if(!main)return null;
 const derived=['soft','deep','dark'].map(s=>`${main}-${s}`).filter(n=>parseHex(tokens[n]));
 return {main,derived};
}

/** The brand colour on the theme's tokens: the derived tokens keep the theme's own lightness steps and tint strength. */
export function brandValues(tokens,brand){
 const names=brandTokens(tokens);if(!names)return null;
 const [bh,bs,bl]=rgbToHsl(hexToRgb(brand)),[,,ml]=rgbToHsl(hexToRgb(tokens[names.main])),out={[names.main]:brand};
 for(const name of names.derived){
  const [,s,l]=rgbToHsl(hexToRgb(tokens[name]));
  out[name]=name.endsWith('-soft')?rgbToHex(hslToRgb([bh,Math.min(s,bs),l])):rgbToHex(hslToRgb([bh,bs,Math.min(.95,Math.max(.05,bl+(l-ml)))]));
 }
 return out;
}

function brandCss({id,tokens,values,face}){
 const names=brandTokens(tokens),lines=[];
 if(values)for(const [name,value] of Object.entries(values))lines.push(` ${name}: ${value}; /* theme: ${tokens[name]} */`);
 else if(names)for(const name of [names.main,...names.derived])lines.push(` /* ${name}: ${tokens[name]}; */`);
 if(face&&tokens['--text'])lines.push(` --text: "${face}", ${tokens['--text']};`);
 else if(tokens['--text'])lines.push(` /* --text: "Your typeface", ${tokens['--text']}; */`);
 return `/* The client's own colour and typeface on ${id}. Link this after theme.css; keep other overrides in a third file.
   Written by \`ui-refiner theme starter\`.${values?'':' No brand colour was given: uncomment and set the lines the client has.'} */
:root {
${lines.join('\n')}
}
`;
}

/** Photographs the theme's sample uses: where, how large and at what ratio, so the same slots can be filled. */
export function photoSlots(html){
 const slots=[];let section='';
 for(const m of html.matchAll(/<!--\s*(?:\d+\.\s*)?([^\n>]{2,60}?)\s*(?:\n[\s\S]*?)?-->|<img\b[^>]*>/g)){
  if(m[1]!==undefined){section=m[1].trim();continue;}
  const attr=n=>new RegExp(`\\b${n}="([^"]*)"`).exec(m[0])?.[1];
  const w=Number(attr('width')),h=Number(attr('height'));if(!w||!h)continue;
  slots.push({section,width:w,height:h,ratio:ratioName(w,h),shows:attr('alt')||'',generated:/\bdata-generated\b/.test(m[0])});
 }
 return slots;
}
function ratioName(w,h){
 const r=w/h;for(const [a,b] of [[16,9],[16,10],[3,2],[4,3],[1,1],[3,4],[2,3],[9,16],[21,9],[5,4],[4,5]])if(Math.abs(r-a/b)<.03)return `${a}:${b}`;
 return r>=1?`${r.toFixed(2)}:1`:`1:${(1/r).toFixed(2)}`;
}

// Runs in the page: every visible element with its own text, with its colour and the first opaque ground behind it.
function readColours(){
 const parse=c=>{const m=/rgba?\(([^)]+)\)/.exec(c);if(!m)return null;const p=m[1].split(/[,\s/]+/).filter(Boolean).map(Number);return {rgb:p.slice(0,3),a:p.length>3?p[3]:1};};
 const ground=el=>{for(let n=el;n&&n.nodeType===1;n=n.parentElement){const s=getComputedStyle(n);
   if(s.backgroundImage!=='none')return null;const c=parse(s.backgroundColor);if(c&&c.a>=.99)return c.rgb;if(c&&c.a>.01)return null;
   if(n!==el&&(s.position==='absolute'||s.position==='fixed'))return null;}return [255,255,255];};
 const label=el=>{const cls=typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'';return el.tagName.toLowerCase()+cls;};
 const out=[];
 for(const el of document.querySelectorAll('body *')){
  const text=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ').trim();
  const control=el.matches('a[class*="btn"],a[class*="button"],button,input[type="submit"]');
  if(!text&&!control)continue;
  const box=el.getBoundingClientRect(),s=getComputedStyle(el);
  if(!box.width||!box.height||s.visibility==='hidden'||s.display==='none'||Number(s.opacity)<.1)continue;
  const fg=parse(s.color),bg=ground(el);
  const own=parse(s.backgroundColor),around=el.parentElement?ground(el.parentElement):null;
  out.push({el:label(el),text:text.slice(0,40),fg:fg&&fg.a>=.99?fg.rgb:null,bg,size:parseFloat(s.fontSize),weight:Number(s.fontWeight)||400,
   fill:control&&own&&own.a>=.99?own.rgb:null,around:control?around:null,hasText:!!text});
 }
 return out;
}

/** Text and buttons on the theme's sample whose contrast the brand colour broke (it met the threshold with the theme's colour). */
export const CONTRAST_WIDTHS=[1440,390];
export async function brandContrast(samplePath,css,{timeoutMs=45000,launch,widths=CONTRAST_WIDTHS}={}){
 const {launchBrowser}=launch?{launchBrowser:launch}:await import('../vendor/lintapple/src/browser.js');
 const browser=await launchBrowser({timeout:timeoutMs}),found=new Map(),changed=new Set();
 const same=(a,b)=>(!a&&!b)||(a&&b&&a.every((v,i)=>v===b[i]));
 const note=(width,kind,a,colour,on,now,need,was)=>{
  const key=[kind,a.el,rgbToHex(colour),rgbToHex(on)].join('|');changed.add(key);
  if(now>=need||(was!==null&&was<need))return;
  const hit=found.get(key);
  if(hit){if(!hit.widths.includes(width))hit.widths.push(width);}
  else found.set(key,{kind,element:a.el,text:a.text,colour:rgbToHex(colour),on:rgbToHex(on),ratio:+now.toFixed(2),needs:need,was:was&&+was.toFixed(2),widths:[width]});
 };
 try{
  for(const width of widths){
   const ctx=await browser.newContext({viewport:{width,height:width<768?844:900},reducedMotion:'reduce',serviceWorkers:'block'});
   try{
    const page=await ctx.newPage();page.setDefaultTimeout(timeoutMs);
    await page.goto(pathToFileURL(samplePath).href,{waitUntil:'load',timeout:timeoutMs});
    await page.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});
    const before=await page.evaluate(readColours);
    await page.addStyleTag({content:css});
    const after=await page.evaluate(readColours);
    for(let i=0;i<after.length&&i<before.length;i++){
     const a=after[i],b=before[i];if(a.el!==b.el)continue;
     if(a.hasText&&a.fg&&a.bg&&(!same(a.fg,b.fg)||!same(a.bg,b.bg)))
      note(width,'text',a,a.fg,a.bg,contrast(a.fg,a.bg),a.size>=24||(a.size>=18.66&&a.weight>=700)?3:4.5,b.fg&&b.bg?contrast(b.fg,b.bg):null);
     if(a.fill&&a.around&&!same(a.fill,a.around)&&(!same(a.fill,b.fill)||!same(a.around,b.around)))
      note(width,'button',a,a.fill,a.around,contrast(a.fill,a.around),3,b.fill&&b.around?contrast(b.fill,b.around):null);
    }
   }finally{await ctx.close();}
  }
 }finally{await browser.close();}
 return {widths,checked:changed.size,failures:[...found.values()]};
}

/** The smallest change that repairs one failure: the nearest shade of the brand colour that meets the threshold, or the theme's ink on a brand fill. */
export function suggestFix(failure,{brandColours=[],ink}={}){
 const is=c=>brandColours.includes(c),shade=(colour,against)=>{
  const [h,s,l]=rgbToHsl(hexToRgb(colour)),other=hexToRgb(against),darker=luminance(other)>.18;
  for(let step=1;step<=95;step++){const next=darker?l-step/100:l+step/100;if(next<0||next>1)break;
   const rgb=hslToRgb([h,s,next]);if(contrast(rgb,other)>=failure.needs)return rgbToHex(rgb);}
  return null;};
 if(is(failure.colour)){const to=shade(failure.colour,failure.on);return to?{use:to,how:`${to}, the nearest shade of the brand colour that reaches ${failure.needs}:1 on ${failure.on}`}:null;}
 if(is(failure.on)){
  if(ink&&contrast(hexToRgb(ink),hexToRgb(failure.on))>=failure.needs)return {use:ink,how:`the theme's ink ${ink} for this text (${contrast(hexToRgb(ink),hexToRgb(failure.on)).toFixed(1)}:1 on the brand colour)`};
  const to=shade(failure.on,failure.colour);return to?{use:to,how:`${to} as the fill, the nearest shade of the brand colour that reaches ${failure.needs}:1 under ${failure.colour} text`}:null;}
 return null;
}

/** Copies the theme and writes brand.css and STARTER.md into `out`. */
export async function themeStarter(id,{out='ui-refiner-theme',brand,face,dir=THEMES_DIR,render=true,launch}={}){
 const themes=await listThemes(dir),theme=themes.find(t=>t.id===id);
 if(!theme)throw new Error(`Unknown theme ${id}. Themes: ${themes.map(t=>t.id).join(', ')}`);
 const colour=brand===undefined?null:parseHex(brand);
 if(brand!==undefined&&!colour)throw new Error(`--brand needs a hex colour such as #0b5cab (got ${brand})`);
 const from=path.join(dir,id),target=path.resolve(out);await fs.mkdir(target,{recursive:true});
 const css=await fs.readFile(path.join(from,'theme.css'),'utf8'),tokens=rootTokens(css),names=brandTokens(tokens);
 if(colour&&!names)throw new Error(`${id} has no colour of its own to replace (it works in black, white and photographs); leave --brand out`);
 const values=colour?brandValues(tokens,colour):null,brandSheet=brandCss({id,tokens,values,face});
 for(const file of ['theme.css','theme.md'])await fs.copyFile(path.join(from,file),path.join(target,file));
 await fs.writeFile(path.join(target,'brand.css'),brandSheet);
 const slots=photoSlots(await fs.readFile(path.join(from,'sample.html'),'utf8'));
 // A literal copy of the theme colour outside the tokens would not follow brand.css.
 const body=css.replace(/:root\s*\{[^}]*\}/,''),literal=names?(body.match(new RegExp(tokens[names.main].replace('#','#?'),'gi'))||[]).length:0;
 let check=null;
 if(values&&render){
  try{check=await brandContrast(path.join(from,'sample.html'),brandSheet,{launch});}
  catch(error){check={skipped:String(error.message||error).split('\n')[0]};}
  for(const f of check.failures||[])f.fix=suggestFix(f,{brandColours:Object.values(values),ink:parseHex(tokens['--ink'])})?.how||null;
 }
 const result={theme,dir:target,files:['theme.css','theme.md','brand.css','STARTER.md'],brand:colour,face:face||null,tokens:values,
  untouched:names?null:'no colour token',literal,contrast:check,photos:slots,ok:!(check&&check.failures&&check.failures.length)};
 await fs.writeFile(path.join(target,'STARTER.md'),starterDoc(result,tokens,names));
 return result;
}

function starterDoc(r,tokens,names){
 const L=[`# ${r.theme.id}: starter`,'',`${r.theme.basis} (${r.theme.sites} measured sites). Read \`theme.md\` for the skeleton, components and rules.`,'',
  '## Link order','','```html','<link rel="stylesheet" href="theme.css">','<link rel="stylesheet" href="brand.css">','<!-- the page\'s own overrides, if any, in a third file -->','```','',
  '## Brand',''];
 if(r.tokens){L.push('| Token | Theme | Client |','|---|---|---|');for(const [name,value] of Object.entries(r.tokens))L.push(`| \`${name}\` | ${tokens[name]} | ${value} |`);
  L.push('',`The derived tokens keep the theme's lightness steps and tint strength with the client's hue. Check them against the client's own palette if it documents one.`);}
 else if(names)L.push(`No brand colour was given. The theme's own colour is \`${names.main}\` (${tokens[names.main]}); set it in \`brand.css\`, or run again with \`--brand "#rrggbb"\`.`);
 else L.push('This theme has no colour of its own: it works in black, white and photographs. Keep the client\'s colour to the logo.');
 if(r.face)L.push('',`Typeface: \`--text\` now starts with "${r.face}". Load the font on the page; the theme's stack stays as the fallback.`);
 if(r.literal)L.push('',`\`theme.css\` writes the theme colour ${r.literal} time(s) outside the tokens; those places do not follow \`brand.css\`. Search for ${tokens[names.main]}.`);
 if(r.contrast){L.push('','## Contrast with the brand colour','');
  if(r.contrast.skipped)L.push(`Not checked: ${r.contrast.skipped}`);
  else if(!r.contrast.failures.length)L.push(`Checked on the theme's sample at ${r.contrast.widths.join(' and ')}px: ${r.contrast.checked} text and button colours changed, and all still meet WCAG AA (4.5:1 for text, 3:1 for large text and for a button against its ground).`);
  else{L.push(`Checked on the theme's sample at ${r.contrast.widths.join(' and ')}px. ${r.contrast.failures.length} of ${r.contrast.checked} changed colours no longer meet WCAG AA:`,'','| What | Width | Colour | On | Ratio | Needs | With the theme colour | Smallest fix |','|---|---|---|---|---|---|---|---|');
   for(const f of r.contrast.failures)L.push(`| ${f.kind} \`${f.element}\`${f.text?` “${f.text}”`:''} | ${f.widths.length===r.contrast.widths.length?'all':f.widths.join(', ')+'px'} | ${f.colour} | ${f.on} | ${f.ratio}:1 | ${f.needs}:1 | ${f.was?f.was+':1':'—'} | ${f.fix||'—'} |`);
   L.push('','Put the fix in the page\'s overrides for those elements. The brand token and the logo keep the client\'s colour.');}
 }
 L.push('','## Photographs the theme needs','');
 if(!r.photos.length)L.push('The sample uses no photographs.');
 else{L.push('| Where | Ratio | At least | What the sample shows there |','|---|---|---|---|');
  for(const p of r.photos)L.push(`| ${p.section||'—'} | ${p.ratio} | ${p.width}×${p.height} | ${p.shows||'—'} |`);
  L.push('','Use the client\'s own photographs. Without them, fetch credited stand-ins with `ui-refiner photos` before building; the sample\'s generated images are not copied here and must not be used on a client\'s page.');}
 L.push('','## Next','','Build the page from the client\'s content on the skeleton in `theme.md`, then run `ui-refiner keep check` and `ui-refiner stress` on it.','');
 return L.join('\n');
}
