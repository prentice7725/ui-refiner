# UI Refiner deep QA gate (`check`)

English | [한국어](README_KO.md) | [日本語](README_JA.md) | [Back to README](../../README.md)

This manual covers the optional, policy-enforced gate: `init`, `check`, baselines, routes, evidence, exports, and review packets. For the zero-config design scan and agent workflows, start with the [main README](../../README.md).

## 1. Requirements and installation

You need Node.js **22.18 or newer**, npm, Git, and an explicitly installed Playwright Chromium binary. Runtime npm dependencies are pinned to `axe-core@4.14.0`, `playwright@1.63.0`, `pixelmatch@7.2.0`, and `pngjs@7.0.0`.

Place this repository at `tools/ui-refiner` inside the target app. Source-integrated installation is supported; running `suta`'s native TypeScript from `node_modules` is not, and there is no compiled npm distribution yet.

Run from the **target app root**:

```sh
(cd tools/ui-refiner && npm ci && npx playwright install chromium)
node tools/ui-refiner/bin/ui-refiner.mjs init --dir "$PWD" --locale en-US
```

Supported initial policies are `en-US`, `ko-KR`, and `ja-JP`. Each derives from the single canonical `vendor/lintapple/ui-policy.json`. Korean and Japanese variants add appropriate initial font lists and copy rules; Japanese includes Hiragino, Noto Sans JP, Meiryo, and Yu Gothic. Review the generated policy against your project's approved design system.

`init` preserves existing configuration and policy files. Re-running it with a different locale does not overwrite an existing policy.

## 2. Configure the project

`init` creates `ui-refiner.config.json` and `ui-policy.json`. All project paths resolve relative to the **directory containing the configuration file**.

| Field | Purpose / default |
|---|---|
| `preset` | Only `web` is supported |
| `locale` | Browser locale and initial policy selection; default `en-US` |
| `static.auditPath` | Default `"bundled"`, executing the maintained `vendor/suta` source |
| `static.targets` | Source paths to audit; default `["src"]` |
| `static.enforcement` / `browser.enforcement` | `enforce` or `advisory`; both default to `enforce` |
| `browser.url` | Running app URL; default `http://127.0.0.1:5173` |
| `browser.routes` | Optional 1–50 named routes replacing the single URL target; relative paths resolve against `browser.url` |
| `browser.policyPath` | Project policy; default `ui-policy.json` |
| `browser.ready` | Optional visible readiness selector; default `null` |
| `browser.interactionsPath` | Optional interaction-plan JSON; default `null` |
| `browser.captureScreenshots` | Same-session state images and element crops; default `false` |
| `browser.captureAriaSnapshots` | Same-state accessibility-tree YAML and advisory structure comparisons; default `false` |
| `browser.ariaSnapshotMasks` | Explicit dynamic-copy regex masks; default `[]` |
| `browser.renderedMetrics` | Opt-in rendered design heuristics; advisory only, default `false` |
| `browser.timeoutMs` | Per navigation/audit step timeout; default `120000` ms |
| `browser.sessionTimeoutMs` | Independent total session bound; default `null` for a derived budget |
| `browser.routeTimeoutMs` | Optional route-worker limit; default `null` for a fair share of the remaining total budget |
| `gate.maxStaticWarnings` | Optional static warning cap; `null` leaves warnings non-blocking |
| `gate.allowedHosts` | Explicit navigation host allowlist; defaults to loopback hosts |
| `gate.baselinePath` | Reviewed `schemaVersion` 2 baseline; default `null` |
| `gate.valueExceptionsPath` | Optional reviewed exact design-value exceptions JSON; default `null` |
| `gate.manualVisualReview` | Default `true`; passing full checks still require human visual review |
| `sot.path` | Optional project source-of-truth path; existence is checked, content is not parsed automatically |
| `visual` | Optional same-session image regression (`enabled: false`, `mode: "advisory"`); separate approved image store |
| `reportDir` | Default `artifacts/ui-refiner` |

Keep policy fonts, sizes, and exceptions consistent with your approved source of truth. Agents should read the design documents; the CLI does not infer policy from them. Use trusted app URLs—hosts outside the allowlist and credentials embedded in URLs are rejected.

## 3. Full and changed-line checks

Start the application separately, then run:

```sh
node tools/ui-refiner/bin/ui-refiner.mjs doctor --config ui-refiner.config.json
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json
```

`doctor` verifies vendor SHA-256 hashes, required paths, and the Node runtime, then launches Chromium, opens a blank page, and closes it. Neither `doctor` nor `check` downloads Chromium.

For targeted static checks on changed lines:

```sh
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json --changed-only
node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json --changed-only --base origin/main
```

Without `--base`, Git changes against `HEAD` include staged and unstaged edits plus untracked source files. With `--base`, committed changes relative to that ref are also included. Paths normalize to the configuration root, including nested monorepo apps. Only configured static targets and changed new-side lines are inspected; deleted lines alone do not create new findings.

