# Changelog

All notable changes to UI Refiner. Dates are in Asia/Tokyo. Versions follow `package.json`; the deep-gate report `version` field and comparison contexts carry the same number.

## Unreleased

### Added
- `ui-refiner system extract <main page>` measures the picked main page (type, sizes, colours, main button, box radius, rules, content width) and writes `ui-refiner-system.json` and `DESIGN_SYSTEM.md`. `ui-refiner system check <page…>` lists where other pages of the site leave that design and exits 1 on drift. The refine skill now runs the directions step once, for the main page, and builds the site's other pages from the system: variety belongs between the three directions and between clients, not between pages of one site. In an inner-page benchmark (8 sites, main page code not available, `docs/SITE_BENCHMARK_2026-11-13.md`), 16 of 16 inner pages built from the system kept the design against 0 of 16 built from a screenshot, and three judges picked them in 18 of 23 verdicts. The system also records whether the main page is photo-led, and `system check` flags an inner page of a photo-led site that has no photos.

### Changed
- `directions deal` gives the odd direction a pure white page carried by a photo or product screen (new surface `image`) on about half of the deals; paper drops to about one page in thirty. In benchmark round 16 paper was the usual odd surface, agents chose it on 3 of 7 pages, and all three set judges named the cream body as the set's shared habit. On the 548 measured human sites, 87% of the light first screens are pure white and 2% a warm cream.
- The scan measures strips of three or more big figures side by side (`statStrips`); the directions sheet and `directions verify` flag them as `stat-strip` (verify does not fail on it). Found on all 8 original AI pages, 3–4 of 8 refined pages in rounds 15 and 16, and 5 of 60 human sites.
- `directions deal` gives a brand ground to about one page in twenty and a dark ground to about one in twelve; the odd direction is mostly a paper ground. Measured on 548 Korean, Japanese and English sites, only about 2% of first screens use a full-colour ground and 5% a dark one. Before, one direction in three got a brand, dark or paper ground with equal odds.
- `directions deal` weights the colour family by what human sites of the same kind use, measured on 548 Korean, Japanese and English sites (`data/colour-reference`); Korean and Japanese pages use their own country's figures where 15 or more sites of the kind were measured. Rare families still come up, and families picked recently for other projects still wait their turn. The survey also found that only about 2% of human first screens use a full-colour ground, and a quarter have no clear accent hue.
- `directions deal` picks the colour family among those that fit the tone (calm: blue, teal, green, ink; warm: orange, amber, red, brown, green, teal; technical: blue, teal, green, orange, amber, ink), and a brand ground only in a hue that carries a full-colour ground. In benchmark round 15 any family could be dealt; the set became the most varied refine set for Claude and Gemini, but a brown budgeting app, a full red food-bank hero and a magenta hiring page cost more than a rank per page.
- `directions deal` deals a colour family again, one per direction: the hue of a brand ground, or of the accent on a white or paper page. It skips families picked recently for other projects, counting a clear colour ground as well as the button colour, and `directions` warns when a mock leaves its family or repeats another project's. In benchmark round 14 the tone left colour free, three of eight pages took the same forest-green ground behind yellow or blue buttons, and all three set judges named the green as the shared habit.
- `directions deal` deals a hero structure and a surface only, and lists faces to avoid (the overused ones and those picked recently for other projects). Type and accent are left to the agent, with one strong display face per direction. In benchmark round 11, three judges (Claude, Gemini, Grok) put the plain prompt or round 2, each pushing one strong look of its own, first in 21 of 24 page rankings. They called the dealt pairings "plain".
- Refine guidance:
  - headlines come from a fact only this client has, not a category slogan;
  - the first screen gets one main piece instead of a stacked photo, schedule and cards;
  - stand-in photos show the place or the work itself, never generic office objects.
