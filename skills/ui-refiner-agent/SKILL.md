---
name: ui-refiner-agent
description: Design, implement and QA ordinary web-app interfaces with existing design systems, suta patterns, lintapple rendered checks and UI Refiner evidence. Never use for Canvas, native game engine HUDs or game design patterns.
---

# UI Refiner agent protocol

Scope: **ordinary browser DOM web-app UI only**. Game HUDs, Canvas-rendered interfaces and Godot/native engine interfaces belong to a separate future research project.

1. Read the project SOT/design-system tokens, existing components and acceptance criteria; keep approved branding and typography. Generic suta aesthetic preferences are guidelines, not automatic grounds to override explicit branding.
2. Inspect the upstream `.agents/skills/suta/SKILL.md` and the relevant one of its 57 patterns. Reuse tested core and existing project components instead of inventing new ones.
3. Define hierarchy, primary action, navigation, error/empty/loading states, keyboard and screen-reader interactions, reduced motion, Korean/English overflow, 320px/390px/1440px viewport behaviors.
4. Implement semantic accessible DOM elements with clear focus handling; avoid blindly decorating surfaces or using `transition: all`.
5. Launch the web app and run `node tools/ui-refiner/bin/ui-refiner.mjs check --config ui-refiner.config.json`. Both checks must complete. Exit 2 means infrastructure or coverage error, not success.
6. Read `artifacts/ui-refiner/AGENT_HANDOFF.md`. Fix fresh blocking findings and rerun. Never weaken policy/baseline to hide failures.
7. Inspect screenshots, interactive states, long content and responsive breaks. The human reviewer owns visual/UX acceptance despite automated PASS.

## Worker handoff

The implementer owns code and the initial pass. QA workers may attempt at most two bounded fix/recheck iterations; report failures to the lead for SOT conflicts or tool failures. No autonomous execution of LLM-proposed shell text. Required evidence: `report.json`, `report.md`, `AGENT_HANDOFF.md`, optional screenshots and a visual-review note.
