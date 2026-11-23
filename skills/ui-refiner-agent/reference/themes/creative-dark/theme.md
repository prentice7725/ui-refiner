# 스튜디오 포트폴리오 · 다크 (creative, dark cinematic; measured in Korea)

For design studios, branding agencies, production companies and game studios: places that show their work. Black ground, a big statement or wordmark, then the work itself, large, one project after another. Measured on Korean sites; it serves the same trades on a Japanese page too (`ui-refiner theme starter creative-dark --lang ja`).

## Measured basis

34 human-made Korean sites in the creative family that fall in the dark-cinematic archetype (design 41%, game 29%, photo and video 15%, architecture 9%, illustration 6%), measured November 2026 (`archetypes/spec-KR-creative-1.json`). Dark cinematic stays the most common archetype of the 130 Korean creative sites (26%). The basis grew from 12 sites to 34 after a second collection; the shared traits held (black ground, white text, large work images, few menu items).

| What | Measured | Theme value |
|---|---|---|
| Dark share of the first four screens | 37% / 59% / 82% | black ground throughout, one white section allowed |
| Ground | white 53% (dark sections), black 29% | `#0a0a0a`, white section `#ffffff` |
| Faces | Pretendard 21% of body faces, Noto Sans KR 15%; Inter, Montserrat for Latin | Pretendard; Inter for Latin |
| Display | 26 / 44 / 60 px, display ÷ body 2.0 / 3.1 / 5.0; some sites use one huge wordmark | a 160px wordmark or statement at 64px |
| Weights | h1 400 / 650 / 700 | 500 for display, 400 body |
| Buttons | black 21%, white; radius 0 / 2 / 30 | text links with arrows, no filled buttons |
| Hairlines | 0 / 5 / 15 | few |
| Content width | 1200 / 1200 / 1300 | edge to edge with 40px margins |
| Menu | about, works, contact, archive, instagram, careers | the same, in English or Korean |

## Tokens

```css
--ground:#0a0a0a; --ground-2:#141414; --paper:#ffffff; --on-dark:#f5f5f5; --on-dark-soft:#8a8a8a; --ink:#0a0a0a; --line:rgba(255,255,255,.14);
--text:"Pretendard","Pretendard Variable",sans-serif; --latin:"Inter",sans-serif;
--body:16px; --leading:1.7; --display-size:64px; --word-size:clamp(72px,12vw,180px); --h3:20px; --track:-0.03em;
--radius:0; --margin:40px;
```

## Skeleton (in order)

1. **Header**: studio name left in Inter 500, menu right (Works · About · Contact), small, white.
2. **Statement**: one sentence of what the studio does at 64px across the full width, or the studio's wordmark at 180px; a small line of services under it.
3. **Featured work** (the trade component): one project full-width (16:9 image or video still), client and project name, year, discipline, a "Case →" link.
4. **Works grid**: two columns of large project images with uneven heights (one tall, one wide), each with a caption line (client — project — year) under it; hover lifts the caption.
5. **Clients**: a plain list of client names in two or three columns, soft grey.
6. **About** (one white section): a short paragraph about the studio, team size, location, three disciplines as a list.
7. **News / journal**: three text rows with date and title.
8. **Contact**: a large email link at 48px, address, Instagram and Behance as text links.
9. **Footer**: copyright line only.

## Rules

- The work carries the page: images as large as the layout allows, never cropped into small cards.
- Black and white only; colour comes from the work.
- No filled buttons; links are text with an arrow.

## Avoid

- Neon accents, glowing gradients, cursor-follow effects that hide content, autoplaying sound.

## Effects (optional)

Measured on 40 Korean dark cinematic sites of all families (`data/motion/summary.json`, November 2026): hero slides 40%, hero video 33%, scroll reveals 17%, a blurred fixed header 5%, a marquee 3%, a loading intro 0% (parallax 7%, not built). How to add them: `../effects/README.md`.

- **Offer** when the client has the material: `hero-slides`, `hero-video`.
- **Only when the client asks**: `reveal`, `header-blur`.
- **Not for this theme**: `marquee`, `intro`.
- One moving hero: video *or* slides, never both.

## Applying to a client's content

See `../README.md`. Without photographs that can be shown large this theme does not hold; ask for the portfolio first, and use the client's studio or project photographs when the home page has no work images. Game studios lead with the game's key art and a trailer link.

Learned on a real product-photo studio (몽상뷰 M.S.V STUDIO, 21 November 2026): the home page had no work images, only 2000px photographs of the studio, mostly bright. Large, the bright space photographs held on the black ground; what the theme needs is photographs that can be shown large, not dark ones.

- **No work images on the home page**: the twelve portfolio categories become a large two-column index (Inter, 24–40px) linking to the client's category pages.
- **The studio space** goes in a quiet three-column mosaic; the photographer's portrait and career list sit in the white About section with the process steps.
- **A long client list** (160 names in seven groups) stays complete: grouped columns, the lead group larger, the figures (200+, 95%) at the display size.
