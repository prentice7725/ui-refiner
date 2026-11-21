// Measured sites per country, purpose family and archetype: data/archetypes/counts.json, the table in the themes
// README. node scripts/archetypes/counts.mjs
import fs from 'node:fs';
import {NAMES,FAMILIES,familyOf,readFeatures,readJson,file} from './lib.mjs';

const K=readJson('clusters.json');
const groups={};let sites=0;
for(const country of ['KR','JP'])for(const f of Object.keys(FAMILIES))groups[`${country} ${f}`]=new Array(K.k).fill(0);
for(const r of readFeatures()){
 const f=familyOf(r.trade);
 if(!f||!(r.id in K.assign))continue;
 groups[`${r.country} ${f}`][K.assign[r.id]]++;sites++;
}
// One line per array, so a change reads as one changed row.
const line=v=>JSON.stringify(v).replace(/,/g,', ');
const out=['{',
 ` "note": ${JSON.stringify('Measured human-made sites per country and purpose family in each impression archetype (k-means, k=8, November 2026). spec-<country>-<family>-<archetype index>.json holds the measured values of one cell.')},`,
 ` "sites": ${sites},`,
 ` "archetypes": ${line(Object.values(NAMES))},`,
 ' "families": {',
 Object.entries(FAMILIES).map(([k,f])=>`  "${k}": ${line(f.trades)}`).join(',\n'),
 ' },',
 ' "groups": {',
 Object.entries(groups).map(([k,v])=>`  "${k}": ${line(v)}`).join(',\n'),
 ' }',
 '}'];
fs.writeFileSync(file('counts.json'),out.join('\n')+'\n');
console.log(`${sites} sites`);
for(const [k,v] of Object.entries(groups))console.log(k.padEnd(12),v.join(' '),'=',v.reduce((a,b)=>a+b,0));
