// Controlled DOM app data: selecting a browser locale alone does not translate an app.
import http from 'node:http';
import {fileURLToPath} from 'node:url';

export const scenarioCopy = {
 'ko-KR': {
  title:'상태 검사 예제', error:'이름을 입력해 주세요.', empty:'표시할 항목이 없습니다.',
  loading:'데이터를 불러오는 중입니다.', ready:'데이터를 모두 불러왔습니다.',
  long:'저장한 설정은 모든 기기에서 사용할 수 있습니다. 변경 사항을 확인한 다음 저장 버튼을 눌러 주세요. 화면이 좁아도 이 안내 문구 전체를 읽을 수 있어야 합니다.',
 },
 'ja-JP': {
  title:'状態検査の例', error:'名前を入力してください。', empty:'表示する項目はありません。',
  loading:'データを読み込んでいます。', ready:'データの読み込みが完了しました。',
  long:'保存した設定はすべての端末で利用できます。変更内容を確認してから保存ボタンを押してください。画面の幅が狭い場合でも、この案内文を最後まで読むことができる必要があります。',
 },
};

export function scenarioPlan(locale='ko-KR') {
 const copy=scenarioCopy[locale];
 if(!copy)throw Error('Scenario locale must be ko-KR or ja-JP');
 return {
  timeout:1000,maxTabStops:80,
  focus:[{selector:'#enter'}],
  buttons:[
   {selector:'#enter',key:'Enter',outcome:'#enter-result',expectedText:'Enter saved'},
   {selector:'#space',key:'Space',outcome:'#space-result',expectedText:'Space saved'},
  ],
  dialogs:[{open:'#open',dialog:'#modal',close:'#close',returnFocus:'#open'}],
  states:[
   {name:'form-error',action:'click',selector:'#submit',ready:{selector:'#form-error',expectedText:copy.error}},
   {name:'modal-open',action:'click',selector:'#open',ready:{selector:'#modal',state:'visible'}},
   {name:'modal-closed',action:'press',selector:'#close',key:'Escape',ready:{selector:'#modal',state:'hidden'}},
   {name:'empty-list',action:'click',selector:'#clear',ready:{selector:'#empty',expectedText:copy.empty}},
   {name:'loading',action:'click',selector:'#load',ready:{selector:'#loading',expectedText:copy.loading}},
   {name:'ready',action:'click',selector:'#complete',ready:{selector:'#loaded',expectedText:copy.ready}},
   {name:'long-copy',action:'click',selector:'#show-copy',ready:{selector:'#long-copy',expectedText:copy.long}},
  ],
 };
}