**Browser checks still inspect the entire configured page and interaction plan.** A compatible `last-full-report.json` distinguishes previously observed, stable browser debt from fresh findings using the URL, locale, policy contents, and interaction contents. Existing debt stays visible under `existingBrowserDebt` without blocking the scoped result. Without a compatible full reference, browser findings remain enforced. This mechanism neither writes nor approves a baseline, and full checks still enforce existing debt.

### Report comparison compatibility

Reports include versioned `comparisonContexts` for finding changes, existing browser debt, and ARIA evidence. The legacy `comparisonContext` field remains an alias for the findings context. These hashes do not alter finding IDs or baseline `schemaVersion` 2.

Both single-page and named-route checks compare using each route's effective URL, `ready` selector, and interaction contents, along with locale, policy, and pinned engine metadata. Changing `browser.ready` therefore invalidates comparisons and existing-debt suppression, while an explicit route override ignores unused global `ready`/`interactionsPath` settings. Comparison compatibility preserves absolute URLs, whereas portable baseline IDs still exclude host and port.

| Change | Findings comparison | Existing browser debt | ARIA comparison |
|---|---|---|---|
| Effective URL/`ready`/plan, locale, policy, or browser engine | Reset | Reset | Reset |
| `renderedMetrics` | Reset | Keep | Keep |
| ARIA masks or `captureAriaSnapshots` | Keep | Keep | Reset |
| `captureScreenshots`, time budgets, or manual review | Keep | Keep | Keep |
| Static targets/audit path/engine | Reset | Keep | Keep |

Scope changes and incomplete runs cannot produce resolved findings or ARIA removals, and existing debt requires a completed compatible full report. Older reports lacking the new metadata are rejected with an explicit reason—run a full check once to establish a new reference. Existing reviewed v2 baselines remain usable. `diff.reason`, `ariaDiff.reason`, and `browserReference.reason` explain unavailable comparisons in JSON, and the handoff and ARIA summaries surface those reasons as well.

### Status and exit codes

| Status | Exit | Meaning |
|---|---:|---|
| `PASS` | 0 | Full checks found no new enforced violations; manual review disabled |
| `REVIEW_REQUIRED` | 0 | Configured enforced checks passed; advisory image or human visual review remains |
| `FAIL` | 1 | New enforced findings |
| `ERROR` / `INCOMPLETE` | 2 | Tool or environment failure, or missing required checker coverage |
| `SCOPED_PASS` | 3 | Changed scope passed; **not full QA approval** |

Disabling either required engine prevents a full `PASS`, and a `SCOPED_PASS` cannot be used to create a baseline. Run full checks before acceptance.

## 4. Browser coverage and evidence capture

The browser runs in a separate process with total time and output bounds. `browser.timeoutMs` caps individual navigation and audit steps. Set `browser.sessionTimeoutMs` for an explicit total limit; otherwise, it is derived from viewport/theme combinations, planned interactions, and capture allowance, capped at **600,000 ms**. Multiple valid sequential steps can therefore exceed a single step's timeout without premature termination.

Initial and interaction-state audits share the same browser session, locale, and reduced-motion setting with their captured images. Capture is optional and produces at most **five unique violating-element crops per state**, recording a reason when a crop is unavailable. After an interrupted run, treat the current report's artifact list as authoritative.

PNG evidence is stored under `images-<runId>/` with a content SHA-256 in each filename so later audits never overwrite earlier images. `imageArtifacts` and `image-artifacts.json` record artifact IDs, hashes, byte counts, and route/state/viewport/theme/locale dimensions; each browser finding's `imageEvidence` links its state image and matching available crops. Existing `artifacts` and `captures[].image` paths remain relative to `reportDir`, so consumers must support the subdirectory and copy referenced directories when sharing a report.

Current, previous, and last-full reports (including image references in finding diffs) protect their image runs. After report and image-inventory files are published via atomic per-file replacement, cleanup removes only unreferenced, explicitly owned image directories. Manual files, unknown contents, and symlinks protect a directory from deletion, and legacy flat PNGs are left untouched. Interrupted, unpublished runs receive an 11-minute grace period (the maximum browser budget plus one minute). Retention is reference-based rather than an unlimited archive, so use a separate `reportDir` for concurrent audits or long-term archival and keep referenced run directories whole. If a requested state-image capture fails, the run returns `ERROR`; unavailable element crops record their reason, and a failed capture never replaces the last completed full report.

Coverage reports show target counts for alignment, layout/control gaps, nested radius, and control inset. Zero targets report `not-tested`, and missing counters report `unknown`. Add the relevant `data-ui-*` contracts wherever those checks should apply; `PASS` does not imply that unmarked contracts were tested.

