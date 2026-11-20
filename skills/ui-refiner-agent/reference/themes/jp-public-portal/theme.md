# 公共ポータル · 目的から探す (Japanese public, dense portal)

For Japanese banks and credit unions, municipalities, chambers of commerce, associations, universities and museums: places people come to find a service by purpose and read notices. Dense, but organised around 「目的からさがす」: the visitor's task first.

## Measured basis

64 human-made Japanese sites in the public family that fall in the dense-portal archetype (finance 27%, media 16%, government 14%, associations 14%, universities 13%, culture 9%), measured November 2026 (`archetypes/spec-JP-public-3.json`).

| What | Measured (p25 / median / p75) | Theme value |
|---|---|---|
| Hero | full-bleed on 0%; headline left on 50% | a campaign carousel inside the content width |
| Ground | white on 86%; warm off-whites | `#ffffff`, band `#f6f6f2` |
| Hairlines | 18 / 39 / 54 | many |
| Faces | Noto Sans JP 36%, Meiryo, BIZ UDPGothic | Noto Sans JP; BIZ UDPGothic for figures and tables |
| Body | 14 / 16 / 16 px | 16px, line height 1.8 |
| Display | 26 / 32 / 40 px, display ÷ body 1.8 / 2.0 / 2.9 | 30px / 700; section heads 22px |
| Text | #333, #000 | ink `#333333`, soft `#666666` |
| Buttons | white 39%, blue, teal (#009380); radius 0 / 2 / 5; 40px | teal `#00897b` filled, 4px radius, 48px |
| Photographs | 9 / 17 / 26 | 10–14 small images |
| Content width | 990 / 1100 / 1200 | 1100px |
| Page length | 5.1 / 6.7 / 8.2 screens | 6–7 |
| Menu | 個人のお客さま / 法人のお客さま, 店舗・ATM, よくあるご質問, 採用情報, 文字サイズ 標準/大 | the client's own, with audience tabs |

## Tokens

```css
--ground:#ffffff; --band:#f6f6f2; --ink:#333333; --ink-soft:#666666; --line:#dddddd;
--brand:#00897b; --brand-deep:#00695c; --brand-soft:#e0f2ef; --notice:#c62828; --tag:#3e6db5;
--text:"Noto Sans JP","Hiragino Sans","Meiryo",sans-serif; --ud:"BIZ UDPGothic","Noto Sans JP",sans-serif;
--body:16px; --leading:1.8; --display-size:30px; --h2:22px; --h3:17px;
--radius:4px; --content:1100px; --gap:clamp(48px,6vw,80px);
```

## Skeleton (in order)

1. **Top line**: 文字サイズ 標準/大, 店舗・ATM, よくあるご質問, お問い合わせ, English; audience tabs (個人のお客さま · 法人のお客さま · 採用情報).
2. **Header**: logo, global menu (6–8 items), search field.
3. **Important notices**: a thin box with red label 「重要なお知らせ」 and one or two lines (詐欺にご注意ください …).
4. **Carousel**: campaign images inside the content width (16:6), dots and a pause button; at right a column of three square buttons (インターネットバンキング ログイン, 口座開設, ご相談予約).
5. **Find by purpose** (目的からさがす, the trade component): a grid of 8–12 tiles with a small line icon drawn in one colour and a two-word label (ためる · かりる · ふやす · そなえる · 相続 · 事業を始める …), 4px radius, hairline.
6. **News** (お知らせ / ニュースリリース): tabs, date, coloured category tag, title rows, 一覧へ.
7. **Campaigns and features** (キャンペーン・おすすめ情報): three or four image cards.
8. **Online services**: a band with service links in two columns and app download text.
9. **Rates / figures** (金利・手数料, for banks) or **event calendar** (for municipalities): a compact table in BIZ UDPGothic.
10. **Related bodies and own projects** (関係機関・関連リンク): the client's own banner images in one even grid (`.banners` in `theme.css`). Japanese chambers and public bodies mostly use picture banners (a photo with type, about 3:1): `.banners--picture`, 3:1 cells, in colour, shown whole, never cropped. Logo banners use plain `.banners`: same-height white cells, grey until hover or focus. A body without a banner gets its name in the same cell.
11. **Footer**: links in columns, 金融機関コード or 所在地, 個人情報保護方針, copyright.

## Rules

- The task comes first: 目的からさがす sits on the first or second screen.
- One brand colour for buttons, tiles' icons and active tabs; red only for the important-notice label; blue only for news tags.
- Tables and figures in BIZ UDPGothic with tabular numbers.
- Accessibility: 文字サイズ switch works, focus is visible, carousel can be paused.

## Avoid

- Mascot illustrations stacked over campaign banners, gradients, more than three colours on the page chrome.

## Applying to a client's content

See `../README.md`. Municipalities use くらし・手続き · 子育て・教育 · 健康・福祉 · 防災 as purposes; universities 受験生 · 在学生 · 一般・地域の方 as audience tabs.

Learned on a real chamber of commerce page (広島商工会議所, 20 November 2026):

- **No campaign images**: one photograph of the client's own (the city) in the 16:6 frame, without carousel controls; the square buttons are the client's top three actions (入会の資料請求, WEB会員名簿, ニュースレター登録).
- **Chambers' purposes**: 創業支援 · 経営支援 · 融資相談 · 事業承継 · 講演会・セミナー · 検定試験 · 貿易関係証明 · 貸し会議室, each linking to the client's own page.
- **Topics beside the monthly bulletin**: the client's pick-ups as a list, the bulletin cover (所報) at 200px at the right.
- **News without categories**: tag by source (会議所 / 関係機関), tabs filter by it; rows without a visible date keep the date column empty.
- **The full service menu** the client lists on its top page goes in a five-column band, not cut down.
- **事務局 directory** (floors, departments, phone numbers): three columns, phones in BIZ UDPGothic.
- **Six menu items**: `repeat(6)` on desktop, three per row under 1024px.
- **会議所の活動**: 会頭ごあいさつ and 提言・要望 as two text links, then 16 picture banners (部会, 委員会, 女性会, 青年部, Stay@広島 …) in `.banners--picture`, three per row beside the event column, two per row on phones. The original stacked them at mixed sizes down a side column.
