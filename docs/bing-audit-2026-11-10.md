# Bing Webmaster audit — 10 November 2026

## Follow-up confirmation in Bing

User enabled Cloudflare Crawler Hints after signing in. Reloaded the Jacketee caching configuration and verified the `Crawler Hints Beta` switch has `aria-checked=true` (persisted ON). Evidence: `output/bing/crawler-hints-enabled.png`. Bing IndexNow still shows its onboarding page at this observation; receipt/detection is not confirmed. The separate local direct-submission integration remains undeployed and was not used to submit URLs.

Browser access restored. The canonical www sitemap submission is confirmed **Success**, submitted/crawled 10 November, **318 URLs discovered**, zero sitemap errors/warnings. The old non-www sitemap remains listed with 293; the dashboard sum of 611 is across both submissions, not a count of unique indexed pages. Evidence: `output/bing/sitemap-confirmed.png`.

The new priority-page scan is still **Queued** (16 minutes at observation), with no results yet. Recommendations still show two items: missing IndexNow (High), insufficient high-quality inbound links (Moderate). Local code changes have not been deployed in this chat.

Property inspected: https://jacketee.com/. Existing user changes to blog/shop metadata and redirect data were preserved.

## Findings

- Recommendations: IndexNow missing; insufficient inbound links from high-quality domains. Backlinks require real outreach/mentions, not an application code change.
- Submitted sitemap before this audit: https://jacketee.com/sitemap.xml, Success, 293 discovered URLs, last crawled 3 November. Zero sitemap errors or warnings.
- Live canonical sitemap contains 318 URLs. Read-only check of every URL saved to `output/bing/live-audit.json`: 317 return 200, one returns the intended 301 for the retired pink hoodie alias. No 4xx/5xx, no request failures, no public noindex, no missing titles/descriptions or extra/missing H1 on the 200 pages. Homepage canonical differs only by the root slash and is equivalent; the audit now normalizes URL representations.
- Site Explorer shows 94 indexed, zero errors, one warning, six exclusions (historical Bing inventory, not the live sitemap total). NOINDEX and robots-disallowed filters show no data. Other Issues filter lists no applicable URLs. The warning/exclusion details were not fully resolved before browser access became disabled; do not label them fixed.
- Existing Site Scan: 10 September, only one scanned page, zero errors/warnings. It does not establish whole-site health.

## Completed actions and code

- Queued `Jacketee canonical priority pages 2026-11-10` with ten explicit www canonical URLs, using the ten-page remaining quota. No email updates requested. Verified Queued in the scan list; evidence: `output/bing/scan-queued.png`. Scan results remain pending.
- Submitted https://www.jacketee.com/sitemap.xml through Bing's form. Last visible state was Submitting. Browser access then became disabled in Work settings, so success is **unconfirmed**, not claimed.
- `src/app/sitemap.ts`: apply existing permanent redirect destinations and deduplicate canonical URLs. This removes the retired pink hoodie URL while retaining its redirect. No database content or product URLs changed.
- Public IndexNow verification file and `scripts/indexnow.mjs`: preview by default; explicit submission; exact canonical host/public-page validation; live key-file verification before transmitting; batches up to 10,000; handles 200/202 and fails on 403/422/429/5xx. This is an operator-run submission tool, not automatic notifications from admin saves.
- `scripts/audit-bing.mjs`: repeatable read-only live sitemap checks.

## Activation after deployment

Cloudflare CLI is not authenticated. No deployment performed. Log into the existing Jacketee Cloudflare account (do not use a temporary account). Deploy the reviewed workspace changes using the established release process, including any existing uncommitted changes only after reviewing them.

1. Verify https://www.jacketee.com/9f1d3b7e6c824a50b3d8e7192a6c4f05.txt returns 200 and the exact key.
2. Run `node scripts/indexnow.mjs --sitemap` to preview; then `node scripts/indexnow.mjs --sitemap --submit` once for initial discovery.
3. After subsequent public content deployments, run `node scripts/indexnow.mjs <changed canonical URLs> --submit`. Do not repeatedly send unchanged full sitemaps. Deleted URLs may be explicitly submitted if their removal was intended.
4. Run `node scripts/audit-bing.mjs` and confirm the retired hoodie alias is absent from sitemap.
5. Re-enable browser access in Work settings to verify Bing sitemap submission, read the queued scan results, and investigate the remaining historical warning/exclusions.

Protocol reference: https://www.indexnow.org/documentation. Receipt of URLs is not a guarantee of indexing/ranking.

## Validation

- IndexNow regression checks passed (key file, canonical/private URL guards, payload, pending validation and error handling).
- Sitemap regression checks passed (alias replacement, deduplication and root URL).
- Targeted lint and whitespace checks passed.
- Live initial IndexNow preview successfully collected 318 canonical-host URLs; no IndexNow submission was sent because the key file has not been deployed.
- Full TypeScript check passed. Production Webpack build passed with the required network/file access, including all 116 static pages. Initial restricted attempt failed on font network access/file permissions. Temporary build output was moved under ignored `output/bing`; generated TypeScript include changes were removed.
