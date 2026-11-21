# 다크 인더스트리 · 시네마 (Korean business, dark cinematic)

For Korean makers, logistics firms, technology and B2B companies that want to look big and capable: the factory, the machine, the network. Dark sections and full-width photographs or video do the work; type is large and plain.

## Measured basis

35 human-made Korean sites in the business family that fall in the dark-cinematic archetype (maker 26%, logistics 23%, software 20%, hiring 11%, real estate 9%), measured November 2026 (`archetypes/spec-KR-business-1.json`).

| What | Measured (p25 / median / p75) | Theme value |
|---|---|---|
| Dark share of the first four screens | 31% / 41% / 61% | dark hero, dark sections alternating with one light one |
| Root ground | white on 80% (dark sections inside), otherwise #060810 – #2a3447 | sections `#0b0e12` and `#141920`, one light section `#f3f4f6` |
| Headings | white on 31% | white `#f2f4f7` on dark, ink `#111418` on light |
| Faces | Pretendard on 26%, Noto Sans KR on 14%; no serif | Pretendard throughout |
| Body | 16 / 16 / 18 px | 17px, line height 1.7 |
| Display | 48 / 57 / 70 px, display ÷ body 2.7 / 3.4 / 4.7, weight 700 | 64px / 700, letter-spacing −0.02em; 36px on phones |
| h2 | 30 / 48 / 60 px | 44px / 700 |
| Buttons | white on 26%, then red, blue, black; radius 4 / 8 / 50; 46px | white outline on dark, one blue `#1d6fe8` for the inquiry, 6px radius, 50px |
| Boxes | radius 0 | 0 |
| Hero | full-bleed on 46%, claim and action on the first screen on 74% / 71% | full-bleed photograph with a dark wash, claim lower left |
| Page length | 1.8 / 4.4 / 6.6 screens | about 5 screens |
| Photographs | 1 / 3 / 12 | 6–8, large |
| Content width | 1160 / 1200 / 1300 | 1240px |
| Menu words | 회사소개, 사업분야, 고객지원, 홍보센터, 지속가능경영/ESG, 문의하기, EN/KOR | the same |

## Tokens

```css
--night:#0b0e12; --night-2:#141920; --light:#f3f4f6; --on-dark:#f2f4f7; --on-dark-soft:#9aa3ad; --ink:#111418; --ink-soft:#5a636d;
--line-dark:rgba(255,255,255,.14); --line-light:#d8dce1; --signal:#1d6fe8;
--text:"Pretendard","Pretendard Variable","Noto Sans KR",sans-serif;
--body:17px; --leading:1.7; --display-size:64px; --h2:44px; --h3:22px; --track:-0.02em;
--radius:0; --button-radius:6px; --content:1240px; --gap:clamp(80px,11vw,140px);
```

## Skeleton (in order)

1. **Header**: transparent over the hero, logo left, menu (회사소개 · 사업분야 · 기술 · 홍보센터 · 고객지원), KOR/EN switch and 「문의하기」 outline button right. Solid `--night` on scroll.
2. **Hero**: full-bleed photograph of the work (the line, the machine, the port), dark wash left to right. Claim lower left at 64px/700 in two lines, one sentence, two buttons (사업분야 보기, 문의하기). A thin progress line or slide counter at the bottom right if there are several images.
3. **Business areas** (사업분야, the trade component): three or four large photograph tiles side by side, each with a dark wash at the bottom, name at 24px and one line, the whole tile a link. Edge to edge inside the content width, no gaps or 2px gaps.
4. **Capability in figures** (on `--night-2`): three or four facts from the company with unit and label (설립 1998, 공장 3곳, 수출국 27개국). Only figures the client really has; tabular numbers; thin vertical rules between them.
5. **Technology** (light section `--light`): a large photograph left, text right: what the company can make or do that others cannot, three short points as a list with hairlines.
6. **Global network** (on `--night`): a list of sites (본사 · 공장 · 해외 법인) with city and role, two or three columns; optionally a dim world map image behind.
7. **Newsroom** (홍보센터): three latest items as text rows on dark: date, category, title; 「전체 보기」.
8. **Inquiry band**: one line (프로젝트 문의) and the signal-blue button, phone and email.
9. **Footer**: `--night`, company name, representative, address, business number, links, family-site select, credit line.

## Rules

- Dark is the frame: hero, figures, network, news and footer on night tones; one light section in the middle for rhythm.
- One colour: signal blue for the inquiry action only. Everything else white, greys and the photographs.
- Photographs are the work itself, large, never inside small rounded cards.
- Type is big and plain: Pretendard 700, tight tracking on display sizes, no serif, no outline text.
- English section labels are allowed in this archetype (the measured sites use them) but small, above the Korean heading, never instead of it.

## Avoid

- Neon gradients, glows, glass panels, purple; the dark is industrial, not crypto.
- Icons in boxes for business areas; use photographs.
- Invented figures: the capability band shows only the client's real numbers, else it is left out.

## Effects (optional)

Measured on 40 Korean dark cinematic sites of all families (`data/motion/summary.json`, November 2026): hero slides 40%, hero video 33%, scroll reveals 17%, a blurred fixed header 5%, a marquee 3%, a loading intro 0% (parallax 7%, not built). How to add them: `../effects/README.md`.

- **Offer** when the client has the material: `hero-slides`, `hero-video`.
- **Only when the client asks**: `reveal`, `header-blur`.
- **Not for this theme**: `marquee`, `intro`.
- One moving hero: video *or* slides, never both.

## Applying to a client's content

Learned on a real logistics page (한길로지스, 20 November 2026). See also `../README.md`.

- **This theme needs the client's photographs or video.** Without them the page reads as a dark text template: choose the white-quiet or standard-corporate business theme instead, or ask for photographs (for logistics: high-bay racking, trucks at the docks, pick-and-pack stations, the real WMS screen, an aerial of the centre).
- When it is used without photographs anyway: a type hero over the night ground, business areas as type tiles (number, name, line, hairline list), the client's product screen in the technology slot.
- **Optional night sections**: process steps (hairline columns) after the figures, cases in the newsroom slot as text rows, FAQ, and a full quote form after the inquiry band (square dark fields, signal-blue submit, `color-scheme: dark` on the form).
- **Long pages** (over about 7 screens) may take a second light section, for the form or the process, so the dark run is not unbroken.
- **Figures** only from the client; write units in their own span (4.5만 <span>건</span>) so the figure reads as one fact.
- KOR/EN switch, newsroom and family-site select are dropped when the client has none.
