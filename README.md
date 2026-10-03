# Outlands Build Companion

Plan and share character templates for [UO Outlands](https://uooutlands.com): spend your skill and stat points, see what fits under the caps, and send the build to anyone with a link.

Works on desktop and phones, with light and dark themes.

## Features

- **Skill budget bar** showing every skill against the 700-point cap (plus up to 20 Skill Mastery Orbs, for 720).
- **Skills up to 120**, with a count of the Skill Mastery Scrolls needed above 100.
- **Stats** for Strength, Dexterity and Intelligence against the 225 cap.
- **Share links**: the whole template is packed into the URL, so no server or account is needed.
- **Import / export** templates as JSON.
- **Accounts (optional)**: sign in with an emailed link or Discord to save templates to the cloud and open them on any device. Signed-out visitors still save in their browser.

## Run it locally

Requires [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

Without any settings the app runs in browser-only mode (no Sign in button). To test accounts locally,
copy `.env.example` to `.env.local`, fill in your Supabase values (see below), and restart `npm run dev`.

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

## Turn on accounts (Supabase)

Accounts use [Supabase](https://supabase.com), which has a free tier and works with a static GitHub Pages site.

1. **Create a project** at supabase.com. Any name and region.
2. **Create the table.** Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and click **Run**.
   This creates the `templates` table with row-level security, so each person can only read and change their own templates.
3. **Allow your site's address.** Open **Authentication → URL Configuration**:
   - **Site URL**: `https://<your-username>.github.io/outlands-build-companion/`
   - **Redirect URLs**: add that same address, plus `http://localhost:5173/` for local testing.
4. **Copy your keys.** Open **Project Settings → API Keys** and copy the **Project URL** and the
   **publishable key** (starts with `sb_publishable_`). Never use the secret key in this app.
5. **Give them to GitHub.** In your repository, open **Settings → Secrets and variables → Actions → Variables**
   and add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your publishable key
6. Push any change (or re-run the deploy workflow). A **Sign in** button appears in the top bar.

The publishable key is safe to publish; it's built into the site on purpose. The database rules from step 2
are what keep templates private.

**Email sign-in limits.** Supabase's built-in email sender only allows a few sign-in emails per hour,
which is fine for testing. Before sharing the site widely, add your own email provider under
**Authentication → Emails → SMTP Settings** (Resend, Postmark and similar services have free tiers).

### Optional: Sign in with Discord

1. At the [Discord Developer Portal](https://discord.com/developers/applications), create an application.
   Under **OAuth2**, copy the **Client ID** and **Client Secret**, and add this redirect:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
2. In Supabase, open **Authentication → Sign In / Providers → Discord**, turn it on, and paste the ID and secret.
3. Add a GitHub Actions variable `VITE_ENABLE_DISCORD` = `true`, then redeploy.

## Project layout

| Path | What it holds |
| --- | --- |
| `src/data/outlands.ts` | Skill list and game caps. Update this if the shard changes a number. |
| `src/lib/template.ts` | Template shape, validation, totals, share-link encoding. |
| `src/lib/storage.ts` | Saving to the browser, JSON download. |
| `src/lib/supabase.ts`, `src/lib/cloud.ts` | Account connection and cloud reads/writes. |
| `src/hooks/useTemplates.ts` | Owns the template list: browser storage when signed out, account when signed in. |
| `supabase/schema.sql` | Database table and privacy rules. Run once in Supabase. |
| `src/components/` | UI: template list, editor, budget bar, skills, stats, sign-in. |
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
