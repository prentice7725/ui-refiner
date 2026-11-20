# UI Refiner

A design toolkit for Claude Code and Codex, built on measurements of real sites. In November 2026, 1761 human-made Korean and Japanese sites were measured and grouped by first impression and by what a visitor comes to do. From those groups come 13 finished themes, so an agent starts a page from what real sites of that kind look like instead of from its own habits. The toolkit still scans a page for what makes it look AI-generated and refines it in place, keeping its links, forms and figures exactly as they were.

[한국어](README_KO.md) · [日本語](README_JA.md) · [Install](#installation) · [Themes](skills/ui-refiner-agent/reference/themes/README.md) · [Full guide](docs/GUIDE.md) · [Changelog](CHANGELOG.md)

Models now build pages well enough that "was this made by AI?" matters less every month. What still goes wrong is that their pages look like each other and not like the trade they are for. So this release leads with measured design; the scan stays as a check.

## Themes measured from real sites

![The 13 themes' sample pages: Korean themes on the top row, Japanese on the bottom.](docs/assets/themes.jpg)

- **How they were measured.** Each site's stored scan and desktop screenshot gave 23 features: how much of the first screens is white, dark, photograph or saturated colour, type sizes, content width, page length, hairlines and more. Clustering them gave eight impressions: short and small, dark cinematic, white quiet, dense portal, photo-led, big type, standard corporate and bold colour. The trades were then grouped by what a visitor comes to do: place (stay, eat, see), care (book and visit), public (look up and apply), shop (choose and buy), business (trust a company) and creative (see the work).
- **One theme per family and country.** A theme is the most common impression of one family in one country, with its values taken from that group's measurements: ground, faces, sizes, button colour and shape, content width, page length and the section order.
  - Korea and Japan differ as much as trades do. Korean care sites go white and short, Japanese ones standard corporate. So no theme is shared between the two countries.
  - Korean business gets two themes, dark (with the client's own photographs) and white (without).
- **What each theme holds.**
  - `theme.md`: the measured basis (p25, median, p75), tokens, the section skeleton in order, the trade's own components, rules and things to avoid.
  - `theme.css` and a sample page for a fictional client, such as a Jeju farm-direct shop or a Kyoto design office, with desktop and phone screenshots. Every sample passes `stress`.
  - Generated photographs made with Grok Imagine and Codex, with their prompts. They are marked `data-generated` on the page and named as samples in the footer.
- **Applying one to a client.** [The themes README](skills/ui-refiner-agent/reference/themes/README.md) says how to pick a theme and how to map real content onto it.
  - Photo-led and dark themes need the client's own photographs. Applied to a logistics page without any, the dark theme read as a dark text template.
  - Keep the client's menu, drop sections the client has no content for, and never invent news, figures or quotes.
  - Run `keep check` and `stress` on the result.
  - This held on three real pages: a Japanese inn, a Korean dental clinic and a Korean logistics firm.
- **Limits.** The Korean and Japanese creative themes rest on 12 and 7 sites. Some samples are shorter than their measured page length because there were only so many generated images. The themes cover Korean and Japanese sites only.

## What else you get

- **Refine with three directions from three sources.** `/ui-refine` does not leave the design to the model's habits.
  - Three first-screen mocks are built apart, each by its own subagent: familiar (what human-made sites of the kind do, as measured), tailored (colour and type from this client's content) and bold (one material, a finished look taken from a physical thing).
  - You pick a direction, or a mix. The page is rebuilt around a signature element taken from the real content: this month's ledger for a budgeting app, a day in the team for a hiring page.
  - Without client photos, `ui-refiner photos` fetches openly licensed stand-ins from Wikimedia Commons, credited, as WebP at three widths with a ready `<img srcset>` line.
  - Name the client's trade (`--trade inn`) and the familiar direction is drawn from that trade's measured first screens. Of 61 Japanese inns and hotels, 69% open on a full-bleed photograph and a third set the display in Mincho.
- **It remembers, so clients do not get the same page.**
  - A per-user log keeps what each client picked, so the next deal steers away from those looks. It also keeps the two directions not picked and, with `--said`, the person's own words about the pick.
  - `ui-refiner prefer add surface paper --said "no more cream grounds"` records something the person does not want, and every later deal leaves it out. There is only "avoid", no "favour", so one person's taste does not pull every client to one look.
- **Checks that keep a page honest.**
  - `keep check` fails when a link, form field or figure was lost or changed. An unchecked refine once turned 409,847 into 420,000.
  - `directions verify` fails when the page drifted from the chosen structure, surface or type, when the first screen lacks a one-line claim, the main action, or a photo or large product screen, and when a web-font stylesheet blocks the first paint or a stand-in photo has no `srcset`.
  - `stress` swaps realistic worst-case values into the rendered text at 320, 390 and 1440px: longer button labels, a second clause on headings, long emails and phone numbers with an extension, big figures. It lists only what those values broke, each with the usual CSS fix.
  - `system extract` saves the picked main page's design as `DESIGN_SYSTEM.md`, and `system check` fails when another page of the site leaves it.
  - A finish gate (a Stop hook) keeps the agent working until the checks pass.
- **A scan that says why a page looks generic.**
  - `ui-refiner scan <url | file>` needs no config. It checks about two dozen rendered signals (purple gradients, icon-card grids, eyebrow pills, glass, stock copy in English, Korean and Japanese, a cream ground with a serif display), each with evidence, the reason it reads as generic, and a fix. Placeholder text left in the page and three of Vercel's interface rules are listed as quality items.
  - It was calibrated on about 250 AI-built and human-made sites and checked on 1790 human-made Korean and Japanese sites. At a score of 20 or more it flags 69–74% of AI-built sites, 0–9% of English-language human ones, 7% of Korean and 3% of Japanese ones. On 79 Korean and Japanese pages that Claude and Codex built from one-line prompts it flags 73%: 81% of the Claude pages and 64% of the Codex ones.
  - It saves the screenshot marked up like a graded paper (`scan-graded.png`), and a rescan opens with a before/after comparison.
- **Japanese pages placed among 209 real Japanese sites.** Typesetting checks (missing Japanese fonts, cramped line height, heading orphans, bad breaks, fake italics), and each measure shows where the page sits, so "line height 1.3" reads as "lower than 99% of Japanese sites".

## The refine, measured on the same pages

![Three benchmark pages: the original on the left, after /ui-refine on the right.](docs/assets/as-is-to-be.jpg)

Three of the benchmark pages as Claude first built them (left) and after the refine with three directions (right). The agent picked the direction where a person normally would. The clinic photo is a credited stand-in. The red marks are the scan's own (`scan-graded.png`). The originals score 52, 43 and 56; the refined pages score 0, which is expected, because a refine keeps working until its own scan finds nothing. It says the listed signals are gone, not that the design is good.

| 3 Korean and Japanese pages, one run each | Round 17 | Round 12 | Materials only | Materials, free colour and type | Three directions |
|---|---:|---:|---:|---:|---:|
| Per-page mean rank of 5, lower is better | 3.5 | 2.5 | 4.0 | 3.7 | **1.3** |
| Set sameness, 1–10, lower is more varied | 5.0 | 5.0 | **3.5** | **3.5** | 7.0 |

- **Page by page, the three-direction refine ranked first** in 4 of 6 verdicts. The judge saw each page twice with the versions relabelled, and the winner was the same both times on every page.
- **As a set, its three pages were the most alike.** The agent picked the tailored direction twice, and the judge saw the same small label, heavy left headline, mock product card and row of figures on all three.
- **Limits:** 3 pages, one run each, one judge (Claude), no human ratings. [Scores](docs/refine-pilot-2026-11-15-local/results-five-arms.json)

What the newer checks changed, on three Korean and Japanese pages refined once each with this release's skill (November 2026, $19.88):

| | Earlier refines | This release |
|---|---:|---:|
| Pages loading web fonts through a render-blocking stylesheet | 6 of 6 | 0 of 3 |
| Pages with stand-in photos missing `srcset` | 5 of 6 | 0 of 3 |
| Broken rows in `stress` on the final page | not checked | 0 on all 3 (the dental original had 1) |

All three runs ran `stress` themselves. Loading the fonts without blocking had taken one earlier page from Lighthouse performance 70 to 100. On the Japanese clinic, `stress` first misread the fixed bottom bar as overlapping the page; the agent's change to the bar then clipped two buttons, which `stress` caught and the agent fixed. The misreading is fixed in this release.

Where it does not help yet: naming the trade did not bring the familiar mock closer to that trade's measurements on six Korean and Japanese pages (36 runs, mocks only), because most trades open on a photograph as the page-kind figures already do. The 0.7.0 run on eight pages showed the same split as above: across a set the refine gave eight different looks where a plain "less AI-generated" prompt gave eight cream-and-serif pages, but the per-page judge still preferred the plain prompt. [All rounds and limitations](docs/REFINE_BENCHMARK_2026-11-08.md)

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

> Build the home page for our ryokan in Hakone from the jp-place-photo theme. Our photos are in ./photos.

> Review the design of my landing page at localhost:5173 and tell me what makes it look AI-made.

> Refine landing.html so it no longer looks AI-generated. Keep every price and link.

For a refine, the agent:
1. scans the page and records what must be kept;
2. builds three directions from three sources, each in its own subagent, then shows them side by side (`refine-directions/DIRECTIONS.html`) and waits for your pick;
3. rebuilds the page, runs `keep check`, `directions verify` and `stress`, and rescans.

After the pick, "a little bolder" or "quieter on the pricing section" does not start over: it turns up or down the type, colour and elements the page already has. When you rule something out for good ("no more cream grounds"), the agent asks whether it holds for every client and records it.

The report follows the page language: English, Korean or Japanese.

## Learn more

- [Themes](skills/ui-refiner-agent/reference/themes/README.md): how the themes were measured, how to pick one and how to apply it.
- [Full guide](docs/GUIDE.md): what `scan` produces, every AI-look signal, the Japanese checks, calibration, agent workflows, the optional deep QA gate and its limits.
- [Refine benchmark](docs/REFINE_BENCHMARK_2026-11-08.md): rounds 1–11, with judge notes.
- [Changelog](CHANGELOG.md)

[![CI](https://github.com/prentice7725/ui-refiner/actions/workflows/ci.yml/badge.svg)](https://github.com/prentice7725/ui-refiner/actions/workflows/ci.yml)
![Version](https://img.shields.io/badge/version-0.10.0-1b1e24)
![Tests](https://img.shields.io/badge/tests-199%20passing-555555)
[![License: MIT](https://img.shields.io/badge/license-MIT-555555)](LICENSE)

## License

MIT. Bundled third-party code and data keep their own licenses:
- suta: [vendor/suta/LICENSE](vendor/suta/LICENSE)
- lintapple: [vendor/lintapple/LICENSE](vendor/lintapple/LICENSE)
- UI UX Pro Max dataset: [knowledge/ui-ux-pro-max/LICENSE](knowledge/ui-ux-pro-max/LICENSE)
- npm packages: [licenses/THIRD_PARTY.md](licenses/THIRD_PARTY.md)
