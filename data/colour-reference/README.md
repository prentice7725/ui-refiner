# Colour on human-made sites

This folder records which colours human-made sites use on their first screen, by page kind and country. `ui-refiner directions deal` uses the accent shares as weights when it deals a colour family: within the families that fit the tone, a family that sites of the same kind use more often comes up more often. Rare families still come up now and then, and families picked recently for other projects still wait their turn.

`human.json` holds the shares; `sites.json` holds one row per site. Measured on 19 November 2026 on 552 of 670 listed sites (118 were blocked by robots.txt, unreachable or timed out): 182 Korean, 327 Japanese and 43 English. The first survey, earlier in November, missed photos under a text overlay and read about a third of the first screens as photos; this one reads about half.

How it is measured, by `scripts/collect-colours.mjs` at 1440×900 with the site's own locale:

- **Ground:** the first screen is sampled on a 24×14 grid. Each point looks through every element stacked there, top first: it is a photo or video when one is hit, otherwise the first opaque background colour. A box whose own photo sits inside it (a cover photo with a fallback colour, or one darkened by an overlay) counts as the photo. The ground is a colour family when one family covers a quarter of the screen or more; otherwise `dark` or `image` when that covers half or more; otherwise `light` (white or a faint tint).
- **Accent:** the most frequent clear hue among link and button backgrounds, text and borders. `ink` means no clear hue: black, grey or navy links and buttons only.

Only measurements are kept: the host, the shares and the colour families. No page text or screenshots are stored. robots.txt is checked for the `*` group before a site is opened.

| Group | Sites | Light | Photo | Dark | Colour | Ink accent | Top accent hues |
|---|---:|---:|---:|---:|---:|---:|---|
| All | 552 | 41% | 52% | 5% | 2% | 20% | blue 34%, indigo 16%, red 10% |
| Korean | 182 | 41% | 48% | 9% | 2% | 24% | blue 28%, indigo 18%, red 8% |
| Japanese | 327 | 41% | 57% | 1% | 2% | 18% | blue 40%, indigo 14%, red 12% |
| English | 43 | 47% | 37% | 12% | 5% | 23% | indigo 30%, green 14%, blue 12% |
| software, Korean | 47 | 62% | 32% | 2% | 4% | 26% | blue 30%, indigo 26%, teal 9% |
| software, Japanese | 61 | 57% | 39% | — | 3% | 21% | blue 46%, indigo 12%, red 8% |
| service, Korean | 21 | 48% | 43% | 10% | — | 14% | blue 48%, indigo 14%, amber 14% |
| service, Japanese | 29 | 52% | 48% | — | — | 7% | blue 52%, indigo 14%, red 7% |
| place, Korean | 31 | 13% | 71% | 16% | — | 26% | blue 29%, indigo 13%, green 10% |
| place, Japanese | 36 | 28% | 69% | — | 3% | 28% | blue 19%, orange 14%, amber 11% |
| public, Korean | 34 | 50% | 50% | — | — | 9% | blue 32%, teal 12%, red 12% |
| public, Japanese | 98 | 41% | 56% | 1% | 2% | 4% | blue 54%, indigo 16%, red 11% |
| company, Korean | 28 | 4% | 71% | 18% | 7% | 36% | indigo 29%, blue 11%, pink 7% |
| company, Japanese | 68 | 27% | 74% | — | — | 15% | blue 32%, red 21%, indigo 13% |
| studio, Korean | 7 | 14% | 29% | 57% | — | 71% | red 29% |
| studio, Japanese | 23 | 35% | 61% | 4% | — | 78% | blue 9%, indigo 9%, red 4% |
| media, Korean | 14 | 86% | 14% | — | — | 14% | blue 29%, teal 21%, red 21% |
| media, Japanese | 12 | 58% | 33% | 8% | — | 17% | blue 42%, red 17%, indigo 17% |

What this says for the deal:

- **A full-colour ground is rare.** About 2% of the first screens use one; half open on a photo. Korean and Japanese sites carry their colour in links, buttons and photos on a white page.
- **Blue is the common accent everywhere**, most of all on Japanese public bodies (54%). The weights lean the deal towards it without making every page blue.
- **A fifth of the sites have no clear accent hue**, and three in four studios. Ink is a real choice, not a fallback.
- **Places lean warm** (Japanese places: orange 14%, amber 11%), and Japanese companies use red more than other kinds (21%).

Sources: the sites listed in `scripts/colour-sites.tsv` (trade, kind, country, URL), gathered for this survey, plus the human-labelled small and mid-size sites from `scripts/calibration-small.tsv` and the Japanese reference set in `data/ja-reference`.

To measure again: `node scripts/collect-colours.mjs scripts/colour-sites.tsv data/colour-reference --concurrency 4`. Each result is appended to `sites.jsonl` as it comes in, so a stopped run resumes where it left off; delete that file to start over.
