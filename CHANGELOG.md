# Changelog

All notable changes to UI Refiner. Dates are in Asia/Tokyo. Versions follow `package.json`; the deep-gate report `version` field and comparison contexts carry the same number.

## Unreleased

### Added
- `ui-refiner directions` shows each mock's measured page surface and type pair, and warns when two directions share a surface or a type pair, or when all of them sit on faint off-white. The refine workflow redoes the overlapping mock before showing the sheet.
- `tinted-page` AI-look signal (reported only): a faint grey or cream page surface instead of white. Calibration: 69–87% of human sites use plain white and about 10% off-white, against 23–39% off-white on AI sites. Scoring it raised holdout human false positives from 3% to 7%, so it is not scored.

### Changed
- Refine guidance: at most one of the three directions may use a tinted paper surface; the others use plain white, a dark ground or a clear brand colour.
- Refine benchmark round 3 (docs/REFINE_BENCHMARK_2026-11-08.md):
  - Off-white surfaces went from 7 of 8 pages to 0.
  - A new set-level judge, which sees all eight sites at once, rated round 3 less templated than round 2 (6–7 vs 8).
  - The per-page judge still prefers round 2 (mean rank 1.4 vs 2.4).
  - A shared hero skeleton remains: a big left headline with a data panel at the right.

## 0.6.0 — 2026-11-08

UI Refiner now fixes pages, not only reviews them. `/ui-refine` shows three first-screen directions side by side (`ui-refiner directions`), waits for the user to pick one, and rebuilds the page around a signature element from its real content. The release also adds two AI-look signals, a wider calibration set and a blind-judged refine benchmark. The deep gate is unchanged apart from the version number, so the first 0.6.0 `check` starts a new comparison context; reviewed schemaVersion 2 baselines remain valid.

### Added
- `ui-refiner directions <folder>`: scans every `.html` design-direction mock in a folder and writes two files:
  - `DIRECTIONS.html`: desktop and mobile screenshots side by side, with each mock's AI-look score, quality issues and Japanese typesetting issues;
  - `DIRECTIONS.md`.

  A `<!-- direction: concept | type: … | palette: … | signature: … -->` comment at the top of a mock fills in its description. The report language follows the pages (ko/ja/en).
- Refine and `/ui-refine` now stop after the three first-screen directions and ask the user to pick one, or a mix. They decide alone only when told to or when no person is in the loop.
- **Refine** workflow in the agent skill and a `/ui-refine` slash command (plugin `commands/`, also installed by `install-agent-skill.mjs`): fix an AI-looking page in place by root cause, preserve facts and links, never swap in another stock look, and rescan until what remains is deliberate (at most three rounds).
- `docs/REFINE_BENCHMARK_2026-11-08.md`: 16 pages made by headless Claude from one-line prompts (median score 43, 14 of 16 at 20 or more), and 8 of them fixed with `/ui-refine` vs a plain "less AI-generated" prompt. Refine: median 66 → 0, contrast failures 27 → 5, 86–100% of numbers kept. Plain: median 9, but all 8 moved to a warm paper background and 5 to paper + serif.
- Two AI-look signals from the "slop gate" lists of late 2026, both moderate:
  - `nested-cards`: rounded boxes inside rounded boxes, in three or more outer cards (nav, header, footer and dialogs excluded).
  - `boxed-icons`: three or more small tinted rounded squares that each hold only an icon (controls and links excluded).
  - Scans saved before this change have no measurement for them and are not re-judged. `aiLook.measures` records `nestedCards`, `nestedHosts` and `iconBoxes`.
- `scripts/calibration-extra.tsv`: 91 AI-built sites from the Replit and Lovable galleries and 68 Korean, global-brand, editorial, public-body and personal sites.

### Changed
- **Refine** now designs instead of only subtracting:
  - it mocks three clearly different first-screen directions, scans them and picks one;
  - it adds a signature element built from the page's real content;
  - it treats a generated page's colors and fonts as changeable;
  - it checks a craft list (scale, faces, hero, rhythm, accent, spacing, details) on the screenshots;
  - it uses the AI-look score only as a guard.

  `/ui-refine` follows the same steps. Blind judge on the same 8 pages (`docs/REFINE_BENCHMARK_2026-11-08.md`, round 2): mean rank 1.5 and 5 of 8 first places, against 2.6 and none for the first refine and 1.9 and 3 for a plain "less AI-generated" prompt. Distinctiveness went from 5.9 to 7.9. The skill also warns against the font pair round 2 converged on (Bricolage Grotesque + Instrument Sans) and lists a white page with thin rules and one blue accent as a common fallback.
