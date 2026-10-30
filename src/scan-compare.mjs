// Before/after comparison of two scan.json results. Pure apart from loadPreviousScan; advisory only.
import fs from 'node:fs/promises';
import path from 'node:path';
import {signalTitle} from './ai-tells.mjs';
import {jaIssueTitle} from './ja-typography.mjs';

/** Accepts a scan.json path or the folder that holds it. Fails before any browser work starts. */
export async function loadPreviousScan(input){
 let file=path.resolve(input);
 if((await fs.stat(file).catch(()=>null))?.isDirectory())file=path.join(file,'scan.json');
 let scan;
 try{scan=JSON.parse(await fs.readFile(file,'utf8'));}
 catch(e){throw Error(`Cannot read previous scan ${file}: ${e.code==='ENOENT'?'file not found':e.message}`);}
 if(scan?.tool!=='ui-refiner scan'||scan.schemaVersion!==1||!scan.aiLook)throw Error(`${file} is not a ui-refiner scan.json (schemaVersion 1)`);
 return {scan,file,dir:path.dirname(file)};
}

const pagePath=v=>{try{const u=new URL(v);return u.protocol==='file:'?u.href:u.pathname+u.search;}catch{return v;}};

/** For automatic comparison: the last scan in the output folder, only if it is of the same page. */
export async function findAutoPrevious(dir,url){
 const previous=await loadPreviousScan(dir).catch(()=>null);
 return previous&&pagePath(previous.scan.url)===pagePath(url)?previous:null;
}

const rank={strong:3,moderate:2,weak:1,high:3,medium:2,low:1};
function diffById(before=[],after=[],level,title){
 const prev=new Map(before.map(x=>[x.id,x])),next=new Map(after.map(x=>[x.id,x]));
 return {
  resolved:[...prev.keys()].filter(id=>!next.has(id)).map(id=>({id,title:title(id),before:prev.get(id)[level]})),
  added:[...next.keys()].filter(id=>!prev.has(id)).map(id=>({id,title:title(id),after:next.get(id)[level]})),
  persisting:[...next.keys()].filter(id=>prev.has(id)).map(id=>{const b=prev.get(id)[level],a=next.get(id)[level];return {id,title:title(id),before:b,after:a,change:rank[a]>rank[b]?'worse':rank[a]<rank[b]?'better':'same'};})
 };
}

export function compareScans(before,after,{lang='ko'}={}){
 const warnings=[];
 // Comparing production with a local dev server is normal, so only the path has to match.
 if(pagePath(before.url)!==pagePath(after.url))warnings.push('different-page');
 else if(before.url!==after.url)warnings.push('different-host');
 if((before.locale||'')!==(after.locale||''))warnings.push('different-locale');
 const quality=new Map();
 for(const q of before.quality||[])quality.set(q.rule,{rule:q.rule,before:q.count,after:0});
 for(const q of after.quality||[])quality.set(q.rule,{rule:q.rule,before:quality.get(q.rule)?.before||0,after:q.count});
 const japanese=before.japanese?.japanese||after.japanese?.japanese?diffById(before.japanese?.issues,after.japanese?.issues,'severity',id=>jaIssueTitle(id,lang)):null;
 return {
  previous:{url:before.url,scannedAt:before.scannedAt,score:before.aiLook.score,band:before.aiLook.band},
  current:{url:after.url,scannedAt:after.scannedAt,score:after.aiLook.score,band:after.aiLook.band},
  scoreDelta:after.aiLook.score-before.aiLook.score,
  signals:diffById(before.aiLook.signals,after.aiLook.signals,'strength',id=>signalTitle(id,lang)),
  quality:[...quality.values()].filter(q=>q.before!==q.after).sort((a,b)=>(b.before-b.after)-(a.before-a.after)),
  qualityTotal:{before:(before.quality||[]).reduce((n,q)=>n+q.count,0),after:(after.quality||[]).reduce((n,q)=>n+q.count,0)},
  japanese,warnings
 };
}

/** Copies the previous screenshots next to the new ones as before-*.png so the report can link both. */
export async function keepBeforeImages(previous,dir){
 const copied={};
 for(const v of previous.scan.views||[]){
  if(!v.screenshot)continue;
  const source=path.join(previous.dir,v.screenshot),target=path.join(dir,'before-'+v.screenshot);
  if(await fs.copyFile(source,target).then(()=>true,()=>false))copied[v.viewport]='before-'+v.screenshot;
 }
 return copied;
}

