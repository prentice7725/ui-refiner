---
name: ui-refiner-agent
description: Make web pages and app screens that do not look AI-generated, review existing pages, and refine AI-looking pages in place. Holds 13 themes measured from real Korean and Japanese sites (clinic, inn, shop, public body, company, studio) to start a new site from. Use when building or restyling a landing page, screen, layout or component; when asked "AI 티 안 나게", "업종 테마로 만들어 줘", "テーマで作って", "AI 티 빼줘", "디자인 점검", "이 페이지 디자인 개선 제안", "make this look less generic/AI-made", "de-slop this page", "review this site's design", "AIっぽくないデザイン", "AIっぽさを消して", "このサイトのデザインを点検"; Japanese typesetting reviews; or when asked to run UI Refiner. Not for Canvas, native game HUDs or backend-only work.
---

# UI Refiner — design without the AI look

Three jobs: **Build** a screen that looks chosen rather than generated, **Review** an existing page and propose a better design, and **Refine** an AI-looking page in place and measure the change. All rely on the same toolkit:

- themes — 13 finished designs measured from 1761 human-made Korean and Japanese sites, one per purpose family and country ([reference/themes/README.md](reference/themes/README.md)).
- `scan` — zero-config rendered review of any URL: AI-look signals, baseline accessibility/layout measurements, desktop + mobile screenshots, and a proposal-oriented `DESIGN_REVIEW.md`.
- suta guidance — `vendor/suta/skills/suta/SKILL.md` (Korean): the AI-slop red lines, layout/motion values and 57 tested UI patterns.
- `check` — the deep, policy-enforced QA gate for projects that install UI Refiner. Optional; see [reference/quality-gate.md](reference/quality-gate.md).

`UI_REFINER` below means the UI Refiner checkout: `tools/ui-refiner` inside the app, or two levels above this file when installed as a plugin or skill. Run commands with `node <UI_REFINER>/bin/ui-refiner.mjs …`. First use needs `npm ci` and `npx playwright install chromium` in that checkout.

## Review an existing page

1. Run `ui-refiner scan <url>` (add `--source <dir>` when you also have the source). The report language follows the page unless `UI_REFINER_LANG` is set; pass `--lang ko|ja|en` only when the user wants a different language. Any http(s) URL, host name or local dev server works. Never put credentials in the URL.
2. Open `scan-desktop.png` and `scan-mobile.png` yourself and look before you read the signals. Write down: what the page is for, what it asks the user to do, where the eye lands first, and what feels generic.
3. Read `DESIGN_REVIEW.md`. Signals are heuristics. Confirm each against the screenshot; drop the ones that are deliberate brand choices or wrong for the surface (dashboards and settings may rightly use system fonts and dense layouts).
4. Report to the user, in this order:
   - **Verdict**: the report's verdict line and score, then its points table ("Why this score": which signal added how many points, what a deliberate-design sign took off). The verdict follows the score: 20 or more reads as AI-made, 8–19 is unclear (a fifth to a quarter of human-made Japanese and Korean sites score there), under 8 does not read as AI-made. When you reject a signal as a deliberate brand choice, say so and say what the score would be without it. When the user confirms it is their brand (a brand typeface, a brand colour), record it with `ui-refiner allow add <signal> --reason "…"`: later scans then report it without scoring it.
   - **2–3 root causes**, not a list of signals. Example: "decoration stands in for hierarchy" covers gradient hero + glows + pill badge + gradient headline.
   - **Proposed direction** per cause: concrete changes (type pairing and scale, one accent color, layout structure, imagery, copy rewrite with facts), and what must be preserved (factual copy, link targets, form fields, brand color/typeface).
   - **Baseline quality issues** from the scan table that a user would actually hit (contrast, unlabeled controls, mobile overflow), and every `placeholder-text` row: an all-zero phone number or postcode, "○○町", "OO구", "Lorem ipsum" or "[Company Name]" left in the page, for the person to replace with the real value.
5. Only edit code when asked. After edits, rerun the same `scan` command (same page, same output folder compares automatically) and show the comparison section (score change, resolved/new/remaining signals, before/after screenshots). Treat new signals as regressions to explain or fix.

## Refine an AI-looking page

