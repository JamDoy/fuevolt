# FueVolt Social Poster

A small, standalone app that posts to the FueVolt Facebook Page twice a week
(Monday and Thursday mornings, Sydney time) with the cheapest Unleaded 91
price found in each Australian capital city. It runs on its own GitHub
Actions schedule — it is not part of the main site build/deploy.

It has no database and keeps no history: each run fetches live prices from
fuevolt.com's own cached government-data proxies (the same ones the website
uses) and reports the cheapest station found *at that moment* in each city.

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
reads these and runs on its own schedule (Monday and Thursday). You can also
trigger it manually any time from the Actions tab ("Run workflow"), with an
optional "dry run" checkbox that builds the post but doesn't publish it.

## Testing locally

```bash
cd social-poster
npm install
FB_PAGE_ID=xxx FB_PAGE_ACCESS_TOKEN=yyy npm run dry-run
```

`dry-run` fetches real live prices and prints the post it *would* send,
without actually posting — safe to run any time, and works even without
Facebook credentials set (it'll just skip the posting step).

## Changing the schedule or cities

- Schedule: edit the `cron` line in
  [`.github/workflows/social-poster.yml`](../.github/workflows/social-poster.yml)
  (times are UTC).
- Cities/radius: edit
  [`lib/cities.mjs`](lib/cities.mjs).
- Post wording: edit `buildPost()` in [`index.mjs`](index.mjs).
