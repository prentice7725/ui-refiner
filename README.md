# UI Refiner v0.3.0 — source-integrated web UI quality gate

**Scope:** browser DOM web applications only. Native Godot UIs, Phaser Canvas and game HUD design are out of scope; Game UI Lab is a separate research project.

UI Refiner combines the source code (not the npm wrapper packages) of:

- [suta](https://github.com/Guksu/suta) — layout/motion source auditing and UI design/interaction guidance.
- [lintapple](https://github.com/gholtzap/lintapple) — rendered geometry, typographic, accessibility and interaction checks.

It adds project policy, source-of-truth precedence, regression baseline management, one merged JSON/Markdown finding report and a fail-closed CLI. It does **not** automatically rewrite app code.

## Independence and provenance

All runtime implementation of lintapple is in `vendor/lintapple/src/`, with its own MIT license. suta skill and static audit implementation are in `vendor/suta/skills/suta/`, with its own MIT license. The upstream suta catalog has 57 patterns; **the complete catalog has not yet been vendored**. Referenced but missing pattern files must be imported or marked unavailable, never silently invented.

Dependencies are **only** `axe-core@4.14.0` and `playwright@1.63.0`. The previously non-published `lintapple@0.1.21` dependency is removed. `npm ci` has a committed v3 lockfile.

Pinned upstream commits and copyright: [vendor/UPSTREAM.json](vendor/UPSTREAM.json), [licenses/THIRD_PARTY.md](licenses/THIRD_PARTY.md).

## Install in a target web app

Place this repo at `tools/ui-refiner`, then from the **app root**:

```sh
(cd tools/ui-refiner && npm ci)
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