Use this when the user wants a page they own made less generic, not just reviewed. Removing the tells is not the goal. A page that only lost its gradients and cards is plain, not designed. The goal is a page with a point of view that fits this content.

First decide how much to change, from the scan score and the screenshots:
- **20 or more** (most AI-made pages; 0–15% of human-made calibration sites): the full refine below, with three directions.
- **8 to 19**: polish. Keep the structure, palette and type; fix the signals you confirmed and the craft list in step 4. Skip the directions step. Still run `keep record` before and `keep check` after.
- **Under 8, with no confirmed signal**: say the page does not read as generated, list any craft fixes, and change nothing unless the user asks for a new direction.
- A real brand (logo files, design tokens, a documented palette or typeface) moves a page one level down: polish it instead of replacing it, unless the user asks for a redesign.

1. Scan and look at both screenshots. Write down what the page is for, its one primary action, and what must survive: every fact, price, name, link target, form field and legal text. Then record it: `ui-refiner keep record <page>` saves the link targets, forms, fields, contact links and figures, so the redesign can be checked against them. Brand assets survive only when the project really has them (logo files, design tokens, a documented palette or typeface). A palette or font that came with a generated page is not a brand, so you may change it.
2. Offer three directions before touching the page. They are built from three different sources, so they start apart ([reference/lanes/README.md](reference/lanes/README.md)):
   - **A · familiar**: what human-made sites of this kind do, as measured. Reads as a real site of its kind; the least surprising.
   - **B · tailored**: colour, type and look decided from this client's own content (the method of benchmark round 12).
   - **C · bold**: one material, a finished look taken from a physical thing, from the first screen to the footer.

   Through benchmark round 17 the three directions were built from one set of guidance and differed only in dealt parts; they came out alike, and every habit that was ruled out gave way to the next. In the round-18 pilot no single method was best on every page: the tailored method gave the most varied sets, the material pages were the most distinctive and the most disputed. So the person chooses.

   - Decide the page kind:
     - `software`: software, SaaS, fintech, startups;
     - `service`: clinics, logistics, hiring and other services;
     - `place`: cafes, bakeries, inns, studios people visit;
     - `public`: public bodies, schools, museums, non-profits;
     - `company`: large corporate sites;
     - `studio`: design and architecture practices;
     - `media`: news and magazines.
   - Decide the page's tone, one of four, from who visits and why. It keeps a dark ground and harsh display faces away from subjects that cannot carry them:
     - `calm`: health, care, public services, money people worry about;
     - `warm`: neighbourhood places, food, families, community;
     - `technical`: tools for engineers, operations and analysts;
     - `bold`: campaigns, youth brands, media, events.
   - Photographs. Use the client's real photos and product shots first. When there are none and the page kind usually leads with photos (`place`, `service`, `company`), fetch credited stand-ins before the deal: `ui-refiner photos "<plain subject>" --out <project>/assets/stand-in --lang <page language>`. It saves only openly licensed Wikimedia Commons files, with `credits.json`, as WebP at three widths, and prints an `<img>` line with `srcset` for each. Build every stand-in from that line: keep `srcset`, `width` and `height`, set `sizes` to the width the photo really takes, put `fetchpriority="high"` on the first-screen photo and `loading="lazy"` on the others. A photo used as a CSS background loses all this, so prefer an `<img>` with `object-fit: cover`. Open each saved photo and delete those that do not show this kind of place or this work itself. Tell the user which images are stand-ins to replace. When stand-ins do not fit (software pages, or the user declines them), pass `--no-photo` to the deal. Never use stock sites, invent photos or present a stand-in as the client's own.
   - Trade. On a Korean or Japanese page, also name the client's trade when it is one of: `salon`, `beauty`, `skin` (dermatology and cosmetic clinics), `dental`, `kmed` (Korean medicine clinics), `cosmetics`, `fitness`, `wedding`, `restaurant`, `food`, `farm` (farms, breweries, local produce), `inn`, `tourism`, `event`, `academy`, `kids`, `tax` (tax, accounting, law offices), `finance`, `realestate`, `builder`, `interior`, `maker`, `car`, `ec`, `fashion`, `game` (games, entertainment), `software` (software and SaaS companies, system developers), `design` (graphic and web design offices), `hospital` (hospitals and medical centres), `local` (cleaning, moving, opticians, vets), `corp` (company sites of established firms), `logistics`, `hiring` (recruitment sites), `media` (newspapers, broadcasters, publishers), `culture` (museums, galleries, cultural foundations), `org` (chambers of commerce, associations), `gov` (local governments, public corporations and agencies), `university`. Pass it as `--trade <trade>`; the familiar direction then follows what human-made sites of that trade do in that country (1790 sites measured in November 2026). Leave it out when none fits.
   - Run `ui-refiner directions deal refine-directions --kind <kind> [--trade <trade>] --tone <tone> --lang <page language>`. It writes `DEAL.json`: for each of A, B and C a hero structure, its lane file and what that lane needs (A: a white surface and a colour family common on human-made sites of this kind; B: a surface; C: one material and an alternate), plus the faces to avoid. Do not pick any of these yourself.
   - **Build each direction in its own subagent**, all three in one message so they run at the same time. Give each only:
     - the path of [reference/lanes/README.md](reference/lanes/README.md) and of its own lane file, to read first;
     - the path of the page, the page kind, tone and language;
     - its own entry from `DEAL.json` and the faces to avoid;
     - the file to write: `refine-directions/a.html`, `b.html` or `c.html`.

     Do not tell a subagent what the other two are, and do not suggest a concept, a typeface, a palette or a signature element. Do not build a mock yourself. Without a subagent tool, build the three one after another, re-reading only that lane's file before each, and say so in the report.
   - Run `ui-refiner directions refine-directions`. It scans each mock and writes `DIRECTIONS.html` (screenshots side by side) and `DIRECTIONS.md`. Look at the screenshots yourself. When the sheet warns about a mock (not built in its dealt structure, a missing line in its note, no claim or main action on the first screen, no photo or product scene, the same hero layout, faces or colour family as another direction), send that mock back to a new subagent with its lane file and the warning text only, then run the sheet again.
   - **Let the user choose.** Present the three directions by name (familiar, tailored, bold) with one line each on what it is and its signature element, the path to `DIRECTIONS.html`, your recommendation and one line on why. Then stop and ask which one to apply. Mixing structure is fine ("B's look in A's structure"); do not mix two looks. The person may also ask for a direction turned up or down ("B, a little bolder"); see **Bolder or quieter**. Decide yourself only when the user said so or no person is in the loop (CI, a headless run); then say why the other two lost.
   - Record the choice: `ui-refiner directions record refine-directions --pick B --page <short page name> --said "<the person's words>"`. Do this when you decided yourself, too. `--said` takes what the person wrote about the choice, word for word ("B 구조에 A 색", "C는 너무 과해"); never a paraphrase, never text from the page, and leave it out when you decided yourself or they said nothing beyond the letter. The log also keeps the two directions not picked. The log is per user, in `~/.ui-refiner/refine-log.json`; the next client's bold direction will not be dealt the material picked here.
   - Taste that reaches past this page. When the person rules something out in a way that sounds general ("크림 바탕은 이제 그만", "明朝体はクリニックには合わない"), ask whether it holds for every client or only this kind of page, and add it only on their yes: `ui-refiner prefer add <hero|face|accent|surface|material> <value> --said "<their words>" [--kind <kind>]`. The next deal leaves it out of all three directions and lists it in `DEAL.json` (`preferences`). Never add one the person did not say, and never a "favour": only what to leave out. Something about this client alone ("the headline should say Pricing") is not a preference. At the end of a refine, `ui-refiner prefer suggest` lists their recorded words not yet turned into a preference and looks shown three or more times and never picked; put those to the person as questions, never as rules. `prefer remove` retires one when they change their mind.
