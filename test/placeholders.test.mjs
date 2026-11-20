import test from 'node:test';
import assert from 'node:assert/strict';
import {findPlaceholders,collectPlaceholders,placeholderArgs} from '../src/placeholders.mjs';

test('placeholders: unfilled phone numbers, postcodes, addresses and names', () => {
 const kinds=t=>findPlaceholders(t).map(x=>x.kind);
 assert.deepEqual(kinds('TEL 031-000-0000 / 06-0000-0000'),['zero-phone','zero-phone']);
 assert.deepEqual(kinds('〒530-0000 大阪府大阪市北区〇〇町1-2-3'),['zero-postcode','circles']);
 assert.deepEqual(kinds('서울시 OO구 OO로 12, ○○빌딩 3층'),['circles','oo-address','oo-address']);
 assert.deepEqual(kinds('Lorem ipsum dolor. Contact [Company Name] at hello@example.com'),['lorem','bracket-name','example-email']);
 assert.deepEqual(kinds('[회사명] 대표 김OO'),['bracket-name']);
});

test('placeholders: real values and house style are left alone', () => {
 for(const t of ['TEL 031-123-4567','〒530-0001 大阪市北区','〇〇な方へ、まずはご相談ください','[회사소식] 2026 하반기 채용','[공지] 휴진 안내','010-0000-1234','2026-0000-0000번 사건','ISO 9001:2015'])
  assert.deepEqual(findPlaceholders(t),[],t);
});

test('placeholders: collected from visible text with a selector (real browser)', async () => {
 const {chromium}=await import('playwright');const b=await chromium.launch();
 try{
  const p=await b.newPage();
  await p.setContent('<main><p>電話 06-0000-0000</p><p style="display:none">TEL 03-0000-0000</p><address>東京都港区○○町1-2</address><script>var x="000-0000-0000"</script></main>');
  const found=await p.evaluate(collectPlaceholders,placeholderArgs());
  assert.deepEqual(found.map(f=>f.match),['06-0000-0000','○○町'],'hidden text and scripts are skipped');
  assert.match(found[0].selector,/main:nth-of-type\(1\) > p:nth-of-type\(1\)/);
 }finally{await b.close();}
});
