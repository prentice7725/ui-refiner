import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createReviewPacket,validateDesignReview} from '../src/design-review.mjs';
import {digest} from '../src/project-context.mjs';
test('review packet separates inputs; review validates report/hash/dimensions without promoting judgments',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ui-review-packet-'));try{
 const bytes=Buffer.from('fixture evidence'),file=path.join(root,'report.json');await fs.writeFile(path.join(root,'image.png'),bytes);
 const report={fingerprintVersion:2,automatedStatus:'FAIL',status:'FAIL',scope:{mode:'full',routes:[{name:'home',url:'http://localhost/'}]},findings:[{engine:'lintapple',rule:'text-contrast',message:'x'}],stages:[],imageArtifacts:[{file:'image.png',sha256:digest(bytes),route:'home',state:'initial'}]};const raw=JSON.stringify(report);await fs.writeFile(file,raw);const bundle=path.join(root,'bundle');const packet=await createReviewPacket(file,bundle);assert.equal(packet.reviewerExecuted,false);assert.ok(!('findings' in JSON.parse(await fs.readFile(path.join(bundle,'design-input.json')))));assert.equal((await fs.readFile(path.join(bundle,'report.json'),'utf8')),raw);
 const review={schemaVersion:1,sourceReportSha256:digest(raw),reviewer:{kind:'human',name:'Declared fixture reviewer',executedAt:'2026-10-25T00:00:00Z'},assessmentOrder:'combined',observations:[{domain:'density',route:'home',state:'initial',basis:'captured-evidence',evidence:['image.png'],observation:'Review density',reason:'Task context',suggestion:'Check row clarity',confidence:'medium',blocking:true}]};const submission=path.join(root,'review.json');const validate=async()=>{await fs.writeFile(submission,JSON.stringify(review));return validateDesignReview(submission,file);};const result=await validate();assert.equal(result.automatedStatus,'FAIL');assert.equal(result.observations[0].blocking,false);
 review.observations[0].state='invented';await assert.rejects(validate(),/route\/state/);review.observations[0].state='initial';await fs.writeFile(path.join(root,'image.png'),'corrupt');await assert.rejects(validate(),/hash/);review.observations[0].basis='manual';review.observations[0].evidence=[];assert.equal((await validate()).status,'accepted-advisory');review.sourceReportSha256='x';await assert.rejects(validate(),/canonical/);
 }finally{await fs.rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:250});}
});
