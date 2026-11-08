# Refine benchmark, 2026-11-08

Does the `/ui-refine` workflow remove the AI look from pages Claude makes, and does it do better than simply asking for "less AI-generated"?

## Method

1. **Sample.** Headless Claude Code (`claude -p`, Opus 5.5, no skills, plugins, MCP servers or memory) made 16 single-file pages from one-line prompts: 8 English, 4 Japanese, 4 Korean (productivity SaaS, AI writer, coffee roastery, dental clinics, architecture studio, food bank, budgeting apps, game studio, ryokan, accounting SaaS, IT recruiting, bakery, yoga studio, B2B logistics). Generation cost about $0.49–0.87 per page.
2. **Fix.** The 8 highest-scoring pages (EN 4, JA 2, KO 2) were fixed twice from the same starting file:
   - **Refine**: the `/ui-refine` command text plus the `ui-refiner-agent` skill, with scans allowed (`Bash(node:*)`). Cost $0.93–2.03 per page.
   - **Plain**: "Make this page look less AI-generated. Edit index.html in place." with no tool. Cost $0.57–0.99 per page.
3. **Measure.** Every version was scanned with the rules in this branch. Content kept compares numbers (prices, counts, times) and link targets in the HTML before and after.

Claude Design (the product) has no public gallery yet, so this sample stands for "what Claude makes from a one-line prompt", not for Claude Design itself.

## What Claude makes from a one-line prompt (16 pages)

- Median AI-look score 43; 14 of 16 score 20 or more.
- Signals: card grid 13, icons in tinted rounded squares 11, pill badge above the headline 9, tracked uppercase labels 9, paper + serif 7, headlines ending in a period 4.
- Unscored structure seen in the screenshots and a DOM probe: FAQ 12, stats trio 9, two-tone headline 8, "Most popular" pricing 5, colored CTA band 4. Together they make a stock section order: pill → two-tone hero → logo-name row → three icon cards → stats → testimonials → three tiers → FAQ → CTA band.
- All 4 Japanese pages had heading orphans (泣き別れ); 3 had more rounded boxes than 90% of the Japanese reference sites.

## Results (8 pages)

| | Before | Refine | Plain |
|---|---:|---:|---:|
| Median AI-look score | 66 | 0 | 9 |
| Score ≥ 20 | 8/8 | 0/8 | 1/8 |
| Median contrast failures | 27 | 5 | 5 |
| Japanese typesetting issues (2 pages) | 2 | 0 | 1 |
| Numbers kept | | 86–100% | 67–90% |
| Links kept | | 67–100% | 67–100% |
| Warm paper background | 1/8 | 0/8 | 8/8 |
| Paper + serif display | 1/8 | 0/8 | 5/8 |

- **The plain prompt swaps one template for another.** All 8 plain versions moved to a warm off-white background, and most moved to a serif display face, small mono labels and highlighter marks: the 2025–26 editorial AI template. The old scoring gave this look only 1 point. `paper-serif` is now moderate (2): it fires on 14% of AI-built calibration sites, 2% of human sites and none of the 210 Japanese reference sites, and the human share scoring ≥ 20 did not change.
- **Refine keeps more of the content.** It dropped fewer numbers (it may not invent or remove facts) and kept the page structure where the content needed it, while replacing card grids with lists, tables and one large feature.
- **Sameness risk.** 5 of 8 refined pages ended on the same near-white warm background (#FBFAF7), just under the paper threshold. Scores of 0 everywhere also mean the scan can no longer tell these pages apart; judge them by the screenshots.
- A full-page screenshot draws a sticky header where the page was scrolled to, so it can look as if the header covers a heading. Check the top of the page with a viewport screenshot before reporting that.

## Limits

- 8 pages, one run each, one model. The plain arm is one prompt wording.
- The refine arm was scored by the same tool it was steered by, so its scores are optimistic by construction. Contrast, Japanese issues and content kept are the more independent measures.
- Generated pages and screenshots stay in the local scratchpad and are not committed.
