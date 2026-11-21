# 大きな文字 · スタジオ (Japanese creative, big type)

For Japanese design offices, web and video production companies, photo studios and architects: studios that show their work and want to be asked for the next job. The page is white and long, and its section heads are single English words set very large (Works, Service, About), each with a small Japanese label. Between them, the work does the talking.

## Measured basis

23 human-made Japanese sites in the creative family that fall in the big-type archetype (design 52%, photo and video 22%, game 13%, architecture 9%, illustration 4%), measured November 2026 (`archetypes/spec-JP-creative-5.json`). The Japanese creative family has 153 sites. Its most common archetype is the dense portal (19%), but that one is mostly game companies' portals (41% of it); among design, photo and architecture studios, big type is the most common. This theme replaced `jp-creative-colour` (bold colour, 7 sites) after the second collection.

| What | Measured (p25 / median / p75) | Theme value |
|---|---|---|
| Display | 100 / 135 / 173 px; display ÷ body 6.7 / 8.7 / 10.9 | English section words at `clamp(64px, 11vw, 160px)` / 600 |
| h1 / h2 | h1 12 / 16 / 18 px (the Japanese label), h2 16 / 32 / 50 px | Japanese label 14px beside the word; h3 22px |
| Hero | full-bleed on 65%; claim left 57% | full-bleed photograph, English claim lower left |
| Ground | white on 78%; warm off-whites (#f7f6f0, #f1ece8) | `#ffffff`, band `#f6f4ef` |
| Faces | Noto Sans JP 39–43%; Montserrat, DM Sans, Manrope for Latin; serif 22% | Noto Sans JP; Manrope for the English words |
| Body | 14 / 16 / 16 px | 16px, line height 1.9 |
| Text | #000, #333; headings white on photos 26% | ink `#1b1b1b`, soft `#6b6b6b` |
| Buttons | white 48% (outlined), black, teal, one orange (#f04b00); radius 0 / 3 / 30; 43 / 58 / 88px tall | outlined black, 0 radius, 60px; one vermilion accent `#e8471c` |
| Boxes | radius 0 | 0 |
| Hairlines | 4 / 11 / 28 | few: news rows, service rows |
| Photographs | 11 / 16 / 35 | 12–16 (the work) |
| Content width | 1150 / 1200 / 1230 | 1200px |
| Page length | 9.4 / 13.3 / 14.7 screens | as long as the work shown; the sample, with six works, is 8 screens |
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

## Applying to a client's content

See `../README.md`. Architects show a project list with place and year instead of category tags; video production companies replace the hero photograph with a muted, paused-on-request video poster. Studios without client photographs keep the Works grid to the projects they can show; never fill it with generated mock-ups presented as real clients.

Learned on a real architecture firm (交建設計, stations and commercial buildings, 21 November 2026):

- **No slogan on the client's page**: the claim is the firm's English name (KOKEN ARCHITECTS); no English claim is invented.
- **A night photograph** in the hero: the header moves onto white above the hero and the claim turns white over a dark gradient.
- **Work names come from the work pages** when the home page shows images only; the category tag is the client's own URL category (Station, Commercial …).
- **Seven large works** (the client's slider) two a row with the first across the width, then the rest three a row.
- **Dates and numbers keep the client's format** (2026年11月19日, not 2026.11.19); `keep check` reads a changed format as a lost fact.
- **An 800px recruit photograph** sits beside the text at its own size instead of filling the recruit band.
