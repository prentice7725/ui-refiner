# UI Refiner v0.3.0 — source-integrated web UI quality gate

**Scope:** browser DOM web applications only. Native Godot UIs, Phaser Canvas and game HUD design are out of scope; Game UI Lab is a separate research project.

UI Refiner combines the source code (not the npm wrapper packages) of:

- [suta](https://github.com/Guksu/suta) — layout/motion source auditing and UI design/interaction guidance.
- [lintapple](https://github.com/gholtzap/lintapple) — rendered geometry, typographic, accessibility and interaction checks.

It adds project policy, source-of-truth precedence, regression baseline management, one merged JSON/Markdown finding report and a fail-closed CLI. It does **not** automatically rewrite app code.

## Independence and provenance

All runtime implementation of lintapple is in `vendor/lintapple/src/`, with its own MIT license. suta skill and static audit implementation are in `vendor/suta/skills/suta/`, with its own MIT license. The complete pinned suta skill catalog (250 source files including 57 pattern documents and their assets) is vendored. The browser and static engines remain independently testable.

Dependencies are **only** `axe-core@4.14.0` and `playwright@1.63.0`. The previously non-published `lintapple@0.1.21` dependency is removed. `npm ci` has a committed v3 lockfile.

Pinned upstream commits and copyright: [vendor/UPSTREAM.json](vendor/UPSTREAM.json), [licenses/THIRD_PARTY.md](licenses/THIRD_PARTY.md).

## Install in a target web app

Place this repo at `tools/ui-refiner`, then from the **app root**:

```sh
(cd tools/ui-refiner && npm ci && npx playwright install chromium)
bash tools/ui-refiner/scripts/install-suta.sh "$PWD"
node tools/ui-refiner/scripts/install-agent-skill.mjs "$PWD"
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD"
```

Set the project's `ui-refiner.config.json`: `static.targets`, running `browser.url`, optional `sot.path` and `browser.ready`. Configure the root `ui-policy.json` to match the approved UI, not to silence failures. Start the app, then:

```sh
node tools/ui-refiner/bin/ui-refiner.mjs doctor --config ui-refiner.config.json
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

`artifacts/ui-refiner/` contains the merged report, lintapple raw evidence, agent handoff and optional screenshots. Use a reviewed baseline only for pre-existing debt.

## Self-test

From the ui-refiner repo root with Node.js **22.18 or newer**:

```sh
npm ci
npm test
npx playwright install chromium
npm run smoke:ui
```

The smoke verifies that the default DOM demo has **zero findings at both configured viewport sizes**, and a deliberate invalid font is detected on `/negative-control`. The GitHub Actions workflow runs these stages against a clean install. A passing smoke is a deterministic UI check, **not** visual design approval.

## Quality gate

- `0`: automated checks passed (visual review may still be required).
- `1`: new enforced findings.
- `2`: missing engine, browser, policy or coverage — **never** treat as pass.

Code/runtime dependencies reside here; upstream installs are not needed. Keep `vendor/` MIT notices and update provenance before integrating upstream fixes. For ordinary web apps only.

## Baseline fingerprint v2 and inspection evidence

New baselines use `schemaVersion: 2`; project configuration remains version 1.
Run a fresh check and create a new, reviewed baseline with:

```sh
node tools/ui-refiner/bin/ui-refiner.mjs baseline create --from artifacts/ui-refiner/report.json --out ui-refiner.baseline.v2.json
```

Point `gate.baselinePath` at that file after review. Version 1 hashes cannot be migrated reliably and are rejected; old reports cannot be relabeled as version 2.
Static fingerprints use the relative file and unique trimmed source line, excluding line number and diagnostic message. Repeated/empty source lines are ineligible for suppression. Browser fingerprints use unique `data-ui-id`, `data-testid`, `data-qa`, or `id` anchors, with a unique semantic fallback scoped to an anchored ancestor. They include viewport dimensions, theme, state, pseudo-element and related element identity, excluding measured values and nth-of-type positions. Ambiguous identities remain reported and cannot be baselined; `excludedFindings` records their count. Changing source content or semantic identity can intentionally create a new finding.

Normalized JSON keeps original browser details, including `actual`, `expected` and related selectors. Markdown and the agent handoff include the measured and expected values.

Coverage reports list target counts for alignment, layout/control gaps, nested radius and control inset for each viewport/theme/state. Zero targets mean `not-tested`; missing counters mean `unknown`. PASS means no new enforced violations among executed checks and does not assert coverage of unmarked layout contracts. Add relevant `data-ui-*` markers and configured control containers where those checks should apply.

`doctor` actually launches Chromium, opens a blank page, and closes it. Neither `doctor` nor `check` downloads Chromium; install it explicitly during setup. Browser launch failures return exit 2. Local upstream patches are recorded in `vendor/UPSTREAM.json`.
