# UI Refiner v0.2.1

> **Scope**: conventional browser-based, DOM-rendered web applications. No game HUD, Phaser Canvas, or Godot adapters/profiles. Game UI research is a separate workstream; this package must not quietly claim coverage there.

UI Refiner is a **web UI design-and-QA orchestration tool** combining upstream [suta](https://github.com/Guksu/suta) pattern guidance (57 patterns and a static layout/motion audit) with [lintapple](https://github.com/gholtzap/lintapple) rendered layout/accessibility checks (29 published rules). It adds project-policy governance, a regression-baseline mechanism, JSON/Markdown quality reports, bounded agent handoff and optional screenshots. It does not contain an AI model, generate screens autonomously, or automatically repair code.

## Project identity

- **Repository:** [prentice7725/ui-refiner](https://github.com/prentice7725/ui-refiner)
- **CLI:** `ui-refiner`
- **Agent skill:** `ui-refiner-agent`
- **Project configuration:** `ui-refiner.config.json`
- **Evidence directory:** `artifacts/ui-refiner/`
- **Scope:** standard web applications with rendered DOM elements. Game UI research is a **separate project** and does not inherit this tool's presets.

## Version and provenance

- Tool: `ui-refiner` `0.2.1`; own orchestration code, MIT.
- suta pin: `412bd62e479ce249ef25ca31bc015cfb308aff10`, MIT. Install separately; no full upstream code is copied into this archive.
- lintapple pin: `0.1.21` (npm), MIT. Playwright pin: `1.63.0`. See `licenses/THIRD_PARTY.md`.
- Node.js **22.18 or newer**, npm, Git, network for dependencies, Chromium for rendering tests. The local creation environment has Node 22.16 and does **not** support a real Chromium end-to-end test; local unit/contract tests alone do not prove production readiness.

## Installation into a web app

Assume this folder is copied into the target app at `tools/ui-refiner/`; execute from the **target app root**:

```bash
(cd tools/ui-refiner && npm install)
bash tools/ui-refiner/scripts/install-suta.sh "$PWD"
node tools/ui-refiner/scripts/install-agent-skill.mjs "$PWD"
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD"
```

Edit `ui-refiner.config.json`: set `static.targets` (usually `src`), `browser.url` to the actual running web dev server, `sot.path` if a project SOT exists, and `browser.ready` if hydration must finish. Edit `ui-policy.json` to match approved fonts, text sizing, viewports and interaction requirements. Preset `web` is the **only** valid preset. Non-DOM and game UI is out of scope; unsupported profiles are rejected.

Start your web app separately, then:

```bash
node tools/ui-refiner/bin/ui-refiner.mjs doctor --config ui-refiner.config.json
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

Evidence appears in `artifacts/ui-refiner/`:

- `report.json` / `report.md`: merged findings and statuses.
- `AGENT_HANDOFF.md`: actionable fix list; no automatic fixes.
- `lintapple.raw.json`: browser coverage, including interaction states if configured.
- optional `render-{width}x{height}-{scheme}.png`: screenshots, **not** pixel-diff approval.

Add an explicit interaction plan via `browser.interactionsPath`: see `examples/interactions.json`. For regression debt, baseline only approved existing findings:

```bash
node tools/ui-refiner/bin/ui-refiner.mjs baseline create \
  --from artifacts/ui-refiner/report.json --out ui-refiner.baseline.json
```

After human review, set `gate.baselinePath` in the config. No check command auto-accepts failures into the baseline.

## Gate contract

| Status | Meaning | CLI exit |
|---|---|---|
| `REVIEW_REQUIRED` | Static + browser automated checks passed; manual visual/UX review needed | 0 |
| `PASS` | Automated checks passed; manual review disabled (not the same as production approval) | 0 |
| `FAIL` | New enforced violation | 1 |
| `ERROR` | Tool, policy, browser or screenshot error | 2 |
| `INCOMPLETE` | One of the required web checker stages disabled/not covered | 2 |

suta warnings are reported and can be capped by `gate.maxStaticWarnings`; browser findings are enforced. The approved SOT/design system governs visual intent, but measurable accessibility problems still require an explicit and reviewed resolution. Changing a policy is a design decision, not an agent shortcut.

## Security/CI

Run against **trusted local application URLs**. `gate.allowedHosts` defaults to loopback only; tested code executes in a Chromium process. Checker invocations use argument arrays, not a shell command string. Do not blindly approve external hooks. Review `.github/workflows/ui-qa.example.yml` before copying it to the target repo: it assumes a specific app start command and generated lockfiles. Set up CI with `npm ci`, a health/readiness probe, pinned dependencies and uploaded evidence. Screenshots are optional, but human visual review is not replaced by them.

## Development

```bash
node --test
```

Tests use stubs for external checkers. Real browser integration remains **NOT VERIFIED** until npm dependencies and Chromium are installed in a proper runtime. The game UI workstream is maintained separately in Game UI Lab and is not included here.
