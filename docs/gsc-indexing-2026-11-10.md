# Search Console indexing audit — 10 November 2026

Property: `sc-domain:jacketee.com`. The visible report was last updated 6 November: 322 indexed, 183 not indexed, nine non-empty reasons. All 183 example URLs were collected, including rows beyond the default first ten. Inventory: `scripts/gsc-urls-2026-11-10.json`. Public live HTTP audit: `output/gsc/live-audit.csv` and `output/gsc/live-audit.json`.

## Findings and disposition

| GSC reason | URLs | Live findings | Action |
| --- | ---: | --- | --- |
| Page with redirect | 19 | 18 reach 200; the obsolete `stage-dg3` test product is 404 | Keep intended HTTP/host/category redirects. Leave deleted test data 404. Do not remove valid redirects merely to pass validation. |
| Crawled, currently not indexed | 6 | Two tag archives and two fonts return 200; manifest returns 200; one old font returns 404 | Exclude tag filters from indexing while allowing following article links. Fonts and manifest need not appear in search. Old hashed fonts may expire. |
| Alternate with proper canonical | 44 | All 200: 42 blog tag filters, two shop pagination URLs | Tag filters become `noindex, follow`. Shop pages 6 and 7 receive their own paginated canonical and title. |
| Excluded by noindex | 7 | All 200. Five product URL entries are now indexable with correct canonical. Only checkout/login remain noindex | Preserve private transactional page exclusions; no product exclusion to remove now. |
| Google chose different canonical | 15 | All blog tag filters, 200, normalized self canonical | Apply the same deliberate tag-filter exclusion. Google-selected canonical is historical GSC data, not available from a normal HTTP response. |
| Redirect error | 4 | All now make one permanent host redirect to 200 with correct canonical | Existing validation is running; do not restart it. |
| Server error 5xx | 2 | Both articles now make one permanent host redirect to 200 with correct canonical | Existing validation is running. The old server errors do not reproduce. |
| Not found 404 | 2 | One obsolete font; one missing customization product | Preserve old font 404. Redirect the missing customization action to the working fleece hoodie designer, which supports full-zip and colors; do not substitute a different colored product. |
| Discovered, currently not indexed | 84 | All reach 200 without noindex; 83 original URLs are in sitemap, the remaining pink hoodie redirects to its retained canonical listing | No availability issue found. Keep these public pages indexable; Google still controls crawl/index scheduling. |

Baseline: 179 final 200 responses, four final 404s, zero request errors. Four legacy category aliases take two redirects; these are short working chains, not the reported redirect errors. Checkout/login are intentionally excluded. No promise of indexing or ranking is implied by a successful HTTP check.

## Changes

- `src/app/blog/page.tsx`: `noindex, follow` for tag-filtered archives only. Main blog, numbered archives, curated categories and article pages stay eligible for indexing. This resolves the thin-filter intent across 59 report entries; it does not attempt to index those filters.
- `src/app/shop/page.tsx`: page-aware metadata; pages greater than one no longer canonicalize to page one.
- `src/data/url-redirects.json`: the deleted product's customization URL permanently redirects to `/design/hoodie`.
- Repeatable read-only audit and metadata regression checks accompany the changes.

## Validation

- Live baseline audit completed for all 183 URLs.
- Metadata regression checks passed: first and later shop pages, normalized tag canonical, tag noindex/follow, public archive eligibility, and customization redirect destination.
- Full typecheck passed. Targeted lint finished without errors; its unused suppression warning was removed.
- Production build passed with Webpack (`node node_modules/next/dist/bin/next build --webpack`). The initial default Turbopack attempt failed with the existing Windows child-process/font CSS issue. The first restricted Webpack attempt lacked font-download/file access; the same build with required access passed without application configuration changes.
- Production preview verification passed for `/shop`, `/shop?page=6`, `/shop?page=7`, `/blog`, both crawled tag archives, and the legacy customization redirect to a 200 hoodie designer. Preview server stopped after verification. Repeat with `node scripts/test-gsc-rendered.mjs [base-url]`.
- Cloudflare CLI reports no authenticated deployment account, and no Cloudflare deployment token is configured in the project's environment files. Deployment and live post-release verification require that connection.
- GSC validation was not restarted. Existing running validations should finish; expected redirects, fonts, login/checkout and tag exclusions are not categories that should be forced to zero.
