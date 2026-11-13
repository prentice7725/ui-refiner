# UI Refiner

A design toolkit for Claude Code and Codex. It makes pages built by an agent look less AI-generated and less like each other. It renders a page in a real browser and scores how generic it looks. Then it mocks three different design directions, lets you pick one, and rebuilds the page around it. Your links, forms and figures stay exactly as they were.

[한국어](README_KO.md) · [日本語](README_JA.md) · [Install](#installation) · [Full guide](docs/GUIDE.md) · [Changelog](CHANGELOG.md)

## What you get

- **Refine with three dealt directions.** `/ui-refine` does not leave the design to the model's habits.
  - Each of the three first-screen mocks is dealt four things: a hero structure, a type pairing, an accent family and a surface.
  - Structures are weighted by how 406 human-made sites of the same kind open their first screen.
  - A per-user log keeps the next client from getting the same page.
  - You pick a direction, or a mix. The page is rebuilt around a signature element taken from the real content: this month's ledger for a budgeting app, a day in the team for a hiring page.
- **Checks that keep a refine honest.**
  - `keep check` fails when a link, form field or figure was lost or changed. An unchecked refine once turned 409,847 into 420,000.
  - `directions verify` fails when the page drifted from the chosen structure, surface or type. It also fails when the first screen lacks a one-line claim, the main action, or a photo or large product screen, or when other text dwarfs the claim.
  - `system extract` saves the picked main page's design (type, colours, button, radius, width) as `DESIGN_SYSTEM.md`, and `system check` fails when another page of the site leaves it. Directions vary between clients; pages of one site stay one design.
  - A finish gate (a Stop hook) keeps the agent working until both pass.
- **A scan that says why a page looks generic.**
  - `ui-refiner scan <url | file>` needs no config.
  - It checks about two dozen rendered signals: purple gradients, icon-card grids, eyebrow pills, glass, stock copy in English, Korean and Japanese, and more. Each one comes with evidence, the reason it reads as generic, and a fix.
  - It was calibrated on about 250 AI-built and human-made sites. At a score of 20 or more it flags 66–74% of AI-built sites and 0–15% of human ones.
  - A rescan opens with a before/after comparison.
- **Japanese pages placed among 209 real Japanese sites.**
  - Typesetting checks: missing Japanese fonts, cramped line height, heading orphans (泣き別れ), bad breaks and fake italics.
  - Each measure shows where the page sits, so "line height 1.3" reads as "lower than 99% of Japanese sites".

## Measured on the same pages

The benchmark has 8 pages that Claude built from one-line prompts: a team tool, a budgeting app, a dental clinic, a food bank, a Japanese hiring page, a Japanese clinic, a Korean finance app and a Korean logistics site. Every page was refined once by Claude Code. Judging was blind and done by Claude. The set judge sees all eight pages of one version at once and rates how alike they are. The per-page judge ranks the five versions of each page.

| 8 pages, one run each | Original | "Make it less AI-generated" prompt | `/ui-refine` 0.7.0 | Real human sites |
|---|---:|---:|---:|---:|
| Set sameness, 1–10, lower is more varied (two runs) | 9 / 8 | 8 / 9 | **4 / 5** | 2 / 1 |
| Set rank of 8 (two runs) | 8 / 8 | 6 / 7 | **4 / 4** | 1 / 1 |
| Per-page mean rank of 5, lower is better | 4.9 | **2.0** | 3.5 | — |
| Pages that lost or changed a figure | — | not checked | 0 | — |

What these numbers say:
- **Across a set, the refine works.** The plain prompt moved all eight pages to the same cream-and-serif editorial template. `/ui-refine` gave them eight different looks, and every page opens with a photo or a product screen. The set judge ranked it ahead of the plain prompt and the originals in both runs, but still behind real human sites.
- **Page by page, it does not win yet.** The per-page judge still prefers the plain prompt (2.0) and an early refine that kept one strong look (1.8). Neither of those has a photo, so imagery alone does not close the gap. That gap is the open problem.
- **Habits the set judge still sees:** heavy grotesk headlines, weekday hours strips, data-table heroes and stat rows.
- **Limits:** 8 pages, one run per version, and Claude judging Claude's output.

[Method, all eleven rounds and limitations](docs/REFINE_BENCHMARK_2026-11-08.md)

## Installation

Requirements: Node.js 22.18+, npm, Git.

**Claude Code plugin.** Run these in the chat:

```text
/plugin marketplace add prentice7725/ui-refiner
/plugin install ui-refiner@ui-refiner
```

Then, once, in the plugin folder:

```bash
npm ci && npx playwright install chromium
```

**Per project (Claude Code and Codex).** Put this repo at `tools/ui-refiner` in your app, then run:

```bash
node tools/ui-refiner/scripts/install-agent-skill.mjs .
```

It writes the skill, the `/ui-review` and `/ui-refine` commands, a post-edit hook and the refine finish gate.

**CLI only:**

```bash
git clone https://github.com/prentice7725/ui-refiner && cd ui-refiner
npm ci && npx playwright install chromium && npm link
ui-refiner scan your-site.example
```

[All commands and options](docs/GUIDE.md#quick-start)

## Try it

After installing, ask your agent in plain words, or use the slash commands:

```text
/ui-review https://example.co.jp
/ui-refine landing.html
```

> Review the design of my landing page at localhost:5173 and tell me what makes it look AI-made.

> Refine landing.html so it no longer looks AI-generated. Keep every price and link.

For a refine, the agent:
1. scans the page and records what must be kept;
2. deals and mocks three directions, then shows them side by side (`refine-directions/DIRECTIONS.html`) and waits for your pick;
3. rebuilds the page, verifies it and rescans.

The report follows the page language: English, Korean or Japanese.

## Learn more

- [Full guide](docs/GUIDE.md): what `scan` produces, every AI-look signal, the Japanese checks, calibration, agent workflows, the optional deep QA gate and its limits.
- [Refine benchmark](docs/REFINE_BENCHMARK_2026-11-08.md): rounds 1–11, with judge notes.
- [Changelog](CHANGELOG.md)

[![CI](https://github.com/prentice7725/ui-refiner/actions/workflows/ci.yml/badge.svg)](https://github.com/prentice7725/ui-refiner/actions/workflows/ci.yml)
![Version](https://img.shields.io/badge/version-0.7.0-1b1e24)
![Tests](https://img.shields.io/badge/tests-155%20passing-555555)
[![License: MIT](https://img.shields.io/badge/license-MIT-555555)](LICENSE)

## License

MIT. Bundled third-party code and data keep their own licenses:
- suta: [vendor/suta/LICENSE](vendor/suta/LICENSE)
- lintapple: [vendor/lintapple/LICENSE](vendor/lintapple/LICENSE)
- UI UX Pro Max dataset: [knowledge/ui-ux-pro-max/LICENSE](knowledge/ui-ux-pro-max/LICENSE)
- npm packages: [licenses/THIRD_PARTY.md](licenses/THIRD_PARTY.md)
