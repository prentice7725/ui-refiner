# 蔵元オンラインストア · 商品と物語 (Japanese shop, dense portal)

For Japanese makers and stores that sell online: sake and food brands, cosmetics, crafts and general e-commerce. Measured Japanese shop sites mix the store with the brand's story: products by category, recommended content, the maker's history and news, all orderly on white.

## Measured basis

30 human-made Japanese sites in the shop family that fall in the dense-portal archetype (e-commerce 43%, food 23%, cosmetics 13%, fashion 13%, farm 7%), measured November 2026 (`archetypes/spec-JP-shop-3.json`).

| What | Measured (p25 / median / p75) | Theme value |
|---|---|---|
| Ground | white on 83%; #f4f4f4, #f8f6ec | `#ffffff`, band `#f7f5ef` |
| Photographs | 14 / 20 / 33 | 18–24 |
| Faces | Noto Sans JP 20%; Shippori Mincho 7%; Mincho on 10% | Noto Sans JP; Shippori Mincho for the brand's headings |
| Body | 13 / 14 / 16 px | 15px, line height 1.85 |
| Display | 24 / 30 / 40 px, display ÷ body 1.8 / 2.2 / 2.9 | 32px Shippori Mincho 600 |
| Buttons | white 27%, grey, red, deep blue (#1e4d9e), deep green (#004022); radius 0 / 0 / 6; 43px | deep indigo `#1f3a5f` for カートに入れる, 0 radius, 48px |
| Hairlines | 15 / 28 / 55 | many |
| Hero | full-bleed on 3%; centred 23%, left 17% | a wide visual inside the width, 16:7 |
| Page length | 6.7 / 8.8 / 10.7 screens | 8–9 |
| Content width | 980 / 1130 / 1280 | 1140px |
| Menu | カート, ログイン, お気に入り, 商品情報, 企業情報, 店舗情報, ご利用ガイド | the same |

## Tokens

```css
--ground:#ffffff; --band:#f7f5ef; --ink:#222222; --ink-soft:#666666; --line:#e2ded4;
--brand:#1f3a5f; --brand-soft:#e8edf3; --accent:#a3342b;
--text:"Noto Sans JP","Hiragino Sans",sans-serif; --mincho:"Shippori Mincho","Yu Mincho",serif;
--body:15px; --leading:1.85; --display-size:32px; --h2:24px; --h3:16px;
--radius:0; --content:1140px; --gap:clamp(56px,7vw,96px);
```

## Skeleton (in order)

1. **Top line**: 送料・お届けについて, ご利用ガイド, ログイン, お気に入り, カート (count).
2. **Header**: logo, menu (商品一覧 · ギフト · 蔵の物語 · 店舗情報 · お知らせ), search.
3. **Main visual**: one wide photograph inside the width (the master at work, a seasonal bottle), a Mincho line over or beside it; dots if several.
4. **Recommended content** (おすすめコンテンツ): a horizontal row of five image cards (pairing, recipes, the season's limited release), scrollable.
5. **Products by category** (the trade component): category tabs (純米大吟醸 · 純米酒 · 季節限定 · ギフト), a five-column grid of bottle images on white with name, volume, price (税込), カートに入れる.
6. **Gift band** (band): a photograph of a gift set, wrapping and のし options as text.
7. **The maker's story** (蔵の物語): Mincho heading, a large photograph of the brewery, three short paragraphs, 創業 year as a fact.
8. **Ranking**: 1–5 with small images, name, price.
9. **News**: date, tag, title rows.
10. **Footer**: 特定商取引法に基づく表記, プライバシーポリシー, 20歳未満の飲酒は法律で禁止されています (for alcohol), company address, copyright.

## Rules

- Product images on white, uniform size and angle; prices with 税込 in tabular figures.
- Mincho only for brand headings and the main visual's line; everything else Noto Sans JP.
- One brand colour (indigo) for cart buttons and links; the accent red for 限定 and 新商品 tags only.

## Avoid

- Black-Friday-style banners with bursts and gradients, more than one carousel, countdowns, mascot pop-ups.

## Applying to a client's content

See `../README.md`. Cosmetics stores add a 肌悩みから探す tile row; general stores with many categories move the category tabs into a left sidebar.
