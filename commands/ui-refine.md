---
description: Refine an AI-looking page in place with UI Refiner, then rescan and show the before/after change
argument-hint: <local file | dev-server url> [extra instructions]
---

Refine the page: $ARGUMENTS

Follow the **Refine** workflow of the `ui-refiner-agent` skill:

1. Find the source that renders the target (the `.html` file itself, or the project files behind the dev server). If you cannot edit it, stop and run the **Review** workflow instead.
2. Run `node <UI_REFINER>/bin/ui-refiner.mjs scan <target>` (the skill explains where `<UI_REFINER>` is), then open `ui-refiner-scan/scan-desktop.png` and `scan-mobile.png` before reading `DESIGN_REVIEW.md`.
3. Write down what must be preserved. Then run `node <UI_REFINER>/bin/ui-refiner.mjs directions deal refine-directions --kind <software|service|place|public|company|studio|media> --lang <page language>` (with `--no-photo` when there are no real photos). It deals each direction a hero structure, a type pairing, an accent family and a surface. Mock the first screen in `refine-directions/a.html`, `b.html` and `c.html`, each built from its deal (real brand fonts and colours override it) and each with a signature element only this subject would have, built from real content. Use at most one faint off-white surface.
   Run `node <UI_REFINER>/bin/ui-refiner.mjs directions refine-directions`. If the sheet warns, redo that mock first.
   Show the user the three directions, the `DIRECTIONS.html` path and your recommendation, then stop and ask which to apply (mixing is allowed). Decide yourself only if the extra instructions say so.
   Record the choice with `node <UI_REFINER>/bin/ui-refiner.mjs directions record refine-directions --pick <A|B|C> --page <name>`.
4. Apply the direction by root cause: structure, type, color and surface, copy. Do not invent facts, and do not swap in another stock look. Removing the tells is not enough: a page that is only plainer is not done.
5. Run `node <UI_REFINER>/bin/ui-refiner.mjs directions verify refine-directions <target>`. If it reports drift from the chosen hero structure, surface or type, fix the page first. Then rerun the same scan command. The report opens with the before/after comparison. Check the craft list in the skill against the screenshots; the score is only a guard. Repeat at most three rounds.
6. Reply in the user's language with: the chosen direction, the signature element, score before → after, resolved and remaining signals with reasons, the changes by root cause, what was preserved, and the screenshot paths.
