# デザイン事務所 · 色で語る (Japanese creative, bold colour)

For Japanese design offices, illustration and production studios, event and game sites: people who make things and want the site to feel like their work. One bold ground colour carries large areas, playful but orderly layout, the works in a clear grid.

## Measured basis

7 human-made Japanese sites in the creative family that fall in the bold-colour archetype (game 57%, design 43%), measured November 2026 (`archetypes/spec-JP-creative-7.json`); the archetype is three times more common among Japanese creative sites than overall. **Weak basis: 7 sites**, so the theme follows their clear shared traits (a large field of one saturated colour, black type, works grid, short menus) more than precise medians.

| What | Measured | Theme value |
|---|---|---|
| Colourful share of the first four screens | 24% / 32% / 40% | one saturated ground over about a third of the page |
| Ground | white 57%, light greys | `#ffffff`, colour fields `#e8452c` (vermilion) |
| Faces | Zen Kaku Gothic New, Noto Sans JP, Be Vietnam Pro for Latin | Zen Kaku Gothic New; Be Vietnam Pro for Latin |
| Display | 28 / 39 / 65 px | 56px / 700 |
| Weights | 400 / 400 / 700 | 700 headings, 400 body |
| Buttons | white, black, green, pink; radius 0 / 3 / pill | black pill buttons with an arrow |
| Content width | 900 / 1170 / 1190 | 1160px |
| Menu | works 制作実績, about, member, サービス, お客様の声, お問い合わせ, 資料請求 | bilingual labels (WORKS 制作実績) |

## Tokens

```css
--ground:#ffffff; --field:#e8452c; --field-ink:#ffffff; --ink:#111111; --ink-soft:#555555; --line:#111111; --grey:#f2f2f2;
--text:"Zen Kaku Gothic New","Noto Sans JP",sans-serif; --latin:"Be Vietnam Pro","Zen Kaku Gothic New",sans-serif;
--body:16px; --leading:1.9; --display-size:56px; --h2:36px; --h3:18px;
--radius:0; --pill:999px; --content:1160px; --gap:clamp(64px,9vw,120px);
```

## Skeleton (in order)

1. **Header**: logo left, menu with bilingual labels (WORKS 制作実績 · SERVICE · ABOUT · CONTACT), お問い合わせ pill button.
2. **Hero**: a large colour field (vermilion) filling most of the first screen with the studio's line in white at 56px, and a cut-out work image or object breaking the field's edge.
3. **News**: a thin row of three items with date and title on white.
4. **Message** (colour field again, smaller): what the studio believes in three lines, a 「私たちについて」 pill.
5. **Services** (the trade component): four tiles with a colourful work image each, the service name in Japanese and Latin, two lines.
6. **Works**: a three-column grid of project images with client, kind of work, year; filter tabs (すべて · ロゴ · パッケージ · Web).
7. **Client voice** (お客様の声): three photo cards of clients with a quote and their company.
8. **Members**: portraits in a row with name and role.
9. **Contact band** (colour field): a big 「お問い合わせ」 line and two pills (お問い合わせ · 資料請求).
10. **Footer**: white, address, links, copyright.

## Rules

- One saturated colour only, in large fields (hero, message, contact); never as small accents everywhere.
- Black type on white, white type on the colour; borders in black.
- Works images keep their own colours; the page's colour never tints them.

## Avoid

- Rainbow palettes, gradients, more than one field colour, cartoon mascots unless they are the client's own characters.

## Applying to a client's content

See `../README.md`. Choose the field colour from the client's logo or best-known work; game and event sites lead with the key visual in the field.
