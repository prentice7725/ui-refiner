# Themes

A theme is a finished design measured from real human-made sites: one archetype of one purpose family, measured in Korea or in Japan. Where it was measured is its source, not a limit on its use: a theme serves a client of its family in either language. It gives a page its ground, type, colour, shapes, section skeleton and the trade's own components, so the page reads as a real site of its kind rather than a model's habit.

## Where the themes come from

2326 human-made Korean and Japanese sites (78 trade × country groups, November 2026; 484 added in a second collection for the thin creative, shop and place groups, and 81 Japanese design, photo and architecture studios in a third) were measured from their stored scans and desktop screenshots and grouped into eight impression archetypes: short & small, dark cinematic, white quiet, dense portal, photo-led, big type, standard corporate, bold colour. Trades were then grouped by what a visitor comes to do: place (stay, eat, see), care (book and visit), public (look up and apply), shop (choose and buy), business (trust a company), creative (show work: design, game, architecture, photo and video, illustration). A theme is a common archetype of one family in one country, with its values taken from that group's measurements (`theme.md`, "Measured basis").

Measured sites per country, family and archetype (`data/archetypes/counts.json`; the measured values of a cell are in `data/archetypes/spec-<country>-<family>-<archetype index>.json` for the cells that were specified; `data/archetypes/README.md` explains how the scripts in `scripts/archetypes/` rebuild them):

| | short & small | dark cinematic | white quiet | dense portal | photo-led | big type | standard corporate | bold colour | all |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| KR place | 17 | 18 | 14 | 18 | 43 | 11 | 15 | 7 | 143 |
| KR care | 41 | 18 | 38 | 22 | 1 | 18 | 29 | 8 | 175 |
| KR public | 24 | 7 | 28 | 61 | 13 | 5 | 42 | 22 | 202 |
| KR shop | 21 | 6 | 33 | 60 | 27 | 11 | 31 | 10 | 199 |
| KR business | 31 | 35 | 50 | 22 | 26 | 15 | 41 | 15 | 235 |
| KR creative | 21 | 34 | 17 | 15 | 17 | 8 | 7 | 11 | 130 |
| JP place | 11 | 14 | 9 | 9 | 65 | 15 | 18 | 15 | 156 |
| JP care | 52 | 5 | 29 | 32 | 15 | 43 | 68 | 15 | 259 |
| JP public | 16 | 3 | 17 | 64 | 23 | 11 | 31 | 14 | 179 |
| JP shop | 10 | 4 | 18 | 57 | 23 | 19 | 27 | 7 | 165 |
| JP business | 27 | 12 | 38 | 42 | 29 | 23 | 52 | 26 | 249 |
| JP creative | 18 | 21 | 30 | 35 | 35 | 36 | 38 | 21 | 234 |

Ten themes take the most common archetype of their cell. `care-white` (38 sites, after short & small with 41) and `creative-bigtype` (36, after standard corporate with 38) take the runner-up, and `business-dark` (35, after white quiet with 50 and standard corporate with 41) and `business-corporate-quickbar` (41) are second and third themes for Korean business. The reasons:

- `care-white`: the 41 short & small Korean care sites are pages with little on them (median 2.2 screens, largest type 20px, a claim on the first screen on 22%), not a design to follow; the white-quiet ones run 7.2 screens with a 50px headline and a claim on 71%.
- `creative-bigtype`: the Japanese creative family has no clear leader (standard corporate 38, big type 36, dense portal and photo-led 35 of 234). Standard corporate is mostly studios whose sites read as companies, which `business-corporate-message` already serves; among the design and photo studios, the clients this theme serves, big type leads (28 to 22).
- `business-dark`: 69% of the 172 dark-cinematic sites are Korean, so it is the most Korean-looking business theme, but it needs the client's own photographs (see "Choosing a theme"); `business-white`, the most common archetype, is the one for clients without them.
- `business-corporate-quickbar`: logistics, makers and builders lean to standard corporate and photo-led, not white quiet (of 47 measured Korean logistics sites, 11 and 12 against 7). On a logistics page with no photographs of its own, a blind comparison (21 November 2026) read `business-white` as a software template and a blue, photograph-led corporate page as the real thing.

