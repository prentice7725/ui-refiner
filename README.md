# UI Refiner v0.3.0

[English](README.md) · [한국어](README_KO.md) · [日本語](README_JA.md)

UI Refiner combines **suta source auditing and design guidance** with **lintapple rendered layout, accessibility and interaction checks** for ordinary DOM web applications. It produces repair evidence and a deterministic quality gate for developers and coding agents.

It includes suta's complete pinned skill catalog with 57 patterns and lintapple's maintained runtime source. It does not automatically generate interfaces, repair code, call a vision model or approve a release. Godot UIs, Phaser Canvas and game HUDs are outside its scope.

## 1. Requirements and installation

Use Node.js **22.18 or newer**, npm, Git and explicitly installed Playwright Chromium. Runtime npm dependencies are pinned `axe-core@4.14.0`, `playwright@1.63.0`, `pixelmatch@7.2.0` and `pngjs@7.0.0`.

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
| `browser.ariaSnapshotMasks` | Explicit dynamic-copy regex masks; default `[]` |
| `browser.renderedMetrics` | Opt-in rendered design heuristics; advisory only, default `false` |
| `browser.timeoutMs` | Per navigation/audit step; default `120000` ms |
| `browser.sessionTimeoutMs` | Independent total session bound; default `null` for a derived budget |
| `browser.routeTimeoutMs` | Optional route-worker limit; default `null` for a fair share of the remaining total budget |
| `gate.maxStaticWarnings` | Optional static warning cap; `null` leaves warnings non-blocking |
| `gate.allowedHosts` | Explicit navigation host allowlist; defaults to loopback hosts |
| `gate.baselinePath` | Reviewed schemaVersion 2 baseline; default `null` |
| `gate.valueExceptionsPath` | Optional reviewed exact design-value exceptions JSON; default `null` |
| `gate.manualVisualReview` | Default `true`; successful full checks still require human review |
| `sot.path` | Optional project source-of-truth path; existence is checked, content is not automatically parsed |
| `visual` | Optional same-session image regression; enabled=false, mode=advisory; separate approved image store |
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

### Report comparison compatibility

Reports include versioned `comparisonContexts` for finding changes, existing browser debt and ARIA evidence. The legacy `comparisonContext` field remains an alias for the findings context. These hashes do not change finding IDs or baseline schemaVersion 2.

Both single-page and named-route checks use each route's effective URL, ready selector and interaction contents, plus locale, policy and pinned engine metadata. Changing `browser.ready` therefore invalidates comparisons and existing-debt suppression. An explicit route override ignores unused global ready/plan settings. Absolute URLs remain part of comparison compatibility; portable baseline IDs still exclude the host and port.

| Change | Findings comparison | Existing browser debt | ARIA comparison |
|---|---|---|---|
| Effective URL/ready/plan, locale, policy or browser engine | Reset | Reset | Reset |
| `renderedMetrics` | Reset | Keep | Keep |
| ARIA masks or `captureAriaSnapshots` | Keep | Keep | Reset |
| `captureScreenshots`, time budgets or manual review | Keep | Keep | Keep |
| Static targets/audit path/engine | Reset | Keep | Keep |

Scope changes and incomplete runs cannot produce resolved findings or ARIA removals. Existing debt requires a completed compatible full report. Older reports without the new metadata are rejected with an explicit reason; run full QA once to establish a new reference. Existing reviewed v2 baselines remain usable. `diff.reason`, `ariaDiff.reason` and `browserReference.reason` explain unavailable comparisons in JSON; the handoff and ARIA summary also show comparison reasons.

### Status and exit codes

| Status | Exit | Meaning |
|---|---:|---|
| `PASS` | 0 | Full checks have no new enforced violations; manual review disabled |
| `REVIEW_REQUIRED` | 0 | Configured enforced checks passed; advisory image/human visual review remains |
| `FAIL` | 1 | New enforced findings |
| `ERROR` / `INCOMPLETE` | 2 | Tool/environment failure or missing required checker coverage |
| `SCOPED_PASS` | 3 | Changed scope passed; **not full QA approval** |