Clickable generic elements are checked for missing keyboard focus and semantic roles via inline `onclick`, DOM `onclick` properties (including React-style handlers), `data-ui-clickable`, and Chromium CDP direct click listeners. CDP inspects at most **500 visible non-native candidates per state**, prioritizing `cursor:pointer` before document order, and excludes known framework delegation roots. Reports disclose limited inspection and CDP availability; delegated descendants and candidates beyond the cap require explicit markers or interaction plans. Verify actual `Enter`/`Space` behavior with an interaction plan (see [examples/interactions.json](../../examples/interactions.json)).

### Named routes, ARIA evidence, and rendered metrics

Add these fields to the existing `browser` object while keeping its other fields:

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

Routes take unique safe names and either absolute HTTP(S) URLs or root-relative paths. Omitting `ready` or `interactionsPath` inherits shared settings, whereas an explicit `null` disables them for that route.

Each route runs in an isolated, time-bounded worker/browser with clean viewport and theme contexts, and the overall time budget accounts for route count. If any requested route fails, the overall status is `ERROR`, though findings from completed runs/states and other routes remain visible in `routeResults` and raw runs. A worker timeout can discard that worker's buffered partial states without affecting previously completed workers. Only listed routes are covered; Storybook URLs can be listed explicitly, and authentication state and cookies are not shared across routes.

Navigation hosts are validated before requests. Redirects are rejected without following the chain, so configure the final URL directly. Service workers are disabled during the audit session. External subresources are not covered by the navigation allowlist; this is not a general network sandbox.

Multi-route fingerprints combine the route name with `pathname + search`—excluding origin, host, port, and fragment—while legacy single-URL identities remain unchanged. Switching to explicit routes requires reviewing a fresh full baseline, and old multi-route baselines using absolute-URL IDs must be recreated once because hash-only entries cannot be migrated safely. Baseline `schemaVersion` stays 2.

Image filenames include the route. Optional ARIA YAML snapshots include a content hash to preserve earlier evidence, and compatible runs produce `ariaDiff` with changed, added, removed, and unchanged dimensions plus `previousFile`/`file` paths and bounded, line-numbered YAML text explanations in `report.json`, `report.md`, and the agent handoff. ARIA changes remain advisory—inspect the linked YAML pair for complete evidence. Capture is opt-in, capped at 2 MB per state, and returns `ERROR` if a requested capture fails. Images and accessible names may contain sensitive app content; review them before sharing.

Rendered metrics describe visible viewport content: top-pinned fixed/sticky regions (nested regions counted once), filled buttons, repeated button/link names and destinations, and approximate 15-degree chromatic hue buckets from computed text, background, and border colors. Inspection is capped at 10,000 DOM elements with limited coverage disclosed. Repeated actions or multiple filled buttons may be intentional. These observations are **advisory only**, cannot block or enter a baseline, and never weaken accessibility checks. Hue counts serve as evidence rather than an enforced color cap; gradients, images, and full perceptual color analysis are out of scope.

Metric action names are DOM label/text approximations rather than a full accessible-name computation (check ARIA YAML for semantic evidence). Visibility relies on `checkVisibility` and viewport bounds without occlusion modeling. Target samples are capped at 10 per observation and duplicate-action groups at 20, with total counts and caps recorded.

`browser.routeTimeoutMs` optionally caps each worker; otherwise, pending routes split the remaining session budget evenly. The 600,000 ms total cap still applies, leaving roughly 3,000 ms per run before overhead in a 200-run batch. Reports disclose actual allocations and average budgets—split large or slow batches rather than treating partial completion as `PASS`. Total browser output across a batch is capped at 20 MB.

Filled-button counts require at least `1.5:1` computed background contrast against the nearest opaque ancestor, compositing translucent ancestor layers, so same-color ghost buttons and low-contrast default controls are excluded. Gradients, images, and unresolved canvas backgrounds are reported as `unknown` rather than assumed filled. Top-pinned counts exclude dialogs, explicit backdrop scopes, and elements covering at least half the viewport.

To mask known dynamic copy, configure `browser.ariaSnapshotMasks` (default `[]`, up to 20 patterns; allowed flags `g`/`i`/`m`/`u`, default `g`):

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

The masked YAML is saved and hashed while unmasked label and role changes stay visible. Avoid broad patterns that erase meaningful quantities or semantic structure; changing masks starts a new comparison context. After reports are written, cleanup removes only tool-owned, unreferenced ARIA files while retaining current/previous evidence, comparison pairs, and the `last-full-report.json` reference. Manual files are left untouched.

### Readable ARIA changes

When `browser.captureAriaSnapshots` is enabled, compatible runs explain changed, added, and removed snapshot dimensions using plain YAML text diffs. `ariaDiff.changed[].textDiff` (and its `added`/`removed` equivalents) records unified hunks, old/new line positions, `oldFile`/`newFile`, `algorithm`, limits, and truncation reasons. Changed entries also retain `previousSha256`/`previousBytes`, and `ariaDiff.textSummary` reports `compared`/`unavailable`/`notGenerated`/`truncated` counts. These fields leave compatibility hashes and finding/baseline IDs intact; mask changes still reset ARIA compatibility. Explanations are generated while writing reports.

