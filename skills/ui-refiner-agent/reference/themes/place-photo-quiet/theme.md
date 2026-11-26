# 湯宿 · 写真主導 (place, photo-led; measured in Japan)

For inns, onsen ryokan, small hotels and tourism pages: places people come to stay, eat and look. The photographs carry the page; type stays quiet and lets them speak. Measured on Japanese sites; it serves the same trades on a Korean page too (`ui-refiner theme starter place-photo-quiet --lang ko`).

## Measured basis

65 human-made Japanese sites in the place family that fall in the photo-led archetype (inn 46%, tourism 29%, restaurant, wedding, wellness, event), measured November 2026 (`archetypes/spec-JP-place-4.json`).

| What | Measured (p25 / median / p75) | Theme value |
|---|---|---|
| Ground | white on 83% | `#ffffff`, with one warm paper band `#f6f3ee` |
| Text / headings | black, #333 or white on photos | ink `#1f1c18`, soft ink `#5b544c` |
| Display face | Mincho on 28% (Yu Mincho, Zen Old Mincho, Noto Serif JP); Noto Sans JP most common body | display Zen Old Mincho, body Noto Sans JP |
| Body size | 14 / 15 / 16 px, line height about 2.0 | 15px, 2.0 |
| Display size | 28 / 37 / 48 px, display ÷ body 1.9 / 2.3 / 3.1 | 40px on desktop, 28px on phones (×2.6) |
| Weights | headings 400–500 | 500 |
| Radius | 0 on boxes; buttons 0 / 4 / 8 | 0 everywhere, 2px on the booking button |
| Buttons | white or black; earth tones (#7a6a56, #94634b, #3e3a2a); 50px tall | earth `#7a5c43` filled, white outline on photos, 52px |
| Content width | 960 / 1150 / 1220 | 1160px |
| Photographs | 10 / 19 / 33 per page; photo blocks on a fifth of the first four screens | 14–20 on a full page |
| Page length | 7.5 / 9 / 11 screens | 8–10 screens |
| Hero | full-bleed on 46%, headline left on 43% | full-bleed photograph, short headline lower left |
| Menu words | アクセス, 温泉, 客室, 料理/お料理, 館内施設, お知らせ, ご予約 | the same words, in that order |

## Tokens

```css
--ground:#ffffff; --paper:#f6f3ee; --ink:#1f1c18; --ink-soft:#5b544c; --line:#d9d2c7;
--earth:#7a5c43; --earth-deep:#4a3829; --night:#1d1a17;
--display:"Zen Old Mincho","Yu Mincho","Hiragino Mincho ProN",serif;
--text:"Noto Sans JP","Hiragino Sans","Yu Gothic UI",sans-serif;
--body:15px; --leading:2.0; --display-size:40px; --h2:28px; --h3:18px;
--radius:0; --content:1160px; --gap:clamp(64px,9vw,120px);
```

## Skeleton (in order)

1. **Header** over the hero photo: inn name in Mincho at left, menu (温泉 · 客室 · お料理 · 館内施設 · アクセス), 「ご予約」 button at right. Turns solid white on scroll.
2. **Hero**: one full-bleed photograph (the building or the bath), 100vh minus the booking bar. A two-line claim at the lower left in Mincho, white on the photo with a soft dark gradient at the bottom only. Optionally the claim set vertically (`writing-mode: vertical-rl`) at the right.
3. **Booking bar** (the trade component): check-in date, nights, guests, 「空室を検索」. Directly under the hero, full width, white, hairline top border. Phone number at its right end.
4. **Concept**: a short paragraph (2–4 lines) beside a vertical Mincho heading, with one photograph offset to the other side. Lots of air.
5. **Onsen** (温泉): large photograph left, text right: spring type, temperature, effects as a small definition list.
6. **Rooms** (客室): three to four room types as photo cards with name, size (畳), capacity and the price from (1泊2食). No shadow, no radius; a hairline under the text.
7. **Cuisine** (お料理): a wide photograph strip of two or three dishes, then one paragraph on the season and the local produce.
8. **Plans** (おすすめプラン): a list, not cards: plan name, what is included, price, 「詳細」 link. Hairlines between rows.
9. **Access** (アクセス): address, by car, by train, parking, check-in/out times in a two-column table, with a map frame.
10. **News** (お知らせ): date and title rows, five at most.
11. **Footer**: dark `--night` band, inn name in Mincho, address, phone, hours, menu again, credit line.

## Rules

- Photographs lead every section but the plans and the news; never two sections in a row without one.
- One accent only (earth), used for the booking button and links. Everything else ink on white or white on photos.
- Mincho for the inn name, section headings and the hero claim; Noto Sans JP for everything else.
- Section headings can carry a small romanised label above them (ONSEN, ROOMS) only in the same Mincho at 12px with wide tracking. This is what the measured sites do; keep it to section starts.
- Japanese text: `word-break: auto-phrase`, `text-wrap: balance` on headings, `font-feature-settings: "palt"` on headings only.

## Avoid

- Cards with shadows or rounded corners, icon rows, gradients other than the bottom fade on the hero photograph.
- A dark page: the dark band is the footer only.
- Stock English slogans ("Relax & Refresh"). The copy is the inn's own: the spring, the rooms, the meal, the way there.

## Effects (optional)

Measured on 39 Japanese photo-led sites of all families (`data/motion/summary.json`, November 2026): hero slides 69%, hero video 13%, scroll reveals 36%, a blurred fixed header 5%, a marquee 3%, a loading intro 3% (parallax 13%, not built). How to add them: `../effects/README.md`.

- **Offer** when the client has the material: `hero-slides`, `reveal`.
- **Only when the client asks**: `hero-video`, `header-blur`.
- **Not for this theme**: `marquee`, `intro`.
- Reveals on the concept, onsen and cuisine photographs and the room cards only. Try them on `sample.html?fx=all` or `?fx=hero-slides,reveal`.

## Stand-out variant (optional)

`statement.css`, linked after `theme.css` (with Zen Old Mincho 400 loaded); see it with `sample.html?variant=statement`. For an inn that wants to look unlike the inns in the same town. The theme stays the default.

Measured on the most distinctive quarter of Japanese place sites (35 of 142 inns, restaurants, weddings, tourism and event sites, by distance from the family mean on the 23 archetype features) against the other three quarters:

| What | Distinctive quarter | The rest | Variant |
|---|---|---|---|
| Display size, display ÷ body | 56px, 3.8 | 38px, 2.4 | 64px on desktop over the photograph; 30px on phones so the claim keeps two lines |
| Display weight | 400 | 500 | 400 |
| White share of four screens | 14% | 40% | the cuisine section on the night ground |
| Dark ground | 20% | 2% | one dark band only |

The full-bleed photograph of the bath and the booking bar under it stay as in the theme: for an inn the photograph is the offer.

Blind test (26 November 2026, the sample page, Claude and Codex judges, 12 verdicts in both orders): a traveller would remember the variant 12 of 12, the owner would pick it 11 of 12 and judges would ship it 11 of 12; the theme read as the more typical site 9 of 12. An earlier version that put the whole page on dark and the photograph under the claim lost the owner's pick 12 of 12 ("a moody dark template").

## Applying to a client's content

Learned on a real inn page (やまびこ荘, Hakuba, 20 November 2026). See also `../README.md`.

- **Booking bar**: take the client's own fields, including a fourth one (room type); when the fields and the phone block do not fit one row, give the bar a second row rather than narrowing the fields. The client's reservation section moves here, with its id.
- **Hero buttons** are dropped when the booking bar sits right under the hero and does the same job.
- **Seasons, three baths, a sample menu**: seasons go after the concept on the paper band (tabs over panels that are all in the HTML); several baths sit as a hairline row of three under the onsen block; a sample menu sits beside the cuisine text.
- **A room without a photograph** is a full-width text row under the photo cards, never given a photo of another room.
- **Plans with no plan pages** link each row to the booking bar (空室検索) instead of 「詳細」.
- **FAQ** goes after access as a `<details>` list with hairlines; news (plain rows, not only links) after it. When the client has more photo-less sections than photographs, two such sections in a row at the end are accepted.
- **Vertical heading**: size it from its content (not a fixed height); on phones set it horizontal.
- **Header**: let it grow with a longer menu (min-height, wrap by whole items); on phones the reservation button may wrap.
- Generated images are named for Shibu Onsen; for another town they are mood images only.
