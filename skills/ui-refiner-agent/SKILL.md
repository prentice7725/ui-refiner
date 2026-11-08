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

Use this when the user wants a page they own made less generic, not just reviewed. The goal is a page that looks decided for this content, not a different stock look.

1. Scan and look at both screenshots. Write down what the page is for, its one primary action, and what must survive: every fact, price, name, link target, form field and legal text, plus any brand logo, color or typeface the project already uses.
2. Choose a direction before editing and state it in three lines:
   - one principle taken from the content, not a style word ("a clinic: calm, opening hours and booking first", not "minimal and elegant");
   - a type pairing: a chosen display face plus a readable text face, and for Japanese or Korean pages a named Japanese or Korean family;
   - one accent color taken from the brand or the subject, and what carries the hero (a product view, a photo, data or typography — not a gradient).
3. Fix by root cause, in this order:
   - **Structure.** The stock section recipe is the strongest tell: pill badge → hero with a two-tone headline → row of logo names → three feature cards with icons in rounded squares → stats trio → testimonial trio → three-tier pricing with "Most popular" → FAQ → colored CTA band. Keep only sections that carry real content, merge thin ones, and vary the rhythm (a list or table instead of cards, one large feature instead of three equal ones).
   - **Type.** Real size contrast, one or two families, no tracked uppercase eyebrow over every section.
   - **Color and surface.** One accent; no gradient text, glows or glass; fewer rounded boxes and no boxes inside boxes.
   - **Copy.** Replace stock phrases with the page's own facts. Never invent numbers, quotes, customers or logos; when the page already has invented ones, flag them instead of polishing them.
4. Do not trade one template for another. Cream paper with a serif display face, tiny tracked labels, "01 /" numbering and short headlines ending in a period is the 2025–26 editorial AI template, not an escape from it.
5. Rescan into the same folder; the report opens with the before/after comparison. Stop when the scored signals that remain are deliberate and you can say why, no quality issue got worse, and Japanese typesetting issues did not increase. At most three rounds.
6. Report: score before → after, resolved and remaining signals (with the reason each remaining one stays), the changes by root cause, what was preserved, and the screenshot paths. Look at the final screenshots before you say it is done.

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
