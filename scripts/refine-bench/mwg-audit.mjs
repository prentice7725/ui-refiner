#!/usr/bin/env node
// 사용법: node mwg-audit.mjs <조건 이름…>   (예: before refine-j.1 refine-w.1)
// refine-w(Modern Web Guidance를 더한 refine)와 대조군의 구현 품질을 잰다. 페이지마다 다음을 낸다.
//   axe     axe-core 위반 규칙 수와 위반 요소 수 (critical·serious만 따로)
//   lh      Lighthouse(데스크톱) 접근성·권장사항·성능 점수. 성능은 로컬 서버에서 3번 재고 중앙값을 쓴다
//   legacy  MWG legacy-scan이 찾은 옛 패턴 수 (말뭉치의 약 20%만 규칙이 있다)
//   aiLook  ui-refiner scan의 AI 티 점수 (구현을 고치다 디자인이 흔들렸는지 본다)
// 환경변수: BENCH_DIR, PAGES (기본: pages 폴더 전부), LH_VERSION (기본 13.5.0)
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = resolve(HERE, '../..');
const B = resolve(process.env.BENCH_DIR || 'refine-bench-out');
const arms = process.argv.slice(2);
if (!arms.length) { console.error('사용법: node mwg-audit.mjs <조건 이름…>'); process.exit(2); }
const pages = (process.env.PAGES || readdirSync(join(B, 'pages')).join(' ')).split(/\s+/).filter(Boolean);
const LH = `lighthouse@${process.env.LH_VERSION || '13.5.0'}`;
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const out = join(B, 'mwg-audit'); mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.json': 'application/json' };

function serve(dir) {
  return new Promise(ok => {
    const s = createServer((req, res) => {
      let p = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
      if (!p.startsWith(dir) || !existsSync(p)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': types[extname(p).toLowerCase()] || 'application/octet-stream' });
      res.end(readFileSync(p));
    }).listen(0, '127.0.0.1', () => ok(s));
  });
}
// 페이지 서버가 이 프로세스에 있으므로 외부 명령은 비동기로 돌린다 (동기 호출은 서버를 멈춰 Lighthouse와 서로 기다린다)
const sh = (cmd, args) => new Promise((ok, no) => execFile(cmd, args, { encoding: 'utf8', maxBuffer: 64 << 20, shell: process.platform === 'win32' }, (e, so) => e ? no(e) : ok(so)));
const median = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

async function axe(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const r = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })));
  await page.close();
  const bad = r.filter(v => v.impact === 'critical' || v.impact === 'serious');
  return { rules: r.length, nodes: r.reduce((n, v) => n + v.nodes, 0), seriousRules: bad.length, seriousNodes: bad.reduce((n, v) => n + v.nodes, 0), ids: r.map(v => `${v.id}:${v.impact}:${v.nodes}`) };
}

async function lighthouse(url, tag) {
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const f = join(out, `${tag}.lh${i}.json`);
    await sh(npx, ['-y', LH, url, '--preset=desktop', '--quiet', '--output=json', `--output-path=${f}`, '--only-categories=performance,accessibility,best-practices', '--chrome-flags="--headless=new"']);
    const c = JSON.parse(readFileSync(f, 'utf8')).categories;
    runs.push({ perf: Math.round(c.performance.score * 100), a11y: Math.round(c.accessibility.score * 100), bp: Math.round(c['best-practices'].score * 100) });
  }
  return { perf: median(runs.map(r => r.perf)), a11y: median(runs.map(r => r.a11y)), bp: median(runs.map(r => r.bp)), perfRuns: runs.map(r => r.perf) };
}

async function legacy(file) {
  try { return JSON.parse(await sh(npx, ['-y', 'modern-web-guidance@latest', 'legacy-scan', file, '--json'])).totalFindings; } catch { return null; }
}

async function aiLook(file, tag) {
  try { return JSON.parse(await sh('node', [join(ROOT, 'bin/ui-refiner.mjs'), 'scan', file, '--out', join(out, `${tag}.scan`), '--no-compare', '--json'])).aiLook.score; } catch { return null; }
}

function usage(arm, id) { // 에이전트가 MWG를 썼는지: 최종 답의 "### Modern Web Guidance" 절과 비용
  const f = join(B, 'logs', `${arm}-${id}.json`);
  if (!existsSync(f)) return {};
  try { const j = JSON.parse(readFileSync(f, 'utf8')); const t = String(j.result || ''); return { cost: j.total_cost_usd, mwgSection: /###\s*Modern Web Guidance/i.test(t), mwgIds: (t.split(/###\s*Modern Web Guidance/i)[1] || '').match(/\*\*`[^`]+`\*\*/g)?.length || 0 }; } catch { return {}; }
}

process.env.CHROME_PATH ||= chromium.executablePath();
const browser = await chromium.launch();
const rows = [];
for (const id of pages) for (const arm of arms) {
  const dir = join(B, 'pages', id, arm), file = join(dir, 'index.html');
  if (!existsSync(file)) { console.error(`없음: ${id}/${arm}`); continue; }
  const s = await serve(dir), url = `http://127.0.0.1:${s.address().port}/index.html`, tag = `${id}.${arm}`;
  const row = { page: id, arm, axe: await axe(browser, url), lh: await lighthouse(url, tag), legacy: await legacy(file), aiLook: await aiLook(file, tag), ...usage(arm, id) };
  s.close(); rows.push(row);
  console.log(`${id} ${arm}: axe ${row.axe.seriousNodes}/${row.axe.nodes} · lh a11y ${row.lh.a11y} bp ${row.lh.bp} perf ${row.lh.perf} · legacy ${row.legacy} · ai ${row.aiLook}${row.cost != null ? ` · $${row.cost.toFixed(2)}${row.mwgSection ? ` · MWG 가이드 ${row.mwgIds}` : ''}` : ''}`);
}
await browser.close();
const mean = (arm, f) => { const v = rows.filter(r => r.arm === arm).map(f).filter(x => x != null); return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : null; };
const summary = Object.fromEntries(arms.map(a => [a, { axeSeriousNodes: mean(a, r => r.axe.seriousNodes), axeNodes: mean(a, r => r.axe.nodes), lhA11y: mean(a, r => r.lh.a11y), lhBestPractices: mean(a, r => r.lh.bp), lhPerf: mean(a, r => r.lh.perf), legacy: mean(a, r => r.legacy), aiLook: mean(a, r => r.aiLook) }]));
writeFileSync(join(out, 'results.json'), JSON.stringify({ lighthouse: LH, rows, summary }, null, 1) + '\n');
console.table(summary);