- `paper-serif` is moderate (was weak). It fires on 14% of AI-built calibration sites, 2% of human sites and none of the 210 Japanese reference sites; the human share at score ≥ 20 is unchanged, and the extra AI set goes from 73% to 74%. The plain-prompt arm of the refine benchmark showed why it matters: it is the look a "make it less AI" request swaps in.
- The Build workflow also avoids icons in tinted rounded squares, cards inside cards and the stock section order.
- Calibration with the two signals:
  - `boxed-icons` fires on 20% of AI-built sites and 1% of human sites. `nested-cards` fires on 12% and 2%; requiring only two outer cards caught 6% of human sites (toss.im, linear.app, spotify.com, loom.com).
  - Share at score ≥ 20: tuning set AI 70%, human 0% (unchanged); holdout AI 66% → 68%, human 3% (unchanged); extra set AI 71% → 73%, human 15% (unchanged); Japanese reference sites 1%.
  - The extra set's human side scores higher than the earlier sets: large SaaS and consumer brands use the same gradients, stock copy, card grids and glass. The READMEs now say so.
- The English slop fixture has nested cards and boxed icons, and `smoke:scan` expects both signals.

## 0.5.0 — 2026-11-08

Scan scores are now calibrated against real AI-built and human-made sites, and Japanese pages are compared with measurements from 209 Japanese sites. The deep gate is unchanged apart from the version number, so the first 0.5.0 `check` starts a new comparison context; reviewed schemaVersion 2 baselines remain valid.

### Added
- Japanese scan reports end with **日本のサイトとの比較**. For body size, line height, display ratio, font sizes, hue groups, centered and rounded blocks, and contrast failures, the table shows where the page sits among the `data/ja-reference` sites (p10 / median / p90, and the share of sites below the page). The page's own host is left out. `scan.json` records the comparison as `reference`.
- `data/ja-reference/`: design measurements from about 240 Japanese company, prefecture, public-body, media, startup and design-brand sites. It holds measurements only, with distributions overall and per category, and a fixed 70/30 tune/holdout split by host. It is collected with `scripts/collect-reference.mjs`, which skips pages that robots.txt disallows and paces its requests.
- `scripts/rescore.mjs` re-scores saved scans with the current rules, without opening any page.
  - `scanUrl` takes `keepRaw` to keep the raw collector output, and `screenshots: false` to skip screenshots.
  - `calibrate-scan.mjs` now keeps the raw output.
- The Japanese collector records the median paragraph line-height and font size.
- `/ui-review <url> [instructions]` slash command for Claude Code (plugin `commands/`, also installed to `.claude/commands/` by `install-agent-skill.mjs`).
- `scan --compare <previous scan folder|scan.json>`: before/after comparison. The report opens with the score change, resolved/new/remaining signals (with stronger/weaker direction), per-rule baseline quality changes, Japanese typesetting changes and before/after screenshot links (ko/ja/en). The previous result and screenshots are kept as `previous-scan.json` and `before-scan-*.png`, also when rescanning into the same folder. Only the path must match, so production can be compared with a local dev server; a different page or locale is flagged.
- `examples/redesign-landing-ja.html`: a redesign of the Japanese slop fixture following its own report (100 → 0, 13 signals and 7 Japanese issues resolved). `smoke:scan` runs this loop and uses it as a well-made Japanese page that must stay below 10.

### Changed
- `ja-bad-break` reports only a small kana or ー at the start of a main-heading line (h1/h2, ≥ 24px), and any break in a short nav or button label.
  - Breaks in news lists, card titles and katakana splits inside headings are only counted (`inLists`). On the reference sites the earlier rule fired on 95% of pages; it now fires on 12% (tune) and 13% (holdout).
  - A katakana split cannot tell 「ニュース／リリース」 (two words) from 「フ／ァンド」.
- A transparent `body` and `html` now read as a white canvas, not black.
- `tracked-labels` is unchanged. It fires on 3% of the Japanese reference sites. Making it weak when it is the only editorial tell was tried: AI detection at score ≥ 20 dropped from 70% to 63% (tuning) and from 66% to 58% (holdout), and human false positives at 20 did not change.

- Simpler `scan` defaults:
  - The report language follows the page (Japanese → `ja`, Korean → `ko`, else `en`). `UI_REFINER_LANG` sets a fixed default, `--lang` overrides one run, and the browser locale follows the host (`.jp` → `ja-JP`, `.kr` → `ko-KR`). Previously the default was always Korean.
  - Rescanning the same page into the same output folder compares with the previous scan automatically. `--no-compare` opts out; `--compare <folder>` still compares with a scan elsewhere. A different page in the same folder is not compared.
- `scan.json` records `langSource` (`page` or `option`) and `comparison.mode` (`auto` or `explicit`).
- Baseline quality now counts each element once across viewports (`count`); raw findings move to `occurrences`. Comparing with a scan from before this change uses occurrences on both sides. The report column is renamed 要素数 / 요소 수 / Elements.
- The quality table shows up to three examples, one per threshold first, so a 4.5:1 body-text failure is no longer hidden behind a 3:1 button example.