The reader checks for regular files, the 2 MB snapshot limit, stored hashes, and readable byte counts. Missing or inconsistent history produces an explicit `unavailable` reason rather than implying no change, while requested capture failures still return `ERROR`. This diff compares text lines without parsing YAML or classifying semantic/WCAG violations. You can inspect name, role, and selection changes by line number, while contrast checks, keyboard checks, and human visual review remain independently enforced.

Generated explanations are capped at 120 lines / 12,000 bytes each (2,000 bytes per line), and a batch attempts at most 16 comparisons totaling 600 output lines / 64,000 text bytes before JSON metadata. Larger line-matching inputs fall back to `algorithm=bounded-replacement`, which may be less compact. Truncation and omitted lines/hunks are noted explicitly, and full YAML sources remain linked. `report.md` renders up to 8 comparisons / 24,000 excerpt bytes, and `AGENT_HANDOFF.md` renders up to 2 / 6,000; treat excerpts with `TRUNCATED` markers as previews rather than applicable patches. Unchanged snapshots skip text reads.

Run `npm run smoke:aria` to test real Chromium name/role/selected/add/remove changes, masked clock stability, old-file retention, missing-history reasons, and contrast/keyboard defect controls. CI saves `artifacts/upstream-contracts/aria-text.report.json` and `aria-text-evidence/` with YAML and Markdown comparisons.

### Planned inspection scope and paired benchmark

In `report.json`, the browser stage's `inspectionScope` enumerates every configured `route × viewport × colorScheme × initial/named state`. Counts track requested, confirmed started, completed, failed, not-run, and `unknown` entries; `completionRate` uses only the configured plan as its denominator, never undiscovered app pages. Intermediate interaction snapshots are tracked separately under `intermediateStates`. "Completed" means the audit and requested evidence capture finished, even if violations were found. Progress inside a terminated worker that never returned remains `unknown`. A plan load error sets `planComplete=false`, leaving missing named states out of a known denominator. Partial failures keep completed findings, return `ERROR` (exit `2`), and forbid baseline creation.

Rule-target coverage is independent of plan completion. Zero targets report `not-tested`, and `null`/missing/invalid counters report `unknown`; neither counts as tested. Scope limits report axe color contrast, selected axe accessibility rules, and custom rules separately rather than claiming a full WCAG audit. `iframe` contents and shadow roots are excluded from document-scoped audits, explicit interactions require main-document targets, and delegated listeners or capped direct-listener discovery require explicit markers or interaction plans.

Run `npm run benchmark:scope` after installing the pinned Chromium binary. Paired fixtures compare expected presence/absence labels for font policy, accessible names, labels, contrast, horizontal overflow, and clipping, while `iframe`, open Shadow DOM, and delegated-event probes verify exclusions separately. CI retains `artifacts/upstream-contracts/scope-benchmark.json` with labels, actual findings, matched outcomes, scope, and TP/FP/FN counts. Duplicate detections count once per labeled instance; precision and recall exclude boundary probes and report `null` when the denominator is zero. These metrics characterize this small labeled suite rather than whole-product accuracy or performance. Existing interaction, route failure, timeout, compatibility, and evidence smoke suites remain required.

### State scenarios and explicit Storybook routes

Run `npm run demo:states` to serve `/ko` and `/ja` on port `5173` (override via `UI_REFINER_DEMO_PORT`), containing translated KO/JA fixture data. Copy the relevant entries from `examples/state-scenarios/routes.json` into `browser.routes` and set `browser.url` to the fixture server origin; adjust interaction paths relative to your project root when copying into another app. Set the matching `--locale` (or `locale`) per run, because one browser locale setting neither translates an app nor gives routes individual locales. Existing interaction and config formats are unchanged.

The checked-in KO/JA interaction JSON exercises form validation errors, opening/closing a modal, an empty list, `loading → ready`, and long wrapping copy. `Enter`/`Space` checks verify distinct output text, while dialog checks verify focus containment, `Escape`, and focus return to the opener. Every named state defines a visible/hidden or exact-text ready contract. The controlled loading fixture holds data until the explicit "Release fixture data" action so readiness is observed from page content without sleeps; production apps should wait on real ready elements or data instead of adding fixture controls.

`npm run smoke:states` runs both translations across two viewports and light/dark themes, checks keyboard/clipping defect controls, and forces each of the seven named states to fail reachability in turn. Unreachable states return `ERROR` (`2`), preserve earlier completed audits, leave later states unexecuted, and forbid baselines. Machine-readable output goes to `artifacts/upstream-contracts/state-scenarios.json`, with referenced ARIA YAML archived in `state-scenarios-evidence/` before normal retention pruning runs. This finite fixture run does not establish app-wide coverage or performance targets.

