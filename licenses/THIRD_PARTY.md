# Third-party notices

UI Refiner is an independent source-level combination of two MIT-licensed projects:

* **suta** — Copyright © 2026 Guksu. https://github.com/Guksu/suta, MIT, pinned source commit `412bd62e479ce249ef25ca31bc015cfb308aff10`. Original license preserved at [vendor/suta/LICENSE](../vendor/suta/LICENSE). Vendored here: full pinned suta skill source tree — 250 files, including all 57 pattern documents, assets, and layout/motion audit engine.
* **lintapple** — Copyright © 2026 Gavin Holtzapple. https://github.com/gholtzap/lintapple, MIT, pinned source commit `90ddc736af6f2712903d53dd9a463445e109f586`. Complete CLI and browser audit runtime vendored; original license at [vendor/lintapple/LICENSE](../vendor/lintapple/LICENSE).
* **axe-core** — Deque Systems, MPL-2.0, installed as npm dependency for accessibility inspection.
* **Playwright** — Microsoft, Apache-2.0, installed as npm dependency for Chromium automation.

The copied upstream source remains credited. Any future source edits must preserve those notices. We do not vendor npm binaries, Chromium, upstream demo images or bundled fonts.

* **pixelmatch 7.2.0** — Mapbox, ISC, exact npm dependency for pixel comparison. Repository: https://github.com/mapbox/pixelmatch. Original license: [licenses/pixelmatch.LICENSE](pixelmatch.LICENSE).
* **pngjs 7.0.0** — Luke Page and original contributors, MIT, exact npm dependency for PNG decoding/encoding (Node >=14.19.0). Repository: https://github.com/pngjs/pngjs. Original notices: [licenses/pngjs.LICENSE](pngjs.LICENSE).

* **Ajv 8.20.0**, **ajv-draft-04 1.0.0**, **ajv-formats 3.0.1** — Evgeny Poberezkin and contributors, MIT. Development-only SARIF validation dependencies; original licenses: `ajv.LICENSE`, `ajv-draft-04.LICENSE`, `ajv-formats.LICENSE` in this directory.
* **OASIS SARIF 2.1.0 JSON Schema** — OASIS Open repository terms, not relicensed as MIT. Used only in offline tests. Original terms: [test/schemas/OASIS-LICENSE.md](../test/schemas/OASIS-LICENSE.md); source, retrieval date and SHA-256: [provenance.json](../test/schemas/provenance.json).
