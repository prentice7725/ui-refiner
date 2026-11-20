# 산지직송 몰 · 상품 격자 (Korean shop, dense portal)

For Korean online shops: farm-direct and food malls, cosmetics and fashion stores. People come to browse, compare and buy; the page is a well-kept shop floor: categories, a banner, product grids with prices and discounts, reviews and the delivery promise.

## Measured basis

60 human-made Korean sites in the shop family that fall in the dense-portal archetype (e-commerce 48%, fashion 15%, farm 15%, cosmetics 12%, food 10%; 30% of the 199 Korean shop sites), measured November 2026 (`archetypes/spec-KR-shop-3.json`).

| What | Measured (p25 / median / p75) | Theme value |
|---|---|---|
| Ground | white on 98% | `#ffffff`, band `#f7f7f5` |
| Photographs | 9 / 18 / 36 | 20–30 product images |
| Hairlines | 12 / 29 / 78 | product rows, tabs, footer |
| Faces | Pretendard 38% of body faces (with Pretendard Variable), Noto Sans KR 12% | Pretendard |
| Body | 13 / 16 px (median / p75) | 14px, line height 1.6 |
| Display | 29 / 32 / 40 px, display ÷ body 2.0 / 2.4 / 2.9 | 30px / 700; product names 15px |
| Buttons | white 32%, black, grey, red; radius 0 / 0 / 20; 50px | brand green `#2f7d32` for 장바구니/구매, black for secondary; 2px radius, 48px |
| Boxes | radius 0 | product images 4px, boxes 0 |
| Hero | not full-bleed; banner inside the width | a main banner slider inside 1200px, 3:1 |
| Page length | 5.9 / 6.9 / 10.4 screens | 8 |
| Content width | 1200 / 1260 / 1320 | 1200px |
| Menu | 로그인, 회원가입, 장바구니, 마이페이지, 신상품, 베스트, 이벤트, 고객센터 | the same |

## Tokens

```css
--ground:#ffffff; --band:#f7f7f5; --ink:#191919; --ink-soft:#6b6b6b; --line:#e8e8e8;
--brand:#2f7d32; --brand-soft:#eaf4ea; --sale:#d32f2f; --star:#191919;
--text:"Pretendard","Pretendard Variable","Noto Sans KR",sans-serif;
--body:14px; --leading:1.6; --display-size:30px; --h2:24px; --h3:15px;
--radius:0; --image-radius:4px; --button-radius:2px; --content:1200px; --gap:clamp(48px,6vw,80px);
```

## Skeleton (in order)

1. **Top line**: a one-line delivery promise (오후 2시 전 주문 당일 출고 · 3만 원 이상 무료배송), 로그인 · 회원가입 · 고객센터 right.
2. **Header**: logo, a wide search field with recent keywords, icons with labels for 찜 · 장바구니 (count) · 마이페이지.
3. **Category bar**: 전체 카테고리 button with a mega panel, then 신상품 · 베스트 · 제철 · 선물세트 · 이벤트.
4. **Main banner**: a slider inside the width (photograph of the produce with a short line and period), counter and pause.
5. **Category shortcuts**: eight round product photos with a label (감귤 · 한라봉 · 고구마 …).
6. **Product grids** (the trade component): sections like 오늘의 제철 / 베스트 / 선물세트, each with tabs and a four-column grid: square image, name (2 lines), discount rate in sale red, price bold, original price struck through, review count, small text badges (무료배송, 산지직송).
7. **Producer story**: one wide photograph of the farm with a short paragraph and the producer's name.
8. **Reviews**: a row of review cards: photo, stars in ink, two lines, masked name.
9. **Notices and service**: 공지사항 rows at left; 고객센터 phone, hours, bank transfer account at right.
10. **Footer**: 통신판매업 신고번호, 사업자정보 확인 link, 개인정보처리방침, 이용약관, escrow note.

## Rules

- The grid is the page: one consistent product card everywhere; prices in tabular figures; discount red only on rates and the sale tag.
- One brand colour for purchase buttons and active tabs.
- Product photographs on white or the natural setting, square, the same treatment across the page.

## Avoid

- Animated badges, countdown timers that never end, emoji, several banner sliders, pop-up coupons over the page.

## Applying to a client's content

See `../README.md`. Fashion stores swap round category photos for a model lookbook strip; cosmetics add a skin-type finder in the shortcuts.
