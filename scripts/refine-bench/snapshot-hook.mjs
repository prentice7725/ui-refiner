#!/usr/bin/env node
// PostToolUse 훅: refine이 진행되는 동안 페이지가 바뀔 때마다 사본을 남긴다.
// 최종 결과만 보면 개성이 시안 단계에서 없었는지, 구현이나 검사 뒤 수정에서 사라졌는지 알 수 없기 때문이다.
//   .stage-NNN.html       index.html이 바뀔 때마다 (같은 폴더에 두어 상대 경로의 사진이 그대로 뜬다)
//   .stage-directions/    선택이 기록된 순간의 refine-directions 사본 (스킬이 끝에 이 폴더를 지운다)
//   .stages.jsonl         도구 호출마다 한 줄: 그때의 사본 이름과 검사 파일 상태
// 훅은 절대 실패하지 않는다: 오류가 나도 0으로 끝내 refine을 막지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

try{
 let text='';for await(const chunk of process.stdin){text+=chunk;if(text.length>2_000_000)break;}
 let input={};try{input=JSON.parse(text);}catch{}
 const dir=process.env.BENCH_PAGE_DIR||input.cwd||process.cwd(),page=path.join(dir,'index.html');
 if(fs.existsSync(page)){
  const logFile=path.join(dir,'.stages.jsonl');
  const lines=fs.existsSync(logFile)?fs.readFileSync(logFile,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
  const last=lines.at(-1),hash=crypto.createHash('sha1').update(fs.readFileSync(page)).digest('hex');
  let snap=last?.snap??null,changed=false;
  if(hash!==last?.hash){
   const n=lines.filter(l=>l.changed).length+1;snap=`.stage-${String(n).padStart(3,'0')}.html`;
   fs.copyFileSync(page,path.join(dir,snap));changed=true;
  }
  const read=f=>{try{return JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));}catch{return null;}};
  const pick=read('refine-directions/PICK.json'),verify=read('refine-directions/VERIFY.json'),keep=read('ui-refiner-keep-check.json');
  const saved=path.join(dir,'.stage-directions');
  if(pick&&!fs.existsSync(saved))fs.cpSync(path.join(dir,'refine-directions'),saved,{recursive:true});
  const cmd=typeof input.tool_input?.command==='string'?input.tool_input.command.replace(/\s+/g,' ').slice(0,200):input.tool_input?.file_path??null;
  fs.appendFileSync(logFile,JSON.stringify({at:new Date().toISOString(),tool:input.tool_name??null,cmd,hash,changed,snap,
   pick:pick?.label??pick?.pick??null,verifyAt:verify?.checkedAt??null,drift:verify?.drift?.length??null,problems:verify?.problems??null,keepAt:keep?.checkedAt??null,keepOk:keep?.ok??null})+'\n');
 }
}catch{}
process.exit(0);
