---
name: Signage
slug: signage
tones: technical, bold
kinds: public, service, company, media
ground: white
accent: green
latin: Public Sans + Public Sans
ko: Noto Sans KR + Noto Sans KR
ja: Noto Sans JP + Noto Sans JP
brief: station wayfinding: solid green line bands with white lettering, numbered roundels, arrows and a yellow platform-edge strip on plain white
---

# Signage

The signs of a railway station: a solid band in the line's colour with white lettering, a roundel with the line number, an arrow, the name of the next stop, and the yellow strip along the platform edge. Everything is made to be read at a walk. It suits public bodies, transport, logistics, large companies and anything with steps, routes or departments. It is loud through size and flat colour, never through decoration.

## Tokens

```css
:root {
  --ground: #ffffff; --line: #00843d; --line-deep: #00602c; --ink: #101412; --muted: #4c5450; --rule: #d5dad7;
  --yellow: #ffd200; --band: 88px; --radius-control: 4px; --roundel: 56px;
}
```

`--line` fills bands and roundels, with white text. Body text is `--ink` on white. `--yellow` is the platform strip and the focus ring, never a fill behind text.

## Type

- Display: weight 800, sentence case, line height 1.05, in `--ink` on white or white on a band.
- Text: weight 400 and 600, 18px, line height 1.5 (1.8 on Japanese and Korean pages).
- Band text: weight 700, 28 to 40px, one line. Figures are tabular. On Korean and Japanese pages a band may carry the Latin name beneath at half size, as stations do.

## Surfaces

- A band: full container width, `--band` high (taller for a heading band), filled `--line`, square corners, no shadow. It holds a roundel at the left, one line of white text, and an arrow or a figure at the right.
- A roundel: a `--roundel` circle, white with a 5px `--line` ring and an `--ink` figure, or filled `--line` with a white figure. It numbers steps, departments, routes, platforms.
- The station strip: a white bar with a 6px `--line` line through its middle, the current item in a white box with a 3px `--line` border at the centre, the previous and next items left and right in `--muted` with arrows. Use it between sections of a process or as the page's sub-navigation.
- Arrows are thick (5px stroke), square-capped, `--ink` or white.
- The platform strip: a 10px `--yellow` line across the container with a row of small dots embossed along it (`radial-gradient` dots, 6px apart). One per screen, under the hero or above the footer.
- The hero is one heading band or a full white panel with the claim, a row of two or three bands beneath as the main routes into the page, and the platform strip.

## Controls

- Main button: filled `--line`, white text weight 700, 56px, `--radius-control`, with an arrow at the right. Hover: `--line-deep`.
- Second button: white with a 3px `--ink` border.
- Links in text are `--line-deep`, underlined. Inputs are white with a 2px `--ink` border, 56px.
- Focus: a 4px `--yellow` outline with a 2px `--ink` line outside it.

## Range

- Departments or services as a stack of bands, each with a roundel, a name and where it leads.
- A process as the station strip, one stop per step, with the detail of the current stop beneath.
- Hours or a timetable as a departures board: white rows on `--ink`, tabular figures, the next one first.
- A map or a route as one horizontal line with roundels.

## Rhythm

- Bands lead and then stop: one heading band or band stack in the hero, one stack of bands for the main routes, and the departures board once. In the round-18 pilot the judge liked the system and found the numbered green bars repetitive further down.
- Other sections have a plain `--ink` heading on white with a roundel beside it at most, and text beneath.
- The station strip appears once, the platform strip once per screen.

## Photos

Natural colour, full container width, 21:9, with a band laid along the foot carrying the caption.

## Never

Gradients, rounded cards, shadows, bands in a second hue on the same page, yellow fills behind text, icons in circles that are not roundels, a band that holds a paragraph, the dark departures board as the page ground.
