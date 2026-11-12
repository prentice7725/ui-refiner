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

First decide how much to change, from the scan score and the screenshots:
- **20 or more** (most AI-made pages; 0–15% of human-made calibration sites): the full refine below, with three directions.
- **8 to 19**: polish. Keep the structure, palette and type; fix the signals you confirmed and the craft list in step 4. Skip the directions step. Still run `keep record` before and `keep check` after.
- **Under 8, with no confirmed signal**: say the page does not read as generated, list any craft fixes, and change nothing unless the user asks for a new direction.
- A real brand (logo files, design tokens, a documented palette or typeface) moves a page one level down: polish it instead of replacing it, unless the user asks for a redesign.

1. Scan and look at both screenshots. Write down what the page is for, its one primary action, and what must survive: every fact, price, name, link target, form field and legal text. Then record it: `ui-refiner keep record <page>` saves the link targets, forms, fields, contact links and figures, so the redesign can be checked against them. Brand assets survive only when the project really has them (logo files, design tokens, a documented palette or typeface). A palette or font that came with a generated page is not a brand, so you may change it.
2. Explore three directions before touching the page:
   - Before the deal, decide the page's tone, one of four, from who visits and why:
     - `calm`: health, care, public services, money people worry about;
     - `warm`: neighbourhood places, food, families, community;
     - `technical`: tools for engineers, operations and analysts;
     - `bold`: campaigns, youth brands, media, events.
     The tone is shared by all three directions; they differ inside it. It keeps the type and ground from fighting the subject: judges called condensed capitals on a black-and-red ground "harsh for a family dental practice", an ultra-heavy Japanese face (Dela Gothic One) hard to read on a hiring page, and a dark food-bank page "cold for a community food bank".
   - Write each direction as five lines, taken from the content, never a style word like "minimal and elegant":
     - direction: what the product or place is, in this client's words ("the clinic's front desk: hours and booking first");
     - tone: the shared tone;
     - world: where the look comes from, a real place, trade or object this client belongs to (a pharmacy counter, a freight yard board, a school notice); take the palette and the type's character from it;
     - moment: the visitor's moment the first screen serves ("a parent checking tonight's hours on the way home");
     - signature: the one element only this client would have, built from real content.
     Then give each a type pairing (a display face plus a text face, and a named Japanese or Korean family on those pages), a palette from its world and what carries the hero (the product, a photo, data or typography, never a gradient).
   - Choose the type yourself, one strong face per direction, picked for this subject and pushed through the whole page: a confident display face at a clear size contrast, one family for every figure, body text 16px or more. In benchmark round 11, three judges (Claude, Gemini, Grok) put the pages that pushed one strong look of their own (a serif editorial or a heavy grotesk) first in 21 of 24 page rankings; the refined pages built from dealt pairings such as Work Sans or Hanken Grotesk were called "plain" and "clunky". Avoid the faces the deal lists: the overused ones (3 of 4 English pages used Bricolage Grotesque + Instrument Sans in the November 2026 benchmark) and those picked recently for other projects.
   - Write the headline from a fact only this client has: an hour, a condition, a number, a place, an origin story ("Orders in by 2 pm leave today", "No ID needed, ever"). A slogan that would fit any business in the category ("Healthy smiles for every member of the family", "Your team, in sync") was the judges' most common complaint against the refined pages.
   - The three must differ in at least three of: structure, typefaces, palette, what carries the hero.
   - Do not pick the hero structures or surfaces yourself. First decide the page kind:
     - `software`: software, SaaS, fintech, startups;
     - `service`: clinics, logistics, hiring and other services;
     - `place`: cafes, bakeries, inns, studios people visit;
     - `public`: public bodies, schools, museums, non-profits;
     - `company`: large corporate sites;
     - `studio`: design and architecture practices;
     - `media`: news and magazines.
     Then run `ui-refiner directions deal refine-directions --kind <kind> --tone <tone> --lang <page language>`. The tone takes the dark ground away from calm and warm pages and adds the display faces that fight it (condensed, ultra-heavy, mono) to the faces to avoid. A real brand surface overrides the dealt one.
   - Photographs. Human-made sites open with a full-bleed photo a third of the time, and pages with no imagery read as generated. Use the client's real photos and product shots first. When there are none and the page kind usually leads with photos (`place`, `service`, `company`), fetch credited stand-ins: `ui-refiner photos "<plain subject>" --out <project>/assets/stand-in --lang <page language>`. It saves only openly licensed Wikimedia Commons files, with `credits.json`.
     - Open each saved photo and keep only those that show this kind of place or this work itself (a pantry shelf, a treatment room, a warehouse floor). An object any office has (a keyboard, a mouse, a handshake, a laptop) reads as stock: all three judges flagged one on the hiring page in round 11. Without a fitting photo, use none. Prefer photos without identifiable faces.
     - Mark every stand-in `data-stand-in` and give it a generic alt ("a dental chair"), never "our clinic" or a staff name.
     - Put the printed credit line in the footer.
     - Tell the user which images are stand-ins to replace.
     - Pass `--no-photo` to the deal instead when stand-ins do not fit (software pages, or the user declines them). Never use stock sites, invent photos or present a stand-in as the client's own. It assigns A, B and C three different structures (split, stacked, full-bleed image, signature first …) and puts the ones recently chosen for other projects last. Among the rest it prefers structures that are common on human-made sites. Measured on 110 of them, 32% open with content and no visible headline, 27% with a full-bleed photo, and only 4% use the AI favourite of a left headline with a side panel. The sheet shows each share. Each direction gets a structure and a surface, and the deal lists faces to avoid. Build `a.html` with what was dealt to A, `b.html` with B's, and so on. Left alone, models build the same hero for every client: in the November 2026 benchmark the originals, the plain-prompt fix and the early refine rounds almost all used a big left headline with a panel at the right. When asked to vary, they then chose "left headline, signature below" for 7 of 8 pages.
   - Choose each page surface on purpose. Faint off-white (#f4f4f1, #f6f3ec) is the AI default: 7 of 8 refined pages in the benchmark landed on it, while 70–87% of human-made calibration sites use plain white. Give at most one direction a tinted paper surface; the others use plain white, a dark ground or a clear brand colour. When choosing, white is the usual pick, but not every time: in round 9 all 8 pages picked the white direction over a dealt dark, brand or paper one, and the set read as one template. If the sheet notes that your last picks for other projects were all white, take the dealt non-white direction unless the brand calls for white.
   - Whatever the structure, the first screen at 1440×900 must say what this is in one line and show the main action. On a first screen without photos, no other text dwarfs the claim: on 125 human-made sites it was the largest text in 76 of the 82 first screens that had one. Its size follows the type pairing and the brand; do not default every page to one big headline on white, which round 9 of the benchmark showed becomes its own template. A signature element (week board, ledger, timetable) sits beside or below the claim and never uses larger type than it; in round 8 a board whose day labels outsized a 30px headline was judged among the worst. Its labels stay readable (13px or more). Human first screens without a headline are mostly image-led (30 of 43 had photos over half the screen), so "content first" means real photos, products or listings with pictures, never a text or data board. Fill a signature element with real content at a size its content needs: an oversized, mostly empty week board reads as broken. `directions` and `directions verify` warn on a missing claim, on a claim dwarfed by other text, and on a headline whose button sits below the fold.
   - Give the first screen one main piece: the photo, the product screen or the signature element, at a size that lets it breathe. A photo, a schedule, three cards and two buttons in one screen read as cramped; it was the judges' second most common complaint in round 11. With a photo, put the hours or the schedule in one short line or just below the fold.
   - Show something real on the first screen. On 138 human-made first screens, 66% had a photo or image over 30% of the screen and only 21% had under 10%. In benchmark rounds 9 and 10, six of eight refined pages had no image at all and read as wireframes next to the originals.
     - Places, services, clinics, shops and public bodies: use real photos, or credited stand-ins from `ui-refiner photos` until the real ones arrive. When you choose the direction yourself, prefer the photo direction.
     - Software, finance and logistics: show the product. Build a large, finished product screen in code (a real app view with this client's data, not a hairline table or a floating-card collage), mark its outer element `data-product-shot`, and give it at least a quarter of the first screen. Its text stays readable: 12px or more, 14px for anything the visitor should read. Removing the old phone mockup is not the fix; its shadows and floating badges were the tell, not the product. Do not wrap it in the dark dashboard template: a near-black or navy ground, rows of metric cards and a neon lime or electric blue accent. In round 12 all three judges called it a crypto or dev-tool look and ranked both Korean software pages 4th or 5th of 5; the deal no longer gives software pages a dark ground. Show the screen on the page's own white, brand or paper ground, in the client's colours, as a person would use it.
     - Show one scene that proves the claim, not the whole app: one booked slot, one reviewed change, today's three late shipments. Of 21 refined product screens in rounds 11–13 and the unslop comparison, 19 held 17–35 pieces of text on the first screen; the two over 40, both hiring boards with five columns of cards, were the ones judges called crowded or dense.
     - `directions verify` fails a first screen with neither (image under 10% and no product shot of 25% or more), one whose product shot is full of text under 12px, and one whose product shot holds more than 40 pieces of text.
   - Build each as a quick mock of the first screen plus one content section in `refine-directions/a.html`, `b.html` and `c.html` inside the project; the scan's browser may not open files outside it. Start each file with `<!-- direction: … | tone: … | world: … | moment: … | type: … | palette: … | signature: … -->`.
   - Run `ui-refiner directions refine-directions`. It scans each mock and writes `DIRECTIONS.html` (screenshots side by side) and `DIRECTIONS.md`, with the measured surface, type and hero layout of each. It also reads the deal and the choice log. Redo a mock before you show anything when the sheet warns that it:
     - shares a surface, a type pair or a hero layout with another direction;
     - was not built in its dealt structure;
     - repeats a choice made recently for another project;
     - lacks one of the five lines in its note.
     Also redo when all directions sit on off-white. Look at the screenshots yourself before you present them.
   - Rename test, last: put a rival's name on each mock. If it still fits, it is not this client's direction yet. Push the world, the moment or the signature further before you show it.
   - **Let the user choose.** Present the three directions (concept, type, palette, signature element, what the scan found) with the path to `DIRECTIONS.html`, give your recommendation and one line on why, then stop and ask which one to apply. Mixing is allowed ("A's hero with B's palette"). Decide yourself only when the user said so or no person is in the loop (CI, a headless run); then say why the other two lost.
   - Once a direction is chosen, record it: `ui-refiner directions record refine-directions --pick B --page <short page name>`. Do this when you decided yourself, too. The log is per user, in `~/.ui-refiner/refine-log.json`. Pages of the same project may share a direction; other clients should not get it again.
   - After applying the direction, run `ui-refiner keep check <page>`. It fails when a link, form, field or figure went missing. It also lists figures that only the new page has. A benchmark refine rounded 409,847 users to 420,000 and 4.7 stars to 4.8. Restore every original figure; never round, update or invent one.
   - After applying the direction to the real page, run `ui-refiner directions verify refine-directions <page>`. Models drift back to their habit while building the full page: in the benchmark a page whose chosen mock opened with content ended as "left headline, stacked". If the check reports drift, rebuild the hero in the chosen structure, then check again. It also fails when the first screen lacks a claim or its main button, or when other text dwarfs the claim on a screen without photos. Keep the drift only when the user asked for the change.
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
