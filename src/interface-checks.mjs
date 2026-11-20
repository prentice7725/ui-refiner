// Interface rules from Vercel's Web Interface Guidelines (MIT) that a rendered page shows without interaction:
// - zoom-disabled: the viewport meta blocks pinch zoom ("NEVER: disable browser zoom"). People with low vision
//   enlarge text this way; WCAG 1.4.4 asks for 200%.
// - input-zoom: on a phone, a text field under 16px makes iOS Safari zoom the page when it gets focus.
// - paste-blocked: a field refuses paste (onpaste returning false), which breaks password managers and pasted codes.
// Quality items, never AI-look signals: they are as common on human-made sites as on generated ones.

/** Pure: whether a viewport meta content blocks zoom. */
export function blocksZoom(content){
 const c=String(content||'').toLowerCase().replace(/\s+/g,''),get=k=>(c.match(new RegExp(`(?:^|,)${k}=([^,]+)`))||[])[1];
 const us=get('user-scalable'),max=parseFloat(get('maximum-scale'));
 return us==='no'||us==='0'||(Number.isFinite(max)&&max<2);
}

/** In-page: the three checks. `mobile` turns on the field-size check. Self-contained: no eval, so a page's CSP cannot block it. */
export function collectInterfaceIssues({mobile}){
 const blocks=content=>{const c=String(content||'').toLowerCase().replace(/\s+/g,''),get=k=>(c.match(new RegExp(`(?:^|,)${k}=([^,]+)`))||[])[1];const us=get('user-scalable'),max=parseFloat(get('maximum-scale'));return us==='no'||us==='0'||(Number.isFinite(max)&&max<2);}; // same as blocksZoom
 const selector=el=>{const parts=[];while(el&&el!==document.body&&parts.length<6){const sib=[...el.parentElement.children].filter(x=>x.tagName===el.tagName);parts.unshift(`${el.tagName.toLowerCase()}:nth-of-type(${sib.indexOf(el)+1})`);el=el.parentElement;}return parts.join(' > ');};
 const shown=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
 const out=[];
 const meta=document.querySelector('meta[name="viewport" i]');
 if(meta&&blocks(meta.getAttribute('content')))out.push({rule:'zoom-disabled',selector:'meta[name=viewport]',actual:meta.getAttribute('content'),message:`The viewport meta blocks zoom (“${meta.getAttribute('content')}”). Remove user-scalable=no and maximum-scale so people can enlarge the page.`});
 const fields=[...document.querySelectorAll('input,textarea,select')].filter(el=>{const t=(el.getAttribute('type')||'text').toLowerCase();return el.tagName!=='INPUT'||['text','email','tel','url','search','password','number','date','time','datetime-local','month','week'].includes(t);}).filter(shown);
 if(mobile)for(const el of fields){const px=parseFloat(getComputedStyle(el).fontSize);if(px<16)out.push({rule:'input-zoom',selector:selector(el),actual:`${px}px`,message:`This field's text is ${px}px. Under 16px, iOS Safari zooms the page when the field gets focus; set font-size to 16px or more on phones.`});}
 for(const el of fields){const h=(el.getAttribute('onpaste')||'').replace(/\s/g,'');if(/returnfalse|preventDefault/.test(h))out.push({rule:'paste-blocked',selector:selector(el),actual:el.getAttribute('onpaste'),message:'This field refuses paste. Allow it: password managers and one-time codes rely on paste.'});}
 return out.slice(0,40);
}
export const interfaceArgs=mobile=>({mobile});
