# Inner-page benchmark: keeping a site in one design (2026-11-13)

Refine gives the main page three directions to choose from. The site's other pages should then follow the picked design, not vary. This benchmark checks whether `ui-refiner system extract` / `system check` and the skill's "The site's other pages" section help an agent build those pages.

## Setup

- Main pages: the 8 round 17 refine pages (`docs/REFINE_BENCHMARK_2026-11-08.md`).
- Each site gets two inner pages, chosen by subject. Examples: pricing and FAQ for the Korean budgeting app, treatments and access for the Japanese dental clinic, get-food and volunteer for the food bank.
- Model: Claude Opus 5.5, no person in the loop.
- **Pilot (main page code in the folder), Korean fintech only:** both arms kept the design (0 drift each) and the pages were nearly identical. With the main page's HTML at hand, the agent copies its CSS anyway, so the full run used a harder condition.
- **Full run, main page code not available:** the main page is "built in another repository"; the agent sees only a screenshot of its top part.
  - **Plain:** the screenshot, with "match the design of the main page".
  - **System:** the same screenshot, plus `DESIGN_SYSTEM.md` and `ui-refiner-system.json` measured from the live main page. The agent follows the skill section, then runs `system check` and fixes drift.
- **Judges:** Claude, Gemini and Grok, blind A/B. Each image shows the main page and the two inner pages side by side. They scored:
  - consistency (one website, while each inner page suits its content);
  - inner-page quality;
  - the inner pages' AI look;
  - which version they would launch.
- **Cost:** about $21: $2.83 for the pilot, $17.60 for the 16 builds of the full run, the rest for judges.

## Results

Automated check against the design measured from the real main page:

| Arm | Inner pages that keep the design | Most common drift |
|---|---:|---|
| System | **16 / 16** | — |
| Plain | 0 / 16 | heading or body face (12), body size (12), heading size (7) |

The plain arm guessed the faces from the screenshot:
- Inter or Inter Tight instead of Familjen or Schibsted Grotesk;
- Noto Sans JP instead of Zen Kaku Gothic New;
- Black Han Sans instead of Do Hyeon.

It also set body text 2–3px smaller.

| Judge | Arm | Consistency | Inner quality | Inner AI look (lower is better) | Picked |
|---|---|---:|---:|---:|---:|
| Claude | System | **8.1** | **7.7** | **3.9** | **6 / 7** |
| Claude | Plain | 7.9 | 6.7 | 5.6 | 1 / 7 |
| Gemini | System | **9.0** | **9.0** | **2.0** | **8 / 8** |
| Gemini | Plain | 6.9 | 6.5 | 5.0 | 0 / 8 |
| Grok | System | **7.5** | 7.3 | **4.1** | 4 / 8 |
| Grok | Plain | 7.0 | 7.3 | 6.6 | 4 / 8 |

Claude's verdict on one site (US product) was not valid JSON.

Reading:
- The system arm won 18 of 23 verdicts. Judges gave the same reasons across sites:
  - **Plain clones the main page.** Its inner pages repeat the main page's hero, including the same photo on the Japanese hiring site. The food bank's get-food page repeats the home page "section for section".
  - **Plain falls back on stock layouts.** Pricing became a three-tier grid with a "Most popular" card (US product, US fintech, Korean fintech), and the FAQ got filter chips.
  - **System pages get layouts of their own** that keep the main page's components: an indexed services guide, a one-plan pricing card, receipt-style rate tables, a job index table, and a real sign-up form.
- Part of the win comes from the skill's guidance, not only the measured tokens: "an inner page opens with its own title and content, not a second landing hero".
- Where the system arm lost (Japanese dental and hiring for Grok, Japanese dental for Claude), the main page was photo-led. The system pages were "text-heavy … no imagery" or used "the same repeated two-column text template". The measured system says nothing about imagery, and the inner pages dropped the photos.
- Next: say in the system notes whether the main page is photo-led. Ask inner pages of a photo-led site to carry photos too.
