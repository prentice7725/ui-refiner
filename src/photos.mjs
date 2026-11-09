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

/** Searches and saves stand-ins into `out` with credits.json; returns the saved list and the credit line. */
export async function fetchStandIns(query,{out='assets/stand-in',count=6,orientation='landscape',lang='en',fetchImpl=fetch}={}){
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
 credits.photos.push(...saved);
 await fs.writeFile(path.join(dir,'credits.json'),JSON.stringify(credits,null,1)+'\n');
 return {dir,photos:saved,credit:creditLine(credits.photos,lang)};
}

/** Counts stand-in images in an HTML source (img or elements marked data-stand-in). */
export const countStandIns=html=>(String(html).match(/data-stand-in(?:=["']?(?:true|1)["']?)?[\s>/]/gi)||[]).length;