For a known Storybook story, configure its document URL directly (for example `/iframe.html?id=states--ko&viewMode=story`) with its own `ready` selector and interaction plan. The demo includes a local fixture at that URL solely to validate route and query handling; it is not a real Storybook installation, so point real projects at actual story IDs/URLs. Automatic story discovery, index adapters, login automation, and cross-route shared cookies are not included; Storybook is not a dependency, and a version-specific index adapter remains optional if a real target needs one.

### Optional visual image regression

Visual comparison is disabled by default and runs in `advisory` mode when enabled. It captures initial and interaction states inside the existing `onState` browser session without launching a second browser. Add this top-level block, replacing `environmentProfile` with your reviewed font and execution-image identifier:

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

`browser.captureScreenshots` continues to capture raw evidence and crops independently. Visual captures wait for `document.fonts.ready` and visible image decoding, disable animations, hide the caret, and use CSS-pixel scale. Two consecutive PNG byte streams must match within `stabilityAttempts` (2–5); instability or resource/capture failure returns `ERROR`. `capture` supports `viewport` or `fullPage`, capped at 16 million pixels / 32 MB per PNG. Session/route time and output limits still apply, and a worker timeout never implies a visual match.

`environmentProfile` is an explicit user declaration for controlled fonts, test data, and execution provisioning—not automatic font-file or container verification. Manifests also record OS/release/architecture, browser/Playwright/comparator/decoder versions, DPR, locale, UTC/reduced-motion settings, `ready`/interactions, and capture/comparison options. Candidates without a profile cannot be approved. Changing recorded conditions produces `not-comparable`, and changing route, state, viewport, theme, locale, or capture identity requires a matching approved image. Baseline keys exclude the server origin and port. Automatic discovery, authentication, and application data setup are outside this feature.

Run `check` to collect candidates, inspect them, and then approve explicitly:

```sh
node tools/ui-refiner/bin/ui-refiner.mjs visual candidate --from artifacts/ui-refiner/report.json --out visual-candidate
# Review candidate PNGs, manifest dimensions, masks, environment, and policy first.
node tools/ui-refiner/bin/ui-refiner.mjs visual approve --from visual-candidate/manifest.json --out ui-visual-baseline
```

`visual candidate` copies images out of report retention into an owned directory. `visual approve` atomically publishes an image manifest in `baselineDir`; later approvals replace the full image set and remove only old manifest-owned images, preserving manual files. `check` only reads this store and never updates approved images. The existing `baseline create` command remains finding-ID suppression and does not approve images. Candidate creation requires a completed full static/browser run with all requested captures (an enforced `needs-baseline` result can supply a candidate, whereas `--changed-only` runs and failed captures cannot).

| Visual result | `advisory` | Explicit `enforce` |
|---|---|---|
| Disabled | `not-requested` | — |
| Approved image matches | `matched` | `matched` |
| Different image/size | review required | `FAIL` / 1 |
| Approved image missing | `needs-baseline`, review required | `INCOMPLETE` / 2 |
| Environment/options incompatible | `not-comparable`, review required | `INCOMPLETE` / 2 |
| Requested capture/file/comparison failure | `ERROR` / 2 | `ERROR` / 2 |

Switch `mode` to `enforce` only after reviewing approved images and verifying repeat stability in your controlled environment. Other enforced DOM/source defects still fail independently. Advisory differences or pending baselines are never reported as `matched` and trigger `REVIEW_REQUIRED` even when manual review is disabled; a visual match never clears an existing human review requirement.

`masks` accepts up to 20 explicit selector strings; each must match 1–100 elements with a visible target (missing targets fail). Masked areas render as opaque magenta, with selector, index, and viewport CSS boxes recorded in `maskRegions`. No background or panel is ignored automatically—fix test data or declare narrow masks deliberately so outside changes stay detectable. `pixelmatch` `threshold` (0–1) controls per-pixel color tolerance, and allowed differing pixels equal `max(maxDiffPixels, floor(totalPixels × maxDiffRatio))` (defaults allow zero differing pixels after color tolerance and anti-aliasing). Dimensions are compared without resizing; changed dimensions report `different` with a reason and actual/expected sizes.

`report.visual` records per-state status, immutable `actual`/`expected`/`diff` image references, pixel counts/ratios/tolerances, stabilization/mask/environment metadata, and timing/size metrics. Images use run-scoped retention, copying `expected` from the baseline into the run so later approvals never rewrite past report evidence. `maxObservedWorkerRssBytes` samples worker RSS excluding browser descendants, not peak memory across the whole process tree. Missing baseline or error states include explicit reasons and cannot produce a full enforced `PASS`. Visual options use their own compatibility contract and do not reset finding or ARIA comparisons.