Every family can be drawn in every archetype; `docs/archetype-demo/README.md` in the repository shows the Korean business family in all eight with demonstration samples, which are not themes.

| Theme | Measured in · family · archetype | Measured sites |
|---|---|---|
| `place-photo-quiet` | JP · place (inn, tourism, restaurant, wedding) · photo-led | 65 |
| `care-white` | KR · care (dental, dermatology, Korean medicine, hospital) · white quiet | 38 |
| `business-dark` | KR · business (maker, logistics, software) · dark cinematic | 35 |
| `business-white` | KR · business (software, B2B service, tax, hiring) · white quiet; the business theme without photographs | 50 |
| `business-corporate-quickbar` | KR · business (logistics, maker, builder) · standard corporate | 41 |
| `care-corporate` | JP · care (dental, dermatology, day service, fitness, salon) · standard corporate | 68 |
| `place-photo-view` | KR · place (pension, resort, restaurant, tourism, wedding) · photo-led | 43 |
| `business-corporate-message` | JP · business (maker, software, regional firm, builder) · standard corporate | 52 |
| `public-portal-search` | KR · public (media, government, culture, finance, associations) · dense portal | 61 |
| `public-portal-purpose` | JP · public (finance, media, government, associations, universities) · dense portal | 64 |
| `shop-portal-grid` | KR · shop (e-commerce, fashion, farm, cosmetics, food) · dense portal | 60 |
| `shop-portal-story` | JP · shop (e-commerce, food, cosmetics, fashion) · dense portal | 57 |
| `creative-dark` | KR · creative (design, game, photo, architecture, illustration) · dark cinematic | 34 |
| `creative-bigtype` | JP · creative (design, photo and video, architecture studios) · big type | 36 |

Korea and Japan differ in which archetype is common (Korean care sites go white and short, Japanese ones standard corporate with big type), which is why each theme records where it was measured. That says where the design comes from, not where it may be used. A Korean clinic can take the care theme measured in Japan, and a Japanese maker the dark theme measured in Korea. `ui-refiner theme starter <theme> --lang ko|ja` moves the theme's faces, line height and line breaking to the page's language; the menu words and trade components in `theme.md` stay the measured language's, so keep their structure and use the client's words.

Browse the [desktop and mobile screenshots](GALLERY.md) on GitHub. For interactive filters and sample pages, open `index.html` from this folder in a local browser.

## Choosing a theme

1. The purpose family of the client's trade. Every theme of that family is a candidate, whichever country it was measured in; the count table above shows how common each look is in the client's own country, which matters when the client wants to look like its neighbours and not when it wants to stand apart.
2. The archetype must suit the client's material:
   - **Photo-led and dark cinematic need the client's own photographs or video**, or credited stand-ins of the same kind of place, for the hero and most sections. Applied to a logistics page with no photographs, the dark theme read as a dark text template (20 November 2026). Without strong photographs, pick the white-quiet or standard-corporate theme of the same family instead.
   - `business-corporate-quickbar` opens on a full-width photograph too: a logistics firm or maker without photographs of its own gets credited stand-ins of its kind of work; with neither, `business-white`.
   - White quiet works with few photographs (the measured sites use 3–4).
3. A real brand (logo, documented colours or typeface) keeps its colour and face; the theme gives the rest. `ui-refiner theme starter <theme> --brand "#rrggbb" --face "<typeface>"` writes them onto the theme's tokens in `brand.css` and lists where the colour breaks contrast on the theme's sample.

## Applying a theme to a client's content