Disabling either required engine cannot produce a full PASS. A successful scoped check cannot be used to create a baseline. Run full checks before acceptance.

## 4. Browser coverage and evidence capture

The browser runs in a separate process with total time and output bounds. `browser.timeoutMs` limits individual navigation/audit steps. Set `browser.sessionTimeoutMs` for an explicit total limit; otherwise it is derived from viewport/theme combinations, planned interactions and capture allowance, capped at **600000 ms**. Multiple valid sequential steps can therefore outlast one step's timeout without being terminated prematurely.

Initial and interaction-state audits share the same browser session, locale and reduced-motion setting with their images. Capture is optional and produces at most **five unique violating-element crops per state**; unavailable crops record a reason. Treat the current report's artifact list as authoritative after interrupted runs.

PNG evidence is stored under `images-<runId>/` with SHA-256 in each filename. A later audit never overwrites an earlier image. `imageArtifacts` and `image-artifacts.json` record artifact IDs, hashes, byte counts and route/state/viewport/theme/locale dimensions; each browser finding's `imageEvidence` links its state image and matching available crops. Existing `artifacts` and `captures[].image` paths remain relative to `reportDir`; consumers must support the new subdirectory. Copy the referenced directories when sharing a report.

Current, previous and last-full reports (including image references in finding diffs) protect their image runs. After report and image-inventory files are published with atomic per-file replacement, cleanup removes only unreferenced, explicitly owned image directories. Manual files, unknown contents and symlinks protect a directory; legacy flat PNGs are not deleted. Interrupted unpublished runs have an 11-minute grace period, covering the maximum browser budget plus one minute. Retention is reference-based rather than an unlimited archive; use a separate `reportDir` for each concurrent audit or archival job. Keep an entire referenced image run, not just individual files. Requested state-image failure is ERROR; unavailable element crops retain their reason. A failed capture cannot replace the last completed full report.

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

Routes have unique safe names and absolute HTTP(S) URLs or root-relative paths. Omitted `ready` / `interactionsPath` inherit shared settings; explicit `null` disables them for that route. Each route has an isolated bounded worker/browser; viewport/theme contexts remain clean. Budgets include route count. Every requested route must finish for a successful gate: failures keep the overall result ERROR, but completed run/state findings and other routes remain visible in `routeResults` and raw runs. Worker timeout can discard that worker's buffered partial states; previously completed workers remain intact. Only listed routes are covered, not the entire app automatically. Storybook URLs can be listed explicitly. Authentication state and cookies are not shared between routes.

Navigation hosts are validated before requests. Redirects are rejected without following the chain; configure the final URL explicitly. Service workers are disabled in this audit session. External subresources are not covered by the navigation allowlist; this is not a general network sandbox.

Multi-route fingerprints include route name plus `pathname + search`, excluding origin, host, port and fragment; legacy single-URL identities remain unchanged. Switching to explicit routes requires a fresh full baseline review. Old multi-route baselines using absolute-URL IDs must also be recreated once; their hash-only entries cannot be safely migrated. Baseline schemaVersion remains 2. Image names include routes. Optional ARIA YAML also includes a content hash, retaining previous evidence. Compatible runs produce `ariaDiff` with changed/added/removed/unchanged dimensions and `previousFile` / `file` paths. The hash summary also includes bounded, line-numbered YAML text explanations in report.json/report.md and the agent handoff. ARIA changes remain advisory; compare the linked YAML pair for full evidence. Capture is opt-in, limited to 2 MB per state; requested capture failure is ERROR. Images and accessible names may contain sensitive app content; review before sharing.

Rendered metrics describe visible viewport content: top-pinned fixed/sticky regions (nested regions counted once), filled buttons, repeated button/link names and destinations, and approximate 15-degree chromatic hue buckets from computed text/background/border colors. Inspection is capped at 10000 DOM elements with limited coverage disclosed. Repeated actions or multiple filled buttons may be intentional. Observations are **advisory only**, cannot block or be baselined, and never weaken accessibility checks. Hue buckets are evidence, not an enforced color limit; gradients, images and full perceptual color analysis are outside scope.