Run `npm run smoke:visual` for 10 controlled repetitions (initial and saved states), masked normal changes, layout/clipping/outside-mask defects, image-size changes, missing/incompatible baselines, unstable/broken captures, explicit CLI approval, and raw-evidence independence. CI retains `artifacts/upstream-contracts/visual.report.json` and `visual-evidence/`. Results describe that fixture and environment with raw samples and metadata; no general accuracy, p95, or speed target is claimed. `pixelmatch@7.2.0` (ISC) and `pngjs@7.0.0` (MIT) are exact dependencies; original notices live in `licenses/`.

## 5. Reports and repair handoff

Outputs are written under `reportDir`:

| File | Contents |
|---|---|
| `report.json` | All findings and targets, actual/expected values, original browser details, blocking flags, groups, scope, and coverage |
| `report.md` | Readable grouped findings, gate status, and coverage |
| `AGENT_HANDOFF.md` | Prioritized repair tasks, short target hints, and changes from the previous run |
| `previous-report.json` | Previous run used for comparing compatible scopes |
| `last-full-report.json` | Completed full-check reference used to separate existing browser debt in scoped runs |
| `lintapple.raw.json` | Raw rendered checker output |
| `images-<runId>/render-*.png` | Optional immutable same-session state images and element crops |
| `image-artifacts.json` | Current run's image inventory, SHA-256, byte counts, and capture dimensions |
| `render-*.aria.yml` | Optional same-state ARIA structure; content hashes preserve previous evidence |
| `VISUAL_REVIEW.md` | Advisory review packet for a person or an external vision model |

The handoff orders **actual blockers → advisory errors → warnings**. Matching causes are grouped across targets, viewports, and states so an inherited font problem can be fixed at its source instead of element by element. Semantic targets appear as hints such as `h1 "Unlock…"` rather than raw identity JSON.

`AGENT_HANDOFF.md` is capped at roughly **6 KiB**. If blocker groups are omitted, their count and rule names are stated explicitly. Every full selector, exact identity, and remaining group stays in `report.json`; inspect them before finishing repairs.

Compatible consecutive runs record resolved, added, and persisting identities. Agent guidance caps a repair task at two fix/recheck rounds; the CLI never runs an autonomous repair loop. Vision-model feedback is advisory and never changes gate status—a human owns visual acceptance.

## 6. Baseline `schemaVersion` 2

Configuration files use `schemaVersion: 1`, while regression baselines use **`schemaVersion: 2`**.

Create a baseline from a fresh **full** report:

```sh
node tools/ui-refiner/bin/ui-refiner.mjs baseline create --from artifacts/ui-refiner/report.json --out ui-refiner.baseline.v2.json
```

Review the suppression list before setting `gate.baselinePath`. Version 1 baselines are rejected and cannot be relabeled safely as version 2. `baseline create` never overwrites an existing output file.

- Static identities use the relative source path and unique trimmed source-line content, excluding line numbers and diagnostic messages; empty or repeated anchors cannot be baselined.
- Browser identities use a unique application marker or unique scoped semantic identity, viewport dimensions, theme, state, pseudo-element, and related target; measured values and `nth-of-type` positions are excluded.
- Known generated IDs from React `useId`, Radix, and Headless UI—including `:r0:`, `«r0»` / `«R1»`, and `_r_0_`—are excluded as anchors even when unique. Prefer explicit `data-ui-id`, `data-testid`, or `data-qa` markers.
- Ambiguous identities stay reported and cannot be suppressed (`excludedFindings` records how many were skipped). Source or semantic changes intentionally produce a new identity.

No check automatically adds findings to a baseline or weakens policy.

### Reviewed exact-value exceptions

Point `gate.valueExceptionsPath` to a project-relative JSON file modeled on [examples/value-exceptions.json](../../examples/value-exceptions.json). Review entries explicitly—the example is not an approval. Each entry requires `engine: "lintapple"`, `rule`, exact primitive `actual`, and a nonempty `reason`, with optional `route` and exact report `selector` to narrow scope. Supported design rules are `font-family`, `font-size`, `copy`, and `root-background`. Copy exact values and selectors from `report.json` rather than approximate fonts or equivalent CSS selectors.

Matched findings retain evidence and their `reviewedException` reason without blocking. They are not added to a baseline automatically, preventing a value-specific approval from turning into a value-independent suppression; other values or scopes still fail. Accessibility and interaction rules cannot be waived here. Policy `exceptions` remain a separate, broader selector-wide mechanism.

## 7. Agent skill and portable hooks

Optional installation from the app root:

```sh
node tools/ui-refiner/scripts/install-agent-skill.mjs "$PWD"
```

For an in-project checkout, the installer preserves existing Claude settings and adds a project-relative `PostToolUse` hook using `CLAUDE_PROJECT_DIR` (along with a `Stop` finish hook); the wrapper imports the maintained hook via a relative path so moving the checkout embeds no personal absolute paths. An external personal checkout updates `.claude/settings.local.json` and sets a local `UI_REFINER_HOME` override, leaving shared settings intact.

