import test from 'node:test';
import assert from 'node:assert/strict';
import {blocksZoom,collectInterfaceIssues,interfaceArgs} from '../src/interface-checks.mjs';

test('interface: viewport metas that block zoom', () => {
 for(const c of ['width=device-width, user-scalable=no','width=device-width,initial-scale=1,maximum-scale=1','user-scalable=0','maximum-scale=1.0, user-scalable=yes'])assert.ok(blocksZoom(c),c);
 for(const c of ['width=device-width, initial-scale=1','width=device-width, maximum-scale=5','initial-scale=1, user-scalable=yes','',null])assert.ok(!blocksZoom(c),String(c));
});

test('interface: zoom, small fields on phones and blocked paste (real browser)', async () => {
 const {chromium}=await import('playwright');const b=await chromium.launch();
 const html=`<meta name="viewport" content="width=device-width, maximum-scale=1"><form><input name="a" style="font-size:14px"><input name="b" style="font-size:16px"><input type="checkbox" style="font-size:12px"><textarea style="font-size:13px"></textarea><input name="c" style="font-size:18px" onpaste="return false"><input type="hidden" name="h"></form>`;
 try{
  const p=await b.newPage();await p.setContent(html);
  const mobile=await p.evaluate(collectInterfaceIssues,interfaceArgs(true));
  assert.deepEqual(mobile.map(x=>x.rule+':'+(x.actual||'')),['zoom-disabled:width=device-width, maximum-scale=1','input-zoom:14px','input-zoom:13px','paste-blocked:return false'],'checkboxes and hidden fields are not text fields');
  const desktop=await p.evaluate(collectInterfaceIssues,interfaceArgs(false));
  assert.deepEqual(desktop.map(x=>x.rule),['zoom-disabled','paste-blocked'],'field size matters on phones only');
  await p.setContent('<meta name="viewport" content="width=device-width, initial-scale=1"><input style="font-size:16px">');
  assert.deepEqual(await p.evaluate(collectInterfaceIssues,interfaceArgs(true)),[]);
 }finally{await b.close();}
});
