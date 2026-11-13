// Keep a site's other pages in the design picked for its main page.
// `extractSystem` measures the main page (type, sizes, colours, button, radius, rules, content width) and writes
// ui-refiner-system.json plus DESIGN_SYSTEM.md for the agent. `checkSystem` scans other pages and lists where they
// leave it. Variety belongs between the three directions of the main page and between clients; within one site the
// pages should look like one site.
import fs from 'node:fs/promises';
import path from 'node:path';
import {scanUrl} from './scan.mjs';
import {accentOf} from './directions.mjs';
import {accentFamily} from './refine-log.mjs';

export const SYSTEM_FILE='ui-refiner-system.json';
export const SYSTEM_MD='DESIGN_SYSTEM.md';
const hex=c=>c?'#'+c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''):'-';
const dist=(a,b)=>a&&b?Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]):0;
const whiteish=c=>c&&Math.min(...c)>=247&&Math.max(...c)-Math.min(...c)<=8;

async function measure(page,{out,lang='auto',timeoutMs=45000}={}){
 const {result:r}=await scanUrl(page,{out,lang,compare:false,timeoutMs,keepRaw:true});
 const m=r.raw?.find(v=>v.viewport==='desktop')?.metrics??r.raw?.[0]?.metrics;
 if(!m?.system)throw new Error(`Could not measure ${page}.`);
 const accent=accentOf(m);
 // Photo-led: a photo covers 30% or more of the first screen. In the inner-page benchmark, inner pages of photo-led
 // sites built from the system without photos lost to the plain arm ("text-heavy … no imagery").
 return {...m.system,photoLed:(m.firstScreen?.media??0)>=.3,bg:m.rootBackground?.rgb??null,accent,accentFamily:accent?accentFamily(accent):null,aiLook:r.aiLook.score,lang:r.lang};
}

/** Short notes an agent reads before building another page of the site. */
export function renderSystemMarkdown(s,page){
 const f=s.fonts||{},z=s.sizes||{},b=s.button;
 return [`# Design system`,'',`Measured from \`${page}\` on ${s.measured}. Build the site's other pages with these; run \`ui-refiner system check <page>\` after each.`,'',
  `- Type: display ${f.display??'-'}, headings ${f.heading??'-'}, body ${f.body??'-'}`,
  `- Sizes: h1 ${z.h1??'-'}px, h2 ${z.h2??'-'}px, h3 ${z.h3??'-'}px, body ${z.body??'-'}px; weights h1 ${s.weights?.h1??'-'}, h2 ${s.weights?.h2??'-'}`,
  `- Colours: page ${hex(s.bg)}, text ${hex(s.colours?.text)}, headings ${hex(s.colours?.heading)}, accent ${hex(s.accent)}${s.accentFamily?` (${s.accentFamily})`:''}`,
  `- Main button: ${b?`${hex(b.bg)} with ${hex(b.color)} text, radius ${b.radius}px, weight ${b.weight}, height ${b.height}px`:'none measured'}`,
  `- Boxes: radius ${s.radius??'-'}px; ${s.hairlines>20?'thin rules carry the structure':'few rules'} (${s.hairlines} ruled elements)`,
  `- Content width: ${s.content?`${s.content}px`:'-'}`,
  `- Imagery: ${s.photoLed?`photo-led (a photo carries the first screen; ${s.photos} large image${s.photos===1?"":"s"} on the page). Inner pages carry photos too: a photo header or photos beside the content, from the same set.`:`led by type or the product (${s.photos??0} large images on the page).`}`,
  '','Inner pages keep the type, colours, button, radius and width. They may drop the hero treatment of the main page: an inner page opens with its own title and content, not a second landing hero.',''].join('\n');
}

export async function extractSystem(page,{dir,lang,timeoutMs}={}){
 const root=path.resolve(dir||path.dirname(path.resolve(page)));
 const s={schemaVersion:1,measured:new Date().toISOString().slice(0,10),page:path.relative(root,path.resolve(page)).split(path.sep).join('/'),...await measure(page,{out:path.join(root,'ui-refiner-scan','system'),lang,timeoutMs})};
 await fs.writeFile(path.join(root,SYSTEM_FILE),JSON.stringify(s,null,1)+'\n');
 await fs.writeFile(path.join(root,SYSTEM_MD),renderSystemMarkdown(s,s.page));
 return {system:s,file:path.join(root,SYSTEM_FILE),markdown:path.join(root,SYSTEM_MD)};
}

/**
 * Where a page leaves the site's system. Sizes allow for inner pages: their h1 is often smaller than a landing hero,
 * so only h2 and body sizes are compared. An AI-look index 15 or more above the main page's is reported too.
 */
export function systemDrift(s,p){
 const out=[],add=(id,want,got)=>out.push({id,want,got});
 for(const k of ['heading','body'])if(s.fonts?.[k]&&p.fonts?.[k]&&s.fonts[k]!==p.fonts[k])add(`font-${k}`,s.fonts[k],p.fonts[k]);
 if(s.bg&&p.bg&&!(whiteish(s.bg)&&whiteish(p.bg))&&dist(s.bg,p.bg)>12)add('surface',hex(s.bg),hex(p.bg));
 if(s.accentFamily&&p.accentFamily&&s.accentFamily!==p.accentFamily)add('accent',s.accentFamily,p.accentFamily);
 if(s.button&&p.button){
  if(Math.abs(s.button.radius-p.button.radius)>3)add('button-radius',`${s.button.radius}px`,`${p.button.radius}px`);
  if(dist(s.button.bg,p.button.bg)>40)add('button-colour',hex(s.button.bg),hex(p.button.bg));
 }
 if(s.radius!=null&&p.radius!=null&&Math.abs(s.radius-p.radius)>3)add('radius',`${s.radius}px`,`${p.radius}px`);
 if(s.sizes?.body&&p.sizes?.body&&Math.abs(s.sizes.body-p.sizes.body)>1)add('body-size',`${s.sizes.body}px`,`${p.sizes.body}px`);
 if(s.sizes?.h2&&p.sizes?.h2&&(p.sizes.h2/s.sizes.h2<.8||p.sizes.h2/s.sizes.h2>1.25))add('heading-size',`${s.sizes.h2}px`,`${p.sizes.h2}px`);
 if(s.content&&p.content&&Math.abs(p.content-s.content)/s.content>.12)add('width',`${s.content}px`,`${p.content}px`);
 if(s.photoLed&&p.photos===0)add('no-photos',`${s.photos} large image${s.photos===1?'':'s'}`,'none');
 if(s.aiLook!=null&&p.aiLook!=null&&p.aiLook-s.aiLook>=15)add('ai-look',s.aiLook,p.aiLook);
 return out;
}

export async function readSystem(file){try{return JSON.parse(await fs.readFile(path.resolve(file),'utf8'));}catch{return null;}}

export async function checkSystem(pages,{system,lang,timeoutMs}={}){
 const file=system||path.join(path.dirname(path.resolve(pages[0])),SYSTEM_FILE),s=await readSystem(file);
 if(!s)throw new Error(`No design system at ${file}. Run "ui-refiner system extract <main page>" first.`);
 const results=[];
 for(const page of pages){const p=await measure(page,{out:path.join(path.dirname(path.resolve(file)),'ui-refiner-scan','system-check',path.basename(page).replace(/\.\w+$/,'')),lang,timeoutMs});results.push({page,drift:systemDrift(s,p),measured:p});}
 return {system:file,results};
}
