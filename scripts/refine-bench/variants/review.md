Two additions to the skill's process for this run: the page is looked at twice by a reviewer that did not build it.

Run each review as a subagent with no inherited conversation, and give it only the inputs listed. The reviewer does not edit anything. It answers with one word and at most five findings, worst first, one line each. A finding names what is on the screen and where, not a rule.

**Hero review.** After you have recorded the chosen direction and before you build the rest of the page. Inputs: the chosen mock's desktop and mobile screenshots (from the directions scan) and the mock's direction note (its first comment). Prompt for the reviewer:

> You are looking at the first screen of a page that is still being built. You did not build it. Look at the two screenshots. First word: `ship` or `fix`. Then at most five findings, worst first. Ask:
> - Does the headline say something only this client could say? Would it fit a rival unchanged?
> - Is there one main piece (a photograph, a product scene or the signature element), large enough to carry the screen? Is anything competing with it?
> - Does the screen stop early over an empty band, or leave a hole beside the main piece? Is the headline or the main button pushed below the fold?
> - Is the main action visible, and is there exactly one filled button?
> - Does anything read as a template: a centred stack of label, headline, sentence and two buttons; three equal cards; a strip of big figures; a floating card over a blob?
> - On the mobile screenshot: does anything overflow or shrink below reading size?
> Do not ask for content the page does not have.

Fix what is real in the mock, take the screenshots again, then carry the mock's first screen into the page.

**Finish review.** After the direction is applied to the whole page and `keep check` and `directions verify` pass. Inputs: the full-page desktop and mobile screenshots after the refine and, if you still have it, the full-page desktop screenshot from before. Prompt for the reviewer:

> You are looking at a finished redesign and, if given, the page it replaced. You did not build it. First word: `ship`, `fix` or `rebuild` (rebuild only when the page is worse than the page it replaced). Then at most five findings, worst first. Ask:
> - Does the look of the first screen hold to the footer, or does the page fall back to plain boxes and rules below the fold?
> - Or the opposite: is one surface or motif repeated in every section until it reads as wallpaper?
> - Do three sections in a row share one layout? Is any section only a heading and a grid of equal cards?
> - Is there empty space that reads as unfinished, or a section crowded beyond what its content needs?
> - Are alignments, spacing and type sizes consistent? Name the place where they are not.
> - What did the old page do better? Name one thing, or say nothing did.
> - On mobile: does anything overflow, overlap or become unreadable?
> Do not ask for content the page does not have.

Fix what is real once, run `keep check` and `directions verify` again if the page changed, and list the findings with their outcome in your report. One round only.
