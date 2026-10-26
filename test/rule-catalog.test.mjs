import test from 'node:test';
import assert from 'node:assert/strict';
import {ruleCatalog,workflowGuide} from '../src/rule-catalog.mjs';
import {ruleIds} from '../vendor/lintapple/src/index.js';
test('catalog preserves pinned engine IDs, explains prerequisites and separates manual/advisory checks',async()=>{
 const {rules}=await ruleCatalog();assert.equal(new Set(rules.map(r=>r.engine+'/'+r.id)).size,rules.length);for(const id of ruleIds)assert.ok(rules.some(r=>r.engine==='lintapple'&&r.id===id));for(const id of ['transition-all','no-reduced-motion','layout-animation'])assert.ok(rules.some(r=>r.engine==='suta'&&r.id===id));assert.ok(rules.filter(r=>r.engine==='review').every(r=>r.advisory&&r.phases.includes('manual')));assert.match(rules.find(r=>r.id==='focus-visible').requires.join(' '),/interaction plan/);assert.ok(workflowGuide('harden').required.some(s=>s.includes('two')));assert.throws(()=>workflowGuide('unknown'));
});