The skill is copied to `.agents/skills/ui-refiner-agent` (Codex) and `.claude/skills/ui-refiner-agent` (Claude Code). Other hosts should register the generated `.agents/skills/ui-refiner-agent/hook-registration.json` in their supported hook UI; unsupported Codex settings are not invented. The hook checks edited static lines only and is not a full gate. The installer refuses to overwrite locally modified files without review, so inspect differences before passing `--update`.

Runtime auditing defaults to `static.auditPath: "bundled"`. You can copy an optional `suta` guidance snapshot with:

```sh
bash tools/ui-refiner/scripts/install-suta.sh "$PWD"
```

`doctor` warns when that snapshot drifts. Explicit legacy audit-path overrides remain supported, though stale `.agents/skills/suta/scripts/audit.mjs` paths should be migrated to `"bundled"` after review.

## 8. Upstream maintenance and provenance

```sh
node tools/ui-refiner/bin/ui-refiner.mjs upstream check
node tools/ui-refiner/scripts/sync-vendor.mjs --suta <40-character-SHA>
node tools/ui-refiner/scripts/sync-vendor.mjs --lintapple <40-character-SHA>
```

`upstream check` compares pinned commits against upstream `HEAD` without modifying files. `sync-vendor` rejects unrecorded local vendor edits, stages the requested source, replays reviewed patches, records original/current hashes, and runs unit tests plus the UI and CLI browser smokes. Patch conflicts or validation failures restore the previous vendor source and manifest. Sync never installs Chromium, commits, pushes, or approves an upgrade.

