# ui-refiner

**Web-app UI design and quality gate**, built around [suta](https://github.com/Guksu/suta) and [lintapple](https://github.com/gholtzap/lintapple).

This repository is for conventional browser DOM applications only. Game UI (Godot, Phaser Canvas, HUDs) is a separate research effort and is **not** supported here.

## Components

- **suta**: design guidance, 57 tested UI patterns, layout/motion source auditing.
- **lintapple**: rendered browser/UI/accessibility checks.
- **ui-refiner**: project policy, regression baseline, quality gate, JSON/Markdown findings, optional screenshots, actionable agent handoff.

## Runtime and status

Node.js **22.18+**; pinned lintapple `0.1.21`, Playwright `1.63.0`, suta at commit `412bd62e479ce249ef25ca31bc015cfb308aff10`.

Local contract/unit tests: **15/15 PASS**. Actual Chromium end-to-end integration is **not yet verified**. A passing automated check is **not** design approval.

## Install into a web app

Copy this repository into your web app as `tools/ui-refiner/` and run at the app root:

```bash
(cd tools/ui-refiner && npm install)
bash tools/ui-refiner/scripts/install-suta.sh "$PWD"
node tools/ui-refiner/scripts/install-agent-skill.mjs "$PWD"
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD"
```

Edit `ui-refiner.config.json` and `ui-policy.json` for the app's actual SOT, design tokens, URL, and source directories; start the web dev server, then run:

```bash
node tools/ui-refiner/bin/ui-refiner.mjs doctor --config ui-refiner.config.json
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

Exit statuses: `0` automated checks passed (visual review may be required), `1` new violations, `2` tooling or coverage failure. Evidence in `artifacts/ui-refiner/`.

See `README_KO.md` and `IMPLEMENTATION_REPORT_KO.md` for more details. MIT license; upstream code is installed separately and keeps its own attribution.
