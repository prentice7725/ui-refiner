---
name: Lacquer
slug: lacquer
tones: bold, warm
kinds: place, studio, company
ground: dark
accent: red
photo: required
latin: Young Serif + Hanken Grotesk
ko: Hahmlet + Noto Sans KR
ja: Shippori Mincho + Zen Kaku Gothic New
brief: black lacquerware with a vermilion inside and a fine gold line: deep gloss, slow reflections, a tray set with one thing at a time
---

# Lacquer

A lacquer tray: black polished until it reflects the room, a vermilion inside, one gold line along the rim. It belongs to restaurants, inns, tea, craft, small makers and studios that sell one thing done well. The page is dark, but it is the dark of a polished object under warm light, with large still photographs, not a dashboard. Software pages do not use it.

## Tokens

```css
:root {
  --ground: #0e0c0b; --ground-lift: #1a1614; --vermilion: #c7321f; --vermilion-deep: #9c2415;
  --gold: #c9a45c; --ink: #f4efe6; --muted: #b8ada0; --rule: rgba(201,164,92,.45);
  --sheen: linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,.07) 45%, rgba(255,255,255,0) 60%);
  --radius-tray: 22px; --radius-control: 999px;
  --shadow-tray: 0 1px 0 rgba(255,255,255,.08) inset, 0 30px 50px -30px #000;
}
```

Text is `--ink` on black and on vermilion. Gold is a line and a small figure, never a fill and never body text. Vermilion fills whole surfaces: one per screen.

## Type

- Display: the serif (Young Serif, Hahmlet 600, Shippori Mincho 600), sentence case, line height 1.15, generous size, in `--ink`. Japanese and Korean headings may be set vertically (`writing-mode: vertical-rl`) once, in the hero.
- Text: the sans, weight 400 and 500, 17px, line height 1.6 (1.9 on Japanese and Korean pages), in `--ink`; captions in `--muted`.
- Prices and dates: the serif, lining figures, with a gold 1px rule beneath.

## Surfaces

- The ground is black lacquer: `--ground` with `--sheen` laid once across the first screen, fixed, so it reads as a reflection.
- A tray is the container: `--ground-lift`, `--radius-tray`, a 1px `--gold` line 6px inside its edge, `--shadow-tray`. A tray holds one thing: one dish, one room, one price, one line.
- The inside: one tray or one full-width section per page is filled `--vermilion` with the same gold line. It carries the main statement or the booking.
- Rules are 1px `--rule`. Sections are far apart (at least 140px); the page is slow.
- The hero is one large photograph on a tray beside or under the claim, with the main button. Nothing else.

## Controls

- Main button: a vermilion pill, `--ink` text weight 600, 54px, with a 1px gold line inside its edge. Hover: `--vermilion-deep`.
- Second button: a black pill with a 1px gold border and `--ink` text.
- Links are `--ink` with a 1px gold underline. Inputs are `--ground-lift` with a 1px gold border, 54px.
- Focus: a 2px `--ink` outline offset 3px.

## Range

- A menu or a price list as rows on black: the name in the serif, a gold dotted leader, the price.
- A course, a room or a product as one tray with a photograph and three short lines.
- Hours and the address on the vermilion inside.
- One sentence in display type alone on black, with a gold rule above.

## Photos

Central to this material. Warm, low-key, slightly darkened (`filter: brightness(.92) saturate(1.05)`), on trays with the tray radius. Use real photographs of the food, the room or the object; without a fitting photograph, choose another material.

## Never

Metric cards, neon or electric accents, gradients other than the sheen, gold text in paragraphs, gold fills, more than one vermilion surface per screen, glass or blur, three equal trays in a row, a dashboard or a chart.
