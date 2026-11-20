# Themes

A theme is a finished design measured from real human-made sites: one archetype of one purpose family in one country. It gives a page its ground, type, colour, shapes, section skeleton and the trade's own components, so the page reads as a real site of its kind rather than a model's habit.

## Where the themes come from

2245 human-made Korean and Japanese sites (78 trade × country groups, November 2026; 484 of them added in a second collection for the thin creative, shop and place groups) were measured from their stored scans and desktop screenshots and grouped into eight impression archetypes: short & small, dark cinematic, white quiet, dense portal, photo-led, big type, standard corporate, bold colour. Trades were then grouped by what a visitor comes to do: place (stay, eat, see), care (book and visit), public (look up and apply), shop (choose and buy), business (trust a company), creative (show work: design, game, architecture, photo and video, illustration). A theme is the most common archetype of one family in one country, with its values taken from that group's measurements (`theme.md`, "Measured basis").

| Theme | Country · family · archetype | Measured sites |
|---|---|---|
| `jp-place-photo` | JP · place (inn, tourism, restaurant, wedding) · photo-led | 65 |
| `kr-care-white` | KR · care (dental, dermatology, Korean medicine, hospital) · white quiet | 38 |
| `kr-business-dark` | KR · business (maker, logistics, software) · dark cinematic | 35 |
| `kr-business-white` | KR · business (software, B2B service, tax, hiring) · white quiet; the business theme without photographs | 50 |
| `jp-care-corporate` | JP · care (dental, dermatology, day service, fitness, salon) · standard corporate | 68 |
| `kr-place-photo` | KR · place (pension, resort, restaurant, tourism, wedding) · photo-led | 43 |
| `jp-business-corporate` | JP · business (maker, software, regional firm, builder) · standard corporate | 52 |
| `kr-public-portal` | KR · public (media, government, culture, finance, associations) · dense portal | 61 |
| `jp-public-portal` | JP · public (finance, media, government, associations, universities) · dense portal | 64 |
| `kr-shop-portal` | KR · shop (e-commerce, fashion, farm, cosmetics, food) · dense portal | 60 |
| `jp-shop-portal` | JP · shop (e-commerce, food, cosmetics, fashion) · dense portal | 57 |
| `kr-creative-dark` | KR · creative (design, game, photo, architecture, illustration) · dark cinematic | 34 |
| `jp-creative-bigtype` | JP · creative (design, photo and video, architecture studios) · big type | 23 |

Korea and Japan differ as much as trades do (Korean care sites go white and short, Japanese ones standard corporate with big type), so a theme is never reused across the two countries.

[Open the local theme gallery](index.html) to filter by country, family and available photographs.

## Choosing a theme

1. Country of the page, then the purpose family of the client's trade.
2. The archetype must suit the client's material:
   - **Photo-led and dark cinematic need the client's own photographs or video** for the hero and most sections. Applied to a logistics page with no photographs, the dark theme read as a dark text template (20 November 2026). Without strong photographs, pick the white-quiet or standard-corporate theme of the same family instead.
   - White quiet works with few photographs (the measured sites use 3–4).
3. A real brand (logo, documented colours or typeface) keeps its colour and face; the theme gives the rest.

## Applying a theme to a client's content

These held on seven real pages (an inn, a dental clinic, a logistics company; then a Korean veterinary association, a Japanese chamber of commerce, a Tokyo renovation firm and a Saitama day service), all of which kept every link, form, field and figure (`keep check`) and passed `stress`:

- **Keep the client's menu** (its words, order and anchors), not the theme's menu words. Drop a menu item only when the client has no content for it.
- **Map content onto the skeleton in order; drop skeleton sections the client has no content for.** Never invent a section's content (no made-up facilities, news, figures or quotes). A figures band shows only the client's own numbers.
- **Optional slots** for content most real pages have and the skeletons leave out: about/values, process steps, FAQ, cases, an inline booking or quote form. Place them where they read best within the theme's rules; each theme's `theme.md` says where.
- **Page length follows content** within the measured p25–p75 of the theme; the theme's median is a target for an average client, not a cap.
- **Links to pages that do not exist are not made.** A 「자세히」 or 「詳細」 column with no detail page shows the client's own sub-items instead, or links to the booking form.
- **Images**: the client's photographs first. Generated images (the theme's `assets/generated/`, made with Grok Imagine or Codex image generation) are mood images: mark them `data-generated`, say so in the footer, never put one where it reads as a claim (a machine shop next to a warehouse name, a generated portrait next to a named doctor), and leave a section on type rather than mislead. The theme samples' fictional clients are the exception: their people are as made up as their names, which the footer says. List the photographs the client needs in the report.
- **Small photographs** (old sites often have 295–770px images): never upscale one past about 1.5×. Show it at its own size (a split hero, a card photo) and leave the large frames to photographs that can fill them.
- **Banners with baked-in type** (card news, posters, campaign banners) are shown whole (`object-fit: contain`), never cropped as photographs.
- Put client overrides in a separate stylesheet after `theme.css`; scope any rule that changes grid columns to a desktop media query, or it overrides the theme's phone layout.
- Run `keep check` and `stress` on the result; fix every broken stress row in CSS. Serve the page over `http://127.0.0.1` for `keep check`: on a `file://` page, root-relative form actions (`/login`) resolve to the drive and read as lost.

## Files per theme

`theme.md` (measured basis, tokens, skeleton, components, rules), `theme.css`, `sample.html` (a fictional client), `shot-desktop.png`, `shot-mobile.png`, `assets/generated/` (generated images with `prompts.json`). `generated.check.mjs` checks that every listed generated image is present.
