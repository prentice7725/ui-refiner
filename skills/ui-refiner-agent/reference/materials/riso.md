---
name: Riso
slug: riso
tones: bold, warm
kinds: media, public, place, studio, software
ground: white
accent: indigo
latin: Syne + Epilogue
ko: Black Han Sans + Gothic A1
ja: Murecho + Murecho
brief: a two-colour risograph print: indigo and coral ink on uncoated white paper, flat shapes that overprint, halftone dots, slightly off register
---

# Riso

A risograph print from a community print room: two inks, indigo and coral, on uncoated white paper. Where they overlap they make a third, darker colour. Tints are halftone dots, not transparency. The second ink sits a hair off the first. It suits campaigns, events, zines, community groups, small shops and playful products. There is no black on the page: the darkest thing is indigo.

## Tokens

```css
:root {
  --ground: #ffffff; --indigo: #3d3bd1; --indigo-deep: #24228f; --coral: #ff6b57; --coral-soft: #ffb3a8;
  --ink: #24228f; --muted: #55549e;
  --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .07 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  --dots-indigo: radial-gradient(circle at center, var(--indigo) 0 34%, transparent 36%) 0 0 / 7px 7px;
  --dots-coral: radial-gradient(circle at center, var(--coral) 0 34%, transparent 36%) 0 0 / 7px 7px;
  --off: 4px; --radius-control: 0px;
}
```

All text is `--ink` on white or white on `--indigo`. Coral is for shapes, underlines and one word-sized mark; text on coral is `--ink` at 24px or larger only.

## Type

- Display: the heaviest weight (Syne 800, Black Han Sans, Murecho 900), line height 1.0, set very large, in `--indigo`. The main heading carries the off-register second ink: `text-shadow: var(--off) var(--off) 0 var(--coral)`.
- Text: weight 400 and 600, 17px, line height 1.55 (1.8 on Japanese and Korean pages), in `--ink`.
- Figures: display face, tabular.

## Surfaces

- The paper: white with `--grain` over the whole page (`background-image` on `body`).
- Shapes are the material: big flat circles, half circles, bars and quarter rounds in one ink each, set with `mix-blend-mode: multiply` so indigo over coral turns deep plum. Two or three shapes per screen, large (a third of the screen or more), cropped by the container edge.
- A tint is always halftone: `--dots-indigo` or `--dots-coral` as the background of a block. Never a pale flat fill, never opacity.
- Blocks have square corners and no shadow. A block is outlined by a 3px `--indigo` line or filled solid.
- The hero is type-led: the claim at poster size on the left or across, shapes overprinting behind and beside it, the main button on the paper. A photo, when there is one, is a duotone inside a circle or a square block.
- One section per page may flood the ground `--indigo` with white text and coral shapes.

## Controls

- Main button: filled `--indigo`, white text weight 700, 56px, square corners, with a `var(--off) var(--off) 0 var(--coral)` hard shadow. Pressed, it moves onto its shadow.
- Second button: white with a 3px `--indigo` border and no shadow.
- Links are `--ink` with a 3px coral underline. Inputs are white with a 3px `--indigo` border.
- Focus: a 3px `--indigo-deep` outline offset 4px.

## Range

- A date, a price or a count as a poster: the figure in display type inside a coral circle that overprints an indigo bar.
- A programme or a list as rows separated by 3px indigo lines, the time or number in display type at the left.
- Three facts as three shapes of different kinds (a circle, a bar, a half round), each holding one line.
- A statement on the indigo flood.

## Photos

Duotone only: `filter: grayscale(1) contrast(1.15)` on the image, an `--indigo` layer over it with `mix-blend-mode: screen`, and `--dots-indigo` at 25% on top. Never natural colour.

## Never

Black or grey text, soft shadows, rounded cards, gradients, opacity tints, a third ink, more than three shapes on a screen, shapes used as small decorations or bullets, the off-register shadow on body text.