Metric action names are DOM label/text approximations, not a full accessible-name algorithm; ARIA YAML provides the semantic evidence. Visibility uses browser `checkVisibility` and viewport bounds, not occlusion modeling. Target samples are capped at 10 per observation and duplicate-action groups at 20; total counts and limits remain recorded.

`browser.routeTimeoutMs` optionally caps each worker. Otherwise pending routes receive a fair share of the remaining total session budget. The 600000 ms total cap remains; a 200-run batch has only about 3000 ms per run before overhead. The report discloses allocations and average budgets; split large/slow batches rather than treating partial completion as PASS. Browser output is bounded to 20 MB across the batch.

Filled-button counts require at least 1.5:1 computed background contrast against the nearest opaque ancestor, compositing translucent ancestor layers. This design heuristic excludes same-color ghost buttons and low-contrast default controls. Gradients/images or unresolved canvas backgrounds are reported as unknown instead of assumed filled. Top-pinned counts exclude dialog/explicit backdrop scopes and elements covering at least half the viewport.

Mask only known dynamic copy via optional `browser.ariaSnapshotMasks` (default `[]`, at most 20 patterns; `g/i/m/u` flags, default `g`). For example, add this field to `browser`:

```json
{
  "ariaSnapshotMasks": [
    {
      "pattern": "\\d{2}:\\d{2}:\\d{2}",
      "flags": "g"
    }
  ]
}
```

The masked YAML is both saved and hashed; unconfigured label/role changes remain visible. Avoid broad patterns that erase meaningful quantities or semantic structure. Changing masks starts a new comparison context. After reports are written, only tool-owned unreferenced ARIA files are pruned; current/previous report evidence, comparison pairs and the last-full reference are retained. Manual files are untouched.

### Readable ARIA changes

With `browser.captureAriaSnapshots` enabled, compatible runs explain changed/added/removed snapshot dimensions using plain YAML text edits. `ariaDiff.changed[].textDiff` (and added/removed equivalents) records unified hunks, old/new line positions, oldFile/newFile, algorithm, limits and truncation reasons. Changed entries also retain previousSha256/previousBytes; `ariaDiff.textSummary` reports compared/unavailable/notGenerated/truncated counts. These additions do not change compatibility hashes or finding/baseline IDs. Existing mask changes still reset ARIA compatibility. Explanations are generated while writing reports.

The reader verifies regular files, the 2 MB snapshot limit, stored hashes and available byte counts. Missing or inconsistent historical evidence produces an explicit unavailable explanation; it cannot prove no change. The browser's requested capture failures still produce ERROR. This feature compares text without parsing YAML or classifying semantic/WCAG violations. Name, role and selection changes can be inspected at their line positions; actual contrast and keyboard checks remain independently enforced, and human visual review remains required.

Per explanation, generated text is capped at 120 lines / 12000 bytes and 2000 bytes per line. A batch attempts at most 16 comparisons with 600 output lines / 64000 text bytes, before JSON metadata. Larger line-matching problems use a bounded replacement edit (algorithm=bounded-replacement), which may be less compact. Truncation is explicit, including omitted lines/hunks; full source YAML remains linked. report.md displays at most 8 comparisons / 24000 excerpt bytes; AGENT_HANDOFF.md displays 2 / 6000. Review excerpts with TRUNCATED markers as excerpts rather than applicable patches. Unchanged snapshots need no text reads.

Run `npm run smoke:aria` for real Chromium name/role/selected/add/remove changes, masked clock stability, old-file retention, missing-history reasons and contrast/keyboard defect controls. CI saves `artifacts/upstream-contracts/aria-text.report.json` and adjacent `aria-text-evidence/` with YAML plus a Markdown comparison.


### Planned inspection scope and paired benchmark

