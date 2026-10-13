// Tiny local DOM fixture to demonstrate the browser checker after npm install.
import http from 'node:http';
import {fileURLToPath} from 'node:url';
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UI Refiner UI Fixture</title><style>
:root{font-family:system-ui,sans-serif;color:#1d1d1f;background:#fff}*{box-sizing:border-box}body{margin:0;padding:32px}main{max-width:700px;margin:auto}h1{font-size:32px;margin:0 0 20px}p{font-size:16px;line-height:1.5}.field{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-block:24px}button{font-family:inherit;min-height:44px;min-width:100px;font-size:16px;border:0;background:#1e4a90;color:#fff;padding:12px 20px;border-radius:6px;cursor:pointer}button:focus-visible{outline:3px solid #ff9500;outline-offset:3px}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation-duration:0.01ms!important}}
</style></head><body data-app-ready><main><h1>UI 검증 예제</h1><p>실제 suta와 lintapple 실행 전에 도구의 로컬 브라우저 점검 경로를 시험하는 간단한 페이지입니다.</p><div class="field" data-ui-actions><button type="button" data-qa="primary-action">확인</button><output data-qa="result" aria-live="polite">대기</output></div></main><script>document.querySelector('button').addEventListener('click',()=>document.querySelector('output').textContent='Saved');</script></body></html>`;
const negativeHtml = html.replace('font-family:inherit;min-height','font-family:serif;min-height');
export function createDemoServer(){
 return http.createServer((req,res)=>{
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
   res.end(req.url==='/negative-control'?negativeHtml:html);
 });
}
export {html as demoHtml};
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const server=createDemoServer();
 server.listen(Number(process.env.UI_REFINER_DEMO_PORT||5173),'127.0.0.1',()=>console.log('UI demo ready'));
}
