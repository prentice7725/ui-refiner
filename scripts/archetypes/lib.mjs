// Shared paths and definitions for the archetype pipeline that the themes are measured from.
//
// The raw scans (scan.json and screenshots per site, several GB) are not committed; set
// UI_REFINER_GENRES_RAW to their folder (default local/reference-raw/genres in this checkout, git-ignored, laid out as <COUNTRY-trade>/<host>/).
// Everything derived from them that the themes rest on is small and kept in data/archetypes.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const RAW=process.env.UI_REFINER_GENRES_RAW||path.join(REPO,'local','reference-raw','genres');
export const DATA=path.join(REPO,'data','archetypes');
export const file=name=>path.join(DATA,name);

// The eight impression archetypes, in the index order of the k=8 run of November 2026.
export const NAMES={0:'short & small',1:'dark cinematic',2:'white quiet',3:'dense portal',4:'photo-led',5:'big type',6:'standard corporate',7:'bold colour'};

// Purpose families: trades grouped by what a visitor comes to do.
export const FAMILIES={
 place:{label:'장소·체험 (가서 머물고 먹고 보는 곳)',trades:['inn','tourism','restaurant','wedding','event','wellness']},
 care:{label:'진료·돌봄 (예약하고 찾아가는 곳)',trades:['dental','skin','kmed','hospital','care','beauty','salon','fitness','kids']},
 public:{label:'기관·정보 (찾아보고 신청하는 곳)',trades:['gov','org','university','academy','culture','media','finance']},
 shop:{label:'상품·쇼핑 (고르고 사는 곳)',trades:['ec','fashion','cosmetics','food','farm']},
 business:{label:'기업·B2B (믿고 맡기는 회사)',trades:['corp','maker','logistics','software','builder','realestate','car','tax','local','hiring','interior']},
 creative:{label:'창작·엔터 (보여 주는 곳)',trades:['design','game','architecture','photo','illustration']}
};
export const familyOf=trade=>Object.entries(FAMILIES).find(([,f])=>f.trades.includes(trade))?.[0];

export const readJson=name=>JSON.parse(fs.readFileSync(file(name),'utf8'));
export const writeJson=(name,value)=>fs.writeFileSync(file(name),JSON.stringify(value,null,1)+'\n');
/** Feature rows (one per measured site), only those with screenshot pixels. */
export const readFeatures=()=>fs.readFileSync(file('features.jsonl'),'utf8').split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.px4);
/** The desktop metrics of one site's raw scan, or null when the raw scans are not on this machine. */
export function rawMetrics(id){
 try{const j=JSON.parse(fs.readFileSync(path.join(RAW,id,'scan.json'),'utf8'));return j.raw.find(r=>r.viewport==='desktop').metrics;}
 catch{return null;}
}
export function requireRaw(){
 if(!fs.existsSync(RAW)){console.error(`Raw scans not found at ${RAW}. Set UI_REFINER_GENRES_RAW to the folder of <COUNTRY-trade>/<host>/scan.json.`);process.exit(2);}
}
