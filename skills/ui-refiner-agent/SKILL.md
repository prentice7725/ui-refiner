---
name: ui-refiner-agent
description: Make web pages and app screens that do not look AI-generated, review existing pages, and refine AI-looking pages in place. Use when building or restyling a landing page, screen, layout or component; when asked "AI 티 안 나게", "AI 티 빼줘", "디자인 점검", "이 페이지 디자인 개선 제안", "make this look less generic/AI-made", "de-slop this page", "review this site's design", "AIっぽくないデザイン", "AIっぽさを消して", "このサイトのデザインを点検"; Japanese typesetting reviews; or when asked to run UI Refiner. Not for Canvas, native game HUDs or backend-only work.
---

# UI Refiner — design without the AI look

Three jobs: **Build** a screen that looks chosen rather than generated, **Review** an existing page and propose a better design, and **Refine** an AI-looking page in place and measure the change. All rely on the same toolkit:

- `scan` — zero-config rendered review of any URL: AI-look signals, baseline accessibility/layout measurements, desktop + mobile screenshots, and a proposal-oriented `DESIGN_REVIEW.md`.
- suta guidance — `vendor/suta/skills/suta/SKILL.md` (Korean): the AI-slop red lines, layout/motion values and 57 tested UI patterns.
- `check` — the deep, policy-enforced QA gate for projects that install UI Refiner. Optional; see [reference/quality-gate.md](reference/quality-gate.md).

`UI_REFINER` below means the UI Refiner checkout: `tools/ui-refiner` inside the app, or two levels above this file when installed as a plugin or skill. Run commands with `node <UI_REFINER>/bin/ui-refiner.mjs …`. First use needs `npm ci` and `npx playwright install chromium` in that checkout.

## Review an existing page

1. Run `ui-refiner scan <url>` (add `--source <dir>` when you also have the source). The report language follows the page unless `UI_REFINER_LANG` is set; pass `--lang ko|ja|en` only when the user wants a different language. Any http(s) URL, host name or local dev server works. Never put credentials in the URL.
2. Open `scan-desktop.png` and `scan-mobile.png` yourself and look before you read the signals. Write down: what the page is for, what it asks the user to do, where the eye lands first, and what feels generic.
3. Read `DESIGN_REVIEW.md`. Signals are heuristics. Confirm each against the screenshot; drop the ones that are deliberate brand choices or wrong for the surface (dashboards and settings may rightly use system fonts and dense layouts).
4. Report to the user, in this order:
   - **Verdict** in one or two sentences (what makes it look generated or not).
   - **2–3 root causes**, not a list of signals. Example: "decoration stands in for hierarchy" covers gradient hero + glows + pill badge + gradient headline.
   - **Proposed direction** per cause: concrete changes (type pairing and scale, one accent color, layout structure, imagery, copy rewrite with facts), and what must be preserved (factual copy, link targets, form fields, brand color/typeface).
   - **Baseline quality issues** from the scan table that a user would actually hit (contrast, unlabeled controls, mobile overflow).
5. Only edit code when asked. After edits, rerun the same `scan` command (same page, same output folder compares automatically) and show the comparison section (score change, resolved/new/remaining signals, before/after screenshots). Treat new signals as regressions to explain or fix.

## Refine an AI-looking page

Use this when the user wants a page they own made less generic, not just reviewed. Removing the tells is not the goal. A page that only lost its gradients and cards is plain, not designed. The goal is a page with a point of view that fits this content.

