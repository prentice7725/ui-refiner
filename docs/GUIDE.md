# UI Refiner guide

[README](../README.md) | English | [한국어](GUIDE_KO.md) | [日本語](GUIDE_JA.md)

The full reference behind the README.

## Quick start

Requirements: Node.js 22.18+, npm, and Git.

```sh
git clone https://github.com/prentice7725/ui-refiner && cd ui-refiner
npm ci && npx playwright install chromium
npm link                                   # optional: makes `ui-refiner` available everywhere

ui-refiner scan your-site.example          # review a live page
ui-refiner scan localhost:5173             # your dev server; run it again after edits to see what changed
ui-refiner keep record index.html                                  # record links, forms, and figures before refining
ui-refiner directions deal refine-directions --kind service --tone calm --lang en   # assign hero structures, lane elements (surface, color family, or material), and faces to avoid across the three lanes
ui-refiner directions refine-directions     # compare three design-direction mocks (.html) side by side and pick one
ui-refiner directions record refine-directions --pick B                # record the choice so other clients get something else
ui-refiner theme starter care-white --brand "#0b5cab"           # copy a measured theme with brand.css; list needed photos and contrast breaks
ui-refiner photos "dentist chair" --out assets/stand-in             # fetch credited stand-in photos (Wikimedia Commons) until real photos arrive
ui-refiner directions verify refine-directions index.html             # verify the applied page kept the chosen structure
ui-refiner system extract index.html                                  # save the chosen design for the site's other pages
ui-refiner system check about.html pricing.html                       # check that other pages keep that design
ui-refiner keep check index.html                                   # exit 1 if the refined page lost any recorded items
ui-refiner stress index.html                                       # test worst-case labels, emails, phone numbers, and figures at 320/390/1440px; exit 1 if anything breaks
ui-refiner prefer add surface paper --said "no more cream grounds"   # record something this person does not want; later deals leave it out
```

That is the entire loop. `scan` accepts any URL, bare host name, or local `.html` file; it needs no config and changes nothing in the target project. Without `npm link`, run `node bin/ui-refiner.mjs scan …` instead.

To start a Korean or Japanese site from a measured design instead, pick one of the 14 themes in [skills/ui-refiner-agent/reference/themes](../skills/ui-refiner-agent/reference/themes/README.md) and ask the agent to build from it. Each theme provides its measured basis, tokens, section skeleton, CSS, and a sample page.

- **Report language** follows the page: Japanese pages receive a Japanese report, Korean pages receive Korean, and everything else receives English. Set a fixed default with `UI_REFINER_LANG=ko` (or `ja`, `en`), or pass `--lang` for a single run. The browser locale follows the host (`.jp` → `ja-JP`, `.kr` → `ko-KR`) unless `--locale` is given.
- **Rescans compare automatically.** When the output folder already holds a scan of the same page, the new report opens with a before/after comparison. Use `--no-compare` to skip it, or `--compare <folder>` to compare against a scan elsewhere.
- `--source src` adds the static source audit. `--out` changes the output folder (default `ui-refiner-scan/`).