These held on twelve real pages (an inn, a dental clinic, a logistics company; a Korean veterinary association, a Japanese chamber of commerce, a Tokyo renovation firm, a Saitama day service; then a hanok stay, a ginseng shop, a bamboo-craft shop, a product-photo studio and an architecture firm), all of which kept every link, form, field and figure (`keep check`) and passed `stress`:

- **Keep the client's menu** (its words, order and anchors), not the theme's menu words. Drop a menu item only when the client has no content for it.
- **Map content onto the skeleton in order; drop skeleton sections the client has no content for.** Never invent a section's content (no made-up facilities, news, figures or quotes). A figures band shows only the client's own numbers.
- **Optional slots** for content most real pages have and the skeletons leave out: about/values, process steps, FAQ, cases, an inline booking or quote form. Place them where they read best within the theme's rules; each theme's `theme.md` says where.
- **Page length follows content** within the measured p25–p75 of the theme; the theme's median is a target for an average client, not a cap.
- **Links to pages that do not exist are not made.** A 「자세히」 or 「詳細」 column with no detail page shows the client's own sub-items instead, or links to the booking form.
- **Images**: the client's photographs first; then credited stand-ins of the same kind of place or work (`ui-refiner photos`, openly licensed, listed in the report as images to replace), preferring people at work to empty rooms. In a blind comparison (21 November 2026) judges found a dental page with stand-ins of a dentist treating a child more like a real clinic than a themed page carrying the sample's empty generated rooms, and a logistics page with warehouse stand-ins more real than a white theme with none. Generated images (the theme's `assets/generated/`, made with Grok Imagine or Codex image generation) are mood images: mark them `data-generated`, say so in the footer, never put one where it reads as a claim (a machine shop next to a warehouse name, a generated portrait next to a named doctor), and leave a section on type rather than mislead. The theme samples' fictional clients are the exception: their people are as made up as their names, which the footer says. List the photographs the client needs in the report.
- **Small photographs** (old sites often have 295–770px images): never upscale one past about 1.5×. Show it at its own size (a split hero, a card photo) and leave the large frames to photographs that can fill them.
- **Banners with baked-in type** (card news, posters, campaign banners) are shown whole (`object-fit: contain`), never cropped as photographs.
- **Check first whether the original is already designed.** A theme gives a dated page order, but on a page that already has a strong look it can trade that look for a portal's tidiness (長岡銘竹, 21 November 2026). A small body size or an old platform does not by itself mark a dated page; look at it.
- **Keep the client's data and formats as they are**, errors included: dates, prices and phone numbers in the client's own format; a sale price above the list price or a phone link to a different number is shown as the client has it and listed in the report for the client to check.
- **Outside systems stay outside**: a booking calendar, a cart or a shop platform is linked, never imitated with a form that only looks like it works.
- Start with `ui-refiner theme starter <theme> --out <folder>`: `theme.css`, `theme.md`, `brand.css` (the client's colour and typeface on the tokens) and `STARTER.md` (the photographs the theme needs, with place and ratio). It copies no sample page and no generated image.
- Put client overrides in a separate stylesheet after `theme.css` and `brand.css`; scope any rule that changes grid columns to a desktop media query, or it overrides the theme's phone layout.
- Run `keep check` and `stress` on the result; fix every broken stress row in CSS. Serve the page over `http://127.0.0.1` for `keep check`: on a `file://` page, root-relative form actions (`/login`) resolve to the drive and read as lost.

## Files per theme

`theme.md` (measured basis, tokens, skeleton, components, rules), `theme.css`, `sample.html` (a fictional client), `shot-desktop.jpg`, `shot-mobile.jpg`, `assets/generated/` (generated images with `prompts.json`). `generated.check.mjs` checks that every listed generated image is present.

`effects/` holds optional effects shared by the themes (hero video or slides, scroll reveals, a blurred header). A theme lists the ones that suit it under "Effects" in its `theme.md`; so far only `place-photo-quiet` does. See `effects/README.md`.
