# Reviews in fresh context

The thread that built a page is its weakest reviewer: it knows why everything is the way it is. A refine has two reviews by a reviewer that did not build the page. Run each as a subagent with no inherited conversation, in the foreground, and give it only the inputs listed. If no subagent tool is available, re-read the screenshots cold, answer the same questions yourself, and write `in-thread` in the report.

The reviewer does not edit anything. It answers in one word and at most five findings, worst first, one line each. A finding names what is on the screen and where, not a rule.

## Hero review

Run it on the chosen direction's mock, before the rest of the page is built.

Inputs: the mock's desktop and mobile screenshots, the mock's direction note (its first comment), and the material file.

Prompt for the reviewer:

> You are looking at the first screen of a page that is still being built. You did not build it. Read the material file, then look at the two screenshots. First word: `ship` or `fix`. Then at most five findings, worst first. Ask:
> - Is this screen built in the material, or does it only borrow its colours? Name any surface or control that is not made the way the file says, and anything from its Never list.
> - Does the headline say something only this client could say? Would it fit a rival unchanged?
> - Is there one main piece (a photograph, a product scene or the signature element), large enough to carry the screen? Is anything competing with it?
> - Does the screen stop early over an empty band, or leave a hole beside the main piece? Does a photograph or a surface push the headline or the main button below the fold?
> - Is the main action visible, and is there exactly one filled button?
> - Does anything read as a template: a centred stack of label, headline, sentence and two buttons; three equal cards; a strip of big figures; a floating card over a blob?
> - On the mobile screenshot: does anything overflow, shrink below reading size or lose the material?
> Do not ask for content the page does not have.

Fix what is real, take the screenshots again, and score each finding yourself: resolved, partly, or not, with a reason.

## Finish review

Run it after the direction is applied to the whole page and `keep check` and `directions verify` pass.

Inputs: the full-page desktop and mobile screenshots after the refine, the full-page desktop screenshot from before it, the material file, and the hero review's findings with how each was settled.

Prompt for the reviewer:

> You are looking at a finished redesign and the page it replaced. You did not build it. Read the material file, then look at the screenshots. First word: `ship`, `fix` or `rebuild` (rebuild only when the page as a whole is not in the material or is worse than the page it replaced). Then at most five findings, worst first. Ask:
> - Does the material hold from the first screen to the footer, or does the page fall back to plain boxes and rules below the fold?
> - Or the opposite: is one of the material's surfaces repeated in every section until it reads as wallpaper? Check the page against the file's Rhythm section and name the sections that should rest on a plain ground.
> - Do three sections in a row share one layout? Is any section only a heading and a grid of equal cards?
> - Is there empty space that reads as unfinished, or a section crowded beyond what its content needs?
> - Are alignments, spacing and type sizes consistent? Name the place where they are not.
> - What did the old page do better? Name one thing, or say nothing did.
> - On mobile: does anything overflow, overlap or become unreadable?
> Do not ask for content the page does not have.

Fix what is real once, take the screenshots again, and report the findings with their outcome. One round only: the second look is yours.
