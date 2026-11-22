# UI Refiner

[English](README.md) · [한국어](README_KO.md) · [日本語](README_JA.md)

UI Refiner includes 14 web design themes based on measurements from 2,326 Korean and Japanese sites. Use them to build a page with Codex or Claude Code, or review an existing page with the CLI.

## How the themes are built

**1. Eight types of page.** The 2,326 sites fall into eight types by overall impression. Each drawing shows a type's measured average: ground, photographs, type size and density.

![Schematics of the eight page types with the number of measured sites in each](docs/assets/archetypes.jpg)

**2. Six families of trade.** Trades are grouped by what a visitor comes to do.

| Family | Trades | Korea | Japan |
|---|---|---|---|
| place | inns, tourism, restaurants, weddings | 143 | 156 |
| care | clinics, hospitals, care, salons, fitness | 175 | 259 |
| public | government, associations, universities, media, finance | 202 | 179 |
| shop | e-commerce, fashion, cosmetics, food | 199 | 165 |
| business | makers, logistics, software, builders, tax, hiring | 235 | 249 |
| creative | design, games, architecture, photo, illustration | 130 | 234 |

**3. Fourteen themes.** Each theme is a finished design for a type that is common in one family in one country, with its sizes, colours and layout taken from those sites. The count next to a theme is the number of sites of that type in that family and country: `kr-business-white` rests on 50 of the 235 Korean business sites.

