// Stand-in photographs from Wikimedia Commons for pages whose owner has no photos yet.
// Human-made sites open with a full-bleed photo a third of the time (data/hero-reference); a page
// with no imagery at all reads as generated. Stand-ins close that gap honestly:
//   - only openly licensed files (CC0, public domain, CC BY, CC BY-SA), never stock sites;
//   - every file is saved with its author, licence and source page in credits.json;
//   - pages mark each one with data-stand-in and carry one credit line, so nobody mistakes a
//     stand-in for the client's own room, staff or product, and the owner knows what to replace.
import fs from 'node:fs/promises';
import path from 'node:path';

const API='https://commons.wikimedia.org/w/api.php';
const UA='ui-refiner/0.6 (https://github.com/prentice7725/ui-refiner; stand-in photo search)';
const OPEN=/^(cc0|public domain|pd\b|pdm|cc by(-sa)? \d)/i;
const strip=s=>String(s??'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();

/** Licence check: only free licences whose terms allow reuse with credit. */
export const openLicence=name=>OPEN.test(String(name||'').trim())&&!/nc|nd|non-free|fair use/i.test(name);

/** Turns one Commons imageinfo record into a stand-in candidate, or null when it does not qualify. */
export function toCandidate(page,{minWidth=1200,orientation='landscape'}={}){
 const i=page?.imageinfo?.[0],m=i?.extmetadata||{};if(!i)return null;
 const licence=strip(m.LicenseShortName?.value);
 if(!openLicence(licence)||!/^image\/(jpeg|png|webp)$/.test(i.mime)||i.width<minWidth)return null;
 if(orientation==='landscape'&&i.width<i.height*1.2)return null;
 if(orientation==='portrait'&&i.height<i.width*1.1)return null;
 const author=strip(m.Artist?.value)||'Unknown author';
 return {title:page.title,source:`https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g,'_'))}`,url:i.thumburl||i.url,width:i.width,height:i.height,
  author,licence,licenceUrl:strip(m.LicenseUrl?.value)||null,description:strip(m.ImageDescription?.value).slice(0,200)||page.title.replace(/^File:|\.\w+$/g,'')};
}

/** Searches Commons for openly licensed photographs of a subject. */
export async function searchPhotos(query,{count=6,minWidth=1200,orientation='landscape',fetchImpl=fetch}={}){
 if(!String(query||'').trim())throw new Error('photos needs a subject to search for, e.g. "bakery bread shelf"');
 const params=new URLSearchParams({action:'query',format:'json',generator:'search',gsrnamespace:'6',gsrsearch:`${query} filetype:bitmap`,gsrlimit:String(Math.min(50,count*5)),prop:'imageinfo',iiprop:'url|extmetadata|size|mime',iiurlwidth:'1600'});
 const res=await fetchImpl(`${API}?${params}`,{headers:{'user-agent':UA},signal:AbortSignal.timeout(20000)});
 if(!res.ok)throw new Error(`Wikimedia Commons search failed (${res.status})`);
 const pages=Object.values((await res.json()).query?.pages||{}).sort((a,b)=>(a.index??0)-(b.index??0));
 return pages.map(p=>toCandidate(p,{minWidth,orientation})).filter(Boolean).slice(0,count);
}

/** One credit line for the page footer, in the page language. */
export function creditLine(photos,lang='en'){
 const lead={ko:'임시 사진(실제 사진으로 교체 예정)',ja:'仮の写真（実際の写真に差し替え予定）',en:'Stand-in photographs, to be replaced'}[lang]||'Stand-in photographs, to be replaced';
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 return `<p class="stand-in-credits">${lead}: ${photos.map(p=>`<a href="${esc(p.source)}">${esc(p.author)}</a> (${esc(p.licence)})`).join(', ')}, via Wikimedia Commons</p>`;
}

/** Widths the stand-ins are saved at. A downloaded 1600px Commons JPEG weighs 400–750 KB and was the
 * largest-contentful-paint element on refined pages (2026-11-19 benchmark); WebP at these widths with
 * srcset lets a phone load the 640px file instead. */
export const PHOTO_WIDTHS=[640,1024,1600];

/** Resizes saved photos to WebP at each width (never wider than the original) with the bundled Chromium,
 * replaces the original file and adds `variants`, `srcset` and an `<img>` snippet to each photo.
 * When the browser cannot be started, the originals stay and `skipped` says why. */
export async function optimisePhotos(dir,photos,{widths=PHOTO_WIDTHS,quality=0.8,base=dir}={}){
 if(!photos.length)return {photos,skipped:null};
 let browser;
 try{const {chromium}=await import('playwright');browser=await chromium.launch();}
 catch(e){return {photos,skipped:`could not start Chromium to convert photos (${String(e.message).split('\n')[0]}); the original files were kept`};}
 const rel=f=>path.relative(base,path.join(dir,f)).split(path.sep).join('/');
 try{
  const page=await browser.newPage();
  for(const p of photos){
   const src=path.join(dir,p.file),buf=await fs.readFile(src),mime=p.file.endsWith('.png')?'image/png':p.file.endsWith('.webp')?'image/webp':'image/jpeg';
   const made=await page.evaluate(async({data,widths,quality})=>{
    const img=new Image();img.src=data;try{await img.decode();}catch{return null;}
    const W=img.naturalWidth,H=img.naturalHeight,ws=[...new Set([...widths.filter(w=>w<W),Math.min(W,Math.max(...widths))])].sort((a,b)=>a-b);
    return ws.map(w=>{const h=Math.round(w*H/W),c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(img,0,0,w,h);
     const url=c.toDataURL('image/webp',quality);return url.startsWith('data:image/webp')?{w,h,b64:url.split(',')[1]}:null;}).filter(Boolean);
   },{data:`data:${mime};base64,${buf.toString('base64')}`,widths,quality});
   if(!made?.length)continue;
   const stem=p.file.replace(/\.\w+$/,'');p.variants=[];
   for(const v of made){const f=`${stem}-${v.w}.webp`;await fs.writeFile(path.join(dir,f),Buffer.from(v.b64,'base64'));p.variants.push({file:f,width:v.w,height:v.h,bytes:Buffer.byteLength(v.b64,'base64')});}
   await fs.rm(src,{force:true});
   const big=p.variants.at(-1);p.originalBytes=buf.length;p.file=big.file;
   p.srcset=p.variants.map(v=>`${rel(v.file)} ${v.width}w`).join(', ');
   p.img=`<img src="${rel(big.file)}" srcset="${p.srcset}" sizes="100vw" width="${big.width}" height="${big.height}" alt="" data-stand-in>`;
  }
 }finally{await browser.close();}
 return {photos,skipped:null};
}

/** Searches and saves stand-ins into `out` with credits.json; returns the saved list and the credit line.
 * Photos are converted to WebP at PHOTO_WIDTHS unless `optimise` is false. */
/**
 * The folder the `<img>` paths are written relative to: the page's folder when `page` is given, otherwise the project
 * folder that holds the outermost `assets` folder of `out` (`<project>/assets/stand-in` → `<project>`), otherwise the
 * folder above `out`. The working directory is never used: an agent runs the command from the UI Refiner checkout,
 * and paths relative to it came out as `../../Users/…`, broken in the page (2026-11-19 check).
 */
export function photoBase(out,page){
 if(page)return path.dirname(path.resolve(page));
 const dir=path.resolve(out),parts=dir.split(path.sep),i=parts.findIndex(x=>x.toLowerCase()==='assets');
 return i>0?parts.slice(0,i).join(path.sep)||path.sep:path.dirname(dir);
}

export async function fetchStandIns(query,{out='assets/stand-in',count=6,orientation='landscape',lang='en',fetchImpl=fetch,optimise=true,page,base=photoBase(out,page)}={}){
 const found=await searchPhotos(query,{count,orientation,fetchImpl});
 if(!found.length)throw new Error(`No openly licensed photographs found for "${query}". Try a plainer subject (for example "dentist chair" instead of a clinic name).`);
 const dir=path.resolve(out);await fs.mkdir(dir,{recursive:true});
 let credits={schemaVersion:1,standIn:true,photos:[]};try{credits=JSON.parse(await fs.readFile(path.join(dir,'credits.json'),'utf8'));}catch{}
 const saved=[];
 for(const p of found){
  const ext=/\.png(\?|$)/i.test(p.url)?'png':/\.webp(\?|$)/i.test(p.url)?'webp':'jpg';
  const slug=query.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,30)||'photo';
  const file=`${slug}-${String(credits.photos.length+saved.length+1).padStart(2,'0')}.${ext}`;
  const res=await fetchImpl(p.url,{headers:{'user-agent':UA},signal:AbortSignal.timeout(30000)});
  if(!res.ok)continue;
  await fs.writeFile(path.join(dir,file),Buffer.from(await res.arrayBuffer()));
  saved.push({file,query,...p});
 }
 const opt=optimise?await optimisePhotos(dir,saved,{base:path.resolve(base)}):{skipped:null};
 credits.photos.push(...saved);
 await fs.writeFile(path.join(dir,'credits.json'),JSON.stringify(credits,null,1)+'\n');
 return {dir,base:path.resolve(base),photos:saved,credit:creditLine(credits.photos,lang),...(opt.skipped?{optimiseSkipped:opt.skipped}:{})};
}

/** Counts stand-in images in an HTML source (img or elements marked data-stand-in). */
export const countStandIns=html=>(String(html).match(/data-stand-in(?:=["']?(?:true|1)["']?)?[\s>/]/gi)||[]).length;
