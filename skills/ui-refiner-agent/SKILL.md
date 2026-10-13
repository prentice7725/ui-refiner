---
name: ui-refiner-agent
description: Design, implement and QA ordinary DOM web-app interfaces using the project SOT, bundled suta guidance, rendered lintapple checks, grouped repair evidence and bounded rechecks. Exclude Canvas, native game HUDs and game design.
---

# UI Refiner agent protocol

1. Read the project SOT, approved art direction, tokens, existing components and acceptance criteria. Preserve approved typography; use the configured en-US, ko-KR or ja-JP policy. Check long copy for all required languages.
2. Read the bundled `vendor/suta/skills/suta/SKILL.md` and relevant patterns in the UI Refiner installation. Treat `.agents/skills/suta` as a guidance snapshot; the maintained runtime is `static.auditPath: "bundled"`. Run doctor to detect drift and browser setup problems.
3. Define hierarchy, the primary action, navigation, error/empty/loading states, focus and screen-reader behavior, reduced motion and responsive breaks. Prefer semantic buttons/links over generic click handlers. Mark explicit alignment, stack, radius and inset contracts where applicable.
4. Implement the interface. Use the installed post-edit hook for newly edited static lines. Use `check --changed-only [--base <ref>]` for targeted Git checks; it includes staged, unstaged and untracked source changes. Treat it as partial coverage, never full QA approval.
5. Run a full `node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json` against the live app. Both engines must complete. Exit 2 means error, missing coverage or partial scope. Inspect `not-tested`/`unknown` rule coverage even when executed rules pass.
6. Read `AGENT_HANDOFF.md` and fix grouped root causes using the reported actual/expected values. For inherited typography, inspect the parent font before changing each child. Use `report.json` for every affected element; do not drop targets because the handoff shows only representative locations. Read resolved/added/persisting changes after each run.
7. Inspect the captured initial/interaction-state images and violating element crops. Use `VISUAL_REVIEW.md` for an optional external visual-model review. Treat all model feedback as advisory: require screenshot/state evidence and leave final acceptance to a human. UI Refiner does not call a vision provider automatically.

## Bounded repair loop

Allow at most two fix/recheck iterations per repair task. Compare the previous and current reports after each iteration, checking resolved findings, new regressions, persisting causes and scope. Stop and report persisting blockers, tool failures or conflicts with the SOT after the second iteration. Never weaken policy, automatically baseline findings or invent suppressions to make the gate pass.

Keep `report.json`, `report.md`, `AGENT_HANDOFF.md`, `previous-report.json`, captured images when enabled and a human visual-review note. Use schemaVersion 2 baselines only after explicit review of a fresh full report.
