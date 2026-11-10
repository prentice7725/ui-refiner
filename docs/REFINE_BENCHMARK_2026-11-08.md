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
