# 물류·제조 · 표준 기업형 (business, standard corporate; measured in Korea)

For logistics companies, makers, builders and other firms that show their sites, vehicles and people at work: a full-width photograph and a plain claim, a quick bar for what customers come to do, the businesses as photograph tiles, then the company, its figures, its sites, notices and the customer centre. Use it when the client has photographs of its work, or credited stand-ins of the same kind of place (see `../README.md`, "Images"). Measured on Korean sites; it serves the same trades on a Japanese page too (`ui-refiner theme starter business-corporate-quickbar --lang ja`).

## Measured basis

41 human-made Korean sites in the business family that fall in the standard-corporate archetype (logistics 27%, maker 20%, corporate 12%, hiring 12%, tax 12%, builder 5%), measured November 2026 (`archetypes/spec-KR-business-6.json`). Of the 47 measured Korean logistics sites, 7 fall in white quiet and 11 here; a blind comparison on a logistics page (21 November 2026) read `business-white` as a software template and a version like this one as a real logistics site.

| What | Measured (p25 / median / p75) | Theme value |
|---|---|---|
| Hero | full-bleed on 100%; headline left on 73%; claim on the first screen 71%, action 66% | full-bleed photograph, claim left in white |
| Ground | white on 98%; white share of the page 40 / 48 / 57%, dark 8%, colourful 7% | `#ffffff`, band `#f2f4f7`, one brand-blue figures band |
| Faces | Pretendard 17%, Noto Sans KR 17–22%, NanumSquare; serif 5% | Pretendard |
| Body | 14 / 16 / 18 px | 16px, line height 1.7 |
| Display | 48 / 58 / 68 px, display ÷ body 2.9 / 3.4 / 4.1, weight 700 | 56px / 700, tracking −0.02em; 32px on phones |
| h2 | 24 / 36 / 60 px, 700 | 36px / 700 |
| Text | #000, #333, #666; headings white on 20% (over photographs); blue #0055b8 on some | ink `#111111`, soft `#5c636e`, brand `#0055b8` |
| Buttons | white (outline on photographs) 29%, blue 17%, black 12%, orange 7%; radius 0 / 0 / 8; 39 / 54 / 80 px | brand blue filled and white outline, 0 radius, 54px |
| Boxes | radius 0 | 0 |
| Hairlines | 6 / 9 / 19 | tables, notices, facts |
| Photographs | 2 / 5 / 12 | 6–8 |
| Content width | 1170 / 1220 / 1310 | 1220px |
| Page length | 3.8 / 4.5 / 5.6 screens | 5–6 with the optional form |
| Menu words | 회사소개, 고객센터, 제품소개, 고객지원, 지속가능경영, 인재채용, 사업영역, 시공실적, 공지사항, 연혁, 인증현황, KOR/ENG | the client's own |

Nearest measured sites: hdexp.co.kr, hanilexpress.co.kr, hanjin.com, panstar.co.kr (logistics), pangum.com, zeidindus.com (makers), eagon.com (builder).

## Tokens

```css
--ground:#ffffff; --band:#f2f4f7; --deep:#14233a; --ink:#111111; --ink-soft:#5c636e; --line:#dcdfe4;
--brand:#0055b8; --brand-deep:#00438f; --brand-soft:#e8f0fa;
--text:"Pretendard","Pretendard Variable","Noto Sans KR",sans-serif;
--body:16px; --leading:1.7; --display-size:56px; --h2:36px; --h3:20px; --track:-0.02em;
--radius:0; --button-radius:0; --content:1220px; --gap:clamp(72px,9vw,112px);
```

The brand colour is the client's own when it has one (a logistics orange, a maker's green); `#0055b8` stands in.

## Skeleton (in order)

1. **Header**: white, hairline bottom; logo left, menu (회사소개 · 사업영역 · 물류센터/제품소개 · 고객지원 · 인재채용), customer-centre number in brand blue and KOR | ENG right.
2. **Hero**: full-bleed photograph of the company's own work (the centre with trucks at the docks, the plant, the site), 78vh, a dark gradient from the left. A small year or slide count in amber, the claim at 56px/700 white in two lines, one sentence, a brand-blue button and a white outline button.
3. **Quick bar** (the trade component): a white bar overlapping the hero's foot. Its first cell is in brand blue and holds the one thing customers come to do (logistics: 화물 조회 with a tracking-number field; maker: 제품 검색 or 카탈로그; builder: 분양 문의). The other cells hold quote, sites and the customer-centre number.
4. **Business** (사업영역): the title centred between two hairlines; four photograph tiles edge to edge across the full width, the Korean name and one line on the photograph's foot.
5. **Company** (band): photograph left, text right: kicker, two-line heading, two short paragraphs, a facts list (설립, 본사, 인증) under a 2px ink rule, and a 「자세히 보기」 outline link with a long arrow.
6. **Figures band**: the brand colour once, four of the client's own figures with units, the date they hold for.
7. **Sites** (물류센터 / 공장 / 시공실적): a table under a 2px ink rule (name, address, what is handled, area); on phones the rows stack.
8. **Notices and customer centre** (band): notices as dated hairline rows with 더보기 +; beside them a customer-centre block with the number large, the hours and four links.
9. **Footer**: dark grey; policy links (개인정보처리방침 first and bold), a family-site select, the company's registration details on one or two lines, the customer centre at right.

Optional: a quote form after the notices (회사명, 담당자, 연락처, 서비스, 물동량, 내용, 개인정보 동의), photograph beside it.

## Rules

- Photographs of the company's own work carry the page: sites, vehicles, machines and people at work. A software screen or a dashboard mock is not one; that is `business-white`.
- Square corners everywhere. Hairlines and 2px ink rules separate; no cards with shadows except the quick bar.
- One brand colour for buttons, the quick bar's first cell, the figures band and the phone numbers. Amber only for the small hero count.
- Figures, sites and certificates are the client's own; drop the band or the row when the client has none.

## Avoid

- A white minimal hero with a product mock beside it, gradient blobs, glass, icons in circles, pill buttons, testimonial cards.
- English slogans as headings (one small Since 1998 label at most).
- Campaign banners in the business tiles; banners with baked-in type go in a notice or event list, shown whole.

## Effects (optional)

Measured on 38 Korean standard corporate sites of all families (`data/motion/summary.json`, November 2026): hero slides 61%, hero video 16%, scroll reveals 16%, a blurred fixed header 5%, a marquee 0%, a loading intro 0% (parallax 8%, not built). How to add them: `../effects/README.md`.

- **Offer** when the client has the material: `hero-slides`.
- **Only when the client asks**: `hero-video`, `reveal`, `header-blur`.
- **Not for this theme**: `marquee`, `intro`.
- One moving hero: video *or* slides, never both.

## Applying to a client's content

See `../README.md`. A maker uses 제품소개 for the sites table's place (product lines with a photograph each) and keeps the certificates in the facts. A client with only one or two photographs of its own keeps them for the hero and the company section and fills the business tiles with credited stand-ins of the same work, listed in the report; with none at all and no stand-ins, use `business-white` instead.
