# Effects

Optional motion and surface effects on top of a theme. A theme is static by default. Its `theme.md` lists, under "Effects", which of these suit it. When a client page is built from a theme that allows effects, offer them in one line, and add them only when the client says yes.

`effects.css` and `effects.js` hold all of them. Load both after the theme, name the chosen effects on `<html>`, and mark the elements:

```html
<html lang="ja" data-fx="hero-video reveal header-blur">   <!-- data-fx-level="bold" for the stronger setting -->
<link rel="stylesheet" href="theme.css">
<link rel="stylesheet" href="effects/effects.css">
<script src="effects/effects.js" defer></script>
```

To try them on a sample page, add `?fx=hero-slides,reveal`, `?fx=marquee,intro` or `?fx-level=bold` to its address. Samples with effect markup: `place-photo-quiet`, `place-photo-view`, `care-white`, `business-corporate-message` (slides, reveals), `business-dark` (video or slides), `creative-bigtype` (marquee, intro, reveals). The portal themes have their own carousels.

| Effect | Markup | What it does | Fallback |
|---|---|---|---|
| `hero-video` | `<video class="fx-hero-video" data-src="…mp4" poster="…jpg" muted playsinline loop preload="none" aria-hidden="true">` inside the hero (`data-fx-hero`), after the hero photograph | A muted loop cross-fades in over the photograph once it plays. Stops while the hero is out of view. | The photograph. No video on reduced motion, Save-Data or 2G. |
| `hero-slides` | Extra `<img data-fx-slide alt="">` after the hero photograph | Cross-fades through the photographs every 6 s and back to the first. | The first photograph. |
| `reveal` | `data-reveal` on photographs or photo groups | Each block rises and fades in once as it enters the screen. Blocks already on screen at load are shown at once. | Everything visible. Nothing is hidden before the script runs. |
| `header-blur` | `data-fx-header` on the header; the theme script adds `.is-solid` on scroll; `--fx-header-bg` is its solid colour | The solid header turns translucent over a blurred page. | The theme's solid header. |
| `marquee` | `<div class="fx-marquee" aria-hidden="true"><div class="fx-marquee__track"><span>…</span>…</div></div>` between two sections, with words that also stand on the page; the theme sets its type | A strip runs sideways at a steady speed (40 s a lap by default, `--fx-marquee-time`). Stops on hover and while out of view. | Not shown. |
| `intro` | `<body data-fx-intro="name">` | The name on the page ground for 0.9 s, then the page. CSS only; never takes clicks. Real sites hold 3–5 s; this does not. | Not shown. |

Every moving hero needs `<button class="fx-pause" type="button" data-pause="…" data-play="…">` in the hero, labelled in the page's language. It appears only while something moves (WCAG 2.2.2).

## Rules

- **One moving hero.** Video *or* slides, never both; the reveals start below the first screen.
- **Slides before video.** Hero slides are the common case (54% of 630 measured sites, up to 72% in the Japanese bold-colour pages). Hero video is used by 14%, mostly on dark cinematic, big-type and white-quiet pages (23–33%), and hardly ever on short & small and dense-portal pages (3–5%).
- **Reveal photographs, not text.** No reveals on headings, body text, prices, forms or buttons, and no staggered cascades through a list. 27% of the sites reveal on scroll (Japan 33%, Korea 21%); the sites that do hide a median 35% of the blocks below the first screen. This rule is stricter on purpose: an AI-made page fades in every element.
- **Blur only on the header, and only when asked.** 5% of the sites blur their fixed header (60% have one); the most are Korean care pages (21%) and Korean white-quiet and big-type pages (15–16%). Blurred panels in the page flow are rarer still, and the scanner counts three or more as an AI sign.
- **Entering motion eases out.** `--fx-ease` is a strong ease-out (`cubic-bezier(0.23, 1, 0.32, 1)`); never `ease-in`. Animated blur stays under 20 px. (These two follow Emil Kowalski's animation standards, github.com/emilkowalski/skills, MIT.)
- **Video:** 10–20 s, seamless loop, no audio, 1280×720 H.264 under 2.5 MB, with the hero photograph as the poster. If the client has no footage, a slow push-in across two of their photographs (made with ffmpeg) is fine; say so in the footer when the photographs are generated.
- **Strength:** the default is quiet (14 px rise, 0.7 s, 12 px blur). `bold` (32 px, 1 s, 18 px) suits the dark cinematic and big-type themes only.

## Applying to a client's page

Learned on three client pages built from the themes (21 November 2026): a Hakuba inn (`place-photo-quiet`), a Suwon dental clinic (`care-white`) and a fulfilment company (`business-dark`).

- **The material decides first.** The fulfilment company had no photographs, so its hero is set in type; video and slides had nothing to show, and the effects its theme allows on request (reveals, header blur) add nothing to a page without pictures. Offer nothing then, and say why in one line.
- **Slides only with the client's own photographs.** The inn page runs on generated stand-ins named for another town; slides put three of them in the most visible place instead of one. With stand-ins, offer slides as "once you have three photographs of your own", and keep the hero still until then.
- **A framed hero photo can slide too.** On the clinic page the photo sits beside the text, so the slides change a seventh of the first screen, not all of it; the pause control goes in the photo's corner. On phones the photo is below the first screen and the slides wait until it is in view.
- **Copied theme files can be older than the effects.** A page built before the effects has a `theme.css` without the effects block at its end; copy that block (slide stacking, pause position) from the current theme into the page CSS.
- **Mark groups, not every picture.** `data-reveal` on the photo groups (concept, onsen, rooms, cuisine) gives four reveals, each bringing in several pictures at once.
- **Pause labels in the page's language** (`一時停止` / `再生`, `일시정지` / `재생`).

## Basis

`scripts/collect-motion.mjs` measured 630 human-made Korean and Japanese sites in November 2026, about 40 from each country and archetype of `data/archetypes/clusters.json` (desktop 1440×900, first screen watched for 8 s, then scrolled). `data/motion/summary.json` has the shares per country, archetype and family; `data/motion/sites.json` one record per site.

| | Japan | Korea |
|---|---|---|
| Hero slides | 62% | 47% |
| Hero video | 14% | 15% |
| Scroll reveals | 33% | 21% |
| Fixed header / blurred | 57% / 4% | 63% / 6% |
| Marquee (endless sideways strip) | 9% | 6% |
| Loading intro | 8% | 0% |
| Parallax (fixed background) | 4% | 9% |
| Link and button transitions | 300 ms, `ease` on half the sites | 300 ms, `ease` |

Each theme's "Effects" list comes from its country and archetype: offered at 20% and above, on request at 5–19%, not used below 5%. Marquees are most common on Japanese white-quiet and bold-colour pages (17%) and loading intros are Japanese only; parallax is measured but not built.
