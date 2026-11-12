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

## Round 5: dealt directions and a shared log (same 8 pages)

What changed:
- `directions deal` assigns each of the three mocks a hero structure (weighted by the 406-site human reference for that page kind), a type pair, an accent family and a surface.
- `directions record` keeps the chosen direction in a per-user log, and the next deal avoids recent choices.
- The 8 pages ran one after another with one shared log, as one agency would.

The mocks followed their deals, and the directions sheets differed from page to page. The applied pages did not. Five of eight ended as "left headline, stacked" whatever the chosen mock was, and the ko-fintech refine changed published figures (409,847 → 420,000, 4.7 → 4.8).

The set judge now also saw two sheets of real human-made sites for the same kinds of business (human1, human2). On that judge human sets score sameness 2. Round 5 scored 5–6 and ranked with human2, behind human1 and ahead of round 4.

This led to three checks:
- `directions verify` compares the applied page with the chosen mock (hero, surface, type);
- `keep record` and `keep check` list links, forms, fields and figures before and after;
- a Stop hook blocks the end of a refine until both have passed.

Round 6 was stopped because the code changed during the run. Its results are not used.

## Round 7: verify, keep and the finish gate (same 8 pages)

Same as round 5, plus `keep`, `directions verify`, stand-in photos and the Stop gate hook, sequential with a fresh shared log. Cost: $18.96 for 8 pages (37–76 turns each).

- All 8 pages passed `keep check` and `directions verify` with no drift.
- No figure changed. Two pages reported figures that looked new:
  - en-foodbank: the original showed animated counters that start at 0, so keep had recorded none of them. `keep` now reads `data-count` and similar targets.
  - ja-recruit: the figures came from job data that the original only showed in a script-rendered modal.
- Applied heroes: below-fold 2, left stacked 2, right + panel 1, full-bleed photo 1, centred 1, wide headline 1. Round 5 had five pages left stacked.
- Surfaces: white 4, dark 3, pale pink 1. Accent families: red, pink, teal, brown, amber, green, orange.
- Type: eight different families (Source Sans 3 / Schibsted Grotesk, Hanken Grotesk, Commissioner, Atkinson Hyperlegible, Zen Kaku Gothic New, M PLUS Rounded 1c, IBM Plex Sans KR, Gothic A1).
- AI-look index: 0 on all 8 pages.

Judges:

| Version | Per-page mean rank (1–5) | Per-page AI look | Set sameness (run 1 / 2) | Set rank of 8 (run 1 / 2) |
|---|---:|---:|---:|---:|
| Human sites, set 1 | — | — | 2 / 2 | 1 / 1 |
| Human sites, set 2 | — | — | 2 / 2 | 4 / 3 |
| Before | 4.8 | 8.9 | 9 / 8 | 8 / 8 |
| Plain prompt | 2.0 | 3.4 | 8 / 8 | 6 / 5 |
| Refine, round 2 | **1.8** | 4.0 | 8 / 8 | 7 / 7 |
| Refine, round 4 | — | — | 6 / 8 | 5 / 6 |
| Refine, round 5 | 2.9 | 3.5 | 5 / 7 | 3 / 4 |
| Refine, round 7 | 3.6 | 4.5 | **3 / 4** | **2 / 2** |

Reading:
- Across the set, round 7 is the closest to human-made work so far: sameness 3–4 against 2 for real sites. Both runs ranked it right behind the first human set and ahead of the second.
- Page by page, the judge liked it least of the refine arms. Its notes reward a polished, familiar page, which is the quality the set judge counts against a set when every page shares it. A real client sees one page, so this cost is real and is the next thing to work on.
- Habits the set judge still saw: heavy grotesk headlines, client data (schedules, ledgers, shipment tables) as the hero, hairline-ruled tables, stat rows.
- Same limits as before: 8 pages, one run per arm, and Claude judging Claude's output.

## Round 8: first-screen check (same 8 pages)

Same as round 7, plus the first-screen check: `directions verify` and the finish gate now fail a page whose first screen has no one-line claim or no main action, and the below-fold brief says real content may lead but must not replace the claim. Cost: $18.76 for 8 pages (37–84 turns each).