- AI-look scoring recalibrated on 30 ChatGPT Sites vs 26 human sites (`scripts/calibrate-scan.mjs`, `scripts/calibration-sites.tsv`). Median score: AI 12 → 33, human 8 → 0; at score ≥ 20, 70% of AI sites and 0% of human sites are flagged (was 30% / 4%).
  - New signals for the 2025–26 editorial AI template: `tracked-labels` (tiny letter-spaced uppercase labels), `numbered-labels` ("01 / …", "STEP 1 · …"), `period-headlines` (short display headings ending in a period) and `paper-serif` (warm off-white background with serif display type).
  - `transition-all`, `generic-cta` and plain blue `default-accent` fired more on human sites; they stay in the report with weight 0. Tailwind indigo/violet/purple accents still score.
  - Type scale no longer counts as a craft counter-signal (AI sites had it as often as human sites).
  - `aiLook.measures` records the raw editorial measurements for later calibration.
  - Holdout check with unchanged thresholds (`scripts/calibration-holdout.tsv`: 38 Lovable/v0 sites vs 29 design-forward studio, award and editorial sites): median AI 24, human 5; at score ≥ 20, 66% of AI sites and 3% of human sites are flagged (one studio site at 27). `tracked-labels` fires on 14% of these human sites (0% in the tuning set).

### Fixed
- Japanese typesetting missed words broken in short text under 24px. New `ja-bad-break` detects a small kana or ー at a line start and katakana words split across lines in short blocks; long body copy is not checked. What it reports was narrowed later (see Changed): a news-list break such as 「支援フ／ァンド」 is now only counted.

## 0.4.0 — 2026-10-27

Refocused on the original goal: help coding agents build web UIs that do not look AI-generated, and review existing pages to propose better designs. The deep QA gate is unchanged and now documented separately.

### Added
- `ui-refiner scan <url|host|file>`: zero-config design review of any page. Renders at 1440px and 390px, saves full-page screenshots and writes `DESIGN_REVIEW.md` + `scan.json`.
  - **AI-look index** (0–100, heuristic) from 17 rendered signals: purple gradient heroes, large gradients, gradient headlines, glass, colored glows, emoji icons, identical icon-card grids, eyebrow pills, centered text, over-rounding, generic type, flat type scale, framework default accents, many hues, `transition: all`, buzzword copy, repeated generic CTAs. Each signal has evidence, targets, why and a concrete fix.
  - Craft counter-signals (chosen webfont, real imagery, rich type scale) dampen the score without hiding signals.
  - Universal rendered checks (contrast, names/labels, ARIA references, target size, overflow, font loading) and optional suta static audit with `--source`.
- **Japanese support** for `scan`:
  - `--lang ja` report (also `ko`, `en`) and `--locale` for the browser locale (defaults to the report language).
  - Japanese typesetting checks on Japanese pages: missing Japanese typeface in the font stack, tight body line height (<1.45), heading orphans (泣き別れ) per viewport, `word-break: break-all` on headings, italic Japanese, negative tracking, text under 12px, half-width katakana, full-width alphanumerics.
  - Japanese stock-copy phrases (可能性を解き放つ, シームレスな, 次世代の, ビジネスを加速 …) and generic CTAs (詳しく見る, 詳細はこちら, 無料で始める …).
- Fixtures `examples/ai-slop-landing.html` and `examples/ai-slop-landing-ja.html`; `npm run smoke:scan` (real browser, in CI).
- Claude Code plugin and marketplace manifests (`.claude-plugin/`).

### Changed
- Agent skill rewritten around **Build** and **Review** workflows; the gate protocol moved to `skills/ui-refiner-agent/reference/quality-gate.md`.
- `install-agent-skill.mjs` also copies the skill to `.claude/skills` so Claude Code discovers it (Codex keeps `.agents/skills`).
- READMEs rewritten around scan and agent use. The full gate manual moved to `docs/gate/` (EN/KO/JA); the implementation log moved to `docs/history/`.
- Version 0.4.0. Previous full reports stay readable, but engine metadata changed, so the first 0.4.0 `check` starts a new comparison context. Reviewed schemaVersion 2 baselines remain valid.

## 0.3.x — 2026-10-13 to 2026-10-26

Source-integrated web QA gate built on vendored suta (static audit, 57 patterns) and lintapple (rendered checks).

- 2026-10-26 — Contextual preservation inventories, purpose-led review packets and advisory UX repair guidance from the pinned UI UX Pro Max dataset (`guidance`, `rules`, `guide`, `review`, `preserve`).
- 2026-10-22 — Planned inspection-scope accounting, paired normal/defect benchmark, optional same-session visual regression, readable ARIA text diffs, offline HTML/SARIF exports.
- 2026-10-21 — Immutable, content-hashed screenshot evidence across runs; versioned comparison contexts that honor effective route readiness.
- 2026-10-14 — Named routes (1–50) with isolated workers, ARIA snapshot evidence, advisory rendered metrics; disclosed metric limits; incomplete runs cannot create baselines.
- 2026-10-13 — v0.3.0 source-integrated runtime; schemaVersion 2 baselines with stable identities; root-cause grouped handoffs; changed-line checks with SCOPED_PASS (exit 3); portable post-edit hook; blocker-first handoffs and click-target priority; trilingual READMEs.

## 0.2.1 — 2026-10-13

- First published web-only quality gate.
