# FAQ merges completed

The user approved combining the FAQ topics and publishing unique answers on October 9, 2026.

- Published all 13 combined answers from the reviewed proposals.
- Preserved 13 redundant database copies as unpublished drafts with references to their merged record. No records were deleted.
- Preserved the union of each group's display-page targets.
- Stored original question names on the merged records to suppress duplicate fallback questions on `/faq`.
- Updated shipping and returns FAQ lookups to use the new question names.

The configured database now contains 140 unique published FAQs. The local FAQ page combines these with 11 unique fallback FAQs, for **151 unique visible FAQs**. All 151 answer panels rendered in the server-rendering check while remaining collapsed. The acceptance text “Genuine sheepskin is natural” remains present.

The migration ran in a MongoDB transaction after saving a full FAQ backup. It checks the approved source text before writing, rejects concurrent changes, verifies every merged answer is published exactly once, and rejects duplicate published question names. A second dry run proposed zero changes.

Artifacts in `output/seo-fixes/`:

- `faq-merge-backup-*.json`: complete pre-merge FAQ backup.
- `faq-merge-apply-plan.json`: before/after changes for all 26 updated records.
- `faq-merge-result.json`: verification of the saved data.
- `faqs-after-merge.json`: saved FAQ snapshot.
- `faq-merge-idempotence.txt`: second dry run with zero changes.
- `merged-component-ssr.html` and `merged-component-ssr-results.json`: rendered FAQ answers and verification.

The database content is published. Local code changes, including fallback suppression and the shipping/returns lookups, still need deployment for the live site to use them. This verification used the actual shared accordion with saved database data, rather than a new HTTP run; the earlier development-build limitation is documented in the [implementation report](seo-fixes-2026-10-08.md).
