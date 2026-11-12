# Colour on human-made sites

This folder records which colours human-made sites use on their first screen, by page kind and country. `ui-refiner directions deal` uses the accent shares as weights when it deals a colour family: within the families that fit the tone, a family that sites of the same kind use more often comes up more often. Rare families still come up now and then, and families picked recently for other projects still wait their turn.

`human.json` holds the shares; `sites.json` holds one row per site. Measured in November 2026 on 548 of 670 listed sites (122 were blocked by robots.txt, unreachable or timed out): 189 Korean, 320 Japanese and 39 English.

How it is measured, by `scripts/collect-colours.mjs` at 1440×900 with the site's own locale:

- **Ground:** the first screen is sampled on a 24×14 grid. Each point is a photo or video, or the background colour of the first element behind it. The ground is a colour family when one family covers a quarter of the screen or more; otherwise `dark` or `image` when that covers half or more; otherwise `light` (white or a faint tint).
- **Accent:** the most frequent clear hue among link and button backgrounds, text and borders. `ink` means no clear hue: black, grey or navy links and buttons only.

Only measurements are kept: the host, the shares and the colour families. No page text or screenshots are stored. robots.txt is checked for the `*` group before a site is opened.

| Group | Sites | Light | Photo | Dark | Colour | Ink accent | Top accent hues |
|---|---:|---:|---:|---:|---:|---:|---|
| All | 548 | 58% | 35% | 5% | 2% | 25% | blue 33%, indigo 16%, red 8% |
| Korean | 189 | 58% | 33% | 8% | 2% | 27% | blue 29%, indigo 18%, teal 6% |
| Japanese | 320 | 57% | 39% | 3% | 1% | 24% | blue 37%, indigo 13%, red 11% |
| English | 39 | 64% | 13% | 15% | 8% | 21% | indigo 28%, blue 18%, green 10% |
| software, Korean | 50 | 72% | 20% | 6% | 2% | 26% | blue 32%, indigo 24%, teal 8% |
| software, Japanese | 53 | 70% | 25% | 2% | 4% | 23% | blue 42%, indigo 11%, red 9% |
| service, Korean | 24 | 58% | 33% | 4% | 4% | 13% | blue 46%, indigo 21%, teal 8% |
| service, Japanese | 23 | 70% | 30% | — | — | 17% | blue 44%, indigo 17%, teal 9% |
| place, Korean | 34 | 41% | 47% | 12% | — | 32% | blue 27%, indigo 12%, green 9% |
| place, Japanese | 36 | 47% | 50% | — | 3% | 31% | blue 22%, orange 14%, amber 11% |
| public, Korean | 33 | 58% | 36% | 6% | — | 9% | blue 33%, teal 12%, indigo 12% |
| public, Japanese | 96 | 47% | 50% | 2% | 1% | 5% | blue 54%, indigo 15%, red 10% |
| company, Korean | 30 | 47% | 47% | 3% | 3% | 37% | indigo 27%, blue 13%, pink 7% |
| company, Japanese | 80 | 61% | 39% | — | — | 29% | blue 26%, red 16%, indigo 13% |
| studio, Korean | 8 | 25% | 25% | 50% | — | 75% | red 25% |
| studio, Japanese | 24 | 46% | 33% | 21% | — | 75% | indigo 13%, blue 8%, red 4% |
| media, Korean | 10 | 100% | — | — | — | 30% | blue 30%, teal 20%, indigo 10% |
| media, Japanese | 8 | 88% | 13% | — | — | 38% | blue 25%, red 25%, indigo 13% |

What this says for the deal:

- **A full-colour ground is rare.** About 2% of the first screens use one; a third open on a photo. Korean and Japanese sites carry their colour in links, buttons and photos on a white page.
- **Blue is the common accent everywhere**, most of all on Japanese public bodies (54%). The weights lean the deal towards it without making every page blue.
- **A quarter of the sites have no clear accent hue**, and three in four studios. Ink is a real choice, not a fallback.
- **Places lean warm** (Japanese places: orange 14%, amber 11%), and Japanese companies use red more than other kinds (16%).

Sources: the sites listed in `scripts/colour-sites.tsv` (trade, kind, country, URL), gathered for this survey, plus the human-labelled small and mid-size sites from `scripts/calibration-small.tsv` and the Japanese reference set in `data/ja-reference`.

To measure again: `node scripts/collect-colours.mjs scripts/colour-sites.tsv data/colour-reference --concurrency 4`. Each result is appended to `sites.jsonl` as it comes in, so a stopped run resumes where it left off; delete that file to start over.