Preserve future engine changes in the replayable patch and update the reviewed manifests. Licenses and pins: [vendor/UPSTREAM.json](../../vendor/UPSTREAM.json), [licenses/THIRD_PARTY.md](../../licenses/THIRD_PARTY.md), [suta MIT license](../../vendor/suta/LICENSE), and [lintapple MIT license](../../vendor/lintapple/LICENSE). Upstream repositories: [suta](https://github.com/Guksu/suta) and [lintapple](https://github.com/gholtzap/lintapple).

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

CI runs unit/contract tests, real Chromium UI and CLI checks, session-timeout checks, and pinned vendor-sync verification. Fixtures cover clean and violating pages, monorepo changes, moved-checkout hooks, generated IDs, pointer-prioritized discovery after a 1,600-row list, same-state images, and element crops.

Recorded checker outputs and their hashes/provenance live in `test/fixtures`; live smoke output is compared against the reviewed repair contract. CI also uploads `upstream-contracts` evidence. Review contract changes explicitly rather than regenerating fixtures silently. See the [CI workflow](../../.github/workflows/ci.yml).

## 10. Standard output and offline review

JSON remains the canonical result. Every check writes `report.html` (no scripts or server required), `handoff.json`, and the bounded `AGENT_HANDOFF.md`. Handoffs record route/state/viewport/theme, actual/expected values, verified static source locations, immutable image/ARIA references, input hashes, and reproduction arguments. Saved-config runs record runnable commands, while in-memory configs explicitly require saving a snapshot first. Start the app and reproduce the recorded test data and authentication before rechecking.

```sh
node bin/ui-refiner.mjs check --config ui-refiner.config.json --format json
node bin/ui-refiner.mjs check --config ui-refiner.config.json --format sarif
node bin/ui-refiner.mjs export html --from artifacts/ui-refiner/report.json --out review-bundle
node bin/ui-refiner.mjs export sarif --from artifacts/ui-refiner/report.json --out review.sarif
npm run smoke:export
```

`--format json|sarif|html|markdown` changes `stdout` only while keeping the default summary behavior unchanged. All formats and successful exports preserve the original exit codes (`0`/`1`/`2`/`3`), including human review and scoped-pass distinctions; export failures return `2`. JUnit output is deferred until a concrete consumer needs it.

Open `review-bundle/report.html` directly via `file://`. Export requires a fresh destination directory, copies canonical JSON unchanged, and bundles referenced current/previous PNG and YAML evidence. `evidence-manifest.json` flags missing/corrupt files and unverified legacy hashes. Evidence must stay inside the original report directory; symlink and path escapes are rejected. Limits: 2,000 references, 256 MB total, 32 MB per PNG, and 2 MB per YAML. HTML previews cap findings at 300, visual states at 40, ARIA comparisons at 20, and preformatted values at 12,000 characters with explicit omission notices; full data stays in JSON, and no source tree, hosting, or database is required.

SARIF 2.1.0 includes primary source locations only for static files and lines verified at audit time. Browser selectors stay in properties, and browser PNG/YAML files appear as related evidence rather than invented source paths. Relative source/report URIs use separately recorded original base directories, so relocate them deliberately when consuming elsewhere. Tests validate output offline against the pinned official OASIS schema with zero extra runtime dependencies.

`smoke:export` runs two deterministic fixture repairs with a two-attempt budget and full rechecks, recording attempts and new blockers. Because this is a fixture-consumer experiment with zero autonomous-agent trials, it claims no autonomous-agent success rate. The tool never applies fixes, approves baselines, or posts PR comments automatically; preserve your policy, SOT, and human visual acceptance.

Original evidence paths stay intact inside the bundle, while short `e/` aliases keep HTML links working in Windows browsers with long-path limits (alias copies count toward the total byte budget).

## 11. Product context, functional preservation, and design review

Optional `contextPath` points to a `schemaVersion` 1 JSON file separating product facts, declared document references, and route-specific surface purposes (`persuade`, `operate`, `read`, `experience`). Missing facts stay `unknown`; reference hashes and declared approvals are recorded, and context never generates or weakens checker policy. See [examples/project-context.json](../../examples/project-context.json) and the [complete workflow](../CONTEXT_PRESERVATION_REVIEW_KO.md).

Optional `preservation` (`{"enabled": true, "enforcement": "advisory", "baselinePath": null}`) captures same-state link, form, field, control, and test-hook inventories, explicit target attributes/text/names, and declared root CSS tokens. Inspect a full capture first, then save it explicitly with `preserve record --from report.json --out preservation-reference.json`, set `baselinePath`, and optionally switch to `enforce`. Under `enforce`, differences return `FAIL` (`1`), missing or incompatible references return `INCOMPLETE` (`2`), and collection failures return `ERROR` (`2`). `check` never updates references. IDs, classes, and order are excluded; names are approximate, input values are never stored, and DOM equality does not prove handlers or backend behavior—interaction plans remain necessary.

```sh
node bin/ui-refiner.mjs rules --json
node bin/ui-refiner.mjs guide harden --json
node bin/ui-refiner.mjs review packet --from artifacts/ui-refiner/report.json --out design-review
node bin/ui-refiner.mjs review validate --from submitted-review.json --report artifacts/ui-refiner/report.json --out accepted-review.json
npm run smoke:context
```

`guide` supports `audit`, `critique`, `polish`, and `harden` without changing check scope. The rule catalog describes engine IDs, domains, phases, prerequisites, and limits, while actual execution coverage stays in the report. Review packets separate design inputs from detector inputs and preserve evidence. Validation verifies exact report hashes, attachments, and dimensions, though declared reviewer execution and order are not independently attested. All review observations stay advisory, and no model is called automatically.

`npm run benchmark:agent -- --executor <absolute-claude-executable>` is an opt-in real agent experiment on synthetic scratch fixtures, excluded from CI. It runs a restricted installed CLI with file tools only across 2 samples × 2 arms, capped at 2 attempts, 180 seconds, and 1 USD API budget per attempt. It records reported model usage/cost, policy and preservation violations, full rechecks, unresolved/error/not-run cases, and detector implementation hashes. These small samples do not establish statistical superiority or a Hallmark/Impeccable head-to-head result; see the workflow document for requirements and artifacts.

## 12. Advisory UX repair guidance

Checks attach local UX search results to `report.json.repairGuidance`, `handoff.json.repairGuidance`, and per-target `repairSuggestions`, with bounded previews in `AGENT_HANDOFF.md`, `report.md`, and `report.html`. Queries derive from known finding rule IDs rather than page text, and unknown rules explicitly report `no-match`. Blocking findings come first; baselined, reviewed-exception, and existing-debt findings are excluded.

```sh
node bin/ui-refiner.mjs guidance --query "keyboard focus" --limit 3
node bin/ui-refiner.mjs guidance --query "폼 오류" --limit 2
npm run smoke:guidance
```

The bundled UI UX Pro Max UX CSV is pinned at commit `28b3b8dee8c976df4fa3e94aed4e092ad43fcb03`: 119 source rows, filtered to `Web`/`All` for retrieval. Exact bytes, license, source lines, row IDs, and hashes are preserved under `knowledge/ui-ux-pro-max/`. The original Python search and design-system generator is neither installed nor executed; the Node implementation provides deterministic BM25 ranking, lexical KO/JA aliases, category filtering, and explicit `no-match` results. Scores measure keyword relevance, not visual quality or confidence.

Optional `guidance` settings default to `{"enabled": true, "maxFindings": 20, "maxSuggestions": 2}` (caps: 50 findings, 3 suggestions per finding); set `guidance.enabled: false` to disable attachment. Markdown previews are capped separately at 4 entries / 3,200 bytes, with omissions recorded in JSON. Missing or corrupt corpus data reports `guidance` unavailable without changing the gate verdict. No network or model requests occur during search.

Every suggestion includes upstream severity, good/bad examples, and an immutable source URL. Upstream `High` is always advisory and never becomes a blocker or policy rule. Read the real finding, evidence, and approved SOT first; examples can be framework-specific, contextual, or stricter than your project's standard. This feature does not generate policy, apply page overrides, infer a stack, auto-fix code, or install MCP servers or plugins.
