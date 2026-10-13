# UI Refiner v0.3.0

[English](README.md) · [한국어](README_KO.md) · [日本語](README_JA.md)

UI Refiner combines **suta source auditing and design guidance** with **lintapple rendered layout, accessibility and interaction checks** for ordinary DOM web applications. It produces repair evidence and a deterministic quality gate for developers and coding agents.

It includes suta's complete pinned skill catalog with 57 patterns and lintapple's maintained runtime source. It does not automatically generate interfaces, repair code, call a vision model or approve a release. Godot UIs, Phaser Canvas and game HUDs are outside its scope.

## 1. Requirements and installation

Use Node.js **22.18 or newer**, npm, Git and explicitly installed Playwright Chromium. Runtime npm dependencies are pinned `axe-core@4.14.0` and `playwright@1.63.0`.

Place this repository at the target app's `tools/ui-refiner`. This source installation is supported; running the native suta TypeScript from `node_modules` is not. There is no supported compiled npm distribution yet.

Run from the **target app root**:

```sh
(cd tools/ui-refiner && npm ci && npx playwright install chromium)
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD" --locale en-US
```

Supported initial policies are `en-US`, `ko-KR` and `ja-JP`. They derive from the single canonical `vendor/lintapple/ui-policy.json`. Korean and Japanese variants add appropriate initial font lists and copy rules; Japanese includes Hiragino, Noto Sans JP, Meiryo and Yu Gothic. Review the generated policy against the project's approved design system.

`init` preserves existing configuration and policy files. Re-running it with another locale does not replace an existing policy.

## 2. Configure the project

`init` creates `ui-refiner.config.json` and `ui-policy.json`. All project paths resolve relative to the **directory containing the configuration file**.

| Field | Purpose / default |
|---|---|
| `preset` | Only `web` is supported |
| `locale` | Browser locale and initial policy selection; default `en-US` |
| `static.auditPath` | Default `"bundled"`, executing maintained `vendor/suta` source |
| `static.targets` | Source paths to audit; default `["src"]` |
| `static.enforcement` / `browser.enforcement` | `enforce` or `advisory`; both default to `enforce` |
| `browser.url` | Running app URL; default `http://127.0.0.1:5173` |
| `browser.routes` | Optional 1–50 named routes replacing the single URL target; paths resolve against `browser.url` |
| `browser.policyPath` | Project policy; default `ui-policy.json` |
| `browser.ready` | Optional visible readiness selector; default `null` |
| `browser.interactionsPath` | Optional interaction-plan JSON; default `null` |
| `browser.captureScreenshots` | Same-session state images and element crops; default `false` |
| `browser.captureAriaSnapshots` | Same-state accessibility-tree YAML and advisory structure comparisons; default `false` |
| `browser.renderedMetrics` | Opt-in rendered design heuristics; advisory only, default `false` |
| `browser.timeoutMs` | Per navigation/audit step; default `120000` ms |
| `browser.sessionTimeoutMs` | Independent total session bound; default `null` for a derived budget |
| `gate.maxStaticWarnings` | Optional static warning cap; `null` leaves warnings non-blocking |
| `gate.allowedHosts` | Explicit navigation host allowlist; defaults to loopback hosts |
| `gate.baselinePath` | Reviewed schemaVersion 2 baseline; default `null` |
| `gate.valueExceptionsPath` | Optional reviewed exact design-value exceptions JSON; default `null` |
| `gate.manualVisualReview` | Default `true`; successful full checks still require human review |
| `sot.path` | Optional project source-of-truth path; existence is checked, content is not automatically parsed |
| `reportDir` | Default `artifacts/ui-refiner` |

Keep policy fonts, sizes and exceptions consistent with the approved source of truth. Agents should read the design documents; the CLI does not infer policy from them. Use trusted app URLs. Non-allowlisted hosts and credentials embedded in URLs are rejected.

## 3. Full and changed-line checks

Start the application separately, then:

```sh
node tools/ui-refiner/bin/ui-refiner.mjs doctor --config ui-refiner.config.json
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

`doctor` verifies vendor SHA-256 hashes, required paths and the Node runtime, then actually launches Chromium, opens a blank page and closes it. Neither `doctor` nor `check` downloads Chromium.

For targeted static checks:

```sh
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json --changed-only
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json --changed-only --base origin/main
```

Without `--base`, Git changes against HEAD include staged and unstaged edits plus untracked source files. With a base, committed changes relative to that ref are also included. Paths are normalized to the configuration root, including nested monorepo apps. Only configured static targets and changed new-side lines are inspected; deleted lines alone are not treated as new findings.

**Browser checks still inspect the entire configured page and interaction plan.** A compatible `last-full-report.json` distinguishes previously observed stable browser debt from fresh findings using the URL, locale, policy contents and interaction contents. Existing debt stays visible as `existingBrowserDebt` but does not block the scoped result. Without a compatible full reference, browser findings remain enforced. This does not write or approve a baseline; full checks still enforce the debt.

### Status and exit codes

| Status | Exit | Meaning |
|---|---:|---|
| `PASS` | 0 | Full checks have no new enforced violations; manual review disabled |
| `REVIEW_REQUIRED` | 0 | Full automated checks passed; human visual/UX review remains |
| `FAIL` | 1 | New enforced findings |
| `ERROR` / `INCOMPLETE` | 2 | Tool/environment failure or missing required checker coverage |
| `SCOPED_PASS` | 3 | Changed scope passed; **not full QA approval** |

Disabling either required engine cannot produce a full PASS. A successful scoped check cannot be used to create a baseline. Run full checks before acceptance.

## 4. Browser coverage and evidence capture

The browser runs in a separate process with total time and output bounds. `browser.timeoutMs` limits individual navigation/audit steps. Set `browser.sessionTimeoutMs` for an explicit total limit; otherwise it is derived from viewport/theme combinations, planned interactions and capture allowance, capped at **600000 ms**. Multiple valid sequential steps can therefore outlast one step's timeout without being terminated prematurely.

Initial and interaction-state audits share the same browser session, locale and reduced-motion setting with their images. Capture is optional and produces at most **five unique violating-element crops per state**; unavailable crops record a reason. Treat the current report's artifact list as authoritative after interrupted runs.

Coverage reports show target counts for alignment, layout/control gaps, nested radius and control inset. Zero targets are `not-tested`; missing counters are `unknown`. Add the relevant `data-ui-*` contracts where those checks should apply. PASS does not assert that unmarked contracts were tested.

Clickable generic elements are checked for missing keyboard focus and semantic roles through inline `onclick`, DOM `onclick` properties (including React-style handlers), `data-ui-clickable` and Chromium CDP direct click listeners. CDP inspects at most **500 visible non-native candidates per state**, prioritizing `cursor:pointer` before document order. Known framework delegation roots are excluded. Reports disclose limited inspection and CDP availability; delegated descendants and candidates beyond the cap need explicit markers or interaction plans. Use an interaction plan to verify actual Enter/Space behavior. See [examples/interactions.json](examples/interactions.json).

### Named routes, ARIA evidence and rendered metrics

Add these fields to the existing `browser` object; keep its other fields:

```json
{
  "routes": [
    { "name": "home", "url": "/" },
    { "name": "settings", "url": "/settings", "ready": "[data-app-ready]", "interactionsPath": null }
  ],
  "captureAriaSnapshots": true,
  "renderedMetrics": true
}
```

Routes have unique safe names and absolute HTTP(S) URLs or root-relative paths. Omitted `ready` / `interactionsPath` inherit shared settings; explicit `null` disables them for that route. Each route/viewport/theme gets a clean context in one browser process. Budgets include route count. Every requested route must finish: a failed route is ERROR, not partial PASS. Only listed routes are covered, not the entire app automatically. Storybook URLs can be listed explicitly. Authentication state and cookies are not shared between routes.

Navigation hosts are validated before requests. Redirects are rejected without following the chain; configure the final URL explicitly. Service workers are disabled in this audit session. External subresources are not covered by the navigation allowlist; this is not a general network sandbox.

Multi-route fingerprints include route name and canonical configured URL; legacy single-URL identities remain unchanged. Switching to explicit routes requires a fresh full baseline review. Image names include routes. Optional ARIA YAML also includes a content hash, retaining previous evidence. Compatible runs produce `ariaDiff` with changed/added/removed/unchanged dimensions and `previousFile` / `file` paths. This is a hash-based structure summary, not an automatic defect verdict or line-by-line diff: compare the YAML pair. Capture is opt-in, limited to 2 MB per state; requested capture failure is ERROR. Images and accessible names may contain sensitive app content; review before sharing.

Rendered metrics describe visible viewport content: top-pinned fixed/sticky regions (nested regions counted once), filled buttons, repeated button/link names and destinations, and approximate 15-degree chromatic hue buckets from computed text/background/border colors. Inspection is capped at 10000 DOM elements with limited coverage disclosed. Repeated actions or multiple filled buttons may be intentional. Observations are **advisory only**, cannot block or be baselined, and never weaken accessibility checks. Hue buckets are evidence, not an enforced color limit; gradients, images and full perceptual color analysis are outside scope.

## 5. Reports and repair handoff

Outputs appear under `reportDir`:

| File | Contents |
|---|---|
| `report.json` | All findings and targets, actual/expected values, original browser details, blocking flags, groups, scope and coverage |
| `report.md` | Readable grouped findings, gate status and coverage |
| `AGENT_HANDOFF.md` | Prioritized repair tasks, short target hints and previous-run changes |
| `previous-report.json` | Previous run for comparison of compatible scopes |
| `last-full-report.json` | Compatible completed full-check reference for scoped browser debt |
| `lintapple.raw.json` | Original rendered checker output |
| `render-*.png` | Optional same-session state images and element crops |
| `render-*.aria.yml` | Optional same-state ARIA structure; content hashes preserve previous evidence |
| `VISUAL_REVIEW.md` | Advisory review packet for a person or an external visual model |

The handoff orders **actual blockers → advisory errors → warnings**. Matching causes are grouped across targets, viewports and states, so an inherited font problem can be fixed at its source rather than once per child. Semantic targets render as hints such as `h1 "Unlock…"` instead of raw identity JSON.

The repair list is bounded to roughly **6 KiB**. If blocker groups are omitted, their count and rule names are stated explicitly. Every full selector, exact identity and remaining group is preserved in `report.json`; inspect them before finishing repairs.

Compatible consecutive runs record resolved, added and persisting identities. Agent guidance limits a repair task to two fix/recheck iterations; the CLI does not execute an autonomous repair loop. Visual-model feedback is advisory and never changes gate status. A human owns visual acceptance.

## 6. Baseline schemaVersion 2

Configuration remains `schemaVersion: 1`; regression baselines use **`schemaVersion: 2`**.

Create a baseline from a fresh **full** report:

```sh
node tools/ui-refiner/bin/ui-refiner.mjs baseline create --from artifacts/ui-refiner/report.json --out ui-refiner.baseline.v2.json
```

Review the suppression list before setting `gate.baselinePath`. Version 1 baselines are rejected and cannot be safely relabeled as version 2. Baseline creation does not overwrite an existing output file.

- Static identity uses the relative source file and unique trimmed source-line content, excluding line number and diagnostic message. Empty or repeated anchors cannot be baselined.
- Browser identity uses a unique application marker or unique scoped semantic identity, viewport dimensions, theme, state, pseudo-element and related target. Measured values and `nth-of-type` positions are excluded.
- Known generated IDs from React useId, Radix and Headless UI are excluded as anchors even when unique, including `:r0:`, `«r0»` / `«R1»` and `_r_0_`. Prefer explicit `data-ui-id`, `data-testid` or `data-qa` markers.
- Ambiguous identities remain reported and cannot be suppressed. `excludedFindings` records the number of skipped items. Source-content or semantic changes can intentionally produce a new identity.

No check automatically adds findings to a baseline or weakens the policy.

### Reviewed exact-value exceptions

Set `gate.valueExceptionsPath` to a project-relative JSON file using [examples/value-exceptions.json](examples/value-exceptions.json). Review it explicitly; the example is not an approval. Entries require `engine: "lintapple"`, `rule`, exact primitive `actual`, and a nonempty `reason`; optional `route` and exact report `selector` narrow scope. Supported design rules are `font-family`, `font-size`, `copy` and `root-background`. Use exact values and selectors from `report.json`, not approximate fonts or equivalent CSS selectors.

Matched findings retain evidence and their `reviewedException` reason but do not block. They are not automatically added to a baseline, preventing a value-specific approval from becoming a value-independent suppression. Other values or scopes still fail. Accessibility and interaction rules cannot be waived here. Existing policy `exceptions` are broader selector-wide rule exclusions, a different mechanism.

## 7. Agent skill and portable hooks

Optional installation from the app root:

```sh
node tools/ui-refiner/scripts/install-agent-skill.mjs "$PWD"
```

For an in-project tool checkout, the installer preserves existing Claude settings and adds a project-relative PostToolUse hook using `CLAUDE_PROJECT_DIR`; the wrapper imports the maintained hook relatively. Moving the checkout does not embed a personal absolute path. An external personal checkout uses `.claude/settings.local.json` and a local `UI_REFINER_HOME` override, leaving shared settings unchanged.

Other hosts should register the generated `.agents/skills/ui-refiner-agent/hook-registration.json` through their supported hook UI. Unsupported Codex settings are not invented. The hook checks edited static lines only; it is not a full gate. The installer refuses to overwrite an existing skill, so review installed copies before updating them.

Runtime auditing defaults to `static.auditPath: "bundled"`. An optional suta guidance snapshot can be copied with:

```sh
bash tools/ui-refiner/scripts/install-suta.sh "$PWD"
```

Doctor warns when that snapshot drifts. Explicit legacy audit-path overrides are preserved; migrate stale `.agents/skills/suta/scripts/audit.mjs` paths to `"bundled"` after review.

## 8. Upstream maintenance and provenance

```sh
node tools/ui-refiner/bin/ui-refiner.mjs upstream check
node tools/ui-refiner/scripts/sync-vendor.mjs --suta <40-character-SHA>
node tools/ui-refiner/scripts/sync-vendor.mjs --lintapple <40-character-SHA>
```

`upstream check` compares pinned commits with upstream HEAD without modifying files. `sync-vendor` rejects unrecorded local vendor edits, stages the requested source, replays reviewed patches, records original/current hashes and runs unit tests plus the UI and CLI browser smokes. Patch conflicts or validation failures restore the previous vendor source and manifest. Sync does not install Chromium, commit, push or approve an upgrade.

Preserve future engine modifications in the replayable patch and update the reviewed manifests. Licenses and pins: [vendor/UPSTREAM.json](vendor/UPSTREAM.json), [licenses/THIRD_PARTY.md](licenses/THIRD_PARTY.md), [suta MIT license](vendor/suta/LICENSE), [lintapple MIT license](vendor/lintapple/LICENSE). Upstream projects: [suta](https://github.com/Guksu/suta), [lintapple](https://github.com/gholtzap/lintapple).

## 9. Development and verification

Run from the UI Refiner repository root:

```sh
npm ci
npm test
npx playwright install chromium
npm run smoke:ui
npm run smoke:gate
npm run smoke:review2
npm run smoke:routes
```

CI runs unit/contract tests, real Chromium UI and CLI checks, session-timeout checks and pinned vendor-sync verification. Fixtures include clean/violating pages, monorepo changes, moved-checkout hooks, generated IDs, pointer-prioritized discovery after a 1600-row list, same-state images and element crops.

Actual checker recordings and their hashes/provenance are retained in `test/fixtures`; live smoke output is compared with the reviewed repair contract. CI also uploads `upstream-contracts` evidence. Contract changes require review rather than silently regenerating fixtures. See [CI workflow](.github/workflows/ci.yml) and [implementation report](IMPLEMENTATION_REPORT_KO.md).