- All 8 pages passed `keep check` and `directions verify`.
- First screen: all 8 pages show a claim and the main action above the fold. In round 7, en-saas and ko-fintech had neither, because a board pushed them down.
- Applied heroes: below-fold 3, right + panel 1, full-bleed 1, left stacked 1, wide stacked 1, centred 1.
- Surfaces: white 5, dark 2, yellow 1. Type: eight different families again.

Judges:

| Version | Per-page mean rank (1–5) | Per-page AI look | Set sameness (run 1 / 2) | Set rank of 8 (run 1 / 2) |
|---|---:|---:|---:|---:|
| Human sites, set 1 | — | — | 1 / 2 | 1 / 1 |
| Human sites, set 2 | — | — | 2 / 2 | 4 / 4 |
| Before | 4.6 | 8.6 | 8 / 9 | 7 / 7 |
| Plain prompt | 2.4 | 3.0 | 9 / 9 | 8 / 8 |
| Refine, round 2 | **1.6** | 3.5 | 8 / 8 | 6 / 6 |
| Refine, round 5 | — | — | 6 / 7 | 5 / 5 |
| Refine, round 7 | 3.3 | 4.4 | 5 / 4 | 3 / 3 |
| Refine, round 8 | 3.1 | 4.1 | **3 / 4** | **2 / 2** |

Reading:
- Across the set, round 8 holds round 7's place: right behind the first human set in both runs, now ahead of round 7.
- Page by page it improved on round 7 (hierarchy 6.9 → 7.3, mean rank 3.3 → 3.1), but round 2 and the plain prompt still win single pages.
- Habits the set judge still saw: heavy grotesk headlines, schedules and tables as the hero, hairline dividers.
- Same limits as before: 8 pages, one run per arm, and Claude judging Claude's output.

## Round 9: claim size check, image-led below-fold (same 8 pages)

Same as round 8, plus a claim size check and an image-led below-fold:
- `directions verify` and the finish gate fail a text-led first screen whose claim is under 0.6 of its largest text.
- The skill asks for a claim of about 44–64px as the largest text on the first screen.
- `below-fold` is now image-led, in the image family, and not dealt with `--no-photo`.

Cost: $17.88 ($16.13 for the 8 refines at 38–73 turns each, $1.75 for the judges).

- All 8 pages passed `keep check` and `directions verify`. The claim is the largest text on all 8 (44–75px, ratio 1).
- Applied heroes: wide stacked 2, left stacked 2, centred 1, left + panel 1, full-bleed 1, below-fold 1 (photos, ja-dental).
- Surfaces: white on all 8, although every deal offered a dark, brand or paper surface. Round 8 had 3 non-white.

Judges (the same run judged round 8 again, so its figures differ from the round 8 table):

| Version | Per-page mean rank (1–5) | Per-page AI look | Set sameness (run 1 / 2) | Set rank of 8 (run 1 / 2) |
|---|---:|---:|---:|---:|
| Human sites, set 1 | — | — | 1 / 2 | 1 / 1 |
| Human sites, set 2 | — | — | 2 / 2 | 5 / 3 |
| Before | 5.0 | 8.8 | 9 / 8 | 8 / 7 |
| Plain prompt | 2.5 | 3.0 | 8 / 9 | 7 / 8 |
| Refine, round 2 | **1.5** | 3.6 | 7 / 8 | 6 / 6 |
| Refine, round 7 | — | — | 3 / 5 | 3 / 4 |
| Refine, round 8 | 2.5 | 3.8 | **3 / 4** | **2 / 2** |
| Refine, round 9 | 3.5 | 4.5 | 5 / 6 | 4 / 5 |

Reading:
- Round 9 is worse than round 8 on both judges. Page by page, distinctiveness fell 7.4 → 6.1 and typography 7.1 → 6.9. Across the set, sameness rose from 3–4 to 5–6.
- The set judge named the shared look: plain white pages, a bold sans headline, then a schedule, table or ledger right under it.
- The size check worked as a check, but a large claim on white over a data widget became the new template. Every page picked white, which removed the variety the surface deal used to bring.
- Same limits as before: 8 pages, one run per arm, and Claude judging Claude's output. Round 8's per-page rank moved 3.1 → 2.5 between runs, so differences under about 0.6 are noise.