- `directions deal` gives software pages no dark ground, and the dark surface brief asks for a photo or type, not a dashboard. The skill and `/ui-refine` warn against the dark dashboard template (navy or black ground, metric cards, neon accent), which all three judges ranked 4th or 5th on both Korean software pages in round 12.
- Refine starts by choosing how much to change: a full refine with three directions at a scan score of 20 or more, a polish that keeps the structure and brand at 8–19 (or with a real brand), and a report only below that.
- `directions deal --tone calm|warm|technical|bold`: the tone is shared by all three directions. Calm and warm pages get no dark ground, and display faces that fight the tone (condensed, ultra-heavy, mono) join the faces to avoid. DEAL.json is schema 4.
- Each mock starts with a five-line direction (direction, tone, world, moment, signature); the sheet warns when one is missing and ends with a rename test.
- `directions verify` and the finish gate fail a product screen with more than 40 pieces of text on the first screen (`busy-shot`): show one scene that proves the claim, not the whole app. The collector reports it as `firstScreen.shotText`.

## 0.7.0 — 2026-11-11

### Added
- First-screen check: the scan collector records whether the first screen has a one-line claim (outside the navigation), a main action, and how much of it a photo or image covers. `directions` and `directions verify` warn when nothing says what the page is and no large image carries it, or when the headline's button sits below the fold. `verify` exits 1 and the finish gate blocks on it. In benchmark round 7 the two pages that opened with a large board and no claim were judged worst of their sets. Of 33 small human sites, only 1 had neither a claim nor a large photo on the first screen.
- Claim size check: on a first screen without photos, `directions` and `directions verify` also fail when other text (weekday labels, figures, table headings) is far larger than the claim (under 0.6 of the largest text). On 125 human-made sites the claim was the largest text in 76 of 82 first screens that had one; the one page under 0.6 was image-led. Round 8's ko-logistics page (a 30px claim under 70px figures) is the case it catches. The skill does not prescribe a headline size: in round 9, asking for a 44–64px claim on every page made a large headline on white over a data widget the new shared look (set sameness 5–6 against 3–4 in round 8).
- Image check: `directions` and `directions verify` fail a first screen with neither a photo (under 10% of the screen) nor a product screen built in code and marked `data-product-shot` (25% of the screen or more). They also fail a product screen with more than three labels under 12px. The finish gate blocks on both. Of 138 human-made first screens, 66% had an image over 30% of the screen and 21% had under 10%. In rounds 9 and 10, six of eight refined pages had no image, and next to the originals (whose phone mockups were removed) they read as wireframes.
- White-run note: when the last 4 picks for other projects were all plain white, the directions sheet notes it and points at the dealt non-white direction. It is a note at pick time, not a warning that asks for a redo. In round 9 all 8 pages picked white although each deal offered a dark, brand or paper surface.
- `ui-refiner directions deal <folder> --kind <kind> --lang <lang>` assigns each of the three mocks four things:
  - a hero structure, weighted by how often human-made sites of that page kind use it;
  - a Google Fonts pairing, three different voices from `data/type-pairs.json`;
  - an accent hue family;
  - a surface (one non-white at most).

  It avoids what was chosen recently for other projects and deals overused faces (Bricolage Grotesque, Fraunces, IBM Plex Mono) last. `--no-photo` skips structures that need a real photo.
