// The desktop screenshot marked up like a graded paper: each scored signal circled in red pen where it was found,
// with its points beside it, and the score written at the top. Written next to the scan as scan-graded.png.
import path from 'node:path';
import {launchBrowser} from '../vendor/lintapple/src/browser.js';

export const GRADED_FILE='scan-graded.png';
const MARKS_PER_SIGNAL=3;

// Runs in the page. `signals`: [{n, title, points, targets}], `head`: the score line, `sub`: the verdict.
function drawMarks({signals,head,sub,perSignal}){
 const pen='#e0281e',hand='"Segoe Script","Bradley Hand","Nanum Pen Script","Yomogi","Comic Sans MS",cursive';
 const W=document.documentElement.scrollWidth,H=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);
 const layer=document.createElement('div');
 layer.style.cssText=`position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;z-index:2147483647;overflow:hidden`;
 const box=(css,text)=>{const d=document.createElement('div');d.style.cssText=css;if(text)d.textContent=text;layer.appendChild(d);return d;};
 const placed=[];let marked=0;
 for(const s of signals){
  let n=0;
  for(const sel of s.targets||[]){
   if(n>=perSignal)break;
   let el=null;try{el=document.querySelector(sel);}catch{}
   if(!el)continue;
   const r=el.getBoundingClientRect();if(r.width<4||r.height<4)continue;
   const x=r.left+scrollX,y=r.top+scrollY,big=r.width>W*.6||r.height>360,pad=big?6:10+Math.min(r.height,r.width)*.12;
   // A small thing gets a pen circle; a whole section gets a box, since an ellipse that large would mark nothing.
   box(`position:absolute;left:${x-pad}px;top:${y-pad}px;width:${r.width+pad*2}px;height:${r.height+pad*2}px;border:3px solid ${pen};border-radius:${big?'14px':'50%'};transform:rotate(${big?0:-1.5+((n+s.n)%3)}deg);box-sizing:border-box;opacity:.9`);
   if(!n){
    // The label sits above the mark, or below it when that would leave the page or cover an earlier label.
    let ly=y-pad-30;const lx=Math.max(8,Math.min(x,W-360));
    if(ly<8||placed.some(p=>Math.abs(p.y-ly)<28&&Math.abs(p.x-lx)<340))ly=y+r.height+pad+4;
    placed.push({x:lx,y:ly});
    box(`position:absolute;left:${lx}px;top:${ly}px;font:700 20px/1.2 ${hand};color:${pen};background:rgba(255,255,255,.88);padding:1px 8px;border-radius:4px;white-space:nowrap;transform:rotate(-1deg)`,`${s.n}. ${s.title}  +${s.points}`);
   }
   n++;marked++;
  }
 }
 // The score, top right, as a teacher writes it: the number, a double underline, the verdict under it.
 const score=box(`position:absolute;right:28px;top:22px;text-align:center;color:${pen};font-family:${hand};background:rgba(255,255,255,.9);padding:6px 18px 10px;border-radius:8px;transform:rotate(-4deg)`);
 score.innerHTML=`<div style="font-size:64px;font-weight:700;line-height:1"></div><div style="border-top:3px solid ${pen};border-bottom:3px solid ${pen};height:4px;margin:4px 0 6px"></div><div style="font-size:18px;font-weight:700"></div>`;
 score.children[0].textContent=head;score.children[2].textContent=sub;
 document.body.appendChild(layer);
 return marked;
}

/**
 * Renders the page again at desktop width, draws the marks and saves scan-graded.png in `dir`.
 * Returns the file name, or null when the page could not be loaded (the scan itself stays valid).
 */
export async function gradeScreenshot(url,aiLook,{dir,locale,verdict,timeoutMs=45000,width=1440,height=900}={}){
 const signals=aiLook.signals.filter(s=>s.weight>0&&s.points>0).map((s,i)=>({n:i+1,title:s.title,points:s.points,targets:s.targets||[]}));
 const browser=await launchBrowser({timeout:timeoutMs});
 try{
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',locale,deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(timeoutMs);
  await page.goto(url,{waitUntil:'load',timeout:timeoutMs});
  await page.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});
  await page.waitForTimeout(600);
  await page.evaluate(drawMarks,{signals,head:`${aiLook.score}/100`,sub:verdict||'',perSignal:MARKS_PER_SIGNAL});
  await page.screenshot({path:path.join(dir,GRADED_FILE),fullPage:true,timeout:timeoutMs});
  return GRADED_FILE;
 }catch{return null;}
 finally{await browser.close();}
}
