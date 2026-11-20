# 화이트 B2B · 제품 중심 (Korean business, white quiet)

For Korean software, B2B service, tax and accounting, hiring and other companies that sell something you can see working: a product screen, a process, a result. The page is white and orderly; the product itself is the picture. This is also the business theme to use when the client has few or no photographs (the dark theme needs them).

## Measured basis

50 human-made Korean sites in the business family that fall in the white-quiet archetype (software 32%, maker 16%, hiring 14%, logistics 14%, tax 10%), measured November 2026 (`archetypes/spec-KR-business-2.json`).

| What | Measured (p25 / median / p75) | Theme value |
|---|---|---|
| White share of the first four screens | 68% / 75% / 83% | three quarters white |
| Ground | white on 92%; light grey bands (#f5f6f8) | `#ffffff`, band `#f5f6f8` |
| Photographs | 1 / 3 / 9; photo blocks 0–2% of the area | 0–3; the product screen carries the page |
| Faces | Pretendard on 36%, Noto Sans KR; serif 2% | Pretendard |
| Body | 15 / 16 / 17 px | 16px, line height 1.7 |
| Display | 36 / 51 / 70 px, display ÷ body 2.3 / 3.4 / 4.6, weight 700 | 52px / 700, tracking −0.02em; 32px on phones |
| h2 | 20 / 36 / 48 px, 700 | 36px / 700 |
| Text | #000, #222, #333 | ink `#111418`, soft `#5b6470` |
| Buttons | white (outline) 24%, black 22%, blue 14%; radius 0 / 8 / 40; 44px | black filled main button, blue `#2457e6` only for the product's own colour if it has one; 8px radius, 48px |
| Boxes | radius 0 / 0 / 6 | 0–6px; panels for product screens 12px with a hairline |
| Hero | left headline on 54%; full-bleed 34%; claim and action on the first screen 74% / 68% | left headline, product screen at right |
| Page length | 4.6 / 6.5 / 10 screens | 6–8 |
| Content width | 1080 / 1200 / 1340 | 1200px |
| Menu words | 회사소개, 서비스/솔루션, 고객지원/고객센터, 채용, 뉴스룸, 로그인 | the client's own |

## Tokens

```css
--ground:#ffffff; --band:#f5f6f8; --ink:#111418; --ink-soft:#5b6470; --line:#e4e7eb; --panel:#ffffff; --panel-line:#dfe3e8;
--main:#111418; --product:#2457e6; --product-soft:#eaf0fd;
--text:"Pretendard","Pretendard Variable","Noto Sans KR",sans-serif;
--body:16px; --leading:1.7; --display-size:52px; --h2:36px; --h3:20px; --track:-0.02em;
--radius:6px; --panel-radius:12px; --button-radius:8px; --content:1200px; --gap:clamp(72px,10vw,120px);
```

## Skeleton (in order)

1. **Header**: white, hairline bottom; logo left, menu, 로그인 text link and the main button (도입 문의 / 무료로 시작) right.
2. **Hero**: left column: one-line category label, a two-line claim at 52px/700 saying what the product does for whom, one sentence, main button and a text link. Right column: **the product screen** as live HTML (a real-looking view of the product doing its main job, in the product's colours), in a white panel with a hairline and 12px radius. No illustration, no 3D, no floating badges.
3. **Customer logos** (when the client has them): a single quiet row of names or logos in grey, one line above it saying who uses it.
4. **Features** (the trade component): three to four rows, alternating sides: a heading and two lines of text on one side, a cropped product screen (live HTML) on the other. Hairline between rows, no cards.
5. **How it works** (band): three to five numbered steps in hairline columns.
6. **Results / cases**: two or three customer cases as text blocks (company, what changed, a measured result the client really has), hairline left border.
7. **Pricing or plans** (if the client sells plans): a plain table, not three cards with a "most popular" ribbon.
8. **FAQ**: `<details>` rows with hairlines.
9. **Closing band**: one sentence and the main button on the band.
10. **Footer**: white, company details in small soft ink, link columns.

## Rules

- The product screen is the hero's picture and the features' picture: build it as HTML in the product's real layout, never a stock photo of people at laptops.
- One accent at most (the product's colour), used inside the product screens and for one link style. The main button is ink black.
- White and the light-grey band alternate; never two bands in a row.
- Hairlines separate; cards only as the product screen's own panels.

## Avoid

- Gradient blobs, glass, 3D illustrations, phone mockups floating at angles, icon grids, stat strips of big numbers, testimonial carousels.
- English slogans over Korean headings. Small English labels only where the client's product uses them.

## Applying to a client's content

See `../README.md`. Without a product (a tax office, a hiring firm), the hero's right column holds the one thing the client really shows: a sample report, a checklist of the process, or one photograph of the people at work.
