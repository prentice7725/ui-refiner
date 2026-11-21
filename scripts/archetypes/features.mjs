// Per-site features for the impression classification: stored scan metrics plus pixel statistics of the desktop
// screenshot (first screen and first four screens). Writes features.jsonl, one site per line.
// Appends sites not yet in data/archetypes/features.jsonl. node scripts/archetypes/features.mjs
import fs from 'node:fs';import path from 'node:path';import {PNG} from 'pngjs';
import {RAW,file,requireRaw} from './lib.mjs';
requireRaw();
const G=RAW,OUT=file('features.jsonl');
const done=new Set();try{for(const l of fs.readFileSync(OUT,'utf8').split('\n'))if(l)done.add(JSON.parse(l).id);}catch{}
const outFd=fs.openSync(OUT,'a');

// Pixel statistics over rows [y0,y1) with a stride of 2 pixels; 16x16 blocks decide photo-like areas.
function pixels(png,y0,y1){
 const {width:W,data:D}=png,h=Math.min(png.height,y1);let n=0,white=0,dark=0,lum=0,lum2=0,sat=0,colorful=0,edge=0;const hues=new Array(12).fill(0);
 const L=(i)=>.2126*D[i]+.7152*D[i+1]+.0722*D[i+2];
 for(let y=y0;y<h;y+=2)for(let x=0;x<W;x+=2){const i=(y*W+x)*4,r=D[i],g=D[i+1],b=D[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=L(i);
  n++;lum+=l;lum2+=l*l;if(mn>=245)white++;if(l<45)dark++;const s=mx?(mx-mn)/mx:0;sat+=s;
  if(s>.35&&mx>80){colorful++;const d=mx-mn;let hh=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;hues[Math.floor(((hh*60+360)%360)/30)]++;}
  if(x+2<W){const j=i+8;if(Math.abs(l-L(j))>40)edge++;}}
 // Photo-like blocks: many distinct colours and real luminance variance.
 let blocks=0,photo=0;
 for(let by=y0;by+16<=h;by+=16)for(let bx=0;bx+16<=W;bx+=16){blocks++;let s=0,s2=0;const seen=new Set();
  for(let y=by;y<by+16;y+=4)for(let x=bx;x<bx+16;x+=4){const i=(y*W+x)*4,l=L(i);s+=l;s2+=l*l;seen.add((D[i]>>4)<<8|(D[i+1]>>4)<<4|(D[i+2]>>4));}
  const m=s/16,v=s2/16-m*m;if(seen.size>=9&&v>120)photo++;}
 const m=lum/n;
 return {white:white/n,dark:dark/n,lum:m/255,lumSd:Math.sqrt(Math.max(0,lum2/n-m*m))/255,sat:sat/n,colorful:colorful/n,hueBins:hues.filter(c=>c>colorful*.08&&c>n*.002).length,edge:edge/n,photo:blocks?photo/blocks:0};
}
const pngSize=f=>{try{const b=Buffer.alloc(24);const fd=fs.openSync(f,'r');fs.readSync(fd,b,0,24,0);fs.closeSync(fd);return {w:b.readUInt32BE(16),h:b.readUInt32BE(20)};}catch{return null;}};
const num=v=>Number.isFinite(v)?v:null;

let count=0;
for(const g of fs.readdirSync(G).filter(x=>/^(KR|JP)-/.test(x)).sort()){
 const country=g.slice(0,2),trade=g.slice(3);
 for(const site of fs.readdirSync(path.join(G,g)).sort()){
  const id=`${g}/${site}`;if(done.has(id))continue;
  const dir=path.join(G,g,site);let j;try{j=JSON.parse(fs.readFileSync(path.join(dir,'scan.json'),'utf8'));}catch{continue;}
  const d=j.raw?.find(r=>r.viewport==='desktop')?.metrics,mo=j.raw?.find(r=>r.viewport==='mobile')?.metrics;if(!d)continue;
  const lang=country==='KR'?'ko':'ja';if(j.lang&&j.lang!==lang)continue;
  const f={id,country,trade,url:j.url,
   heroFull:d.hero?.fullBleed?1:0,heroSide:d.hero?.side?.kind||null,heroAlign:d.hero?.align||null,headlineWidth:num(d.hero?.headlineWidth),
   fsMedia:num(d.firstScreen?.media),fsShot:num(d.firstScreen?.shot),fsClaim:d.firstScreen?.claim?1:0,fsClaimRatio:num(d.firstScreen?.claimRatio),fsMaxText:num(d.firstScreen?.maxText),fsAction:d.firstScreen?.action?1:0,
   photos:num(d.system?.photos),navCount:d.system?.nav?.length??0,body:num(d.typography?.body),display:num(d.typography?.display),ratio:num(d.typography?.ratio),fontSizes:num(d.typography?.sizes),weights:num(d.typography?.weights),
   h1w:num(d.system?.weights?.h1),radius:num(d.system?.radius),btnRadius:num(d.system?.button?.radius),hairlines:num(d.system?.hairlines),content:num(d.system?.content),
   cardGroups:d.cardGrids?.count??0,iconBoxes:d.iconBoxes?.count??0,centeredRatio:num(d.centered?.ratio),roundedRatio:num(d.rounding?.ratio),hueBuckets:num(d.hueBuckets),
   gradients:d.gradients?.count??0,glass:d.glass?.count??0,emoji:d.emoji?.count??0,serif:num(d.editorial?.serifDisplay),paper:d.editorial?.paper?1:0,tracked:d.editorial?.tracked??0,
   bg:d.rootBackground?.rgb||null,bgDark:d.rootBackground?.dark?1:0,elements:num(d.total),textLen:(d.text||'').length,labels:(d.labels||[]).length,
   mobileElements:num(mo?.total)};
  const desk=path.join(dir,'scan-desktop.png'),mob=path.join(dir,'scan-mobile.png');
  const ds=pngSize(desk),ms=pngSize(mob);f.screens=ds?Math.min(40,ds.h/900):null;f.mobileScreens=ms?Math.min(60,ms.h/844):null;
  try{const png=PNG.sync.read(fs.readFileSync(desk));f.px1=pixels(png,0,900);f.px4=pixels(png,0,3600);}catch(e){f.pxError=String(e.message).slice(0,60);}
  fs.writeSync(outFd,JSON.stringify(f)+'\n');if(++count%100===0)console.log(count,id);
 }
}
console.log('done',count);