## Round 10: no headline size, white-run note (same 8 pages)

Same as round 9, with two changes:
- The skill no longer asks for a 44–64px claim. The dwarfed-claim check stays.
- The skill says white is the usual surface but not every time. The directions sheet notes a run of four white picks for other projects.

Cost: $20.00 ($18.26 for the 8 refines at 33–77 turns each, $1.74 for the judges).

- All 8 pages passed `keep check` and `directions verify`. The claim is the largest text on all 8.
- Applied heroes: left stacked 2, left + panel 1, centred 1, full-bleed 1, wide stacked 1, left + media 1, right + panel 1.
- Surfaces: white 2. The other six are blue, near-black, two off-whites, dark brown and pale green. The white-run note never fired, because the first page already picked blue. The pick changed through the skill text, not through the note.

Judges (same run as the table, so the figures differ from earlier rounds):

| Version | Per-page mean rank (1–5) | Per-page AI look | Set sameness (run 1 / 2) | Set rank of 8 (run 1 / 2) |
|---|---:|---:|---:|---:|
| Human sites, set 1 | — | — | 2 / 2 | 1 / 1 |
| Human sites, set 2 | — | — | 2 / 2 | 4 / 2 |
| Before | 4.9 | 8.6 | 9 / 9 | 8 / 8 |
| Plain prompt | 2.3 | 3.4 | 8 / 8 | 7 / 6 |
| Refine, round 2 | **2.0** | 3.8 | 7 / 9 | 6 / 7 |
| Refine, round 8 | 2.8 | 3.8 | 4 / 5 | 3 / 3 |
| Refine, round 9 | — | — | 6 / 6 | 5 / 5 |
| Refine, round 10 | 3.1 | 4.3 | 4 / 5 | **2** / 4 |

Reading:
- Round 10 recovered round 9's losses:
  - Across the set, sameness is back to round 8's level (4–5), and it ranked right behind the first human set in run 1.
  - Page by page, distinctiveness rose 6.1 → 6.6 and the mean rank 3.5 → 3.1. Round 8's 2.8 is within the noise.
- It did not beat round 8, and round 2 and the plain prompt still win single pages.
- Six non-white surfaces out of eight is more than human sites have (about 1 in 5).
- Habits the set judge still saw:
  - the same grotesk headline;
  - weekday hours tables or schedule bars, which recur on the dental, food-bank, clinic and hiring pages;
  - thin-rule lists;
  - stat rows.
- Same limits as before: 8 pages, one run per arm, and Claude judging Claude's output.

## Round 11: a photo or a large product screen on the first screen (same 8 pages)

Same as round 10, with one new check. A first screen fails `directions verify` and the finish gate when:
- it has neither a photo over 10% of the screen nor a product screen built in code (marked `data-product-shot`) over 25% of it;
- or that product screen holds more than three bits of text under 12px.

Of 138 human first screens, 21% would fail the photo half.

Cost: $21.19 ($19.42 for the 8 refines at 40–73 turns each, $1.78 for the judges).

- All 8 pages passed `keep check` and `directions verify`. The claim is the largest text on all 8.
- Images on the first screen:
  - the four service pages (dental ×2, food bank, hiring) used photos or marked stand-ins;
  - the four software pages (SaaS, two fintech, logistics) used one product screen each.
- Applied heroes: left stacked 2, centred 2, full-bleed 1, image-led below-fold 1, wide stacked 1, right + panel 1.
- Surfaces: white 5, blue 2, warm greige 1.

Judges (same run as the table, so the figures differ from earlier rounds):

| Version | Per-page mean rank (1–5) | Per-page AI look | Set sameness (run 1 / 2) | Set rank of 8 (run 1 / 2) |
|---|---:|---:|---:|---:|
| Human sites, set 1 | — | — | 2 / 1 | 1 / 1 |
| Human sites, set 2 | — | — | 2 / 2 | 5 / 2 |
| Before | 4.9 | 8.8 | 9 / 8 | 8 / 8 |
| Plain prompt | 2.0 | 2.9 | 8 / 9 | 6 / 7 |
| Refine, round 2 | **1.8** | 3.9 | 8 / 8 | 7 / 6 |
| Refine, round 8 | — | — | 3 / 5 | **2** / 5 |
| Refine, round 10 | 2.9 | 4.4 | 4 / 4 | 3 / **3** |
| Refine, round 11 | 3.5 | 4.4 | 4 / 5 | 4 / 4 |