3. Apply the chosen direction to the whole page. Read its lane file yourself first (and the material's file for the bold direction): what it says about ground, colour, type and surfaces holds from the first screen to the footer. Carry the mock's first screen into the page without its `<!-- direction: … -->` comment (nothing about the tool ships in the page), then fix by root cause in this order:
   - **Structure.** The stock section recipe is the strongest tell: pill badge → hero with a two-tone headline → row of logo names → three feature cards with icons in rounded squares → stats trio → testimonial trio → three-tier pricing with "Most popular" → FAQ → colored CTA band. Keep only sections that carry real content, merge thin ones, and vary the rhythm (a list or table instead of cards, one large feature instead of three equal ones).
   - **Type.** The direction's faces, with real size contrast and no tracked uppercase eyebrow over every section.
   - **Color and surface.** The direction's ground and accent throughout. No gradient text, glow or glass unless a material's file calls for it, and no boxes inside boxes.
   - **Copy.** Replace stock phrases with the page's own facts. Never invent numbers, quotes, customers or logos; when the page already has invented ones, flag them instead of polishing them.
4. Check that nothing was lost and that the direction held:
   - Run `ui-refiner keep check <page>`. It fails when a link, form, field or figure went missing, and lists figures only the new page has. Restore every original figure; never round, update or invent one.
   - Run `ui-refiner stress <page>`. It swaps realistic worst-case values (longer button and menu labels, a second clause on headings, long emails, URLs and phone numbers, big figures) into the rendered text at 320, 390 and 1440px and lists only what those values broke, each with the CSS that usually fixes it. Fix every **broken** row in the CSS, never by shortening the client's copy. **Ugly** rows (a label that wraps, an image that changes shape) are decisions: fix them when the fix is cheap, otherwise list them in the report. The real copy stays as it is; the swap happens only in the check's browser.
   - Run `ui-refiner directions verify refine-directions <page>`. Models drift back to their habit while building the full page. If it reports drift, rebuild the hero in the chosen structure and check again. It also fails when the first screen lacks a claim or its main button, when other text dwarfs the claim on a screen without photos, and when there is neither a photo nor a product scene. It fails too when a web-font stylesheet (Google Fonts and the like) blocks the first paint, or a stand-in photo has no `srcset`. Load font stylesheets as `<link rel="stylesheet" href="…" media="print" onload="this.media='all'">` with a `<noscript>` copy, keeping `preconnect` and `display=swap`; the page looks the same once loaded, and in the benchmark one page painted in 0.66 s instead of 2.9 s. Each weight of a Japanese or Korean face is fetched as dozens of slices, so ask for the weights the page uses, not a range.
   - For the **bold** direction, run the finish review in fresh context ([reference/review.md](reference/review.md)), fix what is real once, and run both checks again if the page changed. In the pilot the review made material pages clearer in most comparisons; on pages without a material it changed little and is not needed.
5. Check the craft on the screenshots, not only the score:
   - **Scale.** A few deliberate sizes, not many near-identical ones. The display type is clearly bigger than the body; how much bigger follows the direction (modest for the familiar one, about 3× on a persuasive tailored page; Japanese pages are judged against 日本のサイトとの比較).
   - **Hero.** The first screen is carried by one thing: a photo, the product, the signature element or the type itself.
   - **Rhythm.** No three sections in a row share the same layout, and no surface repeats in every section.
   - **Accent.** One accent, used for the primary action and the signature element, not sprinkled everywhere.
   - **Space and alignment.** One spacing scale, a visible grid, aligned edges and baselines.
   - **Details.** Tabular numbers where they line up, real states (open/closed, sold out, selected), no placeholder text.
6. Rescan into the same folder; the report opens with the before/after comparison. The AI-look score is a guard, not the target: no quality issue or Japanese typesetting issue that got worse, and no new scored signal except one a material's file calls for (its gradient or tinted ground). A page in the familiar direction has its plain typeface recorded in `ui-refiner-allow.json` by `directions record`, so it is reported without being scored. You are done when the direction and the craft list show in the screenshots, not when the score reaches 0. At most three rounds.
7. Once the page passes `keep check` and `directions verify`, run `ui-refiner system extract <page>`. It writes `ui-refiner-system.json` and `DESIGN_SYSTEM.md` next to the page, so the site's other pages can be built in the same design (see **The site's other pages**). Then delete `refine-directions/` unless the user wants to keep it.
8. Report: the chosen direction (familiar, tailored or bold; the material if bold) and who chose it, the signature element, score and verdict before → after, resolved and remaining signals (with the reason each remaining one stays), the changes by root cause, what was preserved, which images are stand-ins, and the screenshot paths. Look at the final screenshots before you say it is done. List every `placeholder-text` value the rescan still shows as a value the client must supply; never replace one with an invented phone number, address or name.

