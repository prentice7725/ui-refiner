// The GitHub Pages site: the theme gallery (themes/index.html) and every theme sample, served as they are in the repo.
// node scripts/build-pages.mjs [out]   → writes the site to out (default _site)
// Each sample gets a small fixed note saying the business is invented, with a link back to the gallery,
// so a sample reached from a search engine is never taken for a real company's site.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const src = path.join(root, 'skills/ui-refiner-agent/reference/themes');
const out = path.resolve(root, process.argv[2] || '_site');

const NOTE = {
  ko: ['가상 업체로 만든 테마 견본입니다', '테마 목록'],
  ja: ['架空の事業者で作ったテーマの見本です', 'テーマ一覧'],
};
const note = lang => {
  const [text, back] = NOTE[lang] || NOTE.ko;
  return `<aside lang="${lang}" style="all:initial;position:fixed;z-index:2147483647;left:12px;bottom:12px;max-width:calc(100% - 24px);padding:6px 12px;border-radius:6px;background:rgba(24,36,31,.92);color:#fff;font:13px/1.5 system-ui,sans-serif">${text} · <a href="../index.html" style="color:inherit;text-decoration:underline">${back}</a></aside>`;
};

await fs.rm(out, { recursive: true, force: true });
await fs.cp(src, out, { recursive: true, filter: file => !file.endsWith('.mjs') });
let samples = 0;
for (const entry of await fs.readdir(out, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(out, entry.name, 'sample.html');
  let html;
  try { html = await fs.readFile(file, 'utf8'); } catch { continue; }
  const lang = /<html[^>]*\blang="(ko|ja)/i.exec(html)?.[1] || 'ko';
  if (!/<\/body>/i.test(html)) throw Error('No </body> in ' + file);
  await fs.writeFile(file, html.replace(/<\/body>/i, note(lang) + '\n</body>'));
  samples++;
}
await fs.access(path.join(out, 'index.html'));
await fs.writeFile(path.join(out, '.nojekyll'), '');
console.log(`Pages site: ${samples} samples and the gallery in ${path.relative(root, out) || out}`);
