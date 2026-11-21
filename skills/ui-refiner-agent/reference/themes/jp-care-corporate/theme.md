# 地域ケア · スタンダード (Japanese care, standard corporate)

For Japanese care services, clinics, salons, fitness and beauty: day services, home care, dental and dermatology clinics, gyms. The page looks like a well-kept local institution: a large photograph of people, a news list right under it, clear guidance for first-time visitors, one friendly brand colour.

## Measured basis

68 human-made Japanese sites in the care family that fall in the standard-corporate archetype (dental 32%, dermatology 19%, care 15%, fitness 10%, salon 10%, beauty 9%), measured November 2026 (`archetypes/spec-JP-care-6.json`).

| What | Measured (p25 / median / p75) | Theme value |
|---|---|---|
| Hero | full-bleed on 100%; headline left on 63%, centred on 26% | full-bleed photograph, claim lower left |
| Ground | white on 94% | `#ffffff`, a pale tint band of the brand colour |
| Faces | Noto Sans JP 22%, Yu Gothic 10%, Meiryo; Mincho on 15% | Noto Sans JP; Zen Maru Gothic for the claim only |
| Weights | headings 400 / 400 / 700 | headings 500, claim 500 |
| Body | 14 / 16 / 16 px | 16px, line height 1.9 |
| Display | 32 / 40 / 50 px, display ÷ body 2.1 / 2.7 / 3.3 | 40px; 26px on phones |
| h2 | 16 / 28 / 34 px | 28px |
| Text | #333 on 28%, #000 | ink `#333333`, soft `#6b6b6b` |
| Buttons | white, green, blue, orange, teal, pink (one per site); radius 0 / 5 / 20; 51px | one brand colour, here green `#3f9a5b`; 24px radius (pill-like), 52px |
| Boxes | radius 0 | 8px on cards, 0 on photos |
| Photographs | 8 / 11 / 25 | 10–14 |
| Hairlines | 9 / 15 / 37 | under news rows and table rows |
| Content width | 1000 / 1100 / 1200 | 1100px |
| Page length | 5.2 / 7.4 / 9.4 screens | 7–8 |
| Menu words | お知らせ, アクセス, 採用情報, よくあるご質問, 診療案内/サービス, お問い合わせ, WEB予約 | the client's own |

## Tokens

```css
--ground:#ffffff; --tint:#f1f8f3; --ink:#333333; --ink-soft:#6b6b6b; --line:#e5e5e5;
--brand:#3f9a5b; --brand-deep:#2c7344; --brand-soft:#e3f2e8; --tag-a:#3f9a5b; --tag-b:#e08a2e; --tag-c:#5a86c8;
--text:"Noto Sans JP","Hiragino Sans","Yu Gothic",sans-serif; --soft-display:"Zen Maru Gothic","Noto Sans JP",sans-serif;
--body:16px; --leading:1.9; --display-size:40px; --h2:28px; --h3:19px;
--radius:8px; --button-radius:24px; --content:1100px; --gap:clamp(64px,9vw,104px);
```

## Skeleton (in order)

1. **Top line**: phone number large with hours, WEB予約 and お問い合わせ buttons at right; logo left. Menu below on a white bar.
2. **Hero**: full-bleed photograph of people (staff with users, a calm treatment, a group activity), 70vh. Claim lower left in Zen Maru Gothic 40px/500 on a soft white panel or white text with a gentle shadow; one supporting line.
3. **News** (お知らせ, the trade component): right under the hero, a white box overlapping the hero's bottom edge by 40px: date, coloured category tag (お知らせ / イベント / 採用), title; three to five rows; 「一覧を見る」.
4. **First visit** (はじめての方へ): two or three large rounded buttons side by side, each with a small photo or icon-free label: 「ご利用の流れ」「料金・費用」「見学・体験のお申し込み」.
5. **About** (私たちについて): photograph left, text right, a small English label above the Japanese heading (ABOUT), 3–4 short paragraphs.
6. **Services** (サービス/診療案内): cards with a photograph on top, name, two lines; 3 or 4 in a row; 8px radius, no shadow, hairline.
7. **A day** (一日の流れ) or **Facilities**: a timeline (time, what happens, a small photo) or a photo grid with captions.
8. **Recruit band** (採用情報): a wide photograph band with a short line and button; measured sites put recruiting on the home page.
9. **Access**: address, hours table, parking, map frame.
10. **Footer**: brand tint band, logo, address, phone, hours, menu, small copyright.

## Rules

- One brand colour (here green) for buttons, the news tags' main kind and small accents; the other two tag colours only inside news tags.
- Photographs of people and rooms in every section above access; real warmth, not stock smiles.
- Small English labels above Japanese section headings (NEWS, ABOUT, SERVICE) are the measured convention here; keep them small (12px, letter-spaced) and in the brand colour.
- Rounded buttons and cards; photographs keep square corners.

## Avoid

- Banners stacked with campaign prices, cartoon mascots, gradient headings, more than one bright colour outside the tags.
- A dark page or dark sections; the footer is a pale tint, not dark.

## Effects (optional)

Measured on 40 Japanese standard corporate sites of all families (`data/motion/summary.json`, November 2026): hero slides 55%, hero video 17%, scroll reveals 23%, a blurred fixed header 0%, a marquee 3%, a loading intro 5% (parallax 5%, not built). How to add them: `../effects/README.md`.

- **Offer** when the client has the material: `hero-slides`, `reveal`.
- **Only when the client asks**: `hero-video`, `intro`.
- **Not for this theme**: `header-blur`, `marquee`.

## Applying to a client's content

See `../README.md`. Clinics replace 「一日の流れ」 with 診療時間 (a weekly table with ○ and ／) and 院長あいさつ.

Learned on a real day service (リハビリの家 デイサービス東浦和, 20 November 2026):

- **No usable photograph of people**: the theme's generated group photograph in the hero as a mood image, marked `data-generated`, with a small 「写真はイメージです」 on it and a footer note. The client's real photographs (rooms at 295px, the building cut from a banner) go where they are facts: the feature cards and 私たちについて, at their own size, never upscaled.
- **Several facilities of one operator**: pill tabs (施設) between the top line and the menu, the current one filled.
- **ご利用の流れ** as four numbered steps, then the schedule and 利用できる方 in two columns, when the client gives a schedule list rather than a timed day.
- **Fee tables** (要介護 / 要支援): two tables side by side, group rows (基本分 / 加算分 / 減算分) in the brand colour, figures right-aligned in tabular numbers, a scroll wrapper on phones, the ※ notes small under each.
- **Info tables** with long labels (ドリンク・レクリエーション代) need a label column of about 11em.
- Page length 8.7 screens with full fee tables: within the measured p75 (9.4).
