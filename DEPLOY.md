# Deploy

This site is a **Vite static build hosted on Cloudflare Pages**, deployed by a
**manual `wrangler` upload** — NOT Git integration. So pushing to GitHub does
**not** deploy; you must run the command below. (`dist/` is gitignored and built
fresh each deploy.)

## Facts
- **Pages project:** `resume-site`  (`resume-site-3rj.pages.dev`)
- **Custom domains:** geohamilton.com + www.geohamilton.com
- **Domain/DNS:** GoDaddy domain, Cloudflare nameservers, Cloudflare Pages (free tier)
- **Cloudflare Account ID:** `7f7fe6bca3a118cb321026c961390aa8`  *(not secret)*

## Auth (pick one)
Wrangler needs Cloudflare credentials. Either:
- **Browser login (simplest):** `npx wrangler login` — persists, but the OAuth
  token expires periodically and can't refresh in a non-interactive shell.
- **API token (for scripts/CI):** create a token at
  dash.cloudflare.com/profile/api-tokens with the **Cloudflare Pages → Edit**
  permission, then export it as `CLOUDFLARE_API_TOKEN`. **Never commit the token.**

## ⚠️ Branch decides the environment (read this first)
`wrangler pages deploy` infers the **deployment branch from your current git
branch** unless you pass `--branch`. The Pages project's **production branch is
`main`**, so:
- On **`main`** (or `--branch main`) → updates **production** = geohamilton.com.
- On any **other branch** (e.g. `lab-portal`) → publishes a **preview URL only**;
  production is untouched. This is the safe default for WIP — a deploy from a
  feature branch will NOT change geohamilton.com.

So if you deploy from `lab-portal` and geohamilton.com doesn't change, that's
correct: you got a preview. Use the preview link to test.

## Deploy to PRODUCTION (geohamilton.com)
Be on `main`, or force it explicitly with `--branch main`:
```bash
npm run build
CLOUDFLARE_API_TOKEN="<your-token>" \
CLOUDFLARE_ACCOUNT_ID="7f7fe6bca3a118cb321026c961390aa8" \
  npx wrangler pages deploy dist --project-name resume-site --branch main --commit-dirty=true
# (token via env, NOT committed. Or run `npx wrangler login` once and drop the env var.)
```

## Deploy a PREVIEW (feature branch, e.g. lab-portal)
Test WIP at a unique URL without touching production:
```bash
npm run build
CLOUDFLARE_API_TOKEN="<your-token>" \
CLOUDFLARE_ACCOUNT_ID="7f7fe6bca3a118cb321026c961390aa8" \
  npx wrangler pages deploy dist --project-name resume-site --branch lab-portal --commit-dirty=true
```
Cloudflare returns a preview URL like `lab-portal.resume-site-3rj.pages.dev`.

## Verify it went live
The bundle filename is content-hashed, so a real deploy changes it:
```bash
BUNDLE=$(curl -s https://geohamilton.com/ | grep -oE '/assets/main-[A-Za-z0-9_-]+\.js' | head -1)
curl -s "https://geohamilton.com$BUNDLE" | grep -q "SOME_NEW_STRING_YOU_ADDED" && echo LIVE || echo "still old"
```

## Notes
- The `/dashboard` page reads live data from a separate **Supabase** project
  (`owgzrwfdmtiaenbumyzo`). RLS blocks anonymous writes, so data updates are run
  as SQL in the Supabase SQL editor (see `update_dashboard_ai.sql`), not from here.
