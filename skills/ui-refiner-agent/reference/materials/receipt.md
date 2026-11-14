---
name: Receipt
slug: receipt
tones: technical, calm
kinds: software, service, media
ground: tint
accent: red
photo: rare
latin: Spline Sans + Spline Sans
ko: IBM Plex Sans KR + IBM Plex Sans KR
ja: IBM Plex Sans JP + IBM Plex Sans JP
brief: white thermal-paper slips with a torn edge on a cool grey counter, monospaced figures, dashed rules and one red ink stamp
---

# Receipt

A till receipt on a shop counter: narrow white thermal paper, a serrated tear at the foot, grey-black print, dashed lines between the parts, the total set larger, and a red ink stamp pressed on at an angle. It suits anything that counts: money, parcels, bookings, usage. It is exact and a little dry, and the stamp is the only loud thing.

## Tokens

```css
:root {
  --ground: #e9ecef; --paper: #ffffff; --print: #1c1d21; --faded: #62666f; --dash: #b9bdc6;
  --stamp: #d9411e;
  --font-mono: "Spline Sans Mono", "IBM Plex Mono", ui-monospace, monospace;
  --slip: 380px; --radius-control: 6px;
  --tear: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 14px 100%;
  --shadow-slip: 0 1px 1px rgba(28,29,33,.10), 0 18px 30px -20px rgba(28,29,33,.45);
}
```

Print is `--print`; secondary lines are `--faded`. `--stamp` is used for the stamp and for nothing else except the focus ring. Load a mono face that matches the page's text face (Spline Sans Mono, or IBM Plex Mono on Korean and Japanese pages).

## Type

- Display: weight 600, sentence case, line height 1.1, in `--print`, on the counter ground beside the slip.
- Text: weight 400 and 500, 16px, line height 1.55 (1.8 on Japanese and Korean pages).
- On a slip, every figure, date, time and code is `--font-mono`, right-aligned in its row; names and labels are the text face. The total is mono at 1.6 times the row size, weight 600.

## Surfaces

- The page ground is the counter: flat `--ground`, no texture.
- A slip is white paper, `--slip` wide (wider slips are allowed up to 560px, never full width), no border, square top corners, `--shadow-slip`, and the foot cut by `mask: var(--tear)` on a 10px strip so it ends in a row of small teeth.
- Inside a slip: a header (the client's name, the date), rows of name left and figure right, `1px dashed var(--dash)` between groups, the total after a double dashed line.
- The stamp: a 96px ring, `3px solid var(--stamp)`, stamp-coloured text weight 700 in two short lines (a status and a date), rotated -8 degrees, `mix-blend-mode: multiply`, opacity .85. One per slip at most, one per screen.
- The hero holds one slip, upright, beside the claim. Only one slip per page may be rotated, by 1.5 degrees at most.
- Long content (features, a comparison) is a row of two or three slips of different lengths, hanging from one top line.

## Controls

- Main button: filled `--print`, white text weight 600, 52px, `--radius-control`.
- Second button: `--paper` fill with a 1.5px `--print` border.
- Inputs are white, 52px, 1.5px `--print` border; their values are mono.
- Links are `--print` with a dashed underline. Focus: a 3px `--stamp` outline offset 2px.

## Range

- The signature as one real receipt: this client's own rows and total, stamped.
- A comparison as two slips side by side, the totals on one line.
- A timeline as one long slip with dashed breaks, the time in mono down the left.
- A price as a short slip: one row, one total, the stamp.

## Photos

Rare. When used, greyscale, on a slip above its header, 4:3.

## Never

A barcode or a QR code that encodes nothing, invented totals, cream or yellowed paper, a slip wider than 560px, coloured rows, rounded slip corners, more than one stamp on a screen, mono for running text.
