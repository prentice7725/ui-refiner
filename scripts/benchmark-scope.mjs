#!/usr/bin/env node
import fs from 'node:fs/promises';
import http from 'node:http';
import {once} from 'node:events';
import {checkRoutes} from '../src/browser-session.mjs';
import {lintapplePolicy} from '../src/presets.mjs';
import {inspectionScope} from '../src/inspection-scope.mjs';
import {browserCoverage} from '../src/normalize.mjs';
import {evaluateBenchmark} from '../src/benchmark.mjs';
const pairs=JSON.parse(await fs.readFile(new URL('../test/fixtures/benchmark/cases.json',import.meta.url),'utf8'));
const pages=new Map(),labels=[];
for(const pair of pairs)for(const variant of ['normal','defect']){
 const route=pair.id+'-'+variant;
 pages.set('/'+route,'<!doctype html><html lang="en"><meta charset="utf-8"><title>Scope fixture</title><style>body{font:16px system-ui;background:white;color:#222;padding:32px}button,input{font:inherit;min-width:80px;min-height:48px;margin:16px}</style><body>'+pair[variant]+'</body></html>');
 labels.push({route,rule:pair.rule,selector:pair.boundary||pair.pageTarget?undefined:'[id="target"]',expected:pair.boundary==='excluded'?false:variant==='defect',kind:pair.boundary?'boundary-probe':'defect-contract',expectedLabel:pair.boundary||(variant==='defect'?'positive':'negative')});
}
const server=http.createServer((req,res)=>{res.writeHead(pages.has(req.url)?200:404,{'Content-Type':'text/html; charset=utf-8'});res.end(pages.get(req.url)||'Missing');});
server.listen(0,'127.0.0.1');await once(server,'listening');
let output;
try{
 const routes=labels.map(l=>({name:l.route,url:'http://127.0.0.1:'+server.address().port+'/'+l.route}));
 const policy={...structuredClone(lintapplePolicy),viewports:[{width:390,height:844}]};
 const raw=await checkRoutes(routes,policy,{allowedHosts:['127.0.0.1'],timeout:15000,locale:'en-US'});
 output={...evaluateBenchmark(labels,raw.findings),errors:raw.errors,inspectionScope:inspectionScope(routes,policy,[],raw.runs),ruleCoverage:browserCoverage(raw),findings:raw.findings};
 if(raw.errors.length)output.status='ERROR';
}catch(e){output={schemaVersion:1,status:'ERROR',error:e.stack};}
finally{await new Promise(resolve=>server.close(resolve));}
await fs.mkdir('artifacts/upstream-contracts',{recursive:true});
await fs.writeFile('artifacts/upstream-contracts/scope-benchmark.json',JSON.stringify(output,null,2)+'\n');
console.log(output.status+': scope benchmark; results in artifacts/upstream-contracts/scope-benchmark.json');
process.exitCode=output.status==='PASS'?0:output.status==='ERROR'?2:1;
