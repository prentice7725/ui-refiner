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
   - Decide the page's tone, one of four, from who visits and why:
     - `calm`: health, care, public services, money people worry about;
     - `warm`: neighbourhood places, food, families, community;
     - `technical`: tools for engineers, operations and analysts;
     - `bold`: campaigns, youth brands, media, events.
     The tone is shared by all three directions.
   - Decide the page kind:
     - `software`: software, SaaS, fintech, startups;
     - `service`: clinics, logistics, hiring and other services;
     - `place`: cafes, bakeries, inns, studios people visit;
     - `public`: public bodies, schools, museums, non-profits;
     - `company`: large corporate sites;
     - `studio`: design and architecture practices;
     - `media`: news and magazines.
   - Run `ui-refiner directions deal refine-directions --kind <kind> --tone <tone> --lang <page language>` (add `--no-photo` when there are no real photos and stand-ins do not fit). It gives each of A, B and C a hero structure and a **material**, and puts what was picked recently for other projects last. Do not pick either yourself.
     - A material is one finished look taken from a physical thing (an enamel sign, a tiled wall, a till receipt). It fixes the ground, the colours, the faces, the surfaces, the controls and how a photo is treated. See [reference/materials/README.md](reference/materials/README.md).
     - Read each dealt material's file before you build its mock. Take its tokens as written, build every surface and control the way it says, use the faces listed for the page's language, and keep out what it lists under Never. A page that only borrows a material's palette is not in the material.
     - A real brand colour replaces the material's accent, and a real brand typeface replaces its faces. Nothing else in the material changes.
     - Until November 2026 the deal handed out a surface, a colour family and faces to avoid as separate parts, and the skill ruled out one habit per benchmark round (cream grounds, forest green, stat strips, hairline tables). The pages passed every check and were still called plain or "wireframe-like", and each habit that was ruled out gave way to the next. A material decides those things together, so do not add or remove surface treatments on your own judgement.
   - Write each direction as five lines, taken from the content, never a style word like "minimal and elegant":
     - direction: what the product or place is, in this client's words ("the clinic's front desk: hours and booking first");
     - tone: the shared tone;
     - world: the real place, trade or object this client's content comes from (a pharmacy counter, a freight yard board, a school notice);
     - moment: the visitor's moment the first screen serves ("a parent checking tonight's hours on the way home");
     - signature: the one element only this client would have, built from real content and made in the material (in Tile, the week's hours as a mosaic; in Receipt, this month's spending as one slip).
   - Write the headline from a fact only this client has: an hour, a condition, a number, a place, an origin story ("Orders in by 2 pm leave today", "No ID needed, ever"). A slogan that would fit any business in the category ("Healthy smiles for every member of the family", "Your team, in sync") was the judges' most common complaint against refined pages.
   - Photographs. Use the client's real photos and product shots first. When there are none and the page kind usually leads with photos (`place`, `service`, `company`), fetch credited stand-ins: `ui-refiner photos "<plain subject>" --out <project>/assets/stand-in --lang <page language>`. It saves only openly licensed Wikimedia Commons files, with `credits.json`.
     - Open each saved photo and keep only those that show this kind of place or this work itself (a pantry shelf, a treatment room, a warehouse floor). An object any office has (a keyboard, a handshake, a laptop) reads as stock. Without a fitting photo, use none. Prefer photos without identifiable faces.
     - Mark every stand-in `data-stand-in`, give it a generic alt ("a dental chair"), put the printed credit line in the footer, and tell the user which images to replace.
     - Treat every photo the way the material's Photos section says. Never use stock sites, invent photos or present a stand-in as the client's own.
   - The first screen, whatever the structure and material:
     - At 1440×900 it says what this is in one line and shows the main action. On a first screen without photos, no other text dwarfs that line.
     - It has one main piece: the photo, the product scene or the signature element, at a size that lets it carry the screen. A photo, a schedule, three cards and two buttons in one screen read as cramped.
     - It shows something real. Places, services and public bodies show photos. Software, finance and logistics show the product: one scene that proves the claim (one booked slot, one transfer, today's three late shipments), built in the material's own surfaces with this client's data, marked `data-product-shot`, a quarter of the screen or more, text 12px or larger, 40 pieces of text at most. Never a drawn phone or browser frame.
     - A signature element is filled with real content at the size that content needs. Never invent data for it.
   - Build each direction as a mock of the first screen plus one content section in `refine-directions/a.html`, `b.html` and `c.html` inside the project. Start each file with `<!-- direction: … | tone: … | world: … | moment: … | type: … | palette: <the material's name> | signature: … -->`.
   - Run `ui-refiner directions refine-directions`. It scans each mock and writes `DIRECTIONS.html` (screenshots side by side) and `DIRECTIONS.md`. Redo a mock before you show anything when the sheet warns that it:
     - was not built in its dealt structure, or does not use its material's faces;
     - shares a surface, a type pair or a hero layout with another direction;
     - repeats a choice made recently for another project;
     - lacks one of the five lines in its note, a claim, the main action, or a photo or product scene.
     Look at the screenshots yourself before you present them: each mock should be recognisable as its material at a glance.
   - Rename test: put a rival's name on each mock. If it still fits, push the world, the moment or the signature further before you show it.
   - **Let the user choose.** Present the three directions (concept, material, signature element) with the path to `DIRECTIONS.html`, give your recommendation and one line on why, then stop and ask which one to apply. Decide yourself only when the user said so or no person is in the loop (CI, a headless run); then say why the other two lost. Do not mix materials: "A's structure in B's material" is fine, half of each material is not.
   - Record the choice: `ui-refiner directions record refine-directions --pick B --page <short page name>`. Do this when you decided yourself, too. The log is per user, in `~/.ui-refiner/refine-log.json`.
   - **Hero review.** Before building the rest of the page, have the chosen mock reviewed in fresh context ([reference/review.md](reference/review.md)). Fix what the review finds in the mock, then carry the mock's first screen into the page.
   - After applying the direction to the whole page:
     - Run `ui-refiner keep check <page>`. It fails when a link, form, field or figure went missing, and lists figures only the new page has. Restore every original figure; never round, update or invent one.
     - Run `ui-refiner directions verify refine-directions <page>`. Models drift back to their habit while building the full page. If it reports drift, rebuild the hero in the chosen structure and check again. It also fails when the first screen lacks a claim or its main button, when other text dwarfs the claim on a screen without photos, and when there is neither a photo nor a product scene.
     - Run the **finish review** in fresh context ([reference/review.md](reference/review.md)), fix what is real, and run both checks again if the page changed.
     - Run `ui-refiner system extract <page>`. It writes `ui-refiner-system.json` and `DESIGN_SYSTEM.md` next to the page, so the site's other pages can be built in the same design (see **The site's other pages**).
   - Then delete `refine-directions/` unless the user wants to keep it.