## Bolder or quieter

When the person wants a refined page stronger or calmer ("B, but a little bolder", "the pricing section is too loud"), do not start a new refine. Follow [reference/steer.md](reference/steer.md): it turns up or down what the page already has, inside the named target, and adds nothing from outside the chosen direction. The person may ask for it together with the pick; then apply the direction first and steer afterwards.

## The site's other pages

Variety belongs in two places: between the three directions for the main page, so the person has a real choice, and between clients. Within one site the pages should look like one site. So the directions step runs once, for the main page; every other page of the site follows the picked design.

1. Read `DESIGN_SYSTEM.md` (from `ui-refiner system extract <main page>`). If it is missing, run that first.
2. Build or refine the other page with the same type, sizes, colours, main button, box radius, rules, content width and header navigation (the same links in the same order; mark the current page instead of dropping links). Do not deal or pick new directions for it.
3. Give it its own structure from its own content. If the main page is photo-led (the system notes say so), the inner page carries photos too, from the same set: in the inner-page benchmark, text-only inner pages of photo-led clinic and hiring sites lost to plain copies of the home page. An inner page opens with its title and what the visitor came for (the price table, the form, the team, the article), not a second landing hero. Keep the main page's signature element only where it carries this page's content too.
4. Run `ui-refiner keep check` when an existing page was changed, then `ui-refiner system check <page>`. It fails when the page leaves the design (another heading or body face, surface, accent family, button radius or colour, box radius, body or heading size, content width, header links dropped or renamed), or when its AI-look index is 15 or more above the main page's. Fix the drift and check again.
5. Report which pages were built or changed, what each keeps from the system, and the screenshot paths.

