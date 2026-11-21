# Archetype data

The measured basis of the themes in `skills/ui-refiner-agent/reference/themes/`. The scripts in `scripts/archetypes/` build every file here.

| File | What it holds | Built by |
|---|---|---|
| `features.jsonl` | 23 features per measured site: stored scan metrics plus pixel statistics of the desktop screenshot | `features.mjs` |
| `clusters.json` | The k=8 run of November 2026: `base` (the 1761 sites it was fitted on), `assign` (site → archetype for every site), per-archetype counts, nearest sites and trade mix | `assign.mjs` |
| `trades.json` | Archetype mix, measured traits and distinctive labels per trade and country | `trades.mjs` |
| `purpose.json` | The six purpose families checked against the data | `purpose.mjs` |
| `counts.json` | Sites per country, family and archetype (the table in the themes README) | `counts.mjs` |
| `spec-<country>-<family>-<archetype>.json` | Measured values of one cell, the source of a theme's "Measured basis" | `spec.mjs` |

## Order

```
node scripts/archetypes/features.mjs                 # appends sites not yet in features.jsonl
node scripts/archetypes/assign.mjs                   # assigns new sites to the nearest archetype
node scripts/archetypes/trades.mjs
node scripts/archetypes/purpose.mjs
node scripts/archetypes/counts.mjs
node scripts/archetypes/spec.mjs KR business 6       # one cell; repeat for each theme cell
```

`features.mjs` and `spec.mjs` read the raw scans (`scan.json` and screenshots per site), which stay out of git. They are looked up in `local/reference-raw/genres/` (git-ignored), or in the folder named by `UI_REFINER_GENRES_RAW`. The other scripts need only the files here.

## The archetypes stay fixed

`clusters.json` is the canonical k=8 run. Sites added later are assigned to the nearest centroid of that run, standardized on its base sites, so an archetype index means the same thing in every theme and spec file. `cluster.mjs` re-runs k-means for comparison; with `--write` it writes `clusters-k<k>-candidate.json` and never replaces `clusters.json`.
