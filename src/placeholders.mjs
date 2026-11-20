// Placeholder text left in a page: an all-zero phone number or postcode, "○○町", "서울시 OO구", "Lorem ipsum",
// "[Company Name]", an @example.com address. A quality item, not an AI-look signal: on 79 Korean and Japanese pages
// that Claude and Codex built from one-line prompts it appeared on 25–52% of them and on 1% of 1748 human-made sites
// (20 November 2026), but it comes from a brief without facts, not from how a model writes. A refine keeps such values
// as they are (keep check), so the report names them for the person to replace with real ones.

/** Patterns, each with a short name for the report. Exported for tests and offline measurement. */
export const PLACEHOLDER_PATTERNS=[
 ['zero-phone',/(?<![\d-])0\d{1,3}-0{3,4}-0{4}(?!\d)|(?<![\d-])0{2,4}-0{3,4}-0{4}(?!\d)|\(\d{3}\)\s?(?:555|000)-0{4}/g],
 ['zero-postcode',/〒\s?\d{3}-0000(?!\d)/g],
 // ○○ only beside an address or name part: Japanese copy also writes "〇〇な方へ" ("for those who …") on purpose.
 ['circles',/(?<=(?:株式会社|有限会社|市|区|町|県)\s?)[○〇]{2,}(?:\s?(?:町|市|区|村|郡|県|丁目|ビル|様|さん|店))?|[○〇]{2,}\s?(?:町|市|区|村|郡|県|丁目|ビル|様|さん|店|株式会社|시|구|동|로|길|님|빌딩)/g],
 ['oo-address',/(?<![A-Za-z])OO(?:시|구|군|동|읍|면|로|길|빌딩|병원|점)/g],
 ['lorem',/lorem ipsum/gi],
 // Only a name slot: Korean boards prefix posts with tags like "[회사소식]".
 ['bracket-name',/\[(?:(?:Your|Company|Business|Client|Brand)[ -]?(?:Name|Here)|Your [A-Za-z ]{2,20}|(?:회사|업체|상호|병원|가게|매장)\s?(?:명|이름)|(?:会社|店舗|事業所|医院)名)\]/gi],
 ['example-email',/[\w.+-]+@example\.(?:com|org|net)\b/gi]
];

/** Pure: placeholder matches in a text, as [{kind, match}]. */
export function findPlaceholders(text){
 const out=[];
 for(const [kind,re] of PLACEHOLDER_PATTERNS)for(const m of String(text||'').matchAll(re))out.push({kind,match:m[0]});
 return out;
}

/** In-page: visible text nodes that hold a placeholder, with a selector for each element. Self-contained. */
export function collectPlaceholders(patterns){
 const res=patterns.map(([kind,src,flags])=>[kind,new RegExp(src,flags)]);
 const selector=el=>{const parts=[];while(el&&el!==document.body&&parts.length<6){const sib=[...el.parentElement.children].filter(x=>x.tagName===el.tagName);parts.unshift(`${el.tagName.toLowerCase()}:nth-of-type(${sib.indexOf(el)+1})`);el=el.parentElement;}return parts.join(' > ');};
 const out=[],w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 for(let n=w.nextNode();n&&out.length<40;n=w.nextNode()){
  const el=n.parentElement;if(!el||['SCRIPT','STYLE','NOSCRIPT','TEMPLATE'].includes(el.tagName))continue;
  const r=el.getBoundingClientRect();if(!r.width||!r.height||getComputedStyle(el).visibility==='hidden')continue;
  for(const [kind,re] of res){re.lastIndex=0;const m=n.nodeValue.match(re);if(m){out.push({kind,match:m[0],selector:selector(el)});break;}}
 }
 return out;
}
/** The patterns in a form page.evaluate can carry. */
export const placeholderArgs=()=>PLACEHOLDER_PATTERNS.map(([k,re])=>[k,re.source,re.flags]);
