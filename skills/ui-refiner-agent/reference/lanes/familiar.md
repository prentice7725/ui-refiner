# Familiar

The direction a careful human studio would most likely make for a client of this kind. It is built from measurements of human-made sites (hero structures of 406 sites, colours of 548 Korean, Japanese and English sites, type on 209 Japanese sites; see `data/`), so a visitor reads it at once as a real site of its kind. It is the least surprising of the three, on purpose: it wins on fit and ease, not on being remembered.

Read [README.md](README.md) first; this file adds what is particular to this lane.

## What is dealt

- A hero structure, with the share of human-made sites of this kind that use it.
- A surface: pure white, carried by a photograph when the page has photographs.
- A colour family for the accent, drawn from what human-made sites of this kind and country use.

## How to build it

- **Ground.** Pure white (`#fff`). Not cream, not off-white, not a tint: 87% of the light first screens measured are pure white and 2% a warm cream. Sections may sit on one very light neutral band; nothing else.
- **Colour.** One accent in the dealt family, for the main action and at most one other thing. Text is near-black, secondary text a mid grey that still passes contrast. No second hue.
- **Type.** One plain, widely used family for the page's language, in two or three weights; a second family only when the client has one. Keep the scale modest. On the 209 Japanese sites measured, body text is 16px at the median (13–16px for most), the largest text is about 2.3 times the body (1.5 to 4.3 times for most) and body line height is 1.6 (1.5 to 2.0). Korean sites have not been measured for type yet; use the same range there. An English page may run larger. On a Japanese page the scan's comparison with Japanese sites (`日本のサイトとの比較`) shows where the mock sits; stay inside it.
- **Photographs.** When the page has them, the first screen is carried by one, large. Leave it as it was taken: no duotone, no heavy overlay, no rounded frame larger than the page's own radius.
- **Structure.** The sections a site of this kind really has, in the order a visitor needs them, taken from the page's content (for a clinic: what it treats, hours, the doctor, access; for a company: what it does, news, hiring). Density is normal for the country: Japanese and Korean pages carry more per screen than English ones.
- **Controls.** Rectangular buttons with a small radius (0–6px), one filled. Links are underlined or plainly coloured.
- **The signature element** is modest here: the most useful thing this client has (today's status, the next date, the one figure people come for), set plainly where the visitor needs it.

## What keeps it from reading as generated

A familiar page built by a model drifts into the generated look: three equal cards with icons, a pill badge over the headline, a strip of big figures, a tinted ground, a two-tone headline. None of those belongs here. If the scan scores a signal on your mock, remove its cause. The one exception is the plain typeface: a neutral family is right for this lane. The directions sheet does not mark this mock down for a single plain typeface, and when this direction is picked, `directions record` writes that into the project's `ui-refiner-allow.json`, so later scans report it without scoring it. Put nothing about the tool in the page itself.

## The direction note

`<!-- direction: what this is, in the client's words | signature: the one element only this client has -->`
