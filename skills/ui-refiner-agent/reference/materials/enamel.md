---
name: Enamel
slug: enamel
tones: calm, warm
kinds: service, public, place, company
ground: white
accent: blue
latin: Figtree + Figtree
ko: Sunflower + Noto Sans KR
ja: Zen Kaku Gothic New + Zen Kaku Gothic New
brief: white enamel sign plates with a cobalt rim, like a pharmacy sign or a house number; glossy, exact, one red mark
---

# Enamel

A vitreous enamel sign: glossy white fired onto steel, a cobalt rim, cobalt lettering, a screw hole in each corner. It is what a pharmacy, a clinic door or a street corner used before plastic. It reads as clean and permanent without being cold. It is not a blue SaaS page: the blue is a rim and lettering on white plates, never a wash, a gradient or a tinted panel.

## Tokens

```css
:root {
  --ground: #ffffff; --plate: #ffffff; --plate-shade: #eef2f8;
  --cobalt: #1746a2; --cobalt-deep: #0f2f73; --ink: #0f1f3d; --muted: #51607a; --rule: #c9d3e6;
  --red: #c8281e;
  --rim: 3px; --radius-plate: 18px; --radius-control: 999px;
  --gloss: linear-gradient(135deg, rgba(255,255,255,.9) 0%, rgba(255,255,255,0) 38%);
  --shadow-plate: 0 1px 0 #fff inset, 0 2px 0 rgba(15,47,115,.18), 0 14px 28px -18px rgba(15,47,115,.45);
}
```

Cobalt does the rims, the lettering of headings and the main button. Red appears once per screen at most: the cross, the "open now" dot or one figure. Body text is `--ink`.

## Type

- Display: weight 800, sentence case, tight line height (1.05), set in `--cobalt-deep`. Figures are lining and tabular.
- Text: weight 400 and 600, 17px, line height 1.55 (1.8 on Japanese and Korean pages).
- Labels on plates: weight 700, one step smaller than text, never tracked.

## Surfaces

- A plate is the only container: white, `--rim` solid cobalt border, `--radius-plate`, a second 1px cobalt line 5px inside the rim (an inset `box-shadow` or an `::after` border), `--gloss` across the top-left corner and `--shadow-plate` below.
- The hero plate carries four screw holes: 8px circles with a 2px `--muted` ring, 14px in from each corner. Only the hero plate has them.
- An inverse plate is filled `--cobalt` with white lettering and a white inner line. Use it for one statement or one notice per page.
- Number plates: small square plates (88 to 120px) holding one big figure and one word, set in a row like house numbers. Use them for hours, room numbers, steps or prices.
- The page ground stays plain white. Sections are separated by space and by a 1px `--rule`, never by tinted bands.

## Controls

- Main button: an oval plate, filled `--cobalt`, white text weight 700, 52px high, with a 1.5px white line 4px inside the edge. It darkens to `--cobalt-deep` on hover and loses its lower shadow when pressed.
- Second button: a white oval plate with the cobalt rim and cobalt text.
- Links are cobalt with a 2px underline 3px below the text. Inputs are white, 52px, with a 2px cobalt border and 12px radius.
- Focus: a 3px `--red` outline offset 3px.

## Range

- Hours as a row of number plates, one per day, today's plate inverse.
- Services as a column of long plates, each with its name left and its fact (price, minutes, doctor) right.
- One notice as an inverse plate across the full container.
- Directions as a street-sign plate: the street name large, the building and floor beneath.

## Photos

Natural colour, slightly cooler, inside a plate with the rim; never full-bleed behind text. Good subjects are the door, the counter, the treatment room, the street front.

## Never

A blue gradient, a tinted blue panel, a dark blue hero, drop shadows wider than the plate shadow, icons in tinted circles, more than one red mark per screen.
