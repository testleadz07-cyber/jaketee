# Hooded collection and sizing article content update

Applied 5 November 2026 to the configured MongoDB, in a transaction.

## Updated records

- Category `hooded`: `introShort`, `introLong`, `updatedAt`. Shortened repeated introductory copy; added two existing wool/leather product links and a clearer hoodie comparison. Other material, fit, artwork and care sections retained.
- Published article `how-to-choose-custom-varsity-jacket-size`: `content`, `updatedAt`. Replaced only the “Use the official size chart” paragraph; added `/size-guide#size-charts` with “varsity and letterman jacket size charts” anchor and body-versus-garment measurement guidance.
- Three published FAQs scoped only to `displayPages: ['hooded']`, category `Hooded`, source batch `hooded-sizing-2026-11-05`. Detailed sizing, materials/product selection and customization answers. Existing shared FAQs unchanged.

The deployed page generates generic fallback questions. Initial browser verification showed duplicate sizing/material questions when newly written questions used different wording. The new scoped records therefore use the exact existing template question labels, with the improved answers. This suppresses the generic fallbacks without deploying application code or altering other categories. The proposed separate hoodie-vs-jacket explanation is included in the material answer and existing collection-guide section. No claim that the generic visible headings were renamed.

## Backups and repeatability

- Original pre-change backup: `local-db-backups/hooded-sizing-2026-11-05-1793826121239.json`.
- Backup before FAQ-label alignment: `local-db-backups/hooded-sizing-2026-11-05-1793826233612.json`.
- Backups use BSON Extended JSON, preserving ObjectIds and Dates. They are ignored by git through `local-*`.
- Script: `scripts/apply-two-content-updates-2026-11-05.mjs`. Defaults to preview; `--apply` writes a backup before a transaction. FAQ identity is source batch plus order so reruns update the same three records.

## Validation

- Exact linked products checked active and in the hooded category before writing.
- Transaction guards detect concurrent category/article edits.
- Fresh database reads verified the expected content and exactly three batch FAQs.
- All other category fields verified unchanged, including name, slug, heading, SEO title/description and image. All other article fields verified unchanged, allowing concurrent view-count increments.
- Products, prices, other articles/categories and application code unchanged.
- Initial browser verification showed the revised collection-guide intro and the first FAQ version through the live site's data layer. After FAQ-label alignment, repeated public-page reloads still served the first FAQ version and the old article paragraph. Full public rendering verification remains pending cache refresh; do not claim the final article link or duplicate suppression has been verified live.
- Local blog-post data caching is configured for 3,600 seconds (`src/lib/public-blog.ts`); direct MongoDB writes do not call the application's cache invalidation. No cache-purge endpoint was called. The authenticated admin article route showed “Blog post not found”, so a UI save/cache-refresh path was not available in this check. No other admin records were changed.
- Script syntax check passed (`node --check`). Content-only data changes required no application build/deployment.

## Measurement

Do not use this database-write time as proof of a Google crawl. Record the next URL Inspection crawl after the updated live content is visible, then compare the same target markets and queries over equal periods. Keyword Planner validation and GSC baseline are saved separately in this directory.

## Follow-up live verification

- Updated “About Hooded” paragraph is visible live. The hero still has the previous text.
- The three template FAQ labels now appear without the initial duplicate questions, but expanding the material answer shows the generic fallback rather than the saved detailed answer.
- Root cause found in `src/app/[...slug]/page.tsx`: the last-wins Map inserted generic `buyingFaqs` after saved `faqs`, overwriting matching saved answers. This disproves the earlier assumption that FAQ display was only a cache issue.
- Local fix reverses that insertion order so saved answers win. `scripts/test-collection-faq-precedence.mjs` exercises the actual selector and passes: all three saved answers retained, missing-topic fallbacks retained, no duplicate questions. Diff whitespace check passed.
- This application fix is **local, not deployed**. The workspace also contains unrelated changes; no whole-workspace production deployment was performed.
- The public sizing article still shows the old paragraph; its new chart link remains unverified live. DB saved content was verified earlier. Blog cache configuration is 3,600 seconds; exact live refresh time is not established.
- Read-only UI evidence: `live-verification-2026-11-05.json`. Do not report this release as fully verified live yet.
