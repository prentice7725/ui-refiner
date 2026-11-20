# 오션뷰 스테이 · 사진 주도 (Korean place, photo-led)

For Korean pensions, resorts, small hotels, glamping, cafés and wedding venues by the sea or in the mountains: places people book for a trip. The view sells the stay; the page opens on it and keeps showing rooms and moments.

## Measured basis

43 human-made Korean sites in the place family that fall in the photo-led archetype (inn 49%, tourism 23%, restaurant 16%, wedding 7%, event 5%; 30% of the 143 Korean place sites), measured November 2026 (`archetypes/spec-KR-place-4.json`).

| What | Measured (p25 / median / p75) | Theme value |
|---|---|---|
| Hero | full-bleed on 40%, headline left 26% or centred 19% | full-bleed view photograph, claim centred-left |
| Photo blocks in the first four screens | 12% / 17% / 22% | photographs in every section |
| Ground | white on 95% | `#ffffff`, one dark band `#1f2328` for rooms |
| Faces | Noto Sans KR 19–24% of body faces, Roboto, Poppins for Latin; serif display 14% | Noto Sans KR; Cormorant Garamond for short Latin labels |
| Weights | headings 400 / 400 / 700 | 400 (light, airy) |
| Body | 13 / 15 / 16 px | 15px, line height 1.8 |
| Display | 30 / 40 / 54 px, display ÷ body 2.0 / 2.6 / 3.6 | 44px / 400; 28px on phones |
| Text | white on photos 31%, #333 | ink `#2b2b2b`, soft `#777` |
| Buttons | white, black, blue, earth (#a58862); radius 0 / 0 / 8; 40px | earth `#a58862` filled for 예약, black outline otherwise; 0 radius, 48px |
| Boxes | radius 0 | 0 |
| Photographs | 3 / 7 / 14 | 12–16 |
| Content width | 1200 / 1280 / 1320 | 1280px |
| Page length | 2.6 / 4.8 / 6.1 screens | 5–6 |
| Menu words | reservation, about us, rooms, location, guide, special offer, 객실안내, 이용안내, 예약 | Korean menu with short English labels |

## Tokens

```css
--ground:#ffffff; --night:#1f2328; --ink:#2b2b2b; --ink-soft:#777777; --line:#e6e2dc;
--earth:#a58862; --earth-deep:#7d6446; --sand:#f5f1eb;
--text:"Noto Sans KR",sans-serif; --latin:"Cormorant Garamond",serif;
--body:15px; --leading:1.8; --display-size:44px; --h2:30px; --h3:18px;
--radius:0; --content:1280px; --gap:clamp(64px,9vw,112px);
```

## Skeleton (in order)

1. **Header** over the hero: logo, menu (객실 ROOMS · 부대시설 · 스페셜 오퍼 · 이용안내 · 오시는 길), 예약하기 button. White text on the photo; solid white on scroll.
2. **Hero**: full-bleed sea or mountain view, 100vh. Claim at 44px/400 in white with a soft shadow, a short Latin label above it in Cormorant (OCEAN VIEW STAY), one line under it.
3. **Booking bar** (the trade component): check-in, check-out, guests, 객실 select, 예약 가능 객실 보기 button; white bar overlapping the hero's bottom, hairline top.
4. **Concept**: a large photograph and three short lines about the place; Latin label above the Korean heading.
5. **Special offers** (스페셜 오퍼): three photo cards: image, offer name, period, short line; square corners.
6. **Rooms** (dark band, `--night`): two or three wide room photographs with a dark gradient at the bottom, room name, size and capacity, 객실 보기 link; side by side on desktop.
7. **Facilities** (부대시설): a mosaic of four photographs (pool, BBQ terrace, café, walking path) with small captions.
8. **Gallery**: a horizontal strip of six photographs, scrollable on phones.
9. **Location & guide**: address, check-in/out, how to get there by car and by bus, parking, a map frame; 이용안내 notes (환불 규정 link).
10. **Footer**: dark `--night`, logo, business details, phone, account for bank transfer if the client lists one, SNS links.

## Rules

- The view and the rooms are the content; every section above the guide carries photographs.
- Light 400 weight headings and generous spacing; Latin labels short and only in Cormorant.
- One accent (earth) for reservation buttons and links.
- Square corners everywhere.

## Avoid

- Event banner stacks, pop-up notices over the hero, coloured stickers, multiple bright colours, rounded cards with shadows.
- Long Latin slogans; the Korean copy names the sea, the rooms and the way there.

## Applying to a client's content

See `../README.md`. Wedding venues replace rooms with halls and offers with packages; cafés drop the booking bar for opening hours and a menu strip.