const text={
 ko:{level:{strong:'강',moderate:'중',weak:'약',high:'높음',medium:'중간',low:'낮음'},title:'이전 스캔과 비교',score:'AI 티 지수',resolved:'해결된 신호',added:'새로 생긴 신호',persisting:'남아 있는 신호',quality:'기본 품질 변화',total:'전체 건수',ja:'일본어 조판 변화',none:'없음',rule:'규칙',before:'이전',after:'이후',images:'스크린샷 비교',change:{better:'완화',worse:'악화',same:'유지'},warn:{'different-page':'⚠ 이전 스캔과 다른 페이지(경로)입니다. 결과를 직접 비교할 수 없습니다.','different-host':'이전 스캔과 호스트가 다릅니다(예: 운영 vs 로컬). 경로는 같아 비교합니다.','different-locale':'이전 스캔과 브라우저 로케일이 다릅니다. 문구 관련 신호가 달라질 수 있습니다.'}},
 ja:{level:{strong:'強',moderate:'中',weak:'弱',high:'高',medium:'中',low:'低'},title:'前回スキャンとの比較',score:'AI感指数',resolved:'解消したサイン',added:'新たに出たサイン',persisting:'残っているサイン',quality:'基本品質の変化',total:'合計件数',ja:'日本語組版の変化',none:'なし',rule:'ルール',before:'前回',after:'今回',images:'スクリーンショット比較',change:{better:'改善',worse:'悪化',same:'変化なし'},warn:{'different-page':'⚠ 前回と別のページ（パス）です。結果を直接比較できません。','different-host':'前回とホストが異なります（例：本番とローカル）。パスが同じなので比較します。','different-locale':'前回とブラウザのロケールが異なります。文言のサインが変わる場合があります。'}},
 en:{level:{strong:'strong',moderate:'moderate',weak:'weak',high:'high',medium:'medium',low:'low'},title:'Compared with the previous scan',score:'AI-look index',resolved:'Resolved signals',added:'New signals',persisting:'Remaining signals',quality:'Baseline quality changes',total:'Total issues',ja:'Japanese typesetting changes',none:'none',rule:'Rule',before:'Before',after:'After',images:'Screenshot comparison',change:{better:'better',worse:'worse',same:'same'},warn:{'different-page':'⚠ The previous scan is of a different page (path); results are not directly comparable.','different-host':'The host differs from the previous scan (e.g. production vs local); paths match, so results are compared.','different-locale':'The browser locale differs from the previous scan; copy-related signals may change.'}}
};

export function renderComparison(c,lang,heading){
 const x=text[['ja','en'].includes(lang)?lang:'ko'],sign=n=>n>0?`+${n}`:`${n}`;
 const L=v=>x.level[v]||v;
 const list=(items,fmt)=>items.length?items.map(fmt):[`- ${x.none}`];
 const lines=[heading(x.title),'',...c.warnings.map(w=>`> ${x.warn[w]}`),...(c.warnings.length?['']:[]),
  `- **${x.score}: ${c.previous.score} → ${c.current.score} (${sign(c.scoreDelta)})** · ${c.previous.scannedAt} → ${c.current.scannedAt}`,
  `- ${x.total}: ${c.qualityTotal.before} → ${c.qualityTotal.after} (${sign(c.qualityTotal.after-c.qualityTotal.before)})`];
 if(c.images)lines.push(`- ${x.images}: ${Object.entries(c.images).map(([vp,f])=>`${vp} [${x.before}](${f}) / [${x.after}](${f.replace(/^before-/,'')})`).join(' · ')}`);
 lines.push('',`**${x.resolved}**`,...list(c.signals.resolved,s=>`- ✓ ${s.title}`),'',`**${x.added}**`,...list(c.signals.added,s=>`- ✗ ${s.title} (${L(s.after)})`),'',`**${x.persisting}**`,...list(c.signals.persisting,s=>`- ${s.title} (${L(s.before)} → ${L(s.after)}, ${x.change[s.change]})`),'');
 if(c.quality.length)lines.push(`**${x.quality}**`,'',`| ${x.rule} | ${x.before} | ${x.after} |`,'|---|---:|---:|',...c.quality.map(q=>`| ${q.rule} | ${q.before} | ${q.after} |`),'');
 if(c.japanese){const j=c.japanese;lines.push(`**${x.ja}**`,...list([...j.resolved.map(s=>`- ✓ ${s.title}`),...j.added.map(s=>`- ✗ ${s.title} (${L(s.after)})`),...j.persisting.map(s=>`- ${s.title} (${L(s.before)} → ${L(s.after)})`)],s=>s),'');}
 return lines;
}