Reading:
- The check did its job: every page now shows a photo or a product screen, and the wireframe look of round 10 is gone from the screenshots.
- It did not raise the judged quality:
  - page by page, round 11 ranked behind round 10 (3.5 vs 2.9), and its typography score fell 6.9 → 6.4;
  - across the set it held round 10's sameness (4–5) but ranked one place lower in both runs.
- The plain prompt and round 2 still win single pages, and neither has a photo. Images alone do not explain the gap.
- Habits the set judge still saw: data-table or schedule heroes, a weekday hours strip on the clinic and food-bank pages, the same blue on two clients, stat rows, two-column feature lists.
- Same limits as before: 8 pages, one run per arm, and Claude judging Claude's output. Differences under about 0.6 in the per-page rank are noise.

## Round 12: the deal keeps structure and surface only; headlines from client facts (same 8 pages)

From this round on, two outside judges rank the same screenshots next to Claude: Gemini (`gemini-4-argon-high` in the Antigravity CLI) and Grok (`--reasoning-effort xhigh`). Both get the same prompt and the same hidden-label shots, read-only.

Round 11 re-judged by all three agreed with Claude. Per-page mean rank, Claude / Gemini / Grok: round 2 1.8 / 1.6 / 2.5, plain prompt 2.0 / 2.4 / 1.8, round 11 3.5 / 2.9 / 2.9. Their notes on why the winners won:
- the headline states a fact only this client has;
- one strong typeface is pushed through the page;
- the first screen has one main piece that answers the visitor's first question.

They called round 11's dealt type pairings plain, its first screens cramped, and some stand-in photos stock-like (a keyboard and mouse for hiring, a smiling family under a slogan for the dental page).

Changes for round 12:
- `directions deal` deals the hero structure and the surface only. It lists the faces to avoid (overused pairings and faces picked for other projects lately); the agent picks the type and accent itself.
- The skill asks for one strong display face per direction, headlines built from a client fact (no category slogans), one main piece on the first screen, and stand-in photos of the place or the work itself, or none.

Cost: $19.84 ($18.31 for the 8 refines at 35–78 turns each, $1.53 for the Claude judges). Gemini and Grok ran on their own accounts.

- All 8 pages passed `keep check` and `directions verify`.
- Headlines, all from the brief's facts: "Plan the week on Monday, ship by Friday", "$612 saved in the first month, on average.", "Open till 7 pm on Tuesdays and Thursdays, and Saturday mornings.", "Free groceries at five pantries. No ID, no paperwork.", 「16時30分に退勤して、保育園へ迎えに行くPMがいます。」, 「月火水金は19時まで、土曜は17時まで診ます。」, "카드 한 번 연동하면, 지난 3개월이 정리돼요", "출고 현황 취합에 쓰던 하루 3시간, 한 화면으로 끝냅니다".
- Faces chosen: Archivo; Big Shoulders Display; Gloock; Libre Franklin; Shippori Mincho B1; Zen Kaku Gothic New; Black Han Sans; SUIT.
- Surfaces: white 4, dark 3 (both Korean pages and the US fintech page), clinic green 1.

