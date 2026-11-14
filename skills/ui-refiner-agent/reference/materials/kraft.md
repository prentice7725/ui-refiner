---
name: Kraft
slug: kraft
tones: warm, technical
kinds: service, place, public
ground: colour
accent: brown
latin: Chivo + Chivo
ko: Do Hyeon + Noto Sans KR
ja: BIZ UDPGothic + BIZ UDPGothic
brief: a brown shipping carton with black print, white address labels, handling marks and a strip of tape; plain, sturdy, hand-packed
---

# Kraft

A corrugated carton: brown kraft board, black print pressed straight onto it, a white address label, the handling marks (this way up, fragile, keep dry) and a strip of paper tape over the seam. It belongs to anything packed and handed over: logistics, food parcels, bakeries, market stalls, moving. The brown ground is the look; it is warm without a single decorative element.

## Tokens

```css
:root {
  --ground: #c9a377; --ground-deep: #b68d5f; --flute: rgba(60,38,14,.07);
  --ink: #1d1a16; --label: #ffffff; --label-ink: #1d1a16; --muted-on-label: #5e5a54;
  --tape: rgba(240,226,196,.82); --yellow: #ffd21f;
  --font-mono: "Chivo Mono", ui-monospace, monospace;
  --radius-label: 6px; --radius-control: 6px;
  --shadow-label: 0 1px 0 rgba(60,38,14,.25), 0 10px 18px -12px rgba(60,38,14,.55);
}
```

On the board, text is `--ink` only, 17px or larger, weight 500 or more. Smaller or lighter text goes on a white label. `--yellow` is a sticker colour, used once per screen.

## Type

- Display: weight 800 (Do Hyeon has one weight), line height 1.05, printed in `--ink` straight on the board.
- Text: weight 500 on the board, 400 on labels; 17px, line height 1.55 (1.8 on Japanese and Korean pages).
- Label data (weights, times, routes, order numbers that the page really has): `--font-mono`, tabular.

## Surfaces

- The board: `--ground` with faint corrugation, `repeating-linear-gradient(90deg, var(--flute) 0 2px, transparent 2px 9px)`. One horizontal seam may cross the page as a 2px `--ground-deep` line.
- A label is the container for anything detailed: white, `--radius-label`, `--shadow-label`, a 3px `--label-ink` bar across its top, then rows separated by 1px `--label-ink` lines like a waybill (from, to, contents, date). Labels sit square, never tilted.
- Handling marks: simple black line pictograms (two arrows up, a glass, an umbrella, a hand), 48 to 72px, printed on the board in a row. Use only the ones that are true for this client, as real information.
- Tape: a 64px band of `--tape` across the full container width with torn ends (a jagged `clip-path`), crossing behind one label. At most once per screen.
- The sticker: a round or square `--yellow` patch with `--ink` text, for one short true fact (a cut-off time, "open today").
- A section may turn the carton inside out: plain white ground with the 2px seam line, for long reading.

## Controls

- Main button: filled `--ink`, white text weight 700, 54px, `--radius-control`.
- Second button: a white label-style button with a 2px `--ink` border.
- Inputs are white with a 2px `--ink` border, 54px. Links on the board are `--ink` with a 2px underline.
- Focus: a 3px white outline with a 2px `--ink` line outside it.

## Range

- The signature as a waybill label filled with this client's own rows.
- Today's status as a row of three labels (packed, on the way, arrived), each with a time.
- Hours or a route as one long label with ruled rows.
- A statement printed large on the board between two seam lines.

## Photos

Natural colour, on a white label with a 10px white margin like a print stuck to the box. Good subjects: shelves, crates, hands packing, the van, the counter.

## Never

A barcode that encodes nothing, invented order numbers, cream or beige instead of the brown board, text under 17px on the board, tilted labels, torn-paper edges on labels, stamps in red, a gradient on the board.
