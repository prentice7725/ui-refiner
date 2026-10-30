# UI Refiner v0.4.0

[English](README.md) · [한국어](README_KO.md) · [日本語](README_JA.md) · [Changelog](CHANGELOG.md)

UI Refiner helps coding agents (Claude Code, Codex) and the people working with them do two things:

1. **Build** web pages and app screens that do not look AI-generated.
2. **Review** existing pages, point out what makes them look generic and propose a better design.

It renders the page in a real browser, measures what it sees, and writes a report an agent or a designer can act on. Japanese pages get dedicated typesetting checks and a Japanese report.

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

A heuristic built from rendered signals. Strong signals weigh 3, moderate 2, weak 1. A chosen webfont, real imagery and a rich type scale each lower the score by 15% (the signals stay listed). It never blocks anything.

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
| Default accent | Untouched Tailwind indigo/violet/blue or Bootstrap blue |
| Many hues | Five or more chromatic hue families in UI colors |
| `transition: all` | Computed on interactive elements |
| Buzzword copy | Stock phrases in EN/KO/JA ("unlock your potential", 잠재력, 可能性を解き放つ, 次世代の …); two or more needed |
| Repeated generic CTA | "Learn more", 자세히 보기, 詳しく見る … repeated |

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
| `word-break: break-all` on headings | Breaks ignore phrase boundaries; use `auto-phrase`, BudouX or `<wbr>` |
| Italic Japanese | Japanese fonts have no italics; the browser fakes a slant |
| Negative tracking | Latin-style tight tracking makes kana and kanji collide |
| Text under 12px | Dense kanji become illegible (footers and legal text excluded) |
| Half-width katakana, full-width alphanumerics | Legacy look; harder to search and read aloud |

Japanese conventions are not treated as AI tells. Hiragino, Noto Sans JP and Yu Gothic stacks, a small logo `h1` and dense layouts are normal.

Calibration at the time of writing (scores change with the sites):

| Page | AI-look | Notes |
|---|---:|---|
| `examples/ai-slop-landing.html` | 100 | 13 signals |
| `examples/ai-slop-landing-ja.html` | 100 | plus 7 Japanese typography issues |
| Plain demo (`npm run demo`) | 6 | generic type only |
| stripe.com, linear.app, github.com, toss.im, apple.com/kr | 6–28 | |
| smarthr.jp, freee.co.jp, note.com, mercari, cybozu, yahoo.co.jp, apple.com/jp, line.me | 0–19 | Japanese typesetting notes are reported separately (e.g. `break-all` and full-width digits on yahoo.co.jp) |

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
