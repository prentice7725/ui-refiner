# Hero structure on human-made sites

This folder records how human-made sites open their first screen. `ui-refiner directions deal` uses it so that agents do not build every page the same way. `directions` also shows each share next to a mock's hero layout.

`human.json` gives the share of each first-screen skeleton on 406 human-made sites, deduplicated by host. The skeleton is measured by the scan collector (`hero`) at 1440×900. It has two parts:

- where the main headline's text sits (`left`, `center`, `right`, or `wide` for the full width);
- what shares the first screen with the headline (`panel`, `media`, or `stacked` when nothing is beside it).

Two special cases cover pages without a headline beside other content:

- `full-bleed`: a photo or video fills the screen.
- `below-fold`: no visible headline on the first screen; the page opens with content, products or news.

| Structure | All 406 | Big brands, public, media (110) | Small and mid-size orgs (92) | Japanese reference (209) |
|---|---:|---:|---:|---:|
| Full-bleed photo or video | 33% | 27% | 38% | 33% |
| Content first, no visible headline | 29% | 32% | 24% | 31% |
| Left headline, stacked below | 14% | 13% | 11% | 15% |
| Centred headline, stacked | 8% | 11% | 13% | 4% |
| Left headline beside a photo | 7% | 8% | 5% | 7% |
| **Left headline beside a panel** | **4%** | 4% | 4% | 4% |

For comparison, 6 of 8 Claude-made pages in the refine benchmark used a left headline beside a panel. The plain "make it less AI-generated" fix used it on 7 of 8.

Sources:

- Human-labelled sites in `scripts/calibration-sites.tsv`, `calibration-holdout.tsv` and `calibration-extra.tsv`.
- Small and mid-size organisations in `scripts/calibration-small.tsv`: clinics, food banks, bakeries, cafes, small SaaS, fintech, logistics, hiring pages, inns, studios and local public bodies, in Korean, Japanese and English.
- The Japanese reference set in `data/ja-reference`.

Collection rules:

- robots.txt is honoured. Three sites were skipped for it.
- Only measurements are kept. Page text and screenshots stay in the collector's local folder.
