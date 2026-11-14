---
name: Widget
slug: widget
tones: calm, bold
kinds: software, company
ground: white
accent: orange
photo: rare
latin: Gabarito + Onest
ko: Gothic A1 + Gothic A1
ja: M PLUS 1p + M PLUS 1p
brief: a phone home screen: big flat squircle tiles in tangerine, lilac, mint and ink on plain white, one heavy figure or one scene per tile
---

# Widget

The home screen of a phone: a few large rounded tiles in flat colour on white, each one showing a single thing in very large type. No shadows, no borders, no gradients; the colour and the size do the work. It suits consumer apps, above all money and everyday tools for younger users. It is the app's own surface brought onto the page, so it replaces the phone mockup.

## Tokens

```css
:root {
  --ground: #ffffff; --ink: #111418; --muted: #5a6068; --quiet: #f1f3f5;
  --tangerine: #ff6a2b; --lilac: #c4b5ff; --mint: #9fe8c7; --ink-tile: #111418;
  --radius-tile: 32px; --radius-control: 999px; --gap: 16px; --unit: 168px;
}
```

Text on tangerine, lilac and mint is `--ink`; on `--ink-tile` it is white. Tangerine leads: the largest tile on a screen is tangerine, and it is used once per screen. Lilac and mint are supporting tiles. `--quiet` is the tile for anything secondary.

## Type

- Display: weight 800, sentence case, line height 1.05, tight tracking (-0.02em on Latin only).
- Text: weight 400 and 600, 17px, line height 1.55 (1.8 on Japanese and Korean pages).
- Tile figures: weight 800, tabular, 56 to 120px, with the unit at half size. A tile holds one figure or one short line, a label of a few words, and nothing else.

## Surfaces

- A tile is a flat fill with `--radius-tile` and 24 to 28px padding. No border, no shadow, no gradient, no inner card.
- Tiles sit on a grid of `--unit` squares with `--gap`: 1×1, 2×1, 2×2 and 4×2. Edges line up; nothing overlaps or tilts.
- The hero is the claim and the main button on plain white, with a cluster of four to six tiles beside or below it. The cluster shows one scene from the product with this client's own content: a balance, one transfer, one goal, one alert. Mark the cluster `data-product-shot`.
- Inside a tile, small parts (a progress bar, a row, a toggle) are drawn in `--ink` at 10 to 20% opacity or in white, never in another hue.
- Sections below alternate between plain text on white and one row of tiles. A full-width `--ink-tile` band may carry one statement.

## Controls

- Main button: a pill filled `--ink`, white text weight 700, 56px high.
- Second button: a `--quiet` pill with `--ink` text.
- Choices are pills: `--quiet` when off, `--ink` when on. Inputs are `--quiet`, 56px, 16px radius, no border until focus.
- Focus: a 3px `--tangerine` outline offset 3px.

## Range

- The product as widgets: one 2×2 tangerine tile with the main figure, two 1×1 tiles with one fact each, one 2×1 ink tile with the latest event.
- Features as a row of three tiles of different sizes, each with one line and one small scene, never three equal cards.
- A comparison as two tall tiles side by side, one `--quiet`, one mint.
- A statement on the ink band in display type.

## Photos

Rare on software pages. A photo fills a whole tile, cropped to its radius.

## Never

A drawn phone or browser frame, shadows, gradients, glass or blur, outlines on tiles, icons in tinted circles, two tangerine tiles on one screen, tiles that hold a paragraph, a fourth hue.
