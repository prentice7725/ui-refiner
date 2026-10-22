import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectionScope} from '../src/inspection-scope.mjs';
import {browserCoverage} from '../src/normalize.mjs';
import {evaluateBenchmark} from '../src/benchmark.mjs';
const viewport={width:390,height:844},policy={viewports:[viewport],colorSchemes:['light','dark']};
test('planned denominator excludes generated snapshots and unconfigured pages; missing worker progress stays unknown',()=>{
 const routes=[{name:'good'},{name:'timeout'},{name:'pending'}],plans=[{states:[{name:'saved'}]}];
 const runs=[{route:'good',viewport,colorScheme:'light',status:'error',states:[{name:'initial'},{name:'buttons[0]: pressed'}],plannedStates:[{name:'initial',started:true,status:'completed'},{name:'saved',started:null,status:'unknown'}]}];
 const scope=inspectionScope(routes,policy,plans,runs,[{route:'timeout',started:true}]);
 assert.deepEqual(scope.counts,{requested:8,started:1,completed:1,failed:0,'not-run':4,unknown:3});
 assert.equal(scope.intermediateStates.length,1);assert.equal(scope.completionRate,1/8);
});
test('failed initial audit is distinct from named states never reached and completed evidence survives',()=>{
 const run={route:'a',viewport,colorScheme:'light',status:'error',states:[],plannedStates:[{name:'initial',started:true,status:'failed'},{name:'saved',started:false,status:'not-run'}]};
 const scope=inspectionScope([{name:'a'}],{...policy,colorSchemes:['light']},[{states:[{name:'saved'}]}],[run]);
 assert.equal(scope.counts.failed,1);assert.equal(scope.counts['not-run'],1);assert.equal(scope.counts.started,1);
});
test('null, zero and invalid rule target counts cannot become tested',()=>{
 const rows=browserCoverage({runs:[{states:[{ruleCoverage:{'layout-gap':null,'control-gap':0,'layout-alignment':-1,'control-inset':2}}]}]});
 assert.equal(rows.find(r=>r.rule==='layout-gap').status,'unknown');assert.equal(rows.find(r=>r.rule==='control-gap').status,'not-tested');assert.equal(rows.find(r=>r.rule==='layout-alignment').status,'unknown');assert.equal(rows.find(r=>r.rule==='control-inset').status,'tested');
});
test('benchmark counts labeled instances once, excludes boundary probes and uses null for empty denominators',()=>{
 const labels=[{route:'bad',rule:'font-family',expected:true,kind:'defect-contract'},{route:'good',rule:'font-family',expected:false,kind:'defect-contract'},{route:'shadow',rule:'font-family',expected:false,kind:'boundary-probe'}];
 const finding={route:'bad',rule:'font-family'};
 const result=evaluateBenchmark(labels,[finding,finding]);assert.equal(result.status,'PASS');assert.equal(result.metrics.tp,1);assert.equal(result.metrics.precision,1);assert.equal(result.metrics.recall,1);
 const missed=evaluateBenchmark(labels,[{route:'good',rule:'font-family'}]);assert.equal(missed.status,'FAIL');assert.equal(missed.metrics.fp,1);assert.equal(missed.metrics.fn,1);
 assert.equal(evaluateBenchmark([],[]).metrics.precision,null);assert.equal(evaluateBenchmark([],[]).metrics.recall,null);
});

test('unreadable plans do not publish a misleading completion rate',()=>{
 const scope=inspectionScope([{name:'bad'}],policy,[{loadError:'invalid JSON'}]);
 assert.equal(scope.planComplete,false);assert.equal(scope.completionRate,null);assert.equal(scope.planningErrors[0].route,'bad');
});
