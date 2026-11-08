# UI Refiner v0.5.0

[English](README.md) · [한국어](README_KO.md) · [日本語](README_JA.md) · [Changelog](CHANGELOG.md)

UI Refiner helps coding agents (Claude Code, Codex) and the people working with them do two things:

1. **Build** web pages and app screens that do not look AI-generated.
2. **Review** existing pages, point out what makes them look generic and propose a better design.

It renders the page in a real browser, measures what it sees, and writes a report an agent or a designer can act on. Japanese pages get dedicated typesetting checks and a Japanese report.

## What the report gives you

- **An AI-look score checked against real sites.** It was tuned on 30 ChatGPT-built sites and 26 human sites, then tested unchanged on 38 Lovable/v0 sites and 29 design-forward studio and editorial sites. At a score of 20 or more it flags 66–70% of the AI-built sites and 0–3% of the human ones. Each signal comes with evidence, the reason it reads as generic, and a concrete fix.
- **Japanese pages placed among 209 real Japanese sites.** Company, prefecture, public-body, media, startup and design-brand sites were measured once (robots.txt respected, numbers only). The report shows where the page sits on each measure, so "line height 1.3" becomes "lower than 99% of Japanese sites". Excerpt for [`examples/ai-slop-landing-ja.html`](examples/ai-slop-landing-ja.html):

  | 項目 | このページ | 日本のサイト（下位10% / 中央 / 上位10%） | 位置 |
  |---|---:|---:|---|
  | 本文の文字サイズ（px） | 16 | 13 / 16 / 18 | 一般的な範囲 (48%のサイトより上) |
  | 本文の行間 | 1.3 | 1.47 / 1.6 / 2 | **少ない・小さい側** (1%のサイトより上) |
  | 中央揃えのブロック | 100% | 0% / 2% / 24% | **多い・大きい側** (100%のサイトより上) |
  | 角丸のボックス | 60% | 0% / 0% / 26% | **多い・大きい側** (98%のサイトより上) |
  | コントラスト不足の要素 | 9 | 7 / 37 / 126 | 一般的な範囲 (11%のサイトより上) |

  Being outside the range is a reason to look, not a defect by itself. The same data keeps Japanese conventions from being flagged: about 1% of the reference sites score 20 or more.
- **Japanese typesetting checks** for missing Japanese fonts, cramped line height, heading orphans (泣き別れ), bad breaks in headings and nav labels, fake italics and more.
- **Before/after in one command.** Scan again after editing and the report opens with what was resolved, what is new and the score change, with both sets of screenshots.

## Quick start

Requirements: Node.js 22.18+, npm, Git.

```sh
git clone https://github.com/prentice7725/ui-refiner && cd ui-refiner
npm ci && npx playwright install chromium
npm link                                   # optional: makes `ui-refiner` available everywhere

ui-refiner scan your-site.example          # review a live page
ui-refiner scan localhost:5173             # your dev server; run it again after edits to see what changed
```

That is the whole loop. `scan` takes any URL, bare host name or local `.html` file, needs no config and changes nothing in the target project. Without `npm link`, use `node bin/ui-refiner.mjs scan …` instead.

- **Report language** follows the page: Japanese pages get a Japanese report, Korean pages Korean, everything else English. Set a fixed default with `UI_REFINER_LANG=ko` (or `ja`, `en`), or pass `--lang` for one run. The browser locale follows the host (`.jp` → `ja-JP`, `.kr` → `ko-KR`) unless `--locale` is given.
- **Rescans compare automatically.** When the output folder already holds a scan of the same page, the new report opens with a before/after comparison. Use `--no-compare` to skip it, or `--compare <folder>` to compare with a scan elsewhere.
- `--source src` adds the static source audit. `--out` changes the output folder (default `ui-refiner-scan/`).