The browser stage's `inspectionScope` in `report.json` lists each configured route × viewport × color scheme × initial/named state. Counts distinguish requested, confirmed started, completed, failed, not-run and unknown; completionRate uses the configured plan only, never undiscovered app pages. Generated interaction snapshots are listed separately as intermediateStates. Completed means the audit/evidence operation finished, even when it found violations. A terminated worker cannot expose unreturned in-memory progress; those states remain unknown. A plan load error sets planComplete=false, so its missing named states are not a known denominator. Partial failures retain completed findings, produce ERROR/exit 2 and prohibit baseline creation.

Rule-target coverage is independent of plan completion. Zero targets are not-tested; null/missing/invalid counters are unknown. Neither counts as tested. Scope limits disclose axe color contrast, the selected axe accessibility rules and custom rules separately; this is not a full WCAG audit. iframe content and shadow-root elements are excluded from document-scoped audits. Explicit interactions require main-document targets. Delegated listeners and capped direct-listener discovery need explicit markers/plans.

Run `npm run benchmark:scope` after installing the pinned Chromium. Paired fixtures label expected presence/absence for font policy, accessible names, labels, contrast, horizontal overflow and clipping. iframe, open Shadow DOM and delegated-event probes verify exclusions separately. CI retains `artifacts/upstream-contracts/scope-benchmark.json` with labels, actual findings, matched outcomes, scope and TP/FP/FN. Duplicate detections count once per labeled instance; precision/recall exclude boundary probes and use null for zero denominators. Metrics describe this small labeled suite, not whole-product accuracy or performance. Existing interaction, route failure, timeout, compatibility and evidence smoke suites remain required.


### State scenarios and explicit Storybook routes

Run `npm run demo:states` to serve `/ko` and `/ja` on port 5173 (override with `UI_REFINER_DEMO_PORT`). The pages contain actual translated KO/JA data. Copy the relevant entries from `examples/state-scenarios/routes.json` into `browser.routes`; its interaction paths are relative to your project root, so copy the examples or adjust those paths when using another project. Set `browser.url` to the fixture server origin. Use the corresponding locale for each run; one browser locale setting does not translate the app or give routes separate locales. Existing interactions/config formats are unchanged.

The checked-in KO/JA interaction JSON demonstrates form validation errors, opening/closing a modal, an empty list, loading → ready, and long wrapping copy. Enter/Space checks verify distinct output text; dialog checks verify focus containment, Escape and return to the opener. Every named state has a visible/hidden or exact-text ready contract. The controlled loading fixture holds its data until the explicit “Release fixture data” action; ready is observed from page content, without sleeps. Production apps should wait on their real ready elements/data instead of adding this fixture control.

`npm run smoke:states` runs both translations across two viewports and light/dark, checks keyboard/clipping defect controls, and makes each of the seven named states unreachable in turn. Failed reachability produces ERROR/2, preserves earlier completed audits, leaves later states unexecuted and forbids baselines. The machine-readable result is `artifacts/upstream-contracts/state-scenarios.json`; referenced ARIA YAML is archived in the adjacent `state-scenarios-evidence/` directory before normal report retention runs. This finite fixture run does not establish application-wide coverage or performance targets.

For a known Storybook story, configure its document URL directly, for example `/iframe.html?id=states--ko&viewMode=story`, with its own ready selector and interaction plan. The demo includes a local fixture at that URL to validate route/query handling; it is not a real Storybook installation. For your app, use its actual story ID/URL. No story discovery, index adapter, login automation or shared route cookies are added. A version-specific index adapter remains optional when a real target requires it; Storybook is not a dependency.


### Optional visual image regression

Visual comparison is disabled by default and uses advisory mode when enabled. It captures initial and interaction states in the existing onState browser session; it does not launch a second comparison browser. Add this top-level configuration, replacing the profile with your reviewed font/execution-image identifier:

```json
{
  "visual": {
    "enabled": true,
    "mode": "advisory",
    "baselineDir": "ui-visual-baseline",
    "environmentProfile": "reviewed-fonts-and-execution-image-v1",
    "capture": "viewport",
    "threshold": 0.1,
    "maxDiffPixels": 0,
    "maxDiffRatio": 0,
    "masks": [],
    "stabilityAttempts": 3
  }
}
```