| Version | Mean rank, Claude / Gemini / Grok | Firsts of 24 | Set sameness, Claude / Gemini / Grok | Set rank of 8, Claude / Gemini / Grok |
|---|---:|---:|---:|---:|
| Human sites, set 1 | — | — | 2 / 1 / 2 | 1 / 1 / 2 |
| Human sites, set 2 | — | — | 2 / 2 / 2 | 3 / 7 / 4 |
| Before | 5.0 / 4.9 / 4.9 | 0 | 9 / 9 / 8 | 8 / 6 / 7 |
| Plain prompt | 2.6 / 2.6 / 2.1 | 8 | 7 / 10 / 9 | 6 / 8 / 8 |
| Refine, round 2 | 2.1 / **1.6** / 2.6 | 7 | 7 / 8 / 6 | 7 / 5 / 6 |
| Refine, round 10 | — | — | 5 / 5 / 4 | 4 / 4 / 3 |
| Refine, round 11 | 3.1 / 3.0 / 3.0 | 1 | 6 / 4 / 5 | 5 / 3 / 5 |
| Refine, round 12 | **2.1** / 2.9 / 2.4 | **8** | **4 / 4 / 3** | **2 / 2 / 1** |

Reading:
- Across the set, round 12 is the best refine so far for all three judges: second only to human set 1 for Claude and Gemini, and first for Grok. Grok's note on what the set shares: "Headlines state a concrete operational fact".
- Page by page it closed most of the gap. Round 12 averages 2.5 across judges, against 2.4 for the plain prompt and 2.1 for round 2; round 11 averaged 3.0. It took 8 of 24 first places, the same as the plain prompt.
- It wins the place pages and loses the dark software pages:
  - food bank: first for all three; Japanese clinic and US clinic: first for two of three;
  - Korean fintech and Korean logistics: 4th or 5th for every judge. All three called the dark navy or black dashboard with a lime or blue accent a familiar crypto or dev-tool template.
- Same limits: 8 pages, one run per arm. Two outside judges now take Claude-judging-Claude out of the result, but differences under about 0.6 in the per-page rank are still noise.

## Round 13: no dark dashboard for software pages (same 8 pages)

In round 12 all three judges ranked both Korean software pages 4th or 5th of 5, and each called the dark navy or black dashboard with a lime or blue accent a crypto or dev-tool template. Both pages had been dealt a dark ground and took it.

Changes:
- `directions deal` gives no dark ground to software pages. The non-white direction gets a brand or paper ground.
- The dark brief asks for a dark ground carried by a photo or by type, not a dashboard.
- The skill warns against the dark dashboard template for product screens.

Cost: $22.80 ($21.29 for the 8 refines at 54–90 turns each, $1.51 for the Claude judges).

- All 8 pages passed `keep check` and `directions verify`.
- Surfaces: white 5, paper-green 1 (US fintech), saturated blue 1 (Japanese hiring), dark 1 (food bank, dealt to a public page).

| Version | Mean rank, Claude / Gemini / Grok | Firsts of 24 | Set sameness, Claude / Gemini / Grok | Set rank of 8, Claude / Gemini / Grok |
|---|---:|---:|---:|---:|
| Human sites, set 1 | — | — | 2 / 1 / 2 | 1 / 1 / 1 |
| Human sites, set 2 | — | — | 2 / 2 / 3 | 5 / 2 / 2 |
| Before | 4.9 / 5.0 / 4.9 | 0 | 9 / 9 / 8 | 8 / 7 / 7 |
| Plain prompt | 2.5 / 2.3 / 2.4 | 9 | 8 / 10 / 9 | 7 / 8 / 8 |
| Refine, round 2 | **2.0** / **2.1** / **2.1** | 6 | 8 / 8 / 7 | 6 / 6 / 6 |
| Refine, round 11 | — | — | 4 / 6 / 4 | 3 / 5 / 3 |
| Refine, round 12 | 2.8 / 2.8 / 2.9 | 5 | 4 / 4 / 6 | **2** / **3** / 5 |
| Refine, round 13 | 2.9 / 2.9 / 2.8 | 4 | 4 / 5 / 5 | 4 / 4 / 4 |

Korean software pages, rank of 5, Claude / Gemini / Grok:

| Page | Round 12 (this run) | Round 13 |
|---|---|---|
| Korean fintech | 3 / 4 / 5 | 2 / 3 / 2 |
| Korean logistics | 3 / 4 / 3 | 2 / 2 / 2 |

