// What a refine must not lose: link targets, forms and their fields, contact details and the facts
// (numbers with units, prices, times, dates) shown on the page. `keep record` takes the inventory
// before the redesign, `keep check` compares the redesigned page and fails when something went
// missing. Facts that appear only after the redesign are listed too, so invented numbers get a look.
import fs from 'node:fs/promises';
import path from 'node:path';
import {launchBrowser} from '../vendor/lintapple/src/browser.js';
import {scanTarget} from './scan.mjs';

/** Runs in the page. Collects targets and facts only, never field values. */
export function collectKeep(){
 // Animated counters show 0 until scrolled into view; read their target figure instead.
 for(const el of document.querySelectorAll('[data-count],[data-target],[data-to],[data-countup],[data-value]')){
  const raw=['count','target','to','countup','value'].map(k=>el.dataset[k]).find(v=>v!=null&&/^-?\d+(\.\d+)?$/.test(v.trim()));
  if(raw==null||el.children.length)continue;
  const n=Number(raw),shown=Number.isInteger(n)?n.toLocaleString('en-US'):raw.trim();
  el.textContent=(el.dataset.prefix||'')+shown+(el.dataset.suffix||'');
 }
 const text=(document.body?.innerText||'').replace(/ /g,' ');
 const abs=v=>{try{const u=new URL(v,location.href);return u.origin===location.origin?u.pathname.replace(/\/index\.html?$/,'/')+u.search+u.hash:u.href;}catch{return v;}};
 const hrefs=[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href').trim()).filter(h=>h&&h!=='#'&&!/^javascript:/i.test(h)).map(h=>/^(tel|mailto):/i.test(h)?h.toLowerCase().replace(/[\s-]/g,''):h.replace(/\/index\.html?(?=$|[?#])/,'/'));
 // In-page anchors may be renamed with the sections; they are reported, not required.
 const links=hrefs.filter(h=>!h.startsWith('#')),anchors=hrefs.filter(h=>h.startsWith('#'));
 const forms=[...document.querySelectorAll('form')].map(f=>({action:f.getAttribute('action')?abs(f.getAttribute('action')):null,method:(f.getAttribute('method')||'get').toLowerCase()}));
 const fields=[...document.querySelectorAll('input,select,textarea')].filter(el=>!['hidden','submit','button','reset','image'].includes((el.getAttribute('type')||'').toLowerCase())).map(el=>({name:el.getAttribute('name')||el.id||null,type:(el.getAttribute('type')||el.tagName).toLowerCase(),required:el.required}));
 // Facts: figures with an optional currency or unit, times, phone numbers, postcodes.
 const facts=[...new Set((text.match(/(?:[$¥₩€£]\s?)?\d[\d,.:/\-]*\s?(?:%|円|원|万|만|억|分|時間|min|mins|hrs?|hours?|명|人|社|件|km|kg|m²|㎡|년|年|月|日|개|個|点)?/g)||[]).map(s=>s.replace(/\s/g,'')).filter(s=>/[^\d]/.test(s)||s.length>=3))];
 return {url:location.href,links:[...new Set(links)],anchors:[...new Set(anchors)],forms,fields,facts,title:document.title};
}

async function inventory(target,{timeoutMs=45000}={}){
 const browser=await launchBrowser({timeout:timeoutMs});
 try{
  const page=await (await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'})).newPage();
  await page.goto(scanTarget(target),{waitUntil:'load',timeout:timeoutMs});
  await page.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});
  return await page.evaluate(collectKeep);
 }finally{await browser.close();}
}

/** Records the inventory of the page as it is now. */
export async function recordKeep(target,{out='ui-refiner-keep.json',timeoutMs}={}){
 const inv=await inventory(target,{timeoutMs});
 const file=path.resolve(out);await fs.writeFile(file,JSON.stringify({schemaVersion:1,recorded:new Date().toISOString(),target,...inv},null,1)+'\n');
 return {file,inventory:inv};
}

/** Pure comparison, exported for tests. */
export function compareKeep(before,after){
 const missing=(a,b)=>a.filter(x=>!b.includes(x));
 const fieldKey=f=>`${f.name??'?'}:${f.type}`;
 const out={
  links:missing(before.links,after.links),
  forms:missing(before.forms.map(f=>`${f.method} ${f.action??'(same page)'}`),after.forms.map(f=>`${f.method} ${f.action??'(same page)'}`)),
  fields:missing(before.fields.map(fieldKey),after.fields.map(fieldKey)),
  facts:missing(before.facts,after.facts),
  added:missing(after.facts,before.facts),
  anchors:missing(before.anchors||[],after.anchors||[])
 };
 out.ok=!out.links.length&&!out.forms.length&&!out.fields.length&&!out.facts.length;
 return out;
}

/** Compares the redesigned page with the recorded inventory. */
export async function checkKeep(target,{from='ui-refiner-keep.json',timeoutMs}={}){
 let before;try{before=JSON.parse(await fs.readFile(path.resolve(from),'utf8'));}catch{throw new Error(`No inventory at ${from}. Run "ui-refiner keep record <page>" before changing the page.`);}
 const result=compareKeep(before,await inventory(target,{timeoutMs}));
 // The Stop-hook gate (scripts/refine-gate-hook.mjs) reads this to know the check ran after the last edit.
 await fs.writeFile(path.join(path.dirname(path.resolve(from)),'ui-refiner-keep-check.json'),JSON.stringify({checkedAt:new Date().toISOString(),target,...result},null,1)+'\n');
 return result;
}