Existing browser.captureScreenshots independently captures raw evidence and crops. Visual captures wait for document.fonts.ready and visible image decoding, disable animations, hide the caret and use CSS-pixel scale. Two consecutive PNG byte streams must match within stabilityAttempts (2–5); instability or resource/capture failure is ERROR. capture supports viewport or fullPage. PNGs are limited to 16 million pixels / 32 MB each. Session/route time and output limits still apply; a timed-out worker never implies a visual match.

The profile is explicitly declared by the user for controlled fonts/test data/execution provisioning. It is not automatic font-file or container verification. Manifests also record OS/release/architecture, browser/Playwright/comparator/decoder versions, DPR, locale, UTC/reduced-motion settings, ready/interactions and capture/comparison options. Missing profiles cannot be approved. Changing recorded conditions produces not-comparable; changing route/state/viewport/theme/locale/capture identity requires the corresponding approved image. Baseline keys exclude the server origin/port. Automatic discovery, authentication and application data setup are outside this feature.

Run check to collect candidates, inspect them, then explicitly approve:

```sh
node tools/ui-refiner/bin/ui-refiner.mjs visual candidate --from artifacts/ui-refiner/report.json --out visual-candidate
# Review candidate PNGs, manifest dimensions, masks, environment and policy first.
node tools/ui-refiner/bin/ui-refiner.mjs visual approve --from visual-candidate/manifest.json --out ui-visual-baseline
```

Candidate images are copied out of report retention into their own owned directory. Approval atomically publishes an image manifest in baselineDir; a later explicit approval replaces its full image set and removes only old manifest-owned images. Manual files remain. check only reads this store and never updates approved images. The existing baseline create command remains finding-ID suppression and does not approve images. Candidate creation requires a full completed static/browser run with all requested captures; an enforced needs-baseline result can still supply a candidate. Neither changed-only runs nor failed captures can create one.

| Visual result | Advisory | Explicit enforce |
|---|---|---|
| Disabled | not-requested | — |
| Approved image matches | matched | matched |
| Different image/size | review required | FAIL / 1 |
| Approved image missing | needs-baseline, review required | INCOMPLETE / 2 |
| Environment/options incompatible | not-comparable, review required | INCOMPLETE / 2 |
| Requested capture/file/comparison failure | ERROR / 2 | ERROR / 2 |

Switch mode to enforce only after reviewing approved images and repeat stability in your controlled environment. Other enforced DOM/source defects continue to fail independently. Advisory differences or pending baselines cannot be described as matched; REVIEW_REQUIRED is shown even when manual review was not otherwise configured. A match never clears an existing human review requirement.

Masks are explicit selector strings, at most 20. Each must match 1–100 elements with a visible target; missing targets fail. Masked areas use opaque magenta, with selector/index/viewport CSS boxes recorded in maskRegions. No background/panel is automatically ignored. Fix fixture data or declare narrow masks deliberately; outside changes remain detectable. pixelmatch threshold (0–1) is per-pixel color tolerance. Allowed differing pixels = max(maxDiffPixels, floor(totalPixels × maxDiffRatio)); defaults permit zero different pixels after color tolerance/anti-alias handling. Sizes are compared without resizing; changed dimensions are different with a reason and actual/expected sizes.

report.visual contains state status, actual/expected/diff immutable image references, pixel counts/ratio/tolerances, stabilization/mask/environment metadata and timing/size metrics. Images use existing run-scoped retention, with expected images copied from the baseline into the run so later approval does not rewrite old report evidence. maxObservedWorkerRssBytes is sampled worker RSS, excluding browser descendants; it is not whole-process-tree peak memory. Missing baseline/error states have explicit reasons and cannot become a full enforced PASS. Visual options use their own compatibility contract and do not reset finding/ARIA comparisons.