<!-- theme-grid:start (node scripts/build-theme-grid.mjs) -->
<table>
<tr>
<td align="center" valign="top" width="33%">
<a href="skills/ui-refiner-agent/reference/themes/kr-care-white/theme.md"><img src="docs/assets/themes/kr-care-white.jpg" alt="First screen of the kr-care-white sample page" width="100%"></a><br>
<b><a href="skills/ui-refiner-agent/reference/themes/kr-care-white/theme.md">kr-care-white</a></b><br>
<sub>Korea · care · white quiet ·&nbsp;38&nbsp;sites</sub>
</td>
<td align="center" valign="top" width="33%">
<a href="skills/ui-refiner-agent/reference/themes/kr-business-dark/theme.md"><img src="docs/assets/themes/kr-business-dark.jpg" alt="First screen of the kr-business-dark sample page" width="100%"></a><br>
<b><a href="skills/ui-refiner-agent/reference/themes/kr-business-dark/theme.md">kr-business-dark</a></b><br>
<sub>Korea · business · dark cinematic ·&nbsp;35&nbsp;sites</sub>
</td>
<td align="center" valign="top" width="33%">
<a href="skills/ui-refiner-agent/reference/themes/kr-business-white/theme.md"><img src="docs/assets/themes/kr-business-white.jpg" alt="First screen of the kr-business-white sample page" width="100%"></a><br>
<b><a href="skills/ui-refiner-agent/reference/themes/kr-business-white/theme.md">kr-business-white</a></b><br>
<sub>Korea · business · white quiet ·&nbsp;50&nbsp;sites</sub>
</td>
</tr>
<tr>
<td align="center" valign="top" width="33%">
<a href="skills/ui-refiner-agent/reference/themes/kr-business-corporate/theme.md"><img src="docs/assets/themes/kr-business-corporate.jpg" alt="First screen of the kr-business-corporate sample page" width="100%"></a><br>
<b><a href="skills/ui-refiner-agent/reference/themes/kr-business-corporate/theme.md">kr-business-corporate</a></b><br>
<sub>Korea · business · standard corporate ·&nbsp;41&nbsp;sites</sub>
</td>
<td align="center" valign="top" width="33%">
<a href="skills/ui-refiner-agent/reference/themes/kr-place-photo/theme.md"><img src="docs/assets/themes/kr-place-photo.jpg" alt="First screen of the kr-place-photo sample page" width="100%"></a><br>
<b><a href="skills/ui-refiner-agent/reference/themes/kr-place-photo/theme.md">kr-place-photo</a></b><br>
<sub>Korea · place · photo-led ·&nbsp;43&nbsp;sites</sub>
</td>
<td align="center" valign="top" width="33%">
<a href="skills/ui-refiner-agent/reference/themes/kr-public-portal/theme.md"><img src="docs/assets/themes/kr-public-portal.jpg" alt="First screen of the kr-public-portal sample page" width="100%"></a><br>
<b><a href="skills/ui-refiner-agent/reference/themes/kr-public-portal/theme.md">kr-public-portal</a></b><br>
<sub>Korea · public · dense portal ·&nbsp;61&nbsp;sites</sub>
</td>
</tr>
<tr>
<td align="center" valign="top" width="33%">
<a href="skills/ui-refiner-agent/reference/themes/kr-shop-portal/theme.md"><img src="docs/assets/themes/kr-shop-portal.jpg" alt="First screen of the kr-shop-portal sample page" width="100%"></a><br>
<b><a href="skills/ui-refiner-agent/reference/themes/kr-shop-portal/theme.md">kr-shop-portal</a></b><br>
<sub>Korea · shop · dense portal ·&nbsp;60&nbsp;sites</sub>
</td>
<td align="center" valign="top" width="33%">
<a href="skills/ui-refiner-agent/reference/themes/kr-creative-dark/theme.md"><img src="docs/assets/themes/kr-creative-dark.jpg" alt="First screen of the kr-creative-dark sample page" width="100%"></a><br>
<b><a href="skills/ui-refiner-agent/reference/themes/kr-creative-dark/theme.md">kr-creative-dark</a></b><br>
<sub>Korea · creative · dark cinematic ·&nbsp;34&nbsp;sites</sub>
</td>
<td align="center" valign="top" width="33%">
<a href="skills/ui-refiner-agent/reference/themes/jp-place-photo/theme.md"><img src="docs/assets/themes/jp-place-photo.jpg" alt="First screen of the jp-place-photo sample page" width="100%"></a><br>
<b><a href="skills/ui-refiner-agent/reference/themes/jp-place-photo/theme.md">jp-place-photo</a></b><br>
<sub>Japan · place · photo-led ·&nbsp;65&nbsp;sites</sub>
</td>
</tr>
<tr>
<td align="center" valign="top" width="33%">
<a href="skills/ui-refiner-agent/reference/themes/jp-care-corporate/theme.md"><img src="docs/assets/themes/jp-care-corporate.jpg" alt="First screen of the jp-care-corporate sample page" width="100%"></a><br>
<b><a href="skills/ui-refiner-agent/reference/themes/jp-care-corporate/theme.md">jp-care-corporate</a></b><br>
<sub>Japan · care · standard corporate ·&nbsp;68&nbsp;sites</sub>
</td>
<td align="center" valign="top" width="33%">
<a href="skills/ui-refiner-agent/reference/themes/jp-business-corporate/theme.md"><img src="docs/assets/themes/jp-business-corporate.jpg" alt="First screen of the jp-business-corporate sample page" width="100%"></a><br>
<b><a href="skills/ui-refiner-agent/reference/themes/jp-business-corporate/theme.md">jp-business-corporate</a></b><br>
<sub>Japan · business · standard corporate ·&nbsp;52&nbsp;sites</sub>
</td>
<td align="center" valign="top" width="33%">
<a href="skills/ui-refiner-agent/reference/themes/jp-public-portal/theme.md"><img src="docs/assets/themes/jp-public-portal.jpg" alt="First screen of the jp-public-portal sample page" width="100%"></a><br>
<b><a href="skills/ui-refiner-agent/reference/themes/jp-public-portal/theme.md">jp-public-portal</a></b><br>
<sub>Japan · public · dense portal ·&nbsp;64&nbsp;sites</sub>
</td>
</tr>
<tr>
<td align="center" valign="top" width="33%">
<a href="skills/ui-refiner-agent/reference/themes/jp-shop-portal/theme.md"><img src="docs/assets/themes/jp-shop-portal.jpg" alt="First screen of the jp-shop-portal sample page" width="100%"></a><br>
<b><a href="skills/ui-refiner-agent/reference/themes/jp-shop-portal/theme.md">jp-shop-portal</a></b><br>
<sub>Japan · shop · dense portal ·&nbsp;57&nbsp;sites</sub>
</td>
<td align="center" valign="top" width="33%">
<a href="skills/ui-refiner-agent/reference/themes/jp-creative-bigtype/theme.md"><img src="docs/assets/themes/jp-creative-bigtype.jpg" alt="First screen of the jp-creative-bigtype sample page" width="100%"></a><br>
<b><a href="skills/ui-refiner-agent/reference/themes/jp-creative-bigtype/theme.md">jp-creative-bigtype</a></b><br>
<sub>Japan · creative · big type ·&nbsp;36&nbsp;sites</sub>
</td>
<td width="33%"></td>
</tr>
</table>
<!-- theme-grid:end -->

