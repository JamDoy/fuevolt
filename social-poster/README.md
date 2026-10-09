# FueVolt Social Poster

A small, standalone app that posts to the FueVolt Facebook Page twice a week.
It runs on its own GitHub Actions schedule — it is not part of the main site
build/deploy. Two kinds of post:

- **`capitals`** (Mondays 22:00 UTC, i.e. Tuesday morning in Sydney): the
  cheapest Unleaded 91 *and* Diesel in each Australian capital city.
- **`seq`** (Thursdays 22:00 UTC, i.e. Friday 8am in Brisbane): the six
  cheapest SE Queensland areas for Unleaded 91 and for Diesel, as a "this
  weekend" post. Areas are defined in `lib/cities.mjs`; each area's cheapest
  station is found, areas are ranked, and a servo that is the cheapest in two
  areas is only listed once.

It has no database and keeps no history: each run fetches live prices from
fuevolt.com's own cached government-data proxies (the same ones the website
uses) and reports the cheapest station found *at that moment*. Prices outside
50¢–400¢/L are ignored as data-entry errors (the government feeds sometimes
contain things like a station reporting 2¢/L).

Sydney, Melbourne, Brisbane, Perth, Hobart, Darwin and Canberra are covered.
**Adelaide (SA) is skipped** — fuevolt.com has no live government fuel-price
feed for South Australia, so there's no real price to report there.

## One-time setup: connect a Facebook Page

You need a Page access token with permission to post. This has to be done
once, by you, in your own Facebook/Meta account — nobody else can do this
step for you.

1. Go to [Meta for Developers](https://developers.facebook.com/apps/) and
   create a new app (choose type "Business").
2. In the app, add the **Facebook Login** or **Pages API** product, and
   under Tools → Graph API Explorer:
   - Select your new app.
   - Select "Get Page Access Token" and pick the FueVolt Facebook Page.
   - Grant the `pages_manage_posts` and `pages_read_engagement` permissions.
3. The token Graph API Explorer gives you is short-lived (~1 hour). Exchange
   it for a long-lived one:
   ```bash
   curl -i -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=<APP_ID>&client_secret=<APP_SECRET>&fb_exchange_token=<SHORT_LIVED_TOKEN>"
   ```
   This gives a token valid ~60 days.
4. For a token that effectively never expires, use the long-lived *user*
   token from step 3 to fetch a **Page** access token (these don't expire as
   long as the app and your admin role stay active):
   ```bash
   curl -i -X GET "https://graph.facebook.com/v21.0/me/accounts?access_token=<LONG_LIVED_USER_TOKEN>"
   ```
   Find the FueVolt Page in the response — its `access_token` field is what
   you want.
5. Find your Page ID: on the Facebook Page, go to About, or call
   `https://graph.facebook.com/v21.0/me?access_token=<PAGE_ACCESS_TOKEN>`.

## One-time setup: GitHub secrets

In the `fuevolt` repo on GitHub: **Settings → Secrets and variables →
Actions → New repository secret**. Add:

- `FB_PAGE_ID` — the Page ID from step 5 above.
- `FB_PAGE_ACCESS_TOKEN` — the Page access token from step 4 above.

That's it — the workflow at `.github/workflows/social-poster.yml` already
reads these and runs on its own schedule. You can also trigger it manually
any time from the Actions tab ("Run workflow"): choose `capitals` or `seq`,
and leave "dry run" ticked (the default) to build the post without publishing.

**If runs are failing:** open the failed run in the Actions tab — the red
annotation at the top of its summary says why. Missing secrets and an
expired/invalid Facebook token are the usual causes. Page tokens only last as
long as the steps above (step 4) keep them valid, so regenerate if Facebook
reports the token expired.

## Testing locally

```bash
cd social-poster
npm install
npm run dry-run          # capital cities post
DRY_RUN=true node index.mjs seq   # Brisbane / SE Queensland post
```

`dry-run` fetches real live prices and prints the post it *would* send,
without actually posting — safe to run any time, and works even without
Facebook credentials set (it'll just skip the posting step).

## Changing the schedule or cities

- Schedule: edit the `cron` line in
  [`.github/workflows/social-poster.yml`](../.github/workflows/social-poster.yml)
  (times are UTC).
- Cities, SE Queensland areas and radii: edit
  [`lib/cities.mjs`](lib/cities.mjs).
- Post wording: edit `buildCapitalsPost()` / `buildSEQPost()` in
  [`index.mjs`](index.mjs).