In Claude Code, `/ui-review <url>` runs the scan, inspects the screenshots, and writes the review for you (see [Using it with agents](#using-it-with-agents)).

## What `scan` produces

Outputs are written to `ui-refiner-scan/` (override with `--out`):

| File | Contents |
|---|---|
| `DESIGN_REVIEW.md` | AI-look index, signals with evidence/why/fix, baseline quality table, Japanese typography (on Japanese pages), source audit (`--source`), what the page avoided, and next steps for the agent |
| `scan.json` | The same data in machine-readable JSON |
| `scan-desktop.png`, `scan-mobile.png` | Full-page screenshots at 1440px and 390px after scrolling through lazy content |
| `before-scan-*.png`, `previous-scan.json` | On a rescan: the previous screenshots and result, kept for side-by-side comparison |

### Before/after comparison

Rescanning the same page into the same folder compares automatically. To keep separate folders, point `--compare` at the earlier folder:

```sh
ui-refiner scan localhost:5173                                   # first scan
# … edit the page …
ui-refiner scan localhost:5173                                   # compared against the first scan automatically
ui-refiner scan localhost:5173 --out scan-after --compare scan-before
```

The report opens with a comparison section showing the AI-look score change (`before → after`), resolved, new, and remaining signals (with stronger/weaker direction), per-rule baseline quality changes, Japanese typesetting changes, and before/after screenshot links. Comparing production with a local dev server works as long as the path matches; a different page or browser locale triggers a warning. `examples/ai-slop-landing-ja.html` → `examples/redesign-landing-ja.html` is a worked example: `100 → 0`, with 13 signals and 7 Japanese issues resolved.

### AI-look index (0–100)

The index is a heuristic built from rendered signals. Strong signals weigh 3, moderate 2, and weak 1. A chosen webfont and real imagery each lower the score by 15% (the signals stay listed). Signals marked *reported only* appeared on human sites at least as often as on AI-built ones, so they appear in the report without adding to the score. The index never blocks anything.

| Signal | What it measures |
|---|---|
| Purple/indigo gradient hero | Large gradient behind text whose color stops are mostly purple, indigo, or pink |
| Large gradients | Gradients covering big text surfaces |
| Gradient text | `background-clip: text` gradients, weighted strongest on headings |
| Glass | Repeated `backdrop-filter: blur` boxes (a pinned nav is allowed) |
| Glow | Colored, blurred box shadows |
| Emoji icons | Standalone or leading emoji used as icons (emoji inside user content is ignored) |
| Icon-card grid | 3–4 identical rounded cards in a row, each with a heading and blurb |
| Eyebrow pill | Pill badge directly above the headline |
| Centered text | Most text blocks centered |
| Over-rounding | Nearly every box has a border radius of 16px or more |
| Cards inside cards | Rounded boxes nested in rounded boxes across three or more outer cards |
| Icons in rounded squares | Three or more small tinted rounded squares that each hold only an icon |
| Generic type | One stock typeface (Inter, Roboto, system…) used for everything |
| Flat type scale | Largest heading under 2× the body size (skipped on Japanese pages; reported only: found on 19% of English human sites and 8% of AI ones) |
| Default accent | Untouched Tailwind indigo, violet, or purple (plain blue and Bootstrap blue are reported only) |
| Many hues | Five or more chromatic hue families in UI colors |
| Tracked labels | Tiny, letter-spaced uppercase labels repeated across sections |
| Numbered labels | `"01 / …"`, `"STEP 1 · …"` section labels |
| Period headlines | Short display headings ending in a period (`"Stay by the sea."`) |
| Paper and serif | Warm off-white background with serif display type, the 2025–26 editorial template |
| `transition: all` | Computed on interactive elements (reported only) |
| Faint off-white page | Light gray or cream page surface instead of white: about 10% of human sites, 25–40% of AI sites (reported only; `directions` uses it) |
| Buzzword copy | Stock phrases in EN/KO/JA (`"unlock your potential"`, `잠재력`, `可能性を解き放つ`, `次世代の` …); two or more required (reported only: found on 14% of English human sites and 13% of AI ones) |
| Repeated generic CTA | `"Learn more"`, `자세히 보기`, `詳しく見る` … repeated (reported only) |

Decorative illustrations, `aria-hidden` art, SVG internals, and pinned navigation are excluded so crafted brand work is not flagged.

### Baseline quality

Universal checks from the bundled `lintapple` engine run on the rendered page: text contrast, accessible names, form labels, ARIA references, control states, target sizes, horizontal overflow, viewport bounds, and font loading. Project-specific rules such as font, size, and copy policies belong in the deep gate.

The scan also flags placeholder text left on the page (`placeholder-text`): an all-zero phone number or postcode (`031-000-0000`, `〒530-0000`), `"○○町"` or `"OO구"` in an address, `"Lorem ipsum"`, `"[Company Name]"`, or an `@example.com` address. This is reported as a quality item rather than an AI-look signal: it appeared on 35 of 79 Korean and Japanese pages built by Claude and Codex from one-line prompts and on 2 of 1,845 human-made Korean and Japanese sites, but it stems from prompting without facts rather than from how a model writes.

Three rules from Vercel's Web Interface Guidelines are handled the same way: a viewport meta tag that blocks zoom (`zoom-disabled`), a text field under 16px on a phone that forces iOS Safari to zoom on focus (`input-zoom`), and a field that refuses paste (`paste-blocked`). Across 60 human-made Korean and Japanese sites, 13 blocked zoom and 9 had small fields, so these are reported as quality items rather than AI-look signals.

### Japanese pages (日本語)

When a page is mostly Japanese, the report adds a **日本語タイポグラフィ** section:

| Check | Why it matters |
|---|---|
| No Japanese family in the font stack | Each OS falls back to a different typeface; typical of AI-generated `Inter, sans-serif` stacks |
| Body line height < 1.45 | Japanese glyphs fill the em box, so long text looks cramped (1.7–2.0 recommended) |
| Heading orphans (`泣き別れ`) | Last line of a heading holds only 1–2 characters; checked per viewport |
| Bad breaks | A small kana or `ー` starting a main-heading line, or any line break inside a short nav or button label (breaks in news lists are counted only) |
| `word-break: break-all` on headings | Breaks ignore phrase boundaries; use `auto-phrase`, BudouX, or `<wbr>` |
| Italic Japanese | Japanese fonts have no true italics, so the browser applies a synthetic slant |
| Negative tracking | Latin-style tight letter-spacing makes kana and kanji collide |
| Text under 12px | Dense kanji become illegible (footers and legal text excluded) |
| Half-width katakana, full-width alphanumerics | Gives a legacy appearance and hurts search and screen-reader output |

Japanese web conventions are not treated as AI tells: Hiragino, Noto Sans JP, and Yu Gothic stacks, a small logo `h1`, and dense layouts are normal.

The section ends with **日本のサイトとの比較**, a table comparing the page against measured Japanese sites across body size, line height, heading-to-body ratio, number of font sizes, hue groups, centered and rounded blocks, and contrast failures. The data and collection method are documented in [data/ja-reference/](../data/ja-reference/README.md).

### Calibration

Remeasured on 19 November 2026 with the current scoring rules (scores shift as live sites change, and a few sites no longer responded, so set sizes changed slightly). Scripts: `scripts/calibrate-scan.mjs`, `scripts/rescore.mjs`.

| Set | Sites | Median score | Score ≥ 20 |
|---|---:|---:|---:|
| ChatGPT-built sites (tuning) | 30 | 38 | 70% |
| Human sites (tuning) | 26 | 0 | 0% |
| Lovable/v0 sites (holdout) | 39 | 31 | 69% |
| Design-forward studio, award, and editorial sites (holdout) | 29 | 0 | 0% |
| Replit/Lovable gallery sites (extra) | 76 | 33 | 74% |
| Korean, global brand, editorial, public, and personal sites (extra) | 55 | 4 | 9% |
| Korean human-made sites by trade (`data/genre-reference`) | 776 | 0 | 7% |
| Japanese human-made sites by trade (`data/genre-reference`) | 1014 | 0 | 3% |
| Korean and Japanese pages built by Claude Opus 5.5 from one-line prompts (`scripts/calibration-ai-krjp.tsv`, plus 7 benchmark pages) | 43 | 33 | 81% |
| The same prompts built by Codex (`gpt-6.2-sol`) | 36 | 24 | 64% |
| `examples/ai-slop-landing.html`, `ai-slop-landing-ja.html` | 2 | 100 | |

The extra set (`scripts/calibration-extra.tsv`) was added after thresholds were fixed. The human side of this set is where the score is weakest: large SaaS and consumer brands such as `toss.im`, `shopify.com`, `allbirds.com`, and `loom.com` score 27–38 because they use the same purple gradients, card grids, and glass effects. On Korean sites by trade, misses come from Korean commercial conventions: dense banners, pop-ups, card grids, gradients, emoji, and glass.

The Korean and Japanese AI-built pages were generated on 19 November 2026 from 36 one-line prompts (18 Korean, 18 Japanese), built once by each tool; Codex saw only its bundled skills. Korean pages are caught more often (77%) than Japanese ones (70%). Since 20 November 2026, a cream ground with a serif display (`paper-serif`) scores as a strong signal on Korean and Japanese pages: it appeared on 44–50% of those AI pages versus 0.5–1.5% of human-made Korean and Japanese sites. Scoring it strong caught 7 more of the 79 pages (`65% → 73%`), while 3 Japanese human sites—all previously at 19—moved to 20.

Most Codex pages still under 20 carry no scored signal: a pale sage ground, a photo on the right half, small dash-led labels, and a row of icon cards under the hero, which current signals do not yet detect. Scoring two reported-only signals on Korean and Japanese pages (one accent-colored word in a heading, a faintly tinted page) was tested and rejected: on the 12 held-out prompts it caught one more page out of 24 while raising the share of human Korean and Japanese sites at 20 or more by about one percentage point. A low score does not prove good design, and more than a quarter of AI-built sites still score under 20.

## Using it with agents

The skill in [skills/ui-refiner-agent/SKILL.md](../skills/ui-refiner-agent/SKILL.md) defines three workflows:

- **Review**: run `scan`, inspect the screenshots first, confirm or reject each signal, then report a verdict, 2–3 root causes, a redesign direction per cause (noting what must be preserved), and the quality issues users would hit.
- **Refine**: scan, record what must be preserved, mock three first-screen directions so you can pick one (`ui-refiner directions <folder>` displays their screenshots side by side), add a signature element drawn from real content, fix by root cause (starting with structure rather than the stock section sequence of pill, two-tone hero, logo row, icon cards, stats, testimonials, three tiers, FAQ, and CTA band), never invent facts or swap in another stock look, and rescan until remaining signals are deliberate (at most three rounds).
- **Build**: read the project and the bundled `suta` guidance, decide the design direction before writing markup, avoid the listed defaults, then `scan` the dev server and fix anything unintended (at most two rounds).

Once installed, you rarely need to invoke the CLI yourself. Ask in plain language (`"review the design of example.co.jp"`, `"build this landing page without the AI look"`, `"fix those and compare again"`), or use the slash commands in Claude Code:

```
/ui-review https://example.co.jp
/ui-review localhost:5173 fix the strong signals, then rescan
/ui-refine landing.html
```

Install the agent integration in one of these ways:

| Agent | How |
|---|---|
| Claude Code (plugin) | Run `/plugin marketplace add prentice7725/ui-refiner` and install `ui-refiner`; then run `npm ci && npx playwright install chromium` once inside the plugin folder |
| Claude Code / Codex (per project) | Place this repository at `tools/ui-refiner` in your app and run `node tools/ui-refiner/scripts/install-agent-skill.mjs .` (supports `--host claude`, `codex`, or default `both`). It installs `.claude/skills/ui-refiner-agent` (with `/ui-review`, `/ui-refine`, and post-edit/finish hooks) for Claude Code and `.agents/skills/ui-refiner-agent` for Codex |

The bundled design knowledge lives in `vendor/suta/skills/suta` (in Korean): AI-slop red lines, layout and motion values, and 57 tested UI patterns.

### With Modern Web Guidance (optional)

UI Refiner decides how a page looks. [Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance) is a separate skill focused on how a page is built: dialogs, forms, images, loading, and accessibility. To combine both, mention it in your prompt (`"refine landing.html with Modern Web Guidance"`), or install it in your project (`npx modern-web-guidance@latest install`) so the skill picks it up automatically. It is off by default: across three pages refined with and without it, accessibility and best-practices scores were identical.

## Deep QA gate (optional)

For projects that need an enforced gate during development or CI, `init` + `check` runs the `suta` static audit and `lintapple` rendered checks against a project policy. It supports named routes, interaction states, baselines, changed-line scoping, evidence images, ARIA diffs, visual regression, SARIF/HTML exports, and review packets.

```sh
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD" --locale ja-JP
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

Exit codes: `0` pass (manual visual review may remain), `1` findings, `2` error or missing coverage, `3` scoped pass only. Because the default policy permits only system UI fonts, edit `ui-policy.json` to match your approved typography before enforcing it.

Full manual: [docs/gate/README.md](gate/README.md) · [한국어](gate/README_KO.md) · [日本語](gate/README_JA.md). Agent protocol: [reference/quality-gate.md](../skills/ui-refiner-agent/reference/quality-gate.md).

## Limits

- `scan` inspects one loaded state per viewport. Interaction states, signed-in pages, and app-wide consistency require the deep gate or manual checks.
- The index is a heuristic, not a taste verdict. A low score does not prove good design, and a deliberate brand gradient is fine. Final visual acceptance belongs to a human.
- No vision model is called automatically; the agent reading the screenshots performs the visual judgment.
- Canvas apps, Godot/Phaser UIs, and game HUDs are out of scope.
- Screenshots and reports can contain page content; review them before sharing.

## Development

```sh
npm test                 # unit tests
npm run smoke:scan       # real browser: EN/JA slop fixtures vs. clean demo
npm run smoke:ui         # other smoke suites: smoke:gate, smoke:routes, smoke:visual, …
```

CI runs all suites ([.github/workflows/ci.yml](../.github/workflows/ci.yml)). Vendored engines are pinned and hash-verified ([vendor/UPSTREAM.json](../vendor/UPSTREAM.json)). Changes are tracked in [CHANGELOG.md](../CHANGELOG.md), and background research lives in [docs/](./).