[Theme gallery](skills/ui-refiner-agent/reference/themes/GALLERY.md) · [Measurement method and catalog](skills/ui-refiner-agent/reference/themes/README.md)

**4. One family in all eight types.** Any family can be drawn in any type. Here the Korean business family is drawn eight ways for one fictional maker. Two of the eight are themes. The other six are demonstration samples built from the measured values of their type, and are not offered as themes. The counts show how common each combination is: 50 Korean business sites are white quiet and 15 are bold colour.

![One fictional Korean maker drawn in all eight page types](docs/assets/archetype-demo-kr-business.jpg)

[Demonstration pages and counts](docs/archetype-demo/README.md)

## Quick start

Requires Node.js 22.18 or later, npm and Git. To use UI Refiner with an existing app, run these commands from the app root.

```sh
git clone https://github.com/prentice7725/ui-refiner tools/ui-refiner
cd tools/ui-refiner
npm ci
npx playwright install chromium
node bin/ui-refiner.mjs doctor
node bin/ui-refiner.mjs scan examples/ai-slop-landing.html --lang en
```

Open `ui-refiner-scan/DESIGN_REVIEW.md` after the sample scan. Desktop and mobile screenshots are saved alongside it. Replace the example with a URL or local HTML path to scan your page. Rescan the same page into the same output folder for a before-and-after comparison.

## Connect an agent

From the `tools/ui-refiner` checkout above, run the command for your host. CLI users can skip this step.

| Host | Install | Use in your app project |
|---|---|---|
| Codex | `node scripts/install-agent-skill.mjs ../.. --host codex` | Open a new chat and ask “Review the design of landing.html” |
| Claude Code | `node scripts/install-agent-skill.mjs ../.. --host claude` | Review with `/ui-review landing.html` or refine with `/ui-refine landing.html` |

Run the installer again to see the installed version and file differences. Add `--update` to apply available updates. Locally modified files are flagged for review.

<details>
<summary>Install as a Claude Code plugin</summary>

Run these commands in Claude Code, then run `npm ci` and `npx playwright install chromium` in the plugin folder.

```text
/plugin marketplace add prentice7725/ui-refiner
/plugin install ui-refiner@ui-refiner
```

</details>

## What you can do

- **Review a page.** `scan` explains each design signal and suggests a change. The 0–100 score measures the strength of detected patterns. Quality issues such as text contrast are reported separately. Reports support English, Korean and Japanese. Set the language with `--lang en`, `ko` or `ja`.
- **Refine an existing design.** The agent keeps the structure for smaller changes and, for a full redesign, starts a Korean or Japanese trade page from the matching theme; other pages, or anyone who asks for options, get three directions to choose from. Use `keep check` to check that links, forms and figures survived the edits, and `stress` to test the layout with longer labels and larger numbers.
- **Build a new page.** The 14 themes draw on measurements from 2,326 Korean and Japanese sites. Open the gallery in a browser from your local checkout to filter samples by country, purpose and availability of client photos.

In a three-page pilot, the three-direction workflow had the best mean rank for individual pages, but the resulting pages were judged similar as a set. One model evaluated the designs. [Pilot results](docs/refine-pilot-2026-11-15-local/results-five-arms.json)

[Full guide and project QA setup](docs/GUIDE.md) · [Changelog](CHANGELOG.md) · [MIT](LICENSE) · [Third-party notices](licenses/THIRD_PARTY.md)
