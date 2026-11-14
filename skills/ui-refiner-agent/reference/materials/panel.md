---
name: Panel
slug: panel
tones: technical
kinds: software, company, studio, service
ground: tint
accent: amber
photo: rare
latin: Barlow + Barlow
ko: Gothic A1 + Gothic A1
ja: Zen Kaku Gothic Antique + Zen Kaku Gothic Antique
brief: a brushed aluminium instrument panel: engraved black labels, recessed displays with amber readings, round indicator lamps and machine screws
---

# Panel

The front of a lab instrument or a mixing desk: a sheet of brushed aluminium, labels engraved and filled black, a recessed dark window where the readings glow amber, a lamp that is on or off, a screw at each corner. It suits tools for engineers and operators, hardware, monitoring, audio, measurement. It is light, not dark: the metal is the page, and only the small displays are dark.

## Tokens

```css
:root {
  --ground: #d9dce0; --metal-light: #eceef1; --metal-shade: #c3c7cd; --ink: #16181b; --muted: #4a4f57;
  --window: #15171a; --amber: #ffab1f; --amber-dim: #7a5210; --lamp-off: #8b9099;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --brush: repeating-linear-gradient(90deg, rgba(255,255,255,.22) 0 1px, rgba(0,0,0,.035) 1px 3px);
  --radius-panel: 10px; --radius-control: 8px;
  --raise: 0 1px 0 rgba(255,255,255,.85) inset, 0 -1px 0 rgba(0,0,0,.12) inset, 0 8px 14px -8px rgba(22,24,27,.45);
  --recess: inset 0 2px 4px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,.7);
}
```

Text on the metal is `--ink`; `--muted` only at 16px or larger. Amber appears only inside a window or as a lit lamp, never as a fill, a button or text on metal.

## Type

- Display: weight 600, sentence case, line height 1.1, in `--ink`, engraved: `text-shadow: 0 1px 0 rgba(255,255,255,.7)`.
- Text: weight 400 and 600, 17px, line height 1.55 (1.8 on Japanese and Korean pages).
- Engraved labels beside controls: weight 600, 14px, sentence case, with the same 1px light edge.
- Readings: `--font-mono`, tabular, amber, 28 to 72px, inside a window only.

## Surfaces

- The page ground is the metal: `--ground` with `--brush` over it.
- A panel is a raised plate: `--metal-light` with `--brush`, `--radius-panel`, `--raise`, and a screw 14px in from each corner (a 10px circle, `--metal-shade`, with a 1px slot line). Panels sit on a strict grid with 16px between them, like rack units.
- A window is recessed into a panel: `--window`, 6px radius, `--recess`. It shows amber readings, one main figure and up to three small rows. Unlit segments may show in `--amber-dim`.
- A lamp is a 12px circle: lit, `--amber` with `0 0 0 3px rgba(255,171,31,.25)`; off, `--lamp-off`. Use lamps only for real states.
- A scale: a row of fine tick marks in `--ink` with figures every fifth tick, for ranges, limits and progress.
- The hero is one wide panel: the claim and the main button engraved on the left, one window on the right showing a single real reading with its label and a lamp. Mark it `data-product-shot` when it shows the product.

## Controls

- Main button: a raised key, `--ink` fill, white text weight 600, 54px, `--radius-control`, with `0 3px 0 #000` beneath; pressed, it drops 3px.
- Second button: a metal key, `--metal-light` with `--raise` and `--ink` text.
- Choices are a row of keys with a lamp above each. Inputs are windows: dark, amber mono text, `--recess`.
- Links are `--ink` with a 2px underline. Focus: a 3px `--ink` outline offset 3px.

## Range

- Specifications as a panel with engraved labels left and mono values right, ruled by 1px `--metal-shade` lines.
- Status as a row of lamps with labels, lit or off.
- A limit or a plan as a scale with a marker.
- Three functions as three panels of different widths in one rack row, each with one window.

## Photos

Natural colour, slightly desaturated, set into a panel like a window with `--recess`. Good subjects: the device, the bench, hands on the controls.

## Never

A dark page ground, neon green or electric blue, amber text on metal, glow effects beyond the lamp ring, glass or blur, gauges or dials that show invented readings, rounded pills, more than one window in the hero.
