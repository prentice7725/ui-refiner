# Korean and Japanese sites by trade

What human-made Korean and Japanese sites of one trade do on their first screen, measured in November 2026. `ui-refiner directions deal --trade <trade>` uses `human.json` for the familiar direction.

- `human.json`: per trade and country (for example `salon/JP`), the share of each hero structure, the first-screen ground and accent family, and type (median body size, largest text over body, body line height on Japanese pages, share of sites with a serif or Mincho display face). A group appears only with 8 or more sites; 33 groups from 512 sites. Built by `scripts/build-genre-reference.mjs`.
- `sites.tsv`, `sites.json`, `summary.json`, `SUMMARY.md`: the full scan of 598 sites (`scripts/collect-reference.mjs`).
- `colour/`: first-screen colours of 571 sites (`scripts/collect-colours.mjs`).

The list is `scripts/genre-sites.tsv`: Japanese sites from a hand list and the industry pages of MUUUUU.ORG, Korean sites from a hand list. robots.txt was respected and only measurements are kept. A site counts only when its page declares the country's language, which also drops a few real ones. Groups are small (8–24 sites), so read the shares as tendencies. Korean hair salons, gyms, wedding halls, tax offices, estate agents, shops, cosmetics and games have fewer than 8 sites and no group.
