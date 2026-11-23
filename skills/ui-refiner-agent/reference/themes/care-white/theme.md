# 맑은 진료실 · 하얀 여백 (care, white quiet; measured in Korea)

For dental, dermatology and Korean-medicine clinics and small hospitals: places people book and visit. The page is calm, white and orderly; trust comes from clear information, the doctor and the hours, not from decoration. Measured on Korean sites; it serves the same trades on a Japanese page too (`ui-refiner theme starter care-white --lang ja`).

## Measured basis

38 human-made Korean sites in the care family that fall in the white-quiet archetype (dental 32%, skin 24%, Korean medicine 21%, salons 13%, hospital 8%), measured November 2026 (`archetypes/spec-KR-care-2.json`).

| What | Measured (p25 / median / p75) | Theme value |
|---|---|---|
| Ground | white on 88%; warm off-white (#faf8f4) on most of the rest | `#ffffff`, one warm band `#f8f6f2` |
| White share of the first four screens | 49% / 67% / 78% | about two thirds white |
| Photographs | 3 / 4 / 13 per page; photo blocks on 1–2% of the area | 4–6, each with a job |
| Faces | Pretendard on a third, Noto Sans KR; serif display on 18% | Pretendard throughout |
| Body | 15 / 16 / 18 px | 16px, line height 1.75 |
| Display | 36 / 50 / 63 px, display ÷ body 2.4 / 3.3 / 4.3, weight 700 | 52px / 700 on desktop, 32px on phones |
| Headings | h2 28 / 36 / 45 px | 36px / 700 |
| Text | #000, #212121, #666 | ink `#191c1f`, soft `#5f6670` |
| Buttons | white (outline) on 35%; one colour otherwise; radius 0 / 4 / 100; 44px tall | deep green `#1f4a3e` filled, 4px radius, 48px |
| Boxes | radius 0 | 0; separation by hairlines, not cards |
| Hairlines | 7 / 13 / 32 | many: under rows, between columns |
| Hero | not full-bleed on 85%; headline left on 35%; photo or panel beside it on 38%; claim and action on the first screen on 71% / 65% | left headline and main action, photo at right |
| Centred blocks | 23% | section heads left-aligned |
| Content width | 1090 / 1180 / 1280 | 1180px |
| Page length | 6 / 7 / 10.5 screens | 7 screens |
| Menu words | 병원소개, 진료안내, 의료진 소개, 오시는 길, 커뮤니티; 임플란트, 치아교정 | the same |

## Tokens

```css
--ground:#ffffff; --band:#f8f6f2; --ink:#191c1f; --ink-soft:#5f6670; --line:#e3e5e8; --line-strong:#191c1f;
--accent:#1f4a3e; --accent-soft:#e8efec;
--text:"Pretendard","Pretendard Variable","Noto Sans KR",sans-serif;
--body:16px; --leading:1.75; --display-size:52px; --h2:36px; --h3:20px;
--radius:0; --button-radius:4px; --content:1180px; --gap:clamp(72px,10vw,128px);
```

## Skeleton (in order)

1. **Utility bar**: a thin top line with today's hours (오늘 09:30–18:30, 야간진료 화·목) and the phone number. Small, soft ink.
2. **Header**: clinic name left, menu (병원소개 · 진료안내 · 의료진 · 오시는 길 · 커뮤니티), 「진료 예약」 filled button right. White, hairline bottom.
3. **Hero**: two columns. Left: a small label (the town and what the clinic is: 수원 영통 · 치과), a two- or three-line claim at 52px/700 that states the clinic's real promise, one sentence under it, the booking button and the phone as a text link. Right: one calm photograph of the treatment room, square corners, no overlay.
4. **Hours strip** (the trade component): a full-width table row under the hero: 평일, 화·목 야간, 토요일, 점심시간, 일요일·공휴일 휴진; today's row marked. Hairlines above and below, no box.
5. **Treatments** (진료과목): a numbered list, not cards: 01 임플란트, 02 치아교정, … Each row: name at 22px, one line on what it is for and who, a 「자세히」 link. Hairline between rows.
6. **Doctor** (의료진): one large portrait or room photograph on the warm band, name, title, three to five career lines in a plain list, a short signed sentence.
7. **First visit** (처음 오시는 분): four steps as a plain ordered list with numbers in the accent colour: 접수, 검진, 상담, 치료.
8. **Facilities** (병원 둘러보기): three photographs in a row with one-line captions.
9. **Location** (오시는 길): address, parking, bus and subway lines in a definition list; a map frame at right.
10. **Footer**: white, hairline top, clinic name, representative, business number, address, phone, hours repeated, credit line.

## Rules

- White is the design. A section either sits on white or on the warm band; never two bands in a row.
- One accent (deep green), used for the main button, step numbers and the current row in the hours. No second colour.
- Separation by hairlines and space, never by shadows, tinted cards or icons in boxes.
- Numbers that patients compare (hours, prices if any) in tabular figures.
- Left-aligned section heads with a small Korean label above (진료과목, 의료진), not English eyebrows.

## Avoid

- Event banners, pop-ups, sliders, stacks of promotion images: that is the dense-portal archetype, not this one.
- Gradient heroes, glass, emoji, stat strips of big numbers.
- English taglines over Korean headings.

## Effects (optional)

Measured on 40 Korean white quiet sites of all families (`data/motion/summary.json`, November 2026): hero slides 42%, hero video 23%, scroll reveals 45%, a blurred fixed header 15%, a marquee 17%, a loading intro 0% (parallax 15%, not built). How to add them: `../effects/README.md`.

- **Offer** when the client has the material: `hero-slides`, `hero-video`, `reveal`.
- **Only when the client asks**: `header-blur`, `marquee`.
- **Not for this theme**: `intro`.
- One moving hero: video *or* slides, never both.

## Applying to a client's content

Learned on a real dental page (바른미소치과의원, 20 November 2026). See also `../README.md`.

- **About / promises** go right after the hours strip as a hairline numbered list (soft-ink numbers), with the client's `#about` anchor there.
- **Hours strip**: a small second line in a cell for notes such as (점심시간 없음); today's row from the client's own status text, moved into the utility bar. No status dots (a second colour).
- **Treatments without detail pages**: the 「자세히」 column shows the client's sub-items instead of a link.
- **Several doctors**: stacked entries (title, name, career list, quote) in the doctor block beside one room photograph; never a generated portrait next to a named doctor.
- **FAQ** as hairline `<details>` rows on the warm band after first visit; **booking form** before the location, as the target of every 진료 예약 button: square hairline fields, accent filled submit, errors in ink with a 「확인해 주세요」 prefix (no red).
- **Facilities** is dropped when the client has no facility content; room images go beside sections whose text they support.
- **Phone menu** wraps to two lines (a scrolling row ran off screen at 320px in stress); a fixed bottom quick bar (전화 상담 / 진료 예약) is kept when the client has one, restyled white with a hairline.
- Page length with FAQ and a form: about 8 screens, within the measured p75 (10.5).
