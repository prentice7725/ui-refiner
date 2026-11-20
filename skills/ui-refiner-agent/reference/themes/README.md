# Themes

A theme is a finished design measured from real human-made sites: one archetype of one purpose family in one country. It gives a page its ground, type, colour, shapes, section skeleton and the trade's own components, so the page reads as a real site of its kind rather than a model's habit.

## Where the themes come from

1761 human-made Korean and Japanese sites (72 trade × country groups, November 2026) were measured from their stored scans and desktop screenshots and grouped into eight impression archetypes: short & small, dark cinematic, white quiet, dense portal, photo-led, big type, standard corporate, bold colour. Trades were then grouped by what a visitor comes to do: place (stay, eat, see), care (book and visit), public (look up and apply), shop (choose and buy), business (trust a company), creative (show work). A theme is the most common archetype of one family in one country, with its values taken from that group's measurements (`theme.md`, "Measured basis").

| Theme | Country · family · archetype | Measured sites |
|---|---|---|
| `jp-place-photo` | JP · place (inn, tourism, restaurant, wedding) · photo-led | 65 |
| `kr-care-white` | KR · care (dental, dermatology, Korean medicine, hospital) · white quiet | 34 |
| `kr-business-dark` | KR · business (maker, logistics, software) · dark cinematic | 35 |

Korea and Japan differ as much as trades do (Korean care sites go white and short, Japanese ones standard corporate with big type), so a theme is never reused across the two countries.

## Choosing a theme

1. Country of the page, then the purpose family of the client's trade.
2. The archetype must suit the client's material:
   - **Photo-led and dark cinematic need the client's own photographs or video** for the hero and most sections. Applied to a logistics page with no photographs, the dark theme read as a dark text template (20 November 2026). Without strong photographs, pick the white-quiet or standard-corporate theme of the same family instead.
   - White quiet works with few photographs (the measured sites use 3–4).
3. A real brand (logo, documented colours or typeface) keeps its colour and face; the theme gives the rest.

## Applying a theme to a client's content

These held on three real pages (an inn, a dental clinic, a logistics company), all of which kept every link, form, field and figure (`keep check`) and passed `stress`:

- **Keep the client's menu** (its words, order and anchors), not the theme's menu words. Drop a menu item only when the client has no content for it.
- **Map content onto the skeleton in order; drop skeleton sections the client has no content for.** Never invent a section's content (no made-up facilities, news, figures or quotes). A figures band shows only the client's own numbers.
- **Optional slots** for content most real pages have and the skeletons leave out: about/values, process steps, FAQ, cases, an inline booking or quote form. Place them where they read best within the theme's rules; each theme's `theme.md` says where.
- **Page length follows content** within the measured p25–p75 of the theme; the theme's median is a target for an average client, not a cap.
- **Links to pages that do not exist are not made.** A 「자세히」 or 「詳細」 column with no detail page shows the client's own sub-items instead, or links to the booking form.
- **Images**: the client's photographs first. Generated images (the theme's `assets/generated/`, Grok Imagine) are mood images: mark them `data-generated`, say so in the footer, never put one where it reads as a claim (a machine shop next to a warehouse name, a generated portrait next to a named doctor), and leave a section on type rather than mislead. List the photographs the client needs in the report.
- Run `keep check` and `stress` on the result; fix every broken stress row in CSS.

## Files per theme

`theme.md` (measured basis, tokens, skeleton, components, rules), `theme.css`, `sample.html` (a fictional client), `shot-desktop.png`, `shot-mobile.png`, `assets/generated/` (generated images with `prompts.json`). `generated.check.mjs` checks that every listed generated image is present.
