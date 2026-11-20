# 技術企業 · スタンダード (Japanese business, standard corporate)

For Japanese manufacturers, software and engineering firms, regional companies and builders: a company that wants to look reliable and established. A full-width photograph and a confident claim, then news, the businesses, the company's message and the recruiting door.

## Measured basis

52 human-made Japanese sites in the business family that fall in the standard-corporate archetype (maker 25%, software 21%, hiring 17%, local 12%, builder 10%), measured November 2026 (`archetypes/spec-JP-business-6.json`).

| What | Measured (p25 / median / p75) | Theme value |
|---|---|---|
| Hero | full-bleed on 100%; headline left on 85% | full-bleed photograph, claim left |
| Ground | white on 88%; pale grey-blue bands (#e6eaeb, #eff0f1); a navy (#1e2b3f) on some | `#ffffff`, band `#eef1f4`, deep `#1d2b3e` for one section |
| Faces | Noto Sans JP 31%, Yu Gothic, Meiryo; Mincho 12% | Noto Sans JP; Inter for English labels |
| Weights | 400 / 600 / 700 | 600 headings, 700 claim |
| Body | 14 / 15 / 16 px | 15px, line height 1.9 |
| Display | 34 / 40 / 52 px, display ÷ body 2.3 / 2.9 / 3.5 | 44px / 700; 28px on phones |
| h2 | 20 / 30 / 36 px | 30px / 600 |
| Text | #333, #000, #222 | ink `#222831`, soft `#5d6672` |
| Buttons | white 31%, black, blue, teal; radius 0 / 3 / 18; 50px | deep blue `#0b5cab` filled, white outline on photos; 2px radius, 52px |
| Boxes | radius 0 | 0 |
| Hairlines | 8 / 18 / 36 | many: news rows, link cards, tables |
| Photographs | 7 / 11 / 20 | 10–12 |
| Content width | 1040 / 1180 / 1250 | 1180px |
| Page length | 5.6 / 7.2 / 9.6 screens | 7–8 |
| Menu words | 企業情報/会社情報, 製品情報/事業紹介, サステナビリティ, IR情報, 採用情報, ニュース/お知らせ, お問い合わせ, English | the client's own |

## Tokens

```css
--ground:#ffffff; --band:#eef1f4; --deep:#1d2b3e; --ink:#222831; --ink-soft:#5d6672; --line:#d9dee4;
--brand:#0b5cab; --brand-soft:#e6eff8;
--text:"Noto Sans JP","Hiragino Sans","Yu Gothic",sans-serif; --latin:"Inter","Noto Sans JP",sans-serif;
--body:15px; --leading:1.9; --display-size:44px; --h2:30px; --h3:19px;
--radius:0; --button-radius:2px; --content:1180px; --gap:clamp(72px,10vw,120px);
```

## Skeleton (in order)

1. **Header**: white, logo left, menu (企業情報 · 事業紹介 · 製品情報 · サステナビリティ · 採用情報 · ニュース), お問い合わせ button and EN switch right.
2. **Hero**: full-bleed photograph of the company's work (the plant, a product in use, engineers), 80vh. Claim left at 44px/700 in two lines, white on a dark gradient from the left; one supporting line; slide dots if several images.
3. **News** (NEWS RELEASE, the trade component): right under the hero, a tabbed list (すべて / ニュースリリース / お知らせ / IR): date, small category label, title, hairline rows, 「一覧を見る」.
4. **Businesses** (OUR BUSINESS): three or four photograph tiles side by side with an English name large (DENTAL, INDUSTRIAL) and the Japanese name under it, dark gradient at the bottom, each a link.
5. **Message** (MESSAGE / 代表メッセージ): a large pale English word as a background watermark (Inter 140px, band colour), a photograph of the leader or the founding place, a heading and 3–4 lines, 「詳しく見る」.
6. **Products / technology**: a photo left, text right, with three facts as a hairline definition list.
7. **Link cards** (IR · サステナビリティ · 採用情報): three wide photograph cards with an English label and Japanese name, hairline frame, 「詳しく見る」.
8. **Recruit band** (deep navy section): photograph of people at work, a short line to job seekers, 新卒採用 / キャリア採用 buttons.
9. **Footer**: white, group-site select, link columns by section, company address, copyright.

## Rules

- English labels in Inter above or beside Japanese headings are the measured convention for this archetype; the Japanese heading stays the larger one except in the business tiles.
- One brand colour (deep blue) for buttons, link arrows and tab underline; the navy section once.
- Square photographs, hairline frames, generous white.

## Avoid

- Campaign banners, cartoon illustrations, pastel gradients, rounded pill buttons, more than one navy section.
- Long English slogans; one short English word as the hero's label at most.

## Applying to a client's content

See `../README.md`. Without IR (a private company) the link cards are 会社概要 · サステナビリティ · 採用情報. A regional service firm uses its service area map instead of the message watermark.

Learned on a real regional service firm (暮らしリフォーム, 20 November 2026):

- **Client photographs at 640–770px**: no full-bleed hero. A split hero on white: claim left, the best photograph at its own size (≤ 560px) right. The claim comes from the client's own words (its banner: 原状回復、一社完結主義).
- **Seven services**: a four-column card grid (photograph 3:2, small English label, name, the client's text, 詳細はこちら) instead of three tiles. A service whose only image is a cartoon gets a type card.
- **Service area** (区・市 link lists by prefecture) replaces the message section.
- **Recruit band**: the photograph fills half the band, so it needs at least 640px; a 770×300 banner there is upscaled past 2× and blurs. The band carries the client's own recruiting words.
- **Contact band** (phone large, お問合せ・無料見積) replaces the form when the client has its own contact page.
- **Client CSS**: a client rule that sets grid columns (footer nav, services) must sit inside a desktop media query; unscoped, it beats the theme's phone rules (the footer ran 384px off screen at 320px in stress).