1. Scan and look at both screenshots. Write down what the page is for, its one primary action, and what must survive: every fact, price, name, link target, form field and legal text. Then record it: `ui-refiner keep record <page>` saves the link targets, forms, fields, contact links and figures, so the redesign can be checked against them. Brand assets survive only when the project really has them (logo files, design tokens, a documented palette or typeface). A palette or font that came with a generated page is not a brand, so you may change it.
2. Explore three directions before touching the page:
   - Write each as a one-line concept taken from the content ("a ledger you want to keep", "the clinic's front desk: hours and booking first"), never a style word like "minimal and elegant". Give each a type pairing (a chosen display face plus a text face, and a named Japanese or Korean family on those pages), a palette and what carries the hero (the product, a photo, data or typography, never a gradient). The faces come from the deal (below). Left to themselves, models land on the same pairs: in the November 2026 benchmark, 3 of 4 English pages used Bricolage Grotesque + Instrument Sans, and later rounds settled on heavy grotesks with IBM Plex Mono figures and a dark green accent.
   - The three must differ in at least three of: structure, typefaces, palette, what carries the hero.
   - Do not pick the hero structures, typefaces or accent colours yourself. First decide the page kind:
     - `software`: software, SaaS, fintech, startups;
     - `service`: clinics, logistics, hiring and other services;
     - `place`: cafes, bakeries, inns, studios people visit;
     - `public`: public bodies, schools, museums, non-profits;
     - `company`: large corporate sites;
     - `studio`: design and architecture practices;
     - `media`: news and magazines.
     Then run `ui-refiner directions deal refine-directions --kind <kind> --lang <page language>`. Real brand fonts and colours override the dealt ones.
   - Photographs. Human-made sites open with a full-bleed photo a third of the time, and pages with no imagery read as generated. Use the client's real photos and product shots first. When there are none and the page kind usually leads with photos (`place`, `service`, `company`), fetch credited stand-ins: `ui-refiner photos "<plain subject>" --out <project>/assets/stand-in --lang <page language>`. It saves only openly licensed Wikimedia Commons files, with `credits.json`.
     - Open each saved photo and keep only those that fit the subject, era and place. Prefer ones without identifiable faces.
     - Mark every stand-in `data-stand-in` and give it a generic alt ("a dental chair"), never "our clinic" or a staff name.
     - Put the printed credit line in the footer.
     - Tell the user which images are stand-ins to replace.
     - Pass `--no-photo` to the deal instead when stand-ins do not fit (software pages, or the user declines them). Never use stock sites, invent photos or present a stand-in as the client's own. It assigns A, B and C three different structures (split, stacked, full-bleed image, signature first …) and puts the ones recently chosen for other projects last. Among the rest it prefers structures that are common on human-made sites. Measured on 110 of them, 32% open with content and no visible headline, 27% with a full-bleed photo, and only 4% use the AI favourite of a left headline with a side panel. The sheet shows each share. Each direction gets a structure, a Google Fonts pairing (three different voices), an accent hue family and a surface. Build `a.html` with everything dealt to A, `b.html` with B's, and so on. Left alone, models build the same hero for every client: in the November 2026 benchmark the originals, the plain-prompt fix and the early refine rounds almost all used a big left headline with a panel at the right. When asked to vary, they then chose "left headline, signature below" for 7 of 8 pages.
   - Choose each page surface on purpose. Faint off-white (#f4f4f1, #f6f3ec) is the AI default: 7 of 8 refined pages in the benchmark landed on it, while 70–87% of human-made calibration sites use plain white. Give at most one direction a tinted paper surface; the others use plain white, a dark ground or a clear brand colour.
   - Whatever the structure, the first screen at 1440×900 must say what this is in one line and show the main action. "Content first" means real products, hours or listings in place of a big headline, not a large board or dashboard that pushes the claim and button below the fold. In benchmark round 7 the two pages that did this were judged worst of their sets. Of 33 small human sites, only 1 had neither a claim nor a large photo on the first screen. Fill a signature element with real content at a size its content needs: an oversized, mostly empty week board reads as broken. `directions` and `directions verify` warn on a missing claim and on a headline whose button sits below the fold.
   - Build each as a quick mock of the first screen plus one content section in `refine-directions/a.html`, `b.html` and `c.html` inside the project; the scan's browser may not open files outside it. Start each file with `<!-- direction: concept | type: … | palette: … | signature: … -->`.
   - Run `ui-refiner directions refine-directions`. It scans each mock and writes `DIRECTIONS.html` (screenshots side by side) and `DIRECTIONS.md`, with the measured surface, type and hero layout of each. It also reads the deal and the choice log. Redo a mock before you show anything when the sheet warns that it:
     - shares a surface, a type pair or a hero layout with another direction;
     - was not built in its dealt structure;
     - repeats a choice made recently for another project.
     Also redo when all directions sit on off-white. Look at the screenshots yourself before you present them.
   - **Let the user choose.** Present the three directions (concept, type, palette, signature element, what the scan found) with the path to `DIRECTIONS.html`, give your recommendation and one line on why, then stop and ask which one to apply. Mixing is allowed ("A's hero with B's palette"). Decide yourself only when the user said so or no person is in the loop (CI, a headless run); then say why the other two lost.
   - Once a direction is chosen, record it: `ui-refiner directions record refine-directions --pick B --page <short page name>`. Do this when you decided yourself, too. The log is per user, in `~/.ui-refiner/refine-log.json`. Pages of the same project may share a direction; other clients should not get it again.
   - After applying the direction, run `ui-refiner keep check <page>`. It fails when a link, form, field or figure went missing. It also lists figures that only the new page has. A benchmark refine rounded 409,847 users to 420,000 and 4.7 stars to 4.8. Restore every original figure; never round, update or invent one.
   - After applying the direction to the real page, run `ui-refiner directions verify refine-directions <page>`. Models drift back to their habit while building the full page: in the benchmark a page whose chosen mock opened with content ended as "left headline, stacked". If the check reports drift, rebuild the hero in the chosen structure, then check again. It also fails when the first screen lacks a claim or its main button. Keep the drift only when the user asked for the change.
   - Then delete `refine-directions/` unless the user wants to keep it.
3. Give the page one **signature element**: something only this subject would have, built from the page's real content and made the most memorable thing on the page. Examples: a ledger-style table of this month's spending for a budgeting app, today's opening hours and the next free slot for a clinic, which pantries are open right now for a food bank. Never invent data for it.
4. Apply the chosen direction to the whole page, fixing by root cause in this order:
   - **Structure.** The stock section recipe is the strongest tell: pill badge → hero with a two-tone headline → row of logo names → three feature cards with icons in rounded squares → stats trio → testimonial trio → three-tier pricing with "Most popular" → FAQ → colored CTA band. Keep only sections that carry real content, merge thin ones, and vary the rhythm (a list or table instead of cards, one large feature instead of three equal ones).
   - **Type.** Real size contrast, one or two families, no tracked uppercase eyebrow over every section.
   - **Color and surface.** One accent; no gradient text, glows or glass; fewer rounded boxes and no boxes inside boxes.
   - **Copy.** Replace stock phrases with the page's own facts. Never invent numbers, quotes, customers or logos; when the page already has invented ones, flag them instead of polishing them.
5. Do not trade one template for another. Cream paper with a serif display face, tiny tracked labels, "01 /" numbering and short headlines ending in a period is the 2025–26 editorial AI template, not an escape from it. A white page with thin rules and one blue accent is the other common fallback.
6. Check the craft on the screenshots, not only the score:
   - **Scale.** The display type is clearly bigger than the body (about 3× or more on a persuasive page; Japanese pages may stay smaller, judged against 日本のサイトとの比較). There are a few deliberate sizes, not many near-identical ones.
   - **Faces.** At most two families, and the display face is a choice that suits the subject.
   - **Hero.** The first screen is carried by the signature element, the product, a photo or the type itself.
   - **Rhythm.** No three sections in a row share the same layout; section widths, density and alignment change with the content.
   - **Accent.** One accent, used for the primary action and the signature element, not sprinkled everywhere.
   - **Space and alignment.** One spacing scale, a visible grid, aligned edges and baselines.
   - **Details.** Tabular numbers where they line up, real states (open/closed, sold out, selected), no placeholder text.
7. Rescan into the same folder; the report opens with the before/after comparison. The AI-look score is a guard, not the target: no new scored signals and no quality issue or Japanese typesetting issue that got worse. You are done when the direction and the craft checklist show in the screenshots, not when the score reaches 0. At most three rounds.
8. Report: the chosen direction (and who chose it), the signature element, score before → after, resolved and remaining signals (with the reason each remaining one stays), the changes by root cause, what was preserved, and the screenshot paths. Look at the final screenshots before you say it is done.

## Build a new screen

1. Read the project first: framework, styling method, existing tokens and components, brand assets. Existing systems are the source of values.
2. Read the suta guidance (`vendor/suta/skills/suta/SKILL.md`, especially "AI 슬롭 금지선", layout and motion values) and the patterns you will use.
3. Decide the design direction **before** writing markup and state it in two or three lines: surface purpose (persuade / operate / read), the one primary action, type pairing and scale, one accent color, and what carries the hero (product, photo, data, typography — not a gradient).
4. Avoid the defaults that read as generated:
   - purple/indigo gradient heroes, gradient headline text, glass cards, colored glows;
   - three identical icon-title-blurb cards, icons in tinted rounded squares, cards inside cards, a pill badge above the headline, everything centered;
   - the stock section recipe (logo-name row, stats trio, testimonial trio, three-tier pricing, FAQ, CTA band) when the content does not need each section;
   - emoji as icons, untouched Tailwind indigo/violet or Bootstrap blue, one generic font at flat sizes;
   - "Unlock your potential / seamless / supercharge / 잠재력 / 혁신적인" copy and repeated "Learn more" buttons;
   - `transition: all`, animating layout properties, ignoring `prefers-reduced-motion`, `div` with `onClick`.
5. Use real content (product screenshots, numbers, specific use cases). If content is missing, leave an honest placeholder and say so instead of inventing claims.
6. Run the dev server and `ui-refiner scan http://127.0.0.1:<port> --source src`. Fix strong and moderate signals that are not deliberate, plus contrast/label/overflow issues. Rerun the same scan after each round; it compares with the previous scan automatically, so resolved and new signals are explicit. At most two fix-and-rescan rounds; then report what remains and why.
7. Look at the screenshots before claiming the result is done.

## Japanese pages (日本語)

- Japanese pages get a Japanese report and `.jp` hosts a `ja-JP` browser automatically; use `--lang ko|en --locale ja-JP` to read a Japanese page's report in another language.
- The report adds **日本語タイポグラフィ** when the page is Japanese: a font stack without a Japanese family (the classic AI `Inter, sans-serif`), body line height below 1.45, heading orphans (泣き別れ) per viewport, `word-break: break-all` on headings, italic Japanese, negative tracking, text under 12px, half-width katakana and full-width alphanumerics. It ends with **日本のサイトとの比較**: where the page's body size, line height, type scale, hues, centering, rounding and contrast failures sit among about 200 measured Japanese sites (`data/ja-reference`). Use it to tell a house norm from an outlier. Do not report a value only because it is outside the range.
- When building Japanese UI: name a Japanese family after the Latin one (`Inter, "Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", sans-serif`), use body line height 1.7–2.0, break headings by phrase (`word-break: auto-phrase`, BudouX or `<wbr>`) with `text-wrap: balance`, never italicize Japanese, and tighten only punctuation with `font-feature-settings: "palt"`.
- Rewrite stock copy (可能性を解き放つ, シームレスな, 次世代の, ビジネスを加速, 誰でも簡単に) with concrete facts and numbers, and make repeated 「詳しく見る」 buttons say where they go.
- Japanese conventions are not AI tells: Hiragino/Noto/Yu Gothic stacks, denser layouts and modest heading sizes are normal on Japanese sites. Judge against Japanese references, not Western landing pages.

## Ground rules

- Scan output is advisory: it never blocks, writes baselines, or changes policy. Do not game the score; a low score is not proof of good design and a deliberate brand gradient is fine.
- The scan sees one page state per viewport. Interaction states, auth-only pages and app-wide consistency need the deep gate or manual checks.
- Final visual acceptance belongs to a human. State what you verified (scan, screenshots) and what you did not.
