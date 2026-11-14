---
name: Tile
slug: tile
tones: calm, warm
kinds: place, service, public
ground: white
accent: teal
latin: Albert Sans + Albert Sans
ko: Noto Sans KR + Noto Sans KR
ja: Zen Maru Gothic + Zen Maru Gothic
brief: a wall of glazed square tiles with grout lines, one sea-green glaze and one yellow tile, like a neighbourhood bathhouse or a swimming pool
---

# Tile

A tiled wall: small glazed squares, pale grout between them, light catching the top-left edge of each one. Most tiles are white, a course of them is sea-green, and one is yellow. It is the wall of a bathhouse, a swimming pool, a fishmonger or an old clinic corridor. It is friendly because it is plain and washable. Everything on the page sits on the tile grid.

## Tokens

```css
:root {
  --ground: #ffffff; --grout: #dbe4e2; --tile: #ffffff; --tile-shade: #f1f6f5;
  --glaze: #0f7f78; --glaze-light: #17a39a; --glaze-deep: #0a5c57; --yellow: #f2c230;
  --ink: #12302e; --muted: #4f6664;
  --cell: 96px; --gap: 3px; --radius-tile: 4px;
  --glaze-light-edge: linear-gradient(135deg, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 30%);
  --glaze-foot: inset 0 -3px 0 rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.7);
}
```

The glaze colour covers whole tiles or nothing. White text on `--glaze`, `--ink` on white tiles and on yellow. The yellow tile appears once per screen.

## Type

- Display: weight 700, sentence case, line height 1.1, in `--ink`.
- Text: weight 400 and 600, 17px, line height 1.55 (1.8 on Japanese and Korean pages).
- Figures inside tiles: weight 700, tabular, sized to fill about half the tile.

## Surfaces

- The tile grid: a CSS grid of `--cell` squares with `--gap` between them on a `--grout` backing, so the grout shows as thin lines. Every tile has `--radius-tile`, `--glaze-light-edge` on top and `--glaze-foot`.
- The hero is a wall: the grid runs the full container width, at least four rows high. A course of glazed tiles runs along its lower third. The claim and the main button sit on one large white tile spanning several cells; a photo or the signature element sits on another.
- Large tiles span whole cells (2×1, 3×2, 4×3). Nothing sits between cells or overlaps a grout line.
- Below the hero the grout backing stops. Sections sit on plain white, each opened by a single course of tiles (one row, full width, one or two glazed).
- A wet-floor shadow is the only shadow: none on tiles; the wall as a whole casts `0 24px 40px -30px rgba(10,92,87,.5)`.

## Controls

- Main button: one glazed tile, 56px high, `--radius-tile`, white text weight 700. Pressed, it loses the light edge and gains `inset 0 3px 0 rgba(0,0,0,.18)`.
- Second button: a white tile with a 2px `--glaze` border and glaze-coloured text.
- Choices (days, sizes, times) are tiles in a row: white when off, glazed when on.
- Links are `--glaze-deep` with an underline. Focus: a 3px `--yellow` outline with a 2px `--ink` line outside it.

## Range

- A timetable as a mosaic: one tile per hour or day, glazed when open, white when closed, today's tile yellow.
- Steps as a row of numbered tiles with the text beneath each.
- A price list on white with a glazed header course.
- One statement set large on a full course of glazed tiles, three rows high.

## Photos

Natural colour inside tiles that span whole cells, with the same radius. A photo may be cut by the grout into a grid of tiles once per page (the hero).

## Never

Rounded cards, pill shapes, soft drop shadows under tiles, a teal gradient band, tiles tilted or scattered, more than two glaze colours, text crossing a grout line.
