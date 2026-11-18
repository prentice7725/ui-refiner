# Turn a refined page up or down

Use this after a direction has been applied, when the person wants the same page **bolder** or **quieter**: "B, but a little bolder", "the pricing section is too loud". It is not a new direction. The page's ground, colours, faces and surfaces are already decided (`DESIGN_SYSTEM.md`); this changes how strongly they are used, and where.

The idea of steering a finished design by strength, and of scoping it to one named part, follows Impeccable's `bolder` and `quieter` commands (pbakaus/impeccable, Apache-2.0).

## Before you change anything

- **Name the target.** The whole page, or the one section the person named. Everything outside the target stays exactly as it is.
- **Record what must survive** if there is no record yet: `ui-refiner keep record <page>`.
- **Read the page's direction**: its lane file (familiar, tailored or bold, from `refine-directions/PICK.json` when the folder is still there), the material's file for a bold page, and `DESIGN_SYSTEM.md`.
- **Look at the screenshots first** and say in one line why the target reads flat, or loud. Change that cause, not the whole target.

## Bolder

A target reads flat when it does less than the rest of the page already does: the display face at half strength, the accent used timidly, the signature element small, the photograph cropped into a box. Bolder brings it up to what the page already owns.

- **Use what the page has, at full strength.** The display face larger or heavier, the accent over a larger area in one place, the signature element at the size its content can carry, the photograph wider or full-bleed, a material's own surface where it is strongest.
- **Add nothing from outside.** No new colour, no new face, no gradient, glow, shadow or motion the direction does not already have. In benchmark round 15, colours handed to a page from outside its subject made eight pages differ and made each one worse.
- **One move, made completely.** Then quiet what is around it, so the move can be read. When everything gets louder, the page gets flatter.
- **By direction:**
  - *familiar*: stay plain. A larger photograph, a headline at the upper end of what human-made sites use (nine in ten of the sites measured keep the largest text under about 4.3 times the body in Japan and 5 times in Korea; when the deal carried `measured` figures for the trade, stay near them), more room around the main action. Not a second colour.
  - *tailored*: push the display face and the signature element, the two things this direction is built on.
  - *bold*: bring the material's own surfaces to full strength in the first screen and in one other place, as its Rhythm section allows. Not in every section.
- **Test the structure without the words.** If the target only works once the copy is back, the boldness is in the type size and not in the design.

## Quieter

A target reads loud when too many things are strong at once. Quieter means fewer strong things, not everything weaker.

- **Reduce the count before the strength.** Fewer places where the accent appears, fewer weights and sizes, fewer boxed surfaces, fewer sections that carry a material's surface.
- **Keep one thing at full strength**: the claim, or the signature element. A page with nothing strong is the plain page the refine set out to replace (in benchmark round 1 the score reached 0 and the pages were called plain).
- **Take out decoration before content.** Nothing the page says is removed: every fact, figure, link and field stays.
- **By direction:**
  - *familiar*: it is already the quiet one. Remove what is left of decoration and give the content more room.
  - *tailored*: the accent on the main action only; the signature element stays.
  - *bold*: the material's surface in the first screen only, the rest of the page on its plain ground. If the person wants it quieter than that, say that the tailored direction is the better fit and offer to switch.

## Afterwards

- Run `ui-refiner keep check <page>`. Nothing may be lost.
- Run `ui-refiner system extract <page>` again and compare `DESIGN_SYSTEM.md` with the one from before: the faces, colours and box radius are the same; only sizes and widths may differ. If a face or a colour changed, you added something from outside: take it back.
- Look at the screenshots at both widths (1440 and 390) before anything else. Nothing you made larger runs past its own column, box or bar, wraps onto a line it did not have, or pushes the main action below the fold. In the first run of this step, amounts set larger ran past the narrowest segment of the bar they belonged to. Where something no longer fits, give it room (stack it, shorten the row, let the container grow); do not shrink it back.
- Rescan into the same folder. No new scored signal, and no quality issue or Japanese typesetting issue that got worse.
- If the site has other pages built from the system, run `ui-refiner system check <page…>` and bring them along where sizes changed.
- Report each move in one line: what was turned up or down, where, and what was left alone.
