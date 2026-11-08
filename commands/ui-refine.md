---
description: Refine an AI-looking page in place with UI Refiner, then rescan and show the before/after change
argument-hint: <local file | dev-server url> [extra instructions]
---

Refine the page: $ARGUMENTS

Follow the **Refine** workflow of the `ui-refiner-agent` skill:

1. Find the source that renders the target (the `.html` file itself, or the project files behind the dev server). If you cannot edit it, stop and run the **Review** workflow instead.
2. Run `node <UI_REFINER>/bin/ui-refiner.mjs scan <target>` (the skill explains where `<UI_REFINER>` is), then open `ui-refiner-scan/scan-desktop.png` and `scan-mobile.png` before reading `DESIGN_REVIEW.md`.
3. Write down what must be preserved. Then mock three clearly different directions for the first screen in `refine-directions/` (each with a signature element only this subject would have, built from real content) and run `node <UI_REFINER>/bin/ui-refiner.mjs directions refine-directions`. Show the user the three directions, the `DIRECTIONS.html` path and your recommendation, then stop and ask which to apply (mixing is allowed). Decide yourself only if the extra instructions say so.
4. Apply the direction by root cause: structure, type, color and surface, copy. Do not invent facts, and do not swap in another stock look. Removing the tells is not enough: a page that is only plainer is not done.
5. Rerun the same scan command. The report opens with the before/after comparison. Check the craft list in the skill against the screenshots; the score is only a guard. Repeat at most three rounds.
6. Reply in the user's language with: the chosen direction, the signature element, score before → after, resolved and remaining signals with reasons, the changes by root cause, what was preserved, and the screenshot paths.
