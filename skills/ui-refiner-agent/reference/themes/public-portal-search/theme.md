# 공공 포털 · 정돈된 밀도 (public, dense portal; measured in Korea)

For public bodies, foundations, associations, museums, universities and news outlets: places people come to look something up, apply or read the latest. The page is dense by necessity; the theme's job is to make that density orderly: a clear search, quick links, notices with dates, programmes with posters, everything on one grid. Measured on Korean sites; it serves the same trades on a Japanese page too (`ui-refiner theme starter public-portal-search --lang ja`).

## Measured basis

61 human-made Korean sites in the public family that fall in the dense-portal archetype (media 33%, government 23%, academies 10%, culture 10%, finance, associations, universities), measured November 2026 (`archetypes/spec-KR-public-3.json`).

| What | Measured (p25 / median / p75) | Theme value |
|---|---|---|
| Hero | full-bleed on 3%; headline left 41%; media beside it on 33% | a programme slider at left, notices at right |
| Ground | white on 97% | `#ffffff`, band `#f4f5f7` |
| Hairlines | 19 / 38 / 62 | many: every list row |
| Faces | Pretendard 22%, Noto Sans KR, Malgun Gothic | Pretendard |
| Body | 14 / 16 / 16 px | 15px, line height 1.65 |
| Display | 32 / 39 / 46 px, display ÷ body 1.9 / 2.5 / 2.9 | 34px / 700; section heads 22px |
| Text | #000, #333, #555 | ink `#1a1d21`, soft `#5c636b` |
| Buttons | white 34%, blue 17%; radius 0 / 0 / 20; 40px | institution blue `#1a5fb4` filled, 0 radius, 44px |
| Boxes | radius 0 | 0 |
| Photographs | 4 / 9 / 19 | 8–12 (programme images, venues) |
| Content width | 1180 / 1200 / 1280 | 1200px |
| Page length | 2.7 / 4.5 / 6.1 screens | 4–6 |
| Menu | 9 / 12 items; 로그인, 회원가입, 사이트맵, 기관소개, ENG | the client's own, with a full-width mega menu |

## Tokens

```css
--ground:#ffffff; --band:#f4f5f7; --ink:#1a1d21; --ink-soft:#5c636b; --line:#e1e4e8; --line-strong:#1a1d21;
--brand:#1a5fb4; --brand-soft:#e8f0fa; --alert:#c62828;
--text:"Pretendard","Pretendard Variable","Noto Sans KR",sans-serif;
--body:15px; --leading:1.65; --display-size:34px; --h2:22px; --h3:17px;
--radius:0; --content:1200px; --gap:clamp(48px,6vw,80px);
```

## Skeleton (in order)

1. **Utility bar**: 로그인 · 회원가입 · 사이트맵 · ENG, small, right; the government or parent-body line left if any.
2. **Header**: logo left, main menu (5–7 items) with a full-width mega menu panel listing every sub-page under each item; search icon.
3. **Hero row** (the trade component): left two-thirds a programme slider (image, title, date, place, a counter and pause button); right third the notice board: tabs (공지사항 · 보도자료 · 채용), five rows of title and date, 더보기.
4. **Quick links**: a strip of six to eight text links with a thin icon-free number or short label each (신청·예약, 대관 안내, 정보공개, 자주 묻는 질문 …), hairline boxes in one row.
5. **Programmes** (전시·공연·교육): tabs by kind, a four-column grid of poster images with title, period and place; status tag (접수중 / 마감) in text.
6. **News / stories**: three columns of image cards with category, title, date.
7. **Search band** (band): a large search field with popular keywords.
8. **Partner and related sites** (유관기관): the bodies' own banner images in one even grid (`.banners` in `theme.css`): every banner in a same-height white cell with a hairline, grey until hover or focus; a body without a banner gets its name in the same cell. Picture banners (a photo with type) use `.banners--picture`: 3:1 cells, in colour, shown whole. A 관련 사이트 select only for sites that have no banner and no other place.
9. **Footer**: address, representative phone, 개인정보처리방침 in bold, 이메일무단수집거부, copyright; accessibility mark text.

## Rules

- Density is fine; disorder is not: one 1200px grid, 24px gutters, every list row with a hairline, dates right-aligned in tabular figures.
- One institution colour for buttons, active tabs and the current menu; the alert red only for urgent notices (사칭 주의, 휴관).
- Posters and programme images may carry their own colours; the page chrome stays white and ink.
- Keyboard and accessibility: skip link, visible focus, a pause button on every slider.

## Avoid

- Floating pop-up windows over the hero, stacks of banner images with prices, gradient banners, emoji.
- More than one slider on the first screen.

## Effects (optional)

Measured on 40 Korean dense portal sites of all families (`data/motion/summary.json`, November 2026): hero slides 57%, hero video 5%, scroll reveals 13%, a blurred fixed header 0%, a marquee 3%, a loading intro 0% (parallax 5%, not built). How to add them: `../effects/README.md`.

- **Offer** when the client has the material: `hero-slides`.
- **Only when the client asks**: `hero-video`, `reveal`.
- **Not for this theme**: `header-blur`, `marquee`, `intro`.

## Applying to a client's content

See `../README.md`. News outlets replace the programme grid with a lead story and section lists; universities add 입학 · 학사 quick links. Weak basis: none; this is the most common Korean public archetype.

Learned on a real association page (대한수의사회, 20 November 2026):

- **No programme photographs**: the slider carries the body's own card-news posters (square, with their own type), shown whole on the band ground (`object-fit: contain`), never cropped. Programmes and news cards are dropped when there is nothing to show in them.
- **Boards without dates**: the title's bracket prefix ([안내], [공고], [부고]) becomes the tag, titles wrap to two lines, and each tab ends with its own 더보기 link.
- **More than six quick links**: two rows of four.
- **Member login**: a 회원 서비스 column (the real login form, 회원가입, ID/PW 찾기, 신상신고) beside a 언론보도 list, 2 : 1.
- **Long sub-menus** (12 items): raise `--mega-h` to about 420px and tighten the link padding; seven top items fit at 132px each.
- **Related bodies** as the banner grid (12 logo banners plus one name cell); **branches**, which have no banners, as a link row, not a select: every link stays a link.
- Page length 2.1 screens: an association with little content stays below the measured p25, which is right.
