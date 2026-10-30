---
description: Review a page's design with UI Refiner and propose a less AI-looking redesign
argument-hint: <url | host | local .html> [extra instructions]
---

Review the design of: $ARGUMENTS

Follow the **Review** workflow of the `ui-refiner-agent` skill:

1. Run `node <UI_REFINER>/bin/ui-refiner.mjs scan <target>` (the skill explains where `<UI_REFINER>` is). Do not pass `--lang`: the report follows the page language unless `UI_REFINER_LANG` is set. Rescanning the same page compares with the previous scan automatically.
2. Open `ui-refiner-scan/scan-desktop.png` and `scan-mobile.png` and look at them before reading the signals.
3. Read `ui-refiner-scan/DESIGN_REVIEW.md`. Confirm or reject each signal against the screenshots and the page's purpose.
4. Reply in the user's language with: a one- or two-sentence verdict, 2–3 root causes, a concrete redesign direction per cause (what to change and what to preserve), and the quality issues users would actually hit. For Japanese pages, include the 日本語タイポグラフィ findings that matter.
5. Do not edit code unless the extra instructions ask for it.