3. Give the page one **signature element**: something only this subject would have, built from the page's real content, made in the material and made the most memorable thing on the page. Examples: a ledger-style table of this month's spending for a budgeting app, today's opening hours and the next free slot for a clinic, which pantries are open right now for a food bank. Never invent data for it.
4. Apply the chosen direction to the whole page, fixing by root cause in this order:
   - **Structure.** The stock section recipe is the strongest tell: pill badge → hero with a two-tone headline → row of logo names → three feature cards with icons in rounded squares → stats trio → testimonial trio → three-tier pricing with "Most popular" → FAQ → colored CTA band. Keep only sections that carry real content, merge thin ones, and vary the rhythm (a list or table instead of cards, one large feature instead of three equal ones).
   - **Type.** The material's faces, with real size contrast and no tracked uppercase eyebrow over every section.
   - **Color and surface.** The material's tokens, surfaces and controls from the first screen to the footer. Nothing decorative from outside it: no gradient text, glow or glass unless the material's file calls for it, and no boxes inside boxes.
   - **Copy.** Replace stock phrases with the page's own facts. Never invent numbers, quotes, customers or logos; when the page already has invented ones, flag them instead of polishing them.
5. Do not trade one template for another. Cream paper with a serif display face, tiny tracked labels, "01 /" numbering and short headlines ending in a period is the 2025–26 editorial AI template, not an escape from it. A white page with thin rules and one blue accent is the other common fallback, and it is where a page lands when the material is dropped below the first screen.
6. Check the craft on the screenshots, not only the score:
   - **Scale.** The display type is clearly bigger than the body (about 3× or more on a persuasive page; Japanese pages may stay smaller, judged against 日本のサイトとの比較). There are a few deliberate sizes, not many near-identical ones.
   - **Faces.** The material's families only.
   - **Hero.** The first screen is carried by the signature element, the product, a photo or the type itself.
   - **Rhythm.** No three sections in a row share the same layout; section widths, density and alignment change with the content.
   - **Accent.** The material's accent, used where its file says and nowhere else.
   - **Space and alignment.** One spacing scale, a visible grid, aligned edges and baselines.
   - **Details.** Tabular numbers where they line up, real states (open/closed, sold out, selected), no placeholder text.
7. Rescan into the same folder; the report opens with the before/after comparison. The AI-look score is a guard, not the target: no quality issue or Japanese typesetting issue that got worse, and no new scored signal except one the material's file calls for (a tinted ground, a sheen, a shadow), which you name in the report as deliberate. You are done when the direction and the craft checklist show in the screenshots, not when the score reaches 0. At most three rounds.
8. Report: the chosen direction and material (and who chose it), the signature element, both reviews' findings with their outcome, score before → after, resolved and remaining signals (with the reason each remaining one stays), the changes by root cause, what was preserved, and the screenshot paths. Look at the final screenshots before you say it is done.

## The site's other pages

Variety belongs in two places: between the three directions for the main page, so the person has a real choice, and between clients. Within one site the pages should look like one site. So the directions step runs once, for the main page; every other page of the site follows the picked design.

1. Read `DESIGN_SYSTEM.md` (from `ui-refiner system extract <main page>`). If it is missing, run that first.
2. Build or refine the other page with the same type, sizes, colours, main button, box radius, rules, content width and header navigation (the same links in the same order; mark the current page instead of dropping links). Do not deal or pick new directions for it.
3. Give it its own structure from its own content. If the main page is photo-led (the system notes say so), the inner page carries photos too, from the same set: in the inner-page benchmark, text-only inner pages of photo-led clinic and hiring sites lost to plain copies of the home page. An inner page opens with its title and what the visitor came for (the price table, the form, the team, the article), not a second landing hero. Keep the main page's signature element only where it carries this page's content too.
4. Run `ui-refiner keep check` when an existing page was changed, then `ui-refiner system check <page>`. It fails when the page leaves the design (another heading or body face, surface, accent family, button radius or colour, box radius, body or heading size, content width, header links dropped or renamed), or when its AI-look index is 15 or more above the main page's. Fix the drift and check again.
5. Report which pages were built or changed, what each keeps from the system, and the screenshot paths.

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