Run npm run smoke:visual for ten controlled repetitions (initial and saved states), masked normal changes, layout/clipping/outside-mask defects, image-size changes, missing/incompatible baselines, unstable/broken captures, explicit CLI approval and raw-evidence independence. CI retains artifacts/upstream-contracts/visual.report.json and adjacent visual-evidence/. Results describe that fixture/environment, with raw samples and source/environment metadata; no general accuracy, p95 or speed-improvement target is claimed. pixelmatch 7.2.0 (ISC) and pngjs 7.0.0 (MIT) are exact dependencies; original notices are in licenses/.


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
| `images-<runId>/render-*.png` | Optional immutable same-session state images and element crops |
| `image-artifacts.json` | Current run's image inventory, SHA-256, byte counts and capture dimensions |
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
npm run smoke:review4
```

CI runs unit/contract tests, real Chromium UI and CLI checks, session-timeout checks and pinned vendor-sync verification. Fixtures include clean/violating pages, monorepo changes, moved-checkout hooks, generated IDs, pointer-prioritized discovery after a 1600-row list, same-state images and element crops.

Actual checker recordings and their hashes/provenance are retained in `test/fixtures`; live smoke output is compared with the reviewed repair contract. CI also uploads `upstream-contracts` evidence. Contract changes require review rather than silently regenerating fixtures. See [CI workflow](.github/workflows/ci.yml) and [implementation report](IMPLEMENTATION_REPORT_KO.md).

## 10. Standard output and offline review

JSON remains the canonical result. Every check writes `report.html` (no scripts/server), `handoff.json` and the bounded `AGENT_HANDOFF.md`. Handoff records route/state/viewport/theme, actual/expected, verified static source positions, immutable image/ARIA references, input hashes and reproduction arguments. Saved configuration checks record runnable commands; in-memory configurations explicitly require saving the snapshot first. Run the app and reproduce the recorded test data/authentication before rechecking.

```sh
node bin/ui-refiner.mjs check --config ui-refiner.config.json --format json
node bin/ui-refiner.mjs check --config ui-refiner.config.json --format sarif
node bin/ui-refiner.mjs export html --from artifacts/ui-refiner/report.json --out review-bundle
node bin/ui-refiner.mjs export sarif --from artifacts/ui-refiner/report.json --out review.sarif
npm run smoke:export
```

`--format json|sarif|html|markdown` selects stdout only; default summary stays unchanged. All formats and successful exports preserve the original exit codes 0/1/2/3, including human review and scoped-pass distinctions. Export failures return 2. JUnit is deferred until there is a concrete consumer.

Open `review-bundle/report.html` directly using `file://`. Export requires a fresh destination, copies the canonical JSON unchanged and includes referenced current/previous PNG/YAML evidence. `evidence-manifest.json` reports missing/corrupt files and unverified legacy hashes. Evidence stays within the original report directory; symlink/path escapes are rejected. Limits: 2000 references, 256 MB total, 32 MB/PNG and 2 MB/YAML. HTML previews cap findings at 300, visual states at 40, ARIA comparisons at 20 and preformatted values at 12000 characters, with visible omission notices; full data remains in JSON. No source tree, hosting or database is needed.

SARIF 2.1.0 includes primary source locations only for static files/lines read and verified at audit time. Browser selectors remain properties; browser PNG/YAML appears as related evidence, never invented source paths. Relative source/report URIs use separately recorded original base directories, so relocate them deliberately when consuming elsewhere. The pinned official OASIS schema validates output offline in tests; production export adds no runtime dependency.

`smoke:export` includes two deterministic fixture repairs with a two-attempt budget and full rechecks, recording attempts and new blockers. This is a fixture-consumer experiment: autonomous-agent trials = 0, so no autonomous-agent success rate is claimed. The tool never applies fixes, approves baselines or posts PR comments automatically. Preserve policy/SOT and human visual acceptance.

Original evidence paths remain in the bundle; short `e/` aliases keep HTML links usable in Windows browsers with long-path limits. Alias copies count toward the total byte budget.
