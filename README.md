# UI Refiner v0.3.0

Source-integrated UI inspection for ordinary browser DOM web applications. Godot, Phaser Canvas and game HUDs belong to separate research.

The maintained source includes suta's complete pinned skill catalog (57 patterns) and static auditing code, plus lintapple's rendered layout/accessibility/interaction runtime. Their MIT licenses remain in `vendor/`. Local runtime changes are recorded as replayable patches and per-file SHA-256 manifests in `vendor/UPSTREAM.json`. npm dependencies are only pinned axe-core and Playwright.

## Install

Place this repository under the target app's `tools/ui-refiner`. Node.js >=22.18 is required. A node_modules/npm distribution is not supported until the vendored native TypeScript is compiled.

From the app root:

```sh
(cd tools/ui-refiner && npm ci && npx playwright install chromium)
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD" --locale en-US
node tools/ui-refiner/scripts/install-agent-skill.mjs "$PWD"
```

Use `--locale ko-KR` or `--locale ja-JP` to generate corresponding initial fonts/copy policy. Policies derive from `vendor/lintapple/ui-policy.json`; review project overrides against the SOT. Browser rendering uses the same locale. `init` preserves existing configuration and policy files.

The skill installer preserves existing Claude settings and adds a PostToolUse hook. Other hosts should register the generated `hook-registration.json` through their supported hook UI; the installer does not invent unsupported Codex settings. Hooks only check edited static lines and are not full approval gates. Review installed executable hooks as part of normal tool setup.

Runtime audits use `static.auditPath: "bundled"` directly. An optional guidance snapshot can be installed with `bash tools/ui-refiner/scripts/install-suta.sh "$PWD"`; doctor warns if that copy drifts. Existing explicit auditPath overrides are preserved but can use outdated code. Migrate old `.agents/skills/suta/scripts/audit.mjs` configuration to `"bundled"` after review.

Configure static targets, the live local browser URL, readiness selector, project policy and optional SOT path. Start the app, then:

```sh
node tools/ui-refiner/bin/ui-refiner.mjs doctor --config ui-refiner.config.json
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

Doctor verifies vendor hashes and actually launches Chromium, opens a blank page and closes it. Neither doctor nor check installs or downloads a browser.

## Evidence and gate

| Evidence | Contents |
|---|---|
| report.json | Every finding/target, actual/expected, original browser details, grouped identities, coverage and scope |
| report.md / AGENT_HANDOFF.md | Root-cause groups, representative targets, combined viewport/state coverage and previous-run changes |
| previous-report.json | The last recorded run; diff compares compatible full/partial scopes |
| lintapple.raw.json | Unmodified rendered audit evidence |
| render-*.png / finding crops | Same-page captures immediately after initial/interaction-state checks |
| VISUAL_REVIEW.md | Optional external visual review checklist; advisory only |

JSON always preserves the complete target list, even when Markdown shows only a few representative locations. Grouping combines matching engine/rule/actual/expected/fix findings; fixing an inherited font can clear many elements and viewports together. Reports compare resolved/added/persisting finding identities on consecutive compatible runs. A repair task is limited to two fix/recheck iterations by the agent protocol; UI Refiner does not autonomously edit code.

| Exit | Meaning |
|---|---|
| 0 | Executed full-scope automated checks have no new enforced violations; human review may remain |
| 1 | New enforced violations |
| 2 | Tool/browser/policy error, disabled required engine or incomplete scope |

Per viewport/theme/state target counts are included for alignment, layout/control gaps, nested radius and control inset. Zero targets mean `not-tested`; missing counters mean `unknown`. Full-scope PASS does not assert these unmarked contracts were checked. Add appropriate `data-ui-*` contracts where relevant. Mouse-only inline `onclick` or explicit `data-ui-clickable` elements are checked for focus/semantic omissions; arbitrary JavaScript event listeners are not automatically enumerated. Use an interaction plan to verify actual keyboard activation.

The browser runs in a separate process with a total time/output bound. Audit and capture share one session, locale and reduced-motion setting. Element crops are bounded to five unique targets per state; unavailable crops are recorded. Partial captures from an interrupted run do not constitute approval; trust the current report's artifact list.

Visual-model feedback is advisory. This tool generates a review packet but does not call a vision provider or change gate status from model output. A human owns visual acceptance.

## Changed-line checks

```sh
node tools/ui-refiner/bin/ui-refiner.mjs check --changed-only
node tools/ui-refiner/bin/ui-refiner.mjs check --changed-only --base origin/main
```

Without a base, Git diff against HEAD includes staged and unstaged edits; untracked source files are also included. With a base, committed changes since that ref are included. Static findings are filtered to changed new-side lines; rendered browser checks still cover the whole configured page. This mode is partial: clean results return INCOMPLETE/exit 2 rather than a full PASS. It cannot be used to create a regression baseline. Run full QA before approval.

## Baseline v2

Configuration remains schemaVersion 1; baselines use schemaVersion 2.

```sh
node tools/ui-refiner/bin/ui-refiner.mjs baseline create --from artifacts/ui-refiner/report.json --out ui-refiner.baseline.v2.json
```

Review a fresh full report and the suppression list before setting `gate.baselinePath`. Version 1 hashes cannot be migrated reliably and are rejected. Static IDs exclude line number/message and use relative file plus unique trimmed source content. Browser IDs use unique application anchors or unique scoped semantic identity, viewport dimensions, theme, state, pseudo-element and related target. Measured values/nth-of-type positions are excluded. Ambiguous identities remain visible and cannot be baselined; excludedFindings records their count. Source/semantic changes can intentionally produce a new identity.

## Upstream maintenance

```sh
node tools/ui-refiner/bin/ui-refiner.mjs upstream check
node tools/ui-refiner/scripts/sync-vendor.mjs --suta <40-character-SHA>
node tools/ui-refiner/scripts/sync-vendor.mjs --lintapple <40-character-SHA>
```

Check compares pinned commits to upstream HEAD without writing files. Sync fetches the requested source into a temporary stage, replays reviewed patch files, records upstream/current SHA-256 hashes, and runs unit tests plus both real browser/CLI smokes. Patch conflicts or verification failures restore previous vendor files. It never installs Chromium automatically or commits/pushes an upgrade. Review the resulting diff and license/provenance changes before approval; put future local engine changes in the patch file instead of losing them during sync.

## Development

```sh
npm ci
npm test
npx playwright install chromium
npm run smoke:ui
npm run smoke:gate
```

CI executes both engines against clean and deliberately violating fixtures, verifies stable DOM identities, mouse-only control defects, same-state images, crop evidence and actual Chromium doctor. Actual checker output is retained as an upstream-contract artifact for recorded-fixture review. A browser PASS is not an aesthetic or release approval.
