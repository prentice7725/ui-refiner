# Changelog

All notable changes to UI Refiner. Dates are in Asia/Tokyo. Versions follow `package.json`; the deep-gate report `version` field and comparison contexts carry the same number.

## 0.4.0 — 2026-10-27

Refocused on the original goal: help coding agents build web UIs that do not look AI-generated, and review existing pages to propose better designs. The deep QA gate is unchanged and now documented separately.

### Added
- `ui-refiner scan <url|host|file>`: zero-config design review of any page. Renders at 1440px and 390px, saves full-page screenshots and writes `DESIGN_REVIEW.md` + `scan.json`.
  - **AI-look index** (0–100, heuristic) from 17 rendered signals: purple gradient heroes, large gradients, gradient headlines, glass, colored glows, emoji icons, identical icon-card grids, eyebrow pills, centered text, over-rounding, generic type, flat type scale, framework default accents, many hues, `transition: all`, buzzword copy, repeated generic CTAs. Each signal has evidence, targets, why and a concrete fix.
  - Craft counter-signals (chosen webfont, real imagery, rich type scale) dampen the score without hiding signals.
  - Universal rendered checks (contrast, names/labels, ARIA references, target size, overflow, font loading) and optional suta static audit with `--source`.
- **Japanese support** for `scan`:
  - `--lang ja` report (also `ko`, `en`) and `--locale` for the browser locale (defaults to the report language).
  - Japanese typesetting checks on Japanese pages: missing Japanese typeface in the font stack, tight body line height (<1.45), heading orphans (泣き別れ) per viewport, `word-break: break-all` on headings, italic Japanese, negative tracking, text under 12px, half-width katakana, full-width alphanumerics.
  - Japanese stock-copy phrases (可能性を解き放つ, シームレスな, 次世代の, ビジネスを加速 …) and generic CTAs (詳しく見る, 詳細はこちら, 無料で始める …).
- Fixtures `examples/ai-slop-landing.html` and `examples/ai-slop-landing-ja.html`; `npm run smoke:scan` (real browser, in CI).
- Claude Code plugin and marketplace manifests (`.claude-plugin/`).

### Changed
- Agent skill rewritten around **Build** and **Review** workflows; the gate protocol moved to `skills/ui-refiner-agent/reference/quality-gate.md`.
- `install-agent-skill.mjs` also copies the skill to `.claude/skills` so Claude Code discovers it (Codex keeps `.agents/skills`).
- READMEs rewritten around scan and agent use. The full gate manual moved to `docs/gate/` (EN/KO/JA); the implementation log moved to `docs/history/`.
- Version 0.4.0. Previous full reports stay readable, but engine metadata changed, so the first 0.4.0 `check` starts a new comparison context. Reviewed schemaVersion 2 baselines remain valid.

## 0.3.x — 2026-10-13 to 2026-10-26

Source-integrated web QA gate built on vendored suta (static audit, 57 patterns) and lintapple (rendered checks).

- 2026-10-26 — Contextual preservation inventories, purpose-led review packets and advisory UX repair guidance from the pinned UI UX Pro Max dataset (`guidance`, `rules`, `guide`, `review`, `preserve`).
- 2026-10-22 — Planned inspection-scope accounting, paired normal/defect benchmark, optional same-session visual regression, readable ARIA text diffs, offline HTML/SARIF exports.
- 2026-10-21 — Immutable, content-hashed screenshot evidence across runs; versioned comparison contexts that honor effective route readiness.
- 2026-10-14 — Named routes (1–50) with isolated workers, ARIA snapshot evidence, advisory rendered metrics; disclosed metric limits; incomplete runs cannot create baselines.
- 2026-10-13 — v0.3.0 source-integrated runtime; schemaVersion 2 baselines with stable identities; root-cause grouped handoffs; changed-line checks with SCOPED_PASS (exit 3); portable post-edit hook; blocker-first handoffs and click-target priority; trilingual READMEs.

## 0.2.1 — 2026-10-13

- First published web-only quality gate.
