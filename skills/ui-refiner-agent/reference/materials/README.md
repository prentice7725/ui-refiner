# Materials

A material is one finished look taken from a physical thing: an enamel sign, a tiled wall, a till receipt. It fixes the ground, the colours, the faces, the surfaces, the controls and how a photo is treated, so a page built in it has one hand behind it. It never says what the page contains or in what order: that comes from the client's content and the dealt hero structure.

`ui-refiner directions deal` picks three materials that fit the page's tone and kind and puts those picked recently for other projects last. Read the file of each dealt material before you build its mock.

## Rules for using one

- Take the tokens as written. Change a colour only for a real brand colour, and then replace the accent, not the ground.
- Build every surface and control the way the file says. A page that only borrows the palette is not in the material.
- Use the faces listed for the page's language. On Korean and Japanese pages the Latin display face still sets Latin words and figures.
- What the file lists under **Never** stays out, even when the page had it before.
- A gradient, a shadow or a tinted ground that the file calls for is deliberate. Say so when the scan reports it.

## File format

Front matter: `name`, `slug`, `tones` (calm, warm, technical, bold), `kinds` (software, service, place, public, company, studio, media), `ground` (white, tint, colour, dark), `accent` (a colour family from `data/type-pairs.json`), `latin`, `ko`, `ja` (display face + text face), optionally `photo: required` (never dealt when there are no photographs; paired with a photo-led hero structure) or `photo: rare` (paired with a structure that needs no photograph) and `brief` (one line, shown by the deal). Then the sections Tokens, Type, Surfaces, Controls, Range, Photos and Never.

## Adding one

Start from a thing you can hold or stand in front of, not from a style word. Write what it is made of, how light falls on it and how a label or a button would be made in it. Then build one first screen in it and look at the screenshot before you add the file.