In Claude Code, the `/ui-review <url>` command does the scan, looks at the screenshots and writes the review for you (see [Using it with agents](#using-it-with-agents)).

## What `scan` produces

Output goes to `ui-refiner-scan/` (change with `--out`):

| File | Contents |
|---|---|
| `DESIGN_REVIEW.md` | AI-look index, signals with evidence/why/fix, baseline quality table, Japanese typography (Japanese pages), source audit (`--source`), what the page avoided, next steps for the agent |
| `scan.json` | The same data for tools |
| `scan-desktop.png`, `scan-mobile.png` | Full-page screenshots at 1440px and 390px after scrolling through lazy content |
| `before-scan-*.png`, `previous-scan.json` | On a rescan: the previous screenshots and result, kept for side-by-side review |

### Before/after comparison

Rescanning the same page into the same folder compares automatically. To keep separate folders, point `--compare` at the earlier one:

```sh
ui-refiner scan localhost:5173                                   # first scan
# … edit the page …
ui-refiner scan localhost:5173                                   # compared with the first scan automatically
ui-refiner scan localhost:5173 --out scan-after --compare scan-before
```

The report then opens with a comparison section: AI-look score before → after, resolved, new and remaining signals (with stronger/weaker direction), baseline quality changes per rule, Japanese typesetting changes, and before/after screenshot links. Comparing production with a local dev server is fine because only the path has to match. A different page or browser locale is called out as a warning. `examples/ai-slop-landing-ja.html` → `examples/redesign-landing-ja.html` is a worked example: 100 → 0, 13 signals and 7 Japanese issues resolved.

### AI-look index (0–100)

A heuristic built from rendered signals. Strong signals weigh 3, moderate 2, weak 1. A chosen webfont and real imagery each lower the score by 15% (the signals stay listed). Signals marked *reported only* showed up on human sites at least as often as on AI-built ones, so they appear in the report but add nothing to the score. It never blocks anything.

| Signal | What it measures |
|---|---|
| Purple/indigo gradient hero | Large gradient behind text whose color stops are mostly purple/indigo/pink |
| Large gradients | Gradients covering big text surfaces |
| Gradient text | `background-clip: text` gradients, strongest on headings |
| Glass | Repeated `backdrop-filter: blur` boxes (a pinned nav is allowed) |
| Glow | Colored, blurred box shadows |
| Emoji icons | Standalone or leading emoji used as icons (emoji inside user content is ignored) |
| Icon-card grid | 3–4 identical rounded cards in a row, each with heading and blurb |
| Eyebrow pill | Pill badge right above the headline |
| Centered text | Most text blocks centered |
| Over-rounding | Nearly every box ≥16px radius |
| Generic type | One stock face (Inter, Roboto, system…) for everything |
| Flat type scale | Largest heading under 2× the body size (skipped on Japanese pages) |
| Default accent | Untouched Tailwind indigo/violet/purple (plain blue and Bootstrap blue are reported only) |
| Many hues | Five or more chromatic hue families in UI colors |
| Tracked labels | Tiny, letter-spaced uppercase labels repeated across sections |
| Numbered labels | "01 / …", "STEP 1 · …" section labels |
| Period headlines | Short display headings ending in a period ("Stay by the sea.") |
| Paper and serif | Warm off-white background with serif display type, the 2025–26 editorial template |
| `transition: all` | Computed on interactive elements (reported only) |
| Buzzword copy | Stock phrases in EN/KO/JA ("unlock your potential", 잠재력, 可能性を解き放つ, 次世代の …); two or more needed |
| Repeated generic CTA | "Learn more", 자세히 보기, 詳しく見る … repeated (reported only) |

Decorative illustrations, `aria-hidden` art, SVG internals and pinned navigation are excluded to keep crafted brand work from being flagged.

### Baseline quality

Universal checks from the bundled lintapple engine, measured in the rendered page: text contrast, accessible names, form labels, ARIA references, control state, target size, horizontal overflow, viewport bounds and font loading. Project-specific rules such as font, size and copy policies are left to the deep gate.

### Japanese pages (日本語)

When a page is mostly Japanese, the report adds a **日本語タイポグラフィ** section:

| Check | Why it matters |
|---|---|
| No Japanese family in the font stack | Each OS falls back to a different face; the typical AI `Inter, sans-serif` stack |
| Body line height < 1.45 | Japanese glyphs fill the em box; long text gets cramped (1.7–2.0 recommended) |
| Heading orphans (泣き別れ) | Last line of a heading holds 1–2 characters; checked per viewport |
| Bad breaks | A small kana or ー starting a main-heading line, or any break inside a short nav or button label (breaks in news lists are only counted) |
| `word-break: break-all` on headings | Breaks ignore phrase boundaries; use `auto-phrase`, BudouX or `<wbr>` |
| Italic Japanese | Japanese fonts have no italics; the browser fakes a slant |
| Negative tracking | Latin-style tight tracking makes kana and kanji collide |
| Text under 12px | Dense kanji become illegible (footers and legal text excluded) |
| Half-width katakana, full-width alphanumerics | Legacy look; harder to search and read aloud |

Japanese conventions are not treated as AI tells. Hiragino, Noto Sans JP and Yu Gothic stacks, a small logo `h1` and dense layouts are normal.

The section ends with **日本のサイトとの比較**, the comparison shown above, for body size, line height, heading-to-body ratio, number of font sizes, hue groups, centered and rounded blocks, and contrast failures. The data and how it was collected are in [data/ja-reference/](data/ja-reference/README.md).

### Calibration

Measured in November 2026 (scores change as sites change). Scripts: `scripts/calibrate-scan.mjs`, `scripts/rescore.mjs`.

| Set | Sites | Median score | Score ≥ 20 |
|---|---:|---:|---:|
| ChatGPT-built sites (tuning) | 30 | 33 | 70% |
| Human sites (tuning) | 26 | 0 | 0% |
| Lovable/v0 sites (holdout) | 38 | 24 | 66% |
| Design-forward studio, award and editorial sites (holdout) | 29 | 5 | 3% |
| Japanese reference sites | 209 | 0 | 1% |
| `examples/ai-slop-landing.html`, `ai-slop-landing-ja.html` | 2 | 100 | |

A low score does not prove good design, and about a third of AI-built sites still score under 20.

## Using it with agents

The skill in [skills/ui-refiner-agent/SKILL.md](skills/ui-refiner-agent/SKILL.md) defines two workflows:

- **Review**: run `scan`, look at the screenshots first, confirm or reject each signal, then report a verdict, 2–3 root causes, a redesign direction per cause (with what must be preserved) and the quality issues users would hit.
- **Build**: read the project and the bundled suta guidance, decide the design direction before writing markup, avoid the listed defaults, then `scan` the dev server and fix what is not deliberate (at most two rounds).

Once installed you rarely need the CLI yourself. Ask in plain words ("review the design of example.co.jp", "build this landing page without the AI look", "fix those and compare again"), or in Claude Code use the slash command:

```
/ui-review https://example.co.jp
/ui-review localhost:5173 fix the strong signals, then rescan
```

Install it in one of these ways:

| Agent | How |
|---|---|
| Claude Code (plugin) | `/plugin marketplace add prentice7725/ui-refiner`, then install `ui-refiner`; run `npm ci && npx playwright install chromium` once in the plugin folder |
| Claude Code / Codex (per project) | Place this repo at `tools/ui-refiner` in the app, then `node tools/ui-refiner/scripts/install-agent-skill.mjs .`; this writes `.claude/skills/ui-refiner-agent` and the `/ui-review` command (Claude Code), `.agents/skills/ui-refiner-agent` (Codex), and registers a post-edit hook |

The bundled design knowledge lives in `vendor/suta/skills/suta` (Korean): AI-slop red lines, layout and motion values and 57 tested UI patterns.

## Deep QA gate (optional)

For projects that want an enforced gate in development or CI, `init` + `check` runs the suta static audit and lintapple rendered checks against a project policy. It adds routes, interaction states, baselines, changed-line scope, evidence images, ARIA diffs, visual regression, SARIF/HTML export and review packets.

```sh
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD" --locale ja-JP
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

Exit codes: 0 pass (human review may remain), 1 findings, 2 error or missing coverage, 3 scoped pass only. The default policy allows only system UI fonts. Edit `ui-policy.json` to match your approved typography before enforcing it.

Full manual: [docs/gate/README.md](docs/gate/README.md) · [한국어](docs/gate/README_KO.md) · [日本語](docs/gate/README_JA.md). Agent protocol: [reference/quality-gate.md](skills/ui-refiner-agent/reference/quality-gate.md).

## Limits

- `scan` sees one loaded state per viewport. Interaction states, signed-in pages and app-wide consistency need the deep gate or a manual check.
- The index is a heuristic, not a taste verdict. A low score does not prove good design, and a deliberate brand gradient is fine. Final visual acceptance belongs to a human.
- No vision model is called. The agent reading the screenshots does the visual judgment.
- Canvas apps, Godot/Phaser UIs and game HUDs are out of scope.
- Screenshots and reports can contain page content. Check them before sharing.

## Development

```sh
npm test                 # unit tests
npm run smoke:scan       # real browser: EN/JA slop fixtures vs. clean demo
npm run smoke:ui         # other smoke suites: smoke:gate, smoke:routes, smoke:visual, …
```

CI runs all suites ([.github/workflows/ci.yml](.github/workflows/ci.yml)). Vendored engines are pinned and hash-verified ([vendor/UPSTREAM.json](vendor/UPSTREAM.json)). Changes are listed in [CHANGELOG.md](CHANGELOG.md). Background research is in [docs/](docs/).

## License

MIT. Bundled third-party code and data keep their licenses: suta ([vendor/suta/LICENSE](vendor/suta/LICENSE)), lintapple ([vendor/lintapple/LICENSE](vendor/lintapple/LICENSE)), UI UX Pro Max dataset ([knowledge/ui-ux-pro-max/LICENSE](knowledge/ui-ux-pro-max/LICENSE)) and npm packages ([licenses/THIRD_PARTY.md](licenses/THIRD_PARTY.md)).