## Build a new screen

1. Read the project first: framework, styling method, existing tokens and components, brand assets. Existing systems are the source of values.
   - For a Korean or Japanese site with no design system of its own (a clinic, an inn, a shop, a public body, a company, a studio), start from a theme. Read [reference/themes/README.md](reference/themes/README.md), pick the theme by country and purpose family, and check the client has the material it needs: photo-led and dark themes need the client's own photographs, otherwise take the white-quiet or standard-corporate theme of that family. Read its `theme.md`, `theme.css` and `sample.html`, then follow "Applying a theme to a client's content": the client's menu and content mapped onto the skeleton, no invented sections, generated images marked and named in the footer. A theme replaces steps 2–3; steps 5–7 still apply. Say which theme you used and which photographs the client still needs.
2. Read the suta guidance (`vendor/suta/skills/suta/SKILL.md`, especially "AI 슬롭 금지선", layout and motion values) and the patterns you will use.
3. Decide the design direction **before** writing markup and state it in two or three lines: surface purpose (persuade / operate / read), the one primary action, type pairing and scale, one accent color, and what carries the hero (product, photo, data, typography — not a gradient).
4. Avoid the defaults that read as generated:
   - purple/indigo gradient heroes, gradient headline text, glass cards, colored glows;
   - three identical icon-title-blurb cards, icons in tinted rounded squares, cards inside cards, a pill badge above the headline, everything centered;
   - the stock section recipe (logo-name row, stats trio, testimonial trio, three-tier pricing, FAQ, CTA band) when the content does not need each section;
   - emoji as icons, untouched Tailwind indigo/violet or Bootstrap blue, one generic font at flat sizes;
   - "Unlock your potential / seamless / supercharge / 잠재력 / 혁신적인" copy and repeated "Learn more" buttons;
   - `transition: all`, animating layout properties, ignoring `prefers-reduced-motion`, `div` with `onClick`.
   - a viewport meta that blocks zoom (`user-scalable=no`, `maximum-scale=1`), form fields under 16px on phones, fields that refuse paste.
5. Use real content (product screenshots, numbers, specific use cases). If content is missing, leave an honest placeholder and say so instead of inventing claims.
6. Run the dev server and `ui-refiner scan http://127.0.0.1:<port> --source src`. Fix strong and moderate signals that are not deliberate, plus contrast/label/overflow issues. Rerun the same scan after each round; it compares with the previous scan automatically, so resolved and new signals are explicit. At most two fix-and-rescan rounds; then report what remains and why. Then run `ui-refiner stress http://127.0.0.1:<port>` and fix its broken rows: a screen built against its own demo copy breaks first on a longer label, a long email or a phone number with an extension.
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