Reading:
- The fix worked where it was aimed. Both Korean pages rose to 2nd or 3rd for every judge; Gemini called the logistics page "clean Swiss-style … high-trust light mode".
- Overall, round 13 did not beat round 12: the per-page means are within 0.1, and across the set it ranked 4th for all three judges against round 12's 2nd–5th. With five of eight pages on white, Gemini saw "light white or warm-cream" pages with bordered tables as the shared habit.
- New losses came from choices the change did not touch:
  - the food bank took a dealt dark ground and an image-led structure with a small headline ("cold for a community food bank");
  - the Japanese hiring page picked an ultra-heavy display face (Dela Gothic One) that two judges said hurt reading in Japanese;
  - the US fintech headline ran to four lines.
- Round 12's own means moved from 2.1–2.9 to 2.8–2.9 between the two runs, with the same pages and a different line-up. Single-run differences under about 0.6 are noise; per-page swings like the Korean ones above are the more reliable signal.

## Round 14: tone before the deal, five-line directions, one-scene product shots (same 8 pages)

Round 13 lost pages on choices the deal did not touch: a dark ground on the food bank, an ultra-heavy face on the Japanese hiring page, and (in the unslop comparison) harsh condensed capitals on the family dental page. This round borrowed the direction-setting idea from [unslop](REFINE_BENCHMARK_UNSLOP_2026-11-11_KO.md).

Changes:
- The agent picks a page tone (calm, warm, technical, bold) before the deal. `directions deal --tone` narrows surfaces and faces: calm and warm pages get no dark ground and avoid condensed, display and mono voices.
- Each direction is written as five lines: direction, tone, world, moment, signature. `directions compare` warns when a line is missing.
- A new first-screen check, `busy-shot`, flags a product screen with more than 40 pieces of text.
- Polish levels by scan score, and a rename test at the end.

Cost: about $23.50 ($21.97 for the 8 refines at 53–82 turns each, about $1.50 for the Claude judges).

- All 8 pages passed `keep check` and `directions verify`. Every direction note had all five lines. `busy-shot` did not fire; the five product shots held 16–29 pieces of text.
- Tones chosen: calm 5 (all three consumer-software pages and both dental pages), warm 2 (food bank, Japanese hiring), technical 1 (Korean logistics), bold 0.
- Surfaces: white or paper 5, forest-green brand ground 3 (US fintech, Japanese hiring, Korean fintech).

| Version | Mean rank, Claude / Gemini / Grok | Firsts of 24 | Set sameness, Claude / Gemini / Grok | Set rank of 8, Claude / Gemini / Grok |
|---|---:|---:|---:|---:|
| Human sites, set 1 | — | — | 2 / 1 / 2 | 1 / 1 / 1 |
| Human sites, set 2 | — | — | 2 / 2 / 2 | 2 / 5 / 2 |
| Before | 5.0 / 4.9 / 5.0 | 0 | 10 / 9 / 8 | 8 / 7 / 7 |
| Plain prompt | 2.1 / 2.1 / 2.8 | 5 | 9 / 10 / 9 | 7 / 8 / 8 |
| Refine, round 2 | **2.0** / **1.6** / **1.9** | 12 | 8 / 8 / 7 | 6 / 6 / 5 |
| Refine, round 12 | — | — | 4 / 6 / 6 | 3 / 4 / 4 |
| Refine, round 13 | 3.0 / 3.4 / 2.6 | 3 | 5 / 4 / 5 | 4 / **2** / **3** |
| Refine, round 14 | 2.9 / 3.0 / 2.8 | 4 | 6 / 5 / 8 | 5 / 3 / 6 |

Round 13 losses, rank of 5, Claude / Gemini / Grok:

| Page | Round 13 (this run) | Round 14 |
|---|---|---|
| US food bank | 4 / 4 / 3 | **1 / 1 / 2** |
| US dental | 4 / 4 / 1 | 1 / 3 / 4 |
| Japanese hiring | 3 / 4 / 2 | 4 / 2 / 4 |
| US fintech | 4 / 4 / 4 | 3 / 3 / 3 |

