// Loading problems a refine adds without meaning to, read from the page source.
// 2026-11-19 benchmark (three refined Korean and Japanese pages): every page loaded its web fonts through a
// render-blocking Google Fonts stylesheet, and Japanese pages fetched 350 KB–1 MB of font slices. Loading the
// same stylesheet without blocking (media="print" onload) cut the largest paint from 2.9 s to 0.66 s on one page
// and from 4.1 s to 2.6 s on another, with no added layout shift; nothing on the page looked different once loaded.
// Stand-in photos without srcset make phones download the 1600px file.

const FONT_CSS=/^(https?:)?\/\/(fonts\.googleapis\.com|fonts\.bunny\.net|use\.typekit\.net|p\.typekit\.net|cdn\.jsdelivr\.net\/.*(pretendard|font)|fastly\.jsdelivr\.net\/.*(pretendard|font)|unpkg\.com\/.*(pretendard|font)|cdnjs\.cloudflare\.com\/.*font)/i;
const attr=(tag,name)=>{const m=tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,'i'));return m?(m[1]??m[2]??m[3]):null;};

/** Font stylesheets that block the first paint: a plain <link rel=stylesheet> to a font host, or an @import of one. */
export function blockingFontCss(html){
 const src=String(html).replace(/<noscript\b[\s\S]*?<\/noscript>/gi,'').replace(/<!--[\s\S]*?-->/g,'');
 const out=[];
 for(const tag of src.match(/<link\b[^>]*>/gi)||[]){
  const rel=(attr(tag,'rel')||'').toLowerCase().split(/\s+/),href=attr(tag,'href')||'';
  if(!rel.includes('stylesheet')||!FONT_CSS.test(href))continue;
  const media=(attr(tag,'media')||'all').trim().toLowerCase();
  if(media==='all'||media==='screen'||media==='')out.push(href);
 }
 for(const style of src.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi)||[])
  for(const m of style.matchAll(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/gi))if(FONT_CSS.test(m[1]))out.push(m[1]);
 return out;
}

/** Stand-in photos (data-stand-in) shown through <img> without srcset. */
export function standInsWithoutSrcset(html){
 return (String(html).match(/<img\b[^>]*>/gi)||[]).filter(t=>/\sdata-stand-in\b/i.test(t)&&!attr(t,'srcset')).map(t=>attr(t,'src')||'');
}

/** Problem ids for `directions verify`, with the offending URLs. */
export function loadingProblems(html){
 const fonts=blockingFontCss(html),photos=standInsWithoutSrcset(html),out=[];
 if(fonts.length)out.push({id:'blocking-font-css',items:fonts});
 if(photos.length)out.push({id:'stand-in-no-srcset',items:photos});
 return out;
}

/** The non-blocking form of a font stylesheet link, for messages and the skill. */
export const nonBlockingFontLink=href=>`<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${href}"></noscript>`;
