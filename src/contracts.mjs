import fs from 'node:fs/promises';
import path from 'node:path';
import {repoRoot} from './vendor.mjs';
import {normalizeStatic,normalizeBrowser,browserCoverage} from './normalize.mjs';
export async function recordedContract(name){return JSON.parse(await fs.readFile(path.join(repoRoot,'test/fixtures',`${name}.recorded.json`),'utf8'));}
// Stable projection of actual checker output: ignore run URL and human wording, retain the repair contract.
export function contractProjection(name,raw){
 const findings=(name==='suta'?normalizeStatic(raw):normalizeBrowser(raw)).map(f=>({rule:f.rule,severity:f.severity,file:f.file,line:f.line,selector:f.selector,actual:f.actual,expected:f.expected,viewport:f.viewport,state:f.state,colorScheme:f.colorScheme,identity:f.identity}));
 return name==='suta'?{files:raw.files,errors:raw.errors,warnings:raw.warnings,findings}:{rules:raw.rules,findings,coverage:browserCoverage(raw)};
}
export async function verifyRecordedContract(name,raw){
 const expected=contractProjection(name,await recordedContract(name)),actual=contractProjection(name,raw);
 if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error(`${name} recorded checker contract changed. Review raw fixture and normalization before updating test/fixtures. Do not silently regenerate approved fixtures.`);
}