export function scenarioHtml(locale='ko-KR',{defect='',fail=''}={}) {
 const copy=scenarioCopy[locale];
 if(!copy)throw Error('Scenario locale must be ko-KR or ja-JP');
 return `<!doctype html><html lang="${locale.slice(0,2)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${copy.title}</title>
<style>
:root{color-scheme:light dark;font:16px system-ui;color:#222;background:#fff}*{box-sizing:border-box}body{margin:0;padding:24px}main{max-width:640px;margin:auto}h1{font-size:32px}h2{font-size:24px}p{line-height:1.6}section{margin-block:24px}button,input{font:inherit;min-height:48px;max-width:100%;padding:12px;border:1px solid #555;border-radius:4px}button{color:inherit;background:transparent;cursor:pointer}button:focus-visible,input:focus-visible{outline:3px solid #0969da;outline-offset:3px}.actions{display:flex;flex-wrap:wrap;gap:16px;align-items:center;margin-block:16px}label{display:block;margin-block:8px}dialog{font:inherit;color:inherit;background:#fff;max-width:calc(100vw - 48px);padding:24px}dialog::backdrop{background:rgb(0 0 0 / .4)}#long-copy{overflow-wrap:anywhere}${defect==='clipping'?'#long-copy{width:80px;white-space:nowrap;overflow:hidden}':''}
@media(prefers-color-scheme:dark){:root{color:#f5f5f5;background:#181818}dialog{background:#181818}button,input{border-color:#aaa}input{background:#222;color:#f5f5f5}button:focus-visible,input:focus-visible{outline-color:#80baff}}
</style></head><body data-app-ready><main><h1>${copy.title}</h1>
<section><h2>Keyboard</h2><div class="actions"><button id="enter">Enter save</button><output id="enter-result" aria-live="polite">Pending Enter</output></div><div class="actions"><button id="space">Space save</button><output id="space-result" aria-live="polite">Pending Space</output></div></section>
<section><h2>Form</h2><form novalidate><label for="name">Name</label><input id="name" autocomplete="name" required aria-describedby="form-error"><div class="actions"><button id="submit" type="submit">Validate</button></div><p id="form-error" role="alert" hidden></p></form></section>
<section><h2>Modal</h2><button id="open">Open details</button><dialog id="modal" aria-labelledby="modal-title"><h2 id="modal-title">Details</h2><p>Review before closing.</p><button id="close" autofocus>Close details</button></dialog></section>
<section><h2>List</h2><ul id="items"><li>Saved item</li></ul><p id="empty" hidden></p><button id="clear">Clear list</button></section>
<section><h2>Loading</h2><div class="actions"><button id="load">Start loading</button><button id="complete">Release fixture data</button></div><p id="loading" role="status" hidden></p><p id="loaded" role="status" hidden></p></section>
<section><h2>Long copy</h2><button id="show-copy">Show guidance</button><p id="long-copy" hidden></p></section>
</main><script>
const copy=${JSON.stringify(copy)},fail=${JSON.stringify(fail).replaceAll('<','\\u003c')},defect=${JSON.stringify(defect).replaceAll('<','\\u003c')};
const byId=id=>document.getElementById(id);
byId('enter').onclick=()=>{if(defect!=='keyboard')byId('enter-result').textContent='Enter saved';};
byId('space').onclick=()=>{if(defect!=='keyboard')byId('space-result').textContent='Space saved';};
document.querySelector('form').onsubmit=e=>{e.preventDefault();if(fail==='form-error')return;byId('form-error').hidden=false;byId('form-error').textContent=copy.error;byId('name').setAttribute('aria-invalid','true');};
byId('open').onclick=()=>{if(fail!=='modal-open')byId('modal').showModal();};
byId('close').onclick=()=>{byId('modal').close();byId('open').focus();};
byId('modal').addEventListener('cancel',e=>{if(fail==='modal-closed')e.preventDefault();});
byId('modal').addEventListener('close',()=>byId('open').focus());
byId('clear').onclick=()=>{if(fail==='empty-list')return;byId('items').replaceChildren();byId('empty').hidden=false;byId('empty').textContent=copy.empty;};
// Keep loading observable until explicit fixture data release. No arbitrary sleeps.
let release;
byId('load').onclick=()=>{if(fail==='loading')return;byId('loaded').hidden=true;byId('loading').hidden=false;byId('loading').textContent=copy.loading;new Promise(resolve=>{release=resolve;}).then(data=>{byId('loading').hidden=true;byId('loaded').hidden=false;byId('loaded').textContent=data;});};
byId('complete').onclick=()=>{if(fail!=='ready')release?.(copy.ready);};
byId('show-copy').onclick=()=>{if(fail==='long-copy')return;byId('long-copy').hidden=false;byId('long-copy').textContent=copy.long;};
</script></body></html>`;
}

export function createScenarioServer() {
 return http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  // Explicit Storybook-style iframe URLs exercise the existing routes interface.
  const locale=url.pathname==='/ko'?'ko-KR':url.pathname==='/ja'?'ja-JP':url.pathname==='/iframe.html'&&url.searchParams.get('id')==='states--ko'?'ko-KR':null;
  if(!locale){res.writeHead(404);res.end('Unknown scenario');return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
  res.end(scenarioHtml(locale,{defect:url.searchParams.get('defect')||'',fail:url.searchParams.get('fail')||''}));
 });
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const server=createScenarioServer();
 server.listen(Number(process.env.UI_REFINER_DEMO_PORT||5173),'127.0.0.1',()=>console.log('State scenarios ready: /ko, /ja, /iframe.html?id=states--ko&viewMode=story'));
}