- `ui-refiner photos "<subject>"` saves openly licensed stand-in photographs from Wikimedia Commons (CC0, public domain, CC BY, CC BY-SA; no stock sites) with `credits.json` and a footer credit line in the page language. Pages mark each one `data-stand-in`, and the refine workflow tells the user what to replace. Human-made sites open with a full-bleed photo a third of the time; pages without imagery read as generated. `directions` and `directions verify` count stand-ins.
- `ui-refiner keep record <page>` lists what a refine must not lose: link targets, phone and mail links, forms and their fields, and figures (prices, counts, ratings, times), including animated counters at their target value. `keep check <page>` compares the refined page with it and exits 1 on any loss. New figures are listed for the person to confirm. In benchmark round 5 an unchecked refine changed 409,847 to 420,000 and a rating from 4.7 to 4.8.
- Refine finish gate: a Stop hook (`hooks/hooks.json` for the plugin, added to project settings by `install-agent-skill`) that keeps the agent working while a refine in the project lacks a passing `keep check` or, once a direction is recorded, a passing `directions verify`. It blocks at most three times, never while the agent is waiting for the person to pick a direction, ignores state older than 12 hours, and is turned off with `UI_REFINER_GATE=off`.
- `ui-refiner directions record <folder> --pick B` keeps the chosen direction in a per-user log (`~/.ui-refiner/refine-log.json`, or `UI_REFINER_HOME`). The log is per user so different clients do not get the same page. Pages of one project may share a direction.
- `ui-refiner directions verify <folder> <page>` reports when the applied page drifted from the chosen mock's hero structure, surface or type (exit 1). In the benchmark a page whose chosen mock opened with content ended as "left headline, stacked".
- The directions sheet also warns when a mock ignores its deal (structure, type, accent) or repeats a hero, type pair, surface or accent hue picked for another project. It also shows each mock's accent and how common its hero structure is on human-made sites.
- `data/hero-reference/human.json`: first-screen structure of 406 human-made sites, overall and per page kind. Only 4% use the AI favourite of a left headline with a side panel. 33% open with a full-bleed photo and 29% with content and no visible headline.
- `scripts/calibration-small.tsv`: 102 small and mid-size organisations (clinics, food banks, bakeries, cafes, small SaaS, fintech, logistics, hiring pages, inns, studios, local public bodies) in Korean, Japanese and English. 16% of them reach 20 on the AI-look index, mostly developer-tool SaaS pages such as Raycast, Resend and cal.com, the look AI pages copy.
- `ui-refiner directions` shows each mock's measured page surface and type pair, and warns when two directions share a surface or a type pair, or when all of them sit on faint off-white. The refine workflow redoes the overlapping mock before showing the sheet.
- Scan collector records the first-screen skeleton (`hero`: headline alignment, a panel or image beside it, a full-bleed photo, a strip of figures). `directions` shows it per direction and warns when two directions share one.
- `tinted-page` AI-look signal (reported only): a faint grey or cream page surface instead of white. Calibration: 69–87% of human sites use plain white and about 10% off-white, against 23–39% off-white on AI sites. Scoring it raised holdout human false positives from 3% to 7%, so it is not scored.
- Four more AI-look signals, reported only:
  - `accent-word`: one word of a heading in a different solid colour;
  - `newsletter-tail`: a lone e-mail sign-up near the bottom of the page;
  - `empty-frames`: two or more filled or bordered boxes with nothing in them;
  - `hero-cta-below`: the headline is on the first screen but its first button is not.

  Calibration on 30–77 AI and 26–209 human sites per set: AI pages have a coloured heading word 30–34% of the time against 3–19% for human pages (16% on small SaaS-heavy sites). Scoring it as a weak signal added 3 points of AI detection but also 1–2 human false positives per set, so none of the four is scored. Empty frames hit human pages as often as AI pages (23% against 10% on the tuning set).

### Changed
- `below-fold` ("content first") is now an image-led structure: real photos, products or listings with pictures, never a text or data board. It shares a family with the full-bleed photo, so a deal holds at most one of them, and `--no-photo` no longer deals it. Human first screens without a headline were image-led in 30 of 43 cases; Claude's content-first pages were text boards and ranked worst of the refine structures in rounds 5–8 (mean rank 4.0 of 5).
- Refine guidance: the three directions use three different hero structures (at most one "left headline, panel beside it"), and at most one may use a tinted paper surface; the others use plain white, a dark ground or a clear brand colour.
- Refine benchmark rounds 3 and 4 (docs/REFINE_BENCHMARK_2026-11-08.md):
  - Round 3: off-white surfaces went from 7 of 8 pages to 0.
  - Round 4: side-panel heroes went from 4–5 of 8 pages to 0.
  - A new set-level judge sees all eight sites at once. It ranked round 4 the least templated set in both runs (sameness 5–6, against 8 for round 2).
  - The per-page judge still prefers round 2 (mean rank 1.9 against 2.9).
- Refine benchmark rounds 5 and 7, with sheets of real human-made sites as a control for the set judge (human sets score sameness 2):
  - Round 5 (dealt directions, shared log): mocks followed their deals but five of eight applied pages fell back to "left headline, stacked", and one changed figures.
  - Round 7 (plus verify, keep and the finish gate): no drift, no changed figures, six different hero structures across eight pages, AI-look index 0 everywhere. The set judge rated it sameness 3–4 and ranked it second of eight in both runs, behind one human set and ahead of the other.
  - The per-page judge ranked round 7 below the other refine arms (mean rank 3.6 against 1.8 for round 2). Better single pages without losing the variety is the open problem.

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
