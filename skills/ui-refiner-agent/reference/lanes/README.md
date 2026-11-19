# The three directions

A refine offers three directions, each built from a different source so that they start apart:

| | Lane | Built from | Reads as |
|---|---|---|---|
| A | [familiar](familiar.md) | what human-made sites of this kind do, as measured | a real site of its kind; the least surprising |
| B | [tailored](tailored.md) | this client's own content: its facts decide colour, type and look | made for this client |
| C | [bold](bold.md) | one material, a finished look taken from a physical thing | the most distinctive; people split on it |

`ui-refiner directions deal` gives each a hero structure and what else its lane needs. Each direction is built by its own subagent, which reads this file and its own lane file and nothing about the other two. Through benchmark round 17 the three were built from one set of guidance and came out alike; in the round-18 pilot, three subagents that could not see each other still chose the same world and the same typefaces, because they had read the same thing.

## What every mock needs

You are building one mock: the first screen plus one content section, in the file you were given (`refine-directions/a.html`, `b.html` or `c.html`). Do not touch the page itself, do not build the other mocks, and do not run `ui-refiner directions`.

- **Read the page first.** Everything on the mock comes from it: the facts, the figures, the names, the links. Never invent a number, a quote, a customer, a logo or a photo, and never round or update a figure.
- **Build in the dealt hero structure.** It is in your entry of `DEAL.json` (`key` and `brief`).
- **The first screen at 1440×900 says what this is in one line and shows the main action.** There is exactly one filled button. On a first screen without photos, no other text is larger than that line.
- **Write that line from a fact only this client has**: an hour, a condition, a number, a place, how it started. If the line would fit a rival unchanged, it is not written yet.
- **One main piece carries the first screen**: a photograph, a product scene or the signature element, at a size that lets it breathe. Do not stack a photo, a schedule, three cards and two buttons into one screen.
- **Show something real.**
  - Places, services, clinics, shops and public bodies: the client's own photos first. Without them, use the credited stand-ins in `assets/stand-in/` when the folder exists; build each from its `img` line in `credits.json` (WebP with `srcset`; set `sizes`, and `fetchpriority="high"` on the first-screen photo), mark each `data-stand-in`, give it a generic alt ("a dental chair", never "our clinic") and keep the credit line in the footer. Use a stand-in only when it shows this kind of place or this work itself; an object any office has reads as stock. Without a fitting photo, use none.
  - Software, finance and logistics: show the product as a person would use it. One scene that proves the line, built in code with this client's data, its outer element marked `data-product-shot`, a quarter of the first screen or more, text 12px or larger, 40 pieces of text at most. Never a drawn phone, a floating-card collage or a dark dashboard of metric cards.
- **One signature element**: something only this client would have, built from the page's real content. Its form follows from that content.
- **Leave out the faces the deal lists to avoid** (`avoidFaces` in `DEAL.json`).
- **Japanese and Korean pages**: name a real Japanese or Korean family, set body text at a line height of 1.6 or more, and do not letter-space or italicise Japanese or Korean text.
- **Start the file with the direction note**, one HTML comment: `<!-- direction: what this is, in the client's words | … -->`. Your lane file says which other lines it needs.

When the mock is written, stop and reply with the file name and one line on the direction.
