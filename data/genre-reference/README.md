# Korean and Japanese sites by trade

What human-made Korean and Japanese sites of one trade do on their first screen, measured in November 2026. `ui-refiner directions deal --trade <trade>` uses `human.json` for the familiar direction.

- `human.json`: per trade and country (for example `salon/JP`), the share of each hero structure, the first-screen ground and accent family, and type (median body size, largest text over body, body line height on Japanese pages, share of sites with a serif or Mincho display face). A group appears only with 8 or more sites; 72 groups from 1790 sites. Built by `scripts/build-genre-reference.mjs`.
- `sites.tsv`, `sites.json`, `summary.json`, `SUMMARY.md`: the full scan of 1919 sites (`scripts/collect-reference.mjs`).
- `colour/`: first-screen colours of 1957 sites (`scripts/collect-colours.mjs`).

The list is `scripts/genre-sites.tsv`. Its sites come from four kinds of source:

- Hand lists: Japanese sites from a hand list and the industry pages of MUUUUU.ORG, and Korean sites from a hand list.
- Korean clinics: dermatology, dental and Korean medicine clinics from the homepage column of the Health Insurance Review and Assessment Service's "전국 병의원 및 약국 현황" (September 2026, data.go.kr, KOGL type 1: source: 건강보험심사평가원). Clinics were picked one per host in a fixed order, at most half from Seoul, Gyeonggi and Incheon. About a third of the listed addresses no longer answered.
- Japanese clinics and care providers: dermatology and dental clinics from the homepage column of the Ministry of Health, Labour and Welfare's 医療情報ネット open data (1 June 2026), and care providers (day services, fee-charging homes, special nursing homes) from the URL column of its 介護サービス情報公表システム open data (end of June 2026). Both are used under 公共データ利用規約 第1.0版 (source: 厚生労働省). They were picked the same way, at most half from Tokyo, Kanagawa, Saitama and Chiba. About nine in ten addresses answered.
- Web-search candidate lists, eight of them, all added on 18 November 2026:
  - The first brought small businesses: credit unions, inns, makers, bakeries, dental clinics, software firms, design and architecture offices.
  - The second (600 rows) brought banks, credit funds, makers, hospitals, shops, inns, museums, newspapers, local governments, public corporations and chambers of commerce. 519 rows were kept. The third gave 51 replacements for rows the second lost.
  - The other five filled the trades still under 8: Korean company sites, museums, associations, universities, job sites, logistics firms, hair salons, design offices, cosmetics, games, gyms, tax offices, wedding halls and estate agents; Japanese city sites, newspapers, universities, job sites, car makers, spas and beauty salons.
  - Every row was checked before it was added: the homepage was opened and its title compared with the name, and robots.txt was read. Dead hosts, robots-blocked hosts, hosts behind a bot challenge, hosts already listed and rows whose domain belonged to a different business than the name were left out. Inner pages were replaced by the homepage.

robots.txt was respected and only measurements are kept. A site counts only when its page declares the country's language, which also drops a few real ones. Groups are small (9–79 sites), so read the shares as tendencies. Every trade that has Korean or Japanese sites has a group for that country.
