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

## Round 2: direction-first refine and a blind judge

The first refine removed every tell but left the pages plain: the same accent, the same white page, no typographic voice. The workflow was changed:
- mock three clearly different first-screen directions, scan them and pick one;
- give the page one signature element built from its real content;
- treat a generated page's colors and fonts as changeable;
- check a craft list (scale, faces, hero, rhythm, accent, spacing, details) on the screenshots;
- use the score only as a guard.

The same 8 pages were refined again with the new workflow, at $1.19–2.97 per page. All four versions of each page were then judged blind by headless Claude (Opus 5.5) acting as a senior designer. Each judge saw full-page screenshots under shuffled letters and scored each version 1–10, then ranked them.

| Version | Hierarchy | Distinctiveness | Typography | Cohesion | AI look (lower is better) | Mean rank | Ranked first |
|---|---:|---:|---:|---:|---:|---:|---:|
| Before | 7.3 | 3.8 | 6.4 | 7.1 | 8.6 | 4.0 | 0 |
| Refine, round 1 | 7.9 | 5.9 | 7.1 | 7.9 | 5.1 | 2.6 | 0 |
| Plain prompt | 7.5 | 7.8 | 7.5 | 7.8 | 3.0 | 1.9 | 3 |
| Refine, round 2 | 8.1 | 7.9 | 7.8 | 7.9 | 3.4 | 1.5 | 5 |

The judge called the round-1 refine "competent but familiar SaaS blue" on most pages. Each round-2 page has a signature element:
- a Monday–Friday week strip;
- a take-home pay splitter;
- an "open now" hours board;
- a weekly pantry timetable;
- three employees' real days side by side;
- a ledger table;
- a shipment status board.

All scored 0 on the AI-look index.

Caveats:
- The judge is Claude, and it is lenient on the cream-and-serif editorial look. The plain prompt moved all 8 pages to a warm paper background and still got the lowest AI-look rating.
- Round 2 has its own sameness:
  - 3 of 4 English pages used Bricolage Grotesque + Instrument Sans;
  - 7 of 8 sit on a warm grey off-white;
  - the skill now warns about the font pair.
- The logistics page went dark with dense, dim text, and the judge flagged its readability.
- Contrast failures that remain on two pages (29 and 26) are mostly elements the checker could not measure, not measured failures.

## Round 3: keeping directions apart (same 8 pages)

Round 2's pages converged on one surface. Calibration data shows how unusual that is for human sites:

| Set | Plain white | Faint off-white | Dark |
|---|---:|---:|---:|
| Human (tune / holdout / extra) | 85% / 69% / 74% | 12% / 7% / 11% | 4% / 24% / 6% |
| Japanese reference (210) | 87% | 7% | 4% |
| AI (tune / holdout / extra) | 7% / 24% / 36% | 23% / 42% / 32% | 40% / 16% / 22% |

Changes for round 3:
- `ui-refiner directions` now measures each mock's surface and type pair. It warns when two mocks share either one, or when all of them sit on off-white.
- The skill allows at most one tinted paper direction.
- A `tinted-page` signal is reported but not scored. Scoring it raised holdout human false positives from 3% to 7% for a 3-point gain on AI sites.

Results:
- Surface: 6 of 8 pages became plain white and 2 dark; none stayed off-white (round 2: 7 of 8).
- Type: Bricolage + Instrument disappeared, but IBM Plex (Sans KR / Condensed + Mono) appeared on 3 of 8.
- AI-look was 0 on all 8, facts kept 86–98%, and real links (tel:, booking) kept.

Two blind judges:
- The per-page judge compares the four versions of one page.
- The new set judge sees one contact sheet per version with the first screens of all eight unrelated sites. It rates how much they look like one reused house style (sameness, 10 = interchangeable). It was run twice.

| Version | Per-page mean rank | Per-page AI look | Set sameness (run 1 / 2) | Set rank (run 1 / 2) |
|---|---:|---:|---:|---:|
| Before | 4.0 | 8.8 | 9 / 9 | 4 / 4 |
| Plain prompt | 2.3 | 3.1 | 6 / 8 | 1 / 2 |
| Refine, round 2 | **1.4** | 3.8 | 8 / 8 | 3 / 3 |
| Refine, round 3 | 2.4 | 4.0 | 7 / 6 | 2 / 1 |

Reading:
- The two judges disagree.
  - Page by page, round 2 still wins.
  - Seen as a set, round 2 is the most templated of the three fixes. The set judge listed the habits behind that:
    - the warm off-white surface on 7 of 8 sites;
    - the same heavy grotesk;
    - forest green reused across five unrelated clients.
  - Round 3 removes the shared surface and is judged the least templated set in one of two runs, but loses per-page preference.
- The per-page judge cannot see convergence by construction, because each comparison shows one subject.
- A shared skeleton remains in round 3, and the set judge named it: a huge left headline with a bordered data panel at the right (hours, ledger, pantry grid, timeline), a four-number stat strip and monospace figures. The signature-element rule tends to produce this layout. Varying the surface is not enough; the hero structure also has to vary.
- With 8 pages and one run per arm, the per-page differences between 2.3 and 2.4 are noise.

## Round 4: varying the hero structure too (same 8 pages)

Changes:
- The scan collector now records the first-screen skeleton (`hero`):
  - where the main headline's text sits (left, centred, right, or full width);
  - whether a panel or image sits beside it;
  - whether a photo fills the screen;
  - whether a strip of figures follows.
- `ui-refiner directions` shows the skeleton for each direction and warns when two directions share one.
- The skill now asks for three different hero structures. At most one may be "headline left, panel beside it".

Measured skeletons across the 8 pages:

| Version | Skeletons |
|---|---|
| Before | left + panel 6, left + image 1, left stacked 1 |
| Plain prompt | left + panel 7, left stacked 1 |
| Refine, round 2 | left + panel 4, left stacked 4 |
| Refine, round 3 | left + panel 5, left stacked 3 |
| Refine, round 4 | left stacked 7, centred stacked 1 |

Round 4 took the signature element (hours board, pantry timetable, ledger, timeline) out of a side panel and made it a full-width block below or above the headline. The dental pages put the week strip first. Every surface is plain white, and English headlines now share Public Sans with Familjen Grotesk or Archivo.

Judges (per page: five versions, mean rank 1–5):

| Version | Per-page mean rank | Per-page AI look | Set sameness (run 1 / 2) | Set rank (run 1 / 2) |
|---|---:|---:|---:|---:|
| Before | 5.0 | 8.8 | 9 / 9 | 5 / 4 |
| Plain prompt | 2.4 | 3.1 | 8 / 8 | 4 / 3 |
| Refine, round 2 | **1.9** | 4.0 | 8 / 8 | 3 / 5 |
| Refine, round 3 | 2.9 | 4.1 | 7 / 7 | 2 / 2 |
| Refine, round 4 | 2.9 | 4.0 | **5 / 6** | **1 / 1** |

Reading:
- The set judge put round 4 first in both runs, as the least templated set (sameness 5–6).
- The per-page judge still prefers round 2. Its tendency to reward warm paper surfaces, seen in rounds 1–3, may account for part of that preference.
- Habits the set judge still saw in round 4:
  - heavy grotesk headlines;
  - a data widget carrying the hero on every site;
  - hairline "label | description" lists;
  - square buttons with one saturated accent.
- The skeleton warning works inside one page's three directions, but it cannot see that the agent picks the same winner on every page: 7 of 8 chosen directions were "left headline, stacked". Fixing that needs memory across pages, for example a project-level record of what was chosen before.
- Same limits as before: 8 pages, one run per arm, and Claude judging Claude's output.
