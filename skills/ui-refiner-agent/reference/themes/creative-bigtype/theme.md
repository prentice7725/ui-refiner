# 大きな文字 · スタジオ (creative, big type; measured in Japan)

For design offices, web and video production companies, photo studios and architects: studios that show their work and want to be asked for the next job. The page is white and long, and its section heads are single English words set very large (Works, Service, About), each with a small Japanese label. Between them, the work does the talking. Measured on Japanese sites; it serves the same trades on a Korean page too (`ui-refiner theme starter creative-bigtype --lang ko`).

## Measured basis

36 human-made Japanese sites in the creative family that fall in the big-type archetype (design 50%, photo and video 28%, architecture 11%, game 8%, illustration 3%), measured November 2026 (`archetypes/spec-JP-creative-5.json`). The Japanese creative family has 234 sites after a third collection of 81 studios on 21 November 2026. Across the family no archetype leads clearly (standard corporate 16%, dense portal, photo-led and big type 15% each). Among the 181 design, photo and architecture studios, standard corporate (34) and big type (32) are level, and big type leads among design and photo studios (28 to 22). A third of the dense-portal sites are game companies' portals. This theme replaced `jp-creative-colour` (bold colour, 7 sites) after the second collection.

Which studios take which theme: a design, photo or video studio that shows its work takes this theme; a studio whose site reads as a company (web production firms, house designers, family photo studios with many branches) is closer to `business-corporate-message`; architects lean photo-led (14 of 51) as much as standard corporate (12).

| What | Measured (p25 / median / p75) | Theme value |
|---|---|---|
| Display | 100 / 120 / 160 px; display ÷ body 6.7 / 8.0 / 10.8 | English section words at `clamp(64px, 11vw, 160px)` / 600 |
| h1 / h2 | h1 14 / 16 / 18 px (the Japanese label), h2 16 / 30 / 44 px | Japanese label 14px beside the word; h3 22px |
| Hero | full-bleed on 58%; claim left 56% | full-bleed photograph, English claim lower left |
| Ground | white on 81%; warm off-whites (#f7f6f0, #f1ece8) | `#ffffff`, band `#f6f4ef` |
| Faces | Noto Sans JP 33% of body faces, Yu Gothic, YakuHanJP; Montserrat, DM Sans, Manrope for Latin; serif 17% | Noto Sans JP; Manrope for the English words |
| Body | 14 / 16 / 16 px | 16px, line height 1.9 |
| Text | #000, #333; headings white on photos 19% | ink `#1b1b1b`, soft `#6b6b6b` |
| Buttons | white 42% (outlined), black 19%, grey, teal; radius 0 / 4 / 78; 48 / 64 / 71px tall | outlined black, 0 radius, 60px; one vermilion accent `#e8471c` |
| Boxes | radius 0 | 0 |
| Hairlines | 5 / 18 / 37 | few: news rows, service rows |
| Photographs | 15 / 25 / 50 | 12–16 (the work) |
| Content width | 1150 / 1200 / 1280 | 1200px |
| Page length | 11.8 / 13.4 / 17.1 screens | as long as the work shown; the sample, with six works, is 8 screens |
| Menu | 制作実績, 採用情報, お問い合わせ, 会社情報, works, service, company, recruit, blog | English words with small Japanese, or the reverse |

## Tokens

```css
--ground:#ffffff; --band:#f6f4ef; --ink:#1b1b1b; --ink-soft:#6b6b6b; --line:#e2e0da; --accent:#e8471c;
--text:"Noto Sans JP","Hiragino Sans","Yu Gothic",sans-serif; --latin:"Manrope","Noto Sans JP",sans-serif;
--body:16px; --leading:1.9; --word:clamp(64px,11vw,160px); --claim:clamp(48px,8vw,120px); --h3:22px;
--radius:0; --button-h:60px; --content:1200px; --gap:clamp(96px,12vw,168px);
```

## Skeleton (in order)

1. **Header**: logo left, English menu words with small Japanese under each (Works 制作実績 …), an outlined お問い合わせ button right; transparent over the hero, white once scrolled.
2. **Hero**: full-bleed photograph of one piece of work (or the studio's own object), 90vh. The English claim in two or three short words at `--claim`, lower left; one Japanese line under it. When the photograph is a single object on a white sweep (`.hero--object`), it takes the right 62% and the claim sits on the same white at the left, never over the object; on phones the object sits above the claim.
3. **News**: right under the hero, a narrow strip: "News" at 20px, three rows of date and title, 一覧へ.
4. **Works** (the trade component): the word "Works" at `--word` with 制作実績 beside it; a three-column grid of six projects (4:3 photograph, client, project name, category tags as small outlined labels); 「制作実績をもっと見る」 as an outlined button.
5. **Service**: the word "Service"; three to four numbered rows on hairlines (01 Branding / ブランディング, a two-line description and what is included at the right).
6. **About / message**: the word "About"; a Japanese statement in 32–40px over two or three lines and a short paragraph; a photograph of the team or the studio beside it.
7. **Voice / client**: one client's photograph and a quote, with the project it came from.
8. **Clients**: 主なお取引先 as a quiet grid of names (or grey logos).
9. **Recruit**: a band with a team photograph, the word "Recruit" and an outlined button.
10. **Contact**: the word "Contact" across the width as one large link, with a phone line and a form link under it.
11. **Footer**: logo, address, menu, SNS, copyright.

## Rules

- The English section words are the type; everything else stays quiet: 16px body, few lines, no boxes or shadows.
- One accent colour, used only on small things (the current menu item, the arrow in buttons, a dot before News); the work brings its own colours.
- Section words are set left and never centred; the Japanese label sits beside them on desktop and under them on phones.
- Generous space: `--gap` between sections. The measured pages are long (13 screens at the median) because they show many works; with few works, keep the space and let the page be shorter rather than padding it.

## Avoid

- Mascots, gradient backgrounds, rounded cards with shadows, coloured section bands one after another (that is the bold-colour archetype).
- More than one English word per head; English sentences as claims longer than three words.
- Splitting the English word across lines on phones: `--word` scales down with the viewport, and long words get `overflow-wrap: anywhere` only as the last resort.

## Effects (optional)

Measured on 40 Japanese big type sites of all families (`data/motion/summary.json`, November 2026): hero slides 55%, hero video 28%, scroll reveals 33%, a blurred fixed header 13%, a marquee 15%, a loading intro 7% (parallax 3%, not built). How to add them: `../effects/README.md`.

- **Offer** when the client has the material: `hero-slides`, `hero-video`, `reveal`.
- **Only when the client asks**: `header-blur`, `marquee`, `intro`.
- One moving hero: video *or* slides, never both.

## Applying to a client's content

See `../README.md`. Architects show a project list with place and year instead of category tags; video production companies replace the hero photograph with a muted, paused-on-request video poster. Studios without client photographs keep the Works grid to the projects they can show; never fill it with generated mock-ups presented as real clients.

Learned on a real architecture firm (交建設計, stations and commercial buildings, 21 November 2026):

- **No slogan on the client's page**: the claim is the firm's English name (KOKEN ARCHITECTS); no English claim is invented.
- **A night photograph** in the hero: the header moves onto white above the hero and the claim turns white over a dark gradient.
- **Work names come from the work pages** when the home page shows images only; the category tag is the client's own URL category (Station, Commercial …).
- **Seven large works** (the client's slider) two a row with the first across the width, then the rest three a row.
- **Dates and numbers keep the client's format** (2026年11月19日, not 2026.11.19); `keep check` reads a changed format as a lost fact.
- **An 800px recruit photograph** sits beside the text at its own size instead of filling the recruit band.
