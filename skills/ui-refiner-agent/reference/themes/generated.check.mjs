// Acceptance check for the generated theme images: every listed file exists in <theme>/assets/generated/, is a PNG,
// JPEG or WebP, is at least the listed width and height, and generated/prompts.json names the model and prompt for it.
// node skills/ui-refiner-agent/reference/themes/generated.check.mjs  → exit 0 when all are present.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
export const WANT={
 'place-photo-quiet':{'hero-bath':[1600,900],'exterior':[1600,900],'room-main':[1600,1000],'room-corner':[1600,1000],'kaiseki':[1600,1000],'dish':[1200,1200],'entrance':[1200,1500]},
 'care-white':{'hero-room':[1600,1200],'doctor':[1200,1500],'reception':[1600,1000],'xray-room':[1600,1000],'consult':[1600,1000]},
 'business-dark':{'hero-line':[1920,1080],'tile-machining':[1200,1500],'tile-automation':[1200,1500],'tile-semicon':[1200,1500],'tile-mold':[1200,1500],'tech-measure':[1600,1100]},
 'business-corporate-quickbar':{'hero-center':[1920,1080],'tile-storage':[1200,1500],'tile-cold':[1200,1500],'tile-linehaul':[1200,1500],'tile-parcel':[1200,1500],'dispatch':[1600,1100],'dock':[1600,1100]},
 'business-white':{'owner-tablet':[1600,1100],'team':[1600,1000],'support':[1200,1500]},
 'care-corporate':{'hero-group':[1920,1080],'rehab':[1600,1100],'lunch':[1600,1100],'room':[1600,1100],'staff':[1600,1100],'exterior':[1600,1100],'bath':[1600,1100]},
 'public-portal-search':{'hall':[1600,1100],'exhibition':[1600,1100],'concert':[1600,1100],'workshop':[1600,1100],'festival':[1600,1100],'dance':[1600,1100],'lecture':[1600,1100],'museum-family':[1600,1100]},
 'public-portal-purpose':{'branch':[1600,1100],'consult':[1600,1100],'business':[1600,1100],'town':[1600,1100],'atm':[1600,1100],'seminar':[1600,1100],'pension':[1600,1100],'smartphone':[1600,1100],'family':[1600,1100]},
 'shop-portal-grid':{'banner-farm':[1920,800],'tangerine':[1200,1200],'hallabong':[1200,1200],'giftset':[1200,1200],'sweetpotato':[1200,1200],'farmer':[1600,1100],'cheonhyehyang':[1200,1200],'juice':[1200,1200],'jam':[1200,1200],'packing':[1600,1100]},
 'shop-portal-story':{'hero-brewer':[1920,840],'bottle-1':[1200,1200],'bottle-2':[1200,1200],'bottle-3':[1200,1200],'pairing':[1600,1100],'brewery':[1600,1100],'giftbox':[1200,1200],'rice':[1600,1100],'seasonal':[1200,1200]},
 'creative-dark':{'work-hero':[1920,1080],'work-1':[1200,1500],'work-2':[1600,1100],'work-3':[1600,1100],'work-4':[1200,1500],'studio':[1600,1100],'work-5':[1600,1100],'work-6':[1200,1500]},
 'creative-bigtype':{'hero-object':[1600,1600],'work-package':[1600,1100],'work-poster':[1600,1100],'work-book':[1600,1100],'client':[1600,1100],'members':[1600,1100],'work-logo':[1600,1100],'work-web':[1600,1100],'work-festival':[1600,1100],'work-bakery':[1600,1100]},
 'place-photo-view':{'hero-sea':[1920,1080],'room-ocean':[1600,1100],'room-family':[1600,1100],'pool':[1600,1100],'bbq':[1600,1100],'walk':[1200,1500],'cafe':[1600,1100]},
 'business-corporate-message':{'hero-plant':[1920,1080],'tile-water':[1200,1500],'tile-air':[1200,1500],'tile-industrial':[1200,1500],'message':[1600,1100],'recruit':[1600,1100],'lab':[1600,1100]}
};
function size(file){
 const b=fs.readFileSync(file);
 if(b.slice(1,4).toString()==='PNG')return [b.readUInt32BE(16),b.readUInt32BE(20)];
 if(b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP'){
  const kind=b.slice(12,16).toString();
  if(kind==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
  if(kind==='VP8 ')return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];
  if(kind==='VP8L'){const v=b.readUInt32LE(21);return [1+(v&0x3fff),1+((v>>14)&0x3fff)];}
 }
 if(b[0]===0xff&&b[1]===0xd8){let i=2;while(i<b.length){if(b[i]!==0xff){i++;continue;}const m=b[i+1];if(m>=0xc0&&m<=0xcf&&![0xc4,0xc8,0xcc].includes(m))return [b.readUInt16BE(i+7),b.readUInt16BE(i+5)];i+=2+b.readUInt16BE(i+2);}}
 return null;
}
const problems=[];
for(const [theme,files] of Object.entries(WANT)){
 const dir=path.join(here,theme,'assets','generated');
 let prompts={};try{prompts=JSON.parse(fs.readFileSync(path.join(dir,'prompts.json'),'utf8'));}catch{problems.push(`${theme}: generated/prompts.json missing or not JSON`);}
 for(const [name,[w,h]] of Object.entries(files)){
  const f=['.png','.jpg','.jpeg','.webp'].map(e=>path.join(dir,name+e)).find(f=>fs.existsSync(f));
  if(!f){problems.push(`${theme}: ${name} missing`);continue;}
  const s=size(f);if(!s){problems.push(`${theme}: ${name} is not a PNG, JPEG or WebP`);continue;}
  if(s[0]<w||s[1]<h)problems.push(`${theme}: ${name} is ${s[0]}x${s[1]}, needs at least ${w}x${h}`);
  const p=prompts[name];if(!p||!p.model||!p.prompt)problems.push(`${theme}: prompts.json has no model and prompt for ${name}`);
 }
}
if(problems.length){console.error(problems.join('\n'));process.exit(1);}
console.log('all generated images present');
