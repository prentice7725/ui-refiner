---
description: Refine an AI-looking page in place with UI Refiner, then rescan and show the before/after change
argument-hint: <local file | dev-server url> [extra instructions]
---

Refine the page: $ARGUMENTS

Follow the **Refine** workflow of the `ui-refiner-agent` skill:

1. Find the source that renders the target (the `.html` file itself, or the project files behind the dev server). If you cannot edit it, stop and run the **Review** workflow instead.
2. Run `node <UI_REFINER>/bin/ui-refiner.mjs scan <target>` (the skill explains where `<UI_REFINER>` is), then open `ui-refiner-scan/scan-desktop.png` and `scan-mobile.png` before reading `DESIGN_REVIEW.md`.
3. Write down what must be preserved and the direction (principle, type pairing, accent, what carries the hero) before you edit.
4. Edit by root cause: structure, type, color and surface, copy. Do not invent facts, and do not swap in another stock look.
5. Rerun the same scan command. The report opens with the before/after comparison. Repeat at most three rounds.
6. Reply in the user's language with: score before → after, resolved and remaining signals with reasons, the changes by root cause, what was preserved, and the screenshot paths.
