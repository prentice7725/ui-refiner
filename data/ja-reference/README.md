# Japanese reference sites

Design measurements from about 240 Japanese sites. Use them to check what is normal on Japanese pages before calling something a defect or an AI tell.

The sites cover 92 large companies, 47 prefectures, 35 universities, museums and public bodies, 19 media sites, 23 startups and 23 design-led brands.

| File | What it is |
|---|---|
| `sites.tsv` | The URL list (`category<TAB>url`). It excludes sites used in `scripts/calibration-*.tsv`. |
| `sites.json` | One record per site. Failed sites carry their error; the others carry these measurements: AI-look score and signals, type scale, body size, hue groups, the Japanese body line-height and size, the Japanese typesetting issues and the baseline quality counts. |
| `summary.json`, `SUMMARY.md` | Distributions overall and per category: p10 / p50 / p90 and shares. |

## Rules for this data

- **Measurements only.** Page text, selectors and screenshots stay in the collector's local raw folder and are not committed.
- **robots.txt is honoured.** The collector reads the `*` group before opening a site and skips any site that disallows the page. It runs at most 3 sites at a time, with a pause after each.
- **The split is fixed.** Each host is assigned to `tune` (about 70%) or `holdout` (about 30%) by a hash of its name.
  - Change signal thresholds by looking only at `tune`.
  - Confirm the change on `holdout`.

## Refresh

```bash
node scripts/collect-reference.mjs data/ja-reference/sites.tsv <local-raw-dir> data/ja-reference
```

The raw folder keeps the full `scan.json` with the collector output. With it you can rescore without opening any page:

```bash
node scripts/rescore.mjs ja=<local-raw-dir>
```

Some sites block headless browsers (HTTP 403) or time out. They stay in `sites.json` with their error.
