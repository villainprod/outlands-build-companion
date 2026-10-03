# Outlands Build Companion

Plan and share character templates for [UO Outlands](https://uooutlands.com): spend your skill and stat points, see what fits under the caps, and send the build to anyone with a link.

Works on desktop and phones, with light and dark themes.

## Features

- **Skill budget bar** showing every skill against the 700-point cap (plus up to 20 Skill Mastery Orbs, for 720).
- **Skills up to 120**, with a count of the Skill Mastery Scrolls needed above 100.
- **Stats** for Strength, Dexterity and Intelligence against the 225 cap.
- **Share links**: the whole template is packed into the URL, so no server or account is needed.
- **Import / export** templates as JSON.
- Templates are saved in your browser (localStorage).

## Run it locally

Requires [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

## Put it on GitHub Pages

1. Create a new repository on GitHub (for example `outlands-build-companion`).
2. Push this folder to it:
   ```bash
   git remote add origin https://github.com/<your-username>/outlands-build-companion.git
   git branch -M main
   git push -u origin main
   ```
3. On GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` builds and publishes on every push to `main`.
   Your site will be at `https://<your-username>.github.io/outlands-build-companion/`.

## Project layout

| Path | What it holds |
| --- | --- |
| `src/data/outlands.ts` | Skill list and game caps. Update this if the shard changes a number. |
| `src/lib/template.ts` | Template shape, validation, totals, share-link encoding. |
| `src/lib/storage.ts` | Saving to the browser, JSON download. |
| `src/components/` | UI: template list, editor, budget bar, skills, stats. |
| `src/stats/types.ts` | Data shapes for the upcoming damage stats feature. |
| `src/index.css` | All styles and the light/dark color tokens. |

## Roadmap: damage stats

The **Damage stats** tab is a placeholder. The plan is to load combat logs, convert them to the
`DamageEvent` format in `src/stats/types.ts`, and compare damage per second and per ability across
templates. A `summarize()` helper is already there to build on.

## Data sources

Skill list and caps come from the [Outlands wiki: Skills & Stats](https://wiki.uooutlands.com/Skills_%26_Stats)
and [Skill Mastery](https://wiki.uooutlands.com/Skill_Mastery) pages.

Fan-made and not affiliated with UO Outlands.