Reading:
- The tone fixed the food bank. Warm, with photos of the pantry and an open-or-closed strip, it ranked first for Claude and Gemini ("warm, grounded … authentic photography").
- The tone did not lift the set. With five of eight pages calm and three on the same forest green, the set judges named the green as the shared habit ("deep forest green as the main color on most sites"; Grok: "every page is either white or the same forest green"). Grok rated the set 8 of 10 for sameness, against 5 for round 13. The tone narrows faces and grounds but leaves the accent hue free, and the agent reached for the same calm green each time.
- Calm went to every consumer-software page. The tone choice itself has no spread across the set.
- The Japanese hiring page dropped the heavy face but still put a job grid in the hero; Claude called it crowded even at 27 pieces of text, under the `busy-shot` limit.
- Per-page means are level with round 13 and still behind round 2 and the plain prompt.

## Round 15: a dealt colour family per direction (same 8 pages)

In round 14 the tone narrowed faces and grounds but left colour free, and three of eight pages took the same forest-green ground. The check only looked at button colour, so a green ground behind a yellow button counted as yellow.

Changes:
- `directions deal` deals each direction a colour family again: the hue of a brand ground, or of the accent on a white or paper page. Families used recently for other projects, ground or accent, are dealt last.
- The colour a page reads as is its ground when the ground is a clear colour, otherwise its accent. `directions` warns when a mock leaves its family or repeats another project's.

Cost: about $22.20 ($20.66 for the 8 refines at 43–72 turns each, about $1.50 for the Claude judges).

- All 8 pages passed `keep check` and `directions verify`, and every page kept its dealt family: ink, brown, teal, red ground, magenta ground, navy, green and orange. `busy-shot` did not fire; the five product shots held 14–30 pieces of text.
- Tones chosen: calm 4, technical 3, warm 1. Surfaces: white 5, red brand ground 1 (food bank), magenta brand ground 1 (Japanese hiring), paper 1 (Japanese dental).

| Version | Mean rank, Claude / Gemini / Grok | Firsts of 24 | Set sameness, Claude / Gemini / Grok | Set rank of 8, Claude / Gemini / Grok |
|---|---:|---:|---:|---:|
| Human sites, set 1 | — | — | 1 / 3* / 2 | 1 / 1* / 1 |
| Human sites, set 2 | — | — | 2 / 2 / 2 | 4 / 6 / 2 |
| Before | 4.9 / 4.9 / 5.0 | 0 | 9 / 9 / 8 | 8 / 7 / 7 |
| Plain prompt | 2.1 / 2.3 / **1.4** | 12 | 8 / 10 / 9 | 6 / 8 / 8 |
| Refine, round 2 | **1.8** / **1.8** / 3.0 | 8 | 8 / 7 / 6 | 7 / 5 / 4 |
| Refine, round 13 | — | — | 4 / 1* / 5 | 3 / 3* / 3 |
| Refine, round 14 | 2.5 / 2.5 / 3.3 | 3 | 7 / 5 / 8 | 5 / 4 / 6 |
| Refine, round 15 | 3.8 / 3.6 / 2.4 | 1 | **4 / 3 / 7** | **2 / 2** / 5 |

\* Gemini's notes for the round 13 sheet describe the human sites and its notes for human set 1 describe refined pages, so it likely swapped the two; the round 15 figures are not affected.

Reading:
- The colour deal did what it was aimed at. The set split into red, magenta, green, orange, brown, teal, navy and black; Claude and Gemini ranked round 15 the most varied refine set so far, second only to human set 1. Grok still saw one serif display face and "one saturated skin on white" across the set.
- Per page it cost Claude and Gemini more than a rank. Dealt colours that did not fit the subject were the reason most often given:
  - US fintech in brown with a quirky serif, the reading order reversed;
  - the food bank's full red hero "feels heavy" (Claude 4th; Gemini and Grok 2nd and 3rd);
  - the Japanese hiring page in magenta, "a bit heavy";
  - Korean logistics in Black Han Sans, which two judges called hard to read. The technical tone does not exclude display faces.
- The Japanese dental page came last for Claude and Gemini over a dated, cluttered treatment-room stand-in photo.
- Grok went the other way (2.4, from 3.3), but its round 2 mean also moved from 1.9 to 3.0 between the two runs; single-run differences under about 0.6 are noise.
- Next: deal the colour family within what fits the tone (no full red or magenta ground on a calm or warm page), and keep display faces off Korean and Japanese headings for every tone.
