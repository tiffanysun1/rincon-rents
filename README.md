# Rincon Rent

A static, unit-by-unit apartment comparison for Rincon Hill. It combines building availability pages and Zillow with an explicit cost model for recurring fees, utilities, insurance, and parking. Studios are excluded at the data boundary.

## Run

```sh
npm run dev
```

Open <http://127.0.0.1:4173>.

## Verify

```sh
npm test
```

The tests check studio exclusion, unit counts, provenance, unique IDs, cost arithmetic, source parsing, and fail-closed refresh behavior.

## Refresh and hosting

The included GitHub Actions workflow is the hosting and daily-update path:

1. Put this directory in a GitHub repository with `main` as its default branch.
2. In **Settings → Pages**, choose **GitHub Actions** as the publishing source.
3. The site deploys on every push. At 6:17 AM Pacific each day, a browser-based refresh checks exact units, updates confirmed prices and dates, runs the validation suite, and deploys to GitHub Pages.
4. **Actions → Refresh listings and deploy → Run workflow** triggers the same process on demand.

The updater is intentionally conservative. Exact unit-and-price matches are required. A blocked or changed source keeps its last known good listing and freshness label; if no source can be verified, the workflow fails without changing the displayed update timestamp. The checked-in `refresh-state.js` records the last successful data update and per-source status.

## Daily iMessage

After the Pages URL is live, install the optional Mac schedule with:

```sh
./scripts/install-imessage-schedule.sh +14155551212 https://username.github.io/rincon-rents/
```

It sends the site link through the signed-in macOS Messages app every day at 7:15 AM, after the 6:17 AM refresh. The phone number is written only to the local LaunchAgent, not the repository. macOS will ask for permission the first time the script controls Messages. Use `./scripts/uninstall-imessage-schedule.sh` to remove it.

## Data caveat

The baseline is a researched snapshot dated August 2, 2026, not a leasing API. Each result links to its source and labels estimated costs. Re-check the itemized monthly price, concessions, availability, and move-in charges with the property before applying.
