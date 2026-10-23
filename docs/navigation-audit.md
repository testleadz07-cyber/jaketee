Navigation and internal-link audit
=================================

The database inventory and navigation-field scan covered all 22 collections
and 1,589 documents. The full public-content audit checked 72 blog posts,
152 FAQs, 21 categories, 13 blog categories, 138 products, 45 section images
and the store settings. No exact obsolete navigation captions remain.
Blog tagged-product/category and product-category references are valid.
Longer article/product titles and prose retain
their original wording. Header labels are hardcoded and already updated.

The route/content audit examined 588 internal-link occurrences against 305
static and database-derived routes. It found 16 obsolete link occurrences in
11 fields across one blog post and ten category documents. The three repairs:

| Old URL | Destination |
| --- | --- |
| /custom-design/varsity-jackets | /design/varsity |
| /wholesale-jackets | /bulk-orders |
| /varsity-jackets/wool-and-leather | /varsity-jackets/wool-leather |

`src/data/content-link-repairs.json` adds permanent redirects through
`next.config.ts`. These take effect when the dev server restarts or the site
is rebuilt and deployed. The existing header links are unchanged.

Database migration (dry-run is the default):

```sh
node scripts/update-navigation-content.mjs
node scripts/update-navigation-content.mjs --apply
node scripts/update-navigation-content.mjs --rollback --apply
```

Applied 11 link-content field updates and renamed the blog category display name
from `Bulk Orders` to `Bulk & Teams`. A repeat dry-run reports zero changes.
The footer builder links, bulk breadcrumbs (including structured data), home bulk
link and header dropdown caption now use the updated wording. All route slugs
and destinations remain unchanged except the three explicitly repaired stale links.
Apply saves exact
original fields in `docs/navigation-content-backup.json` before writing. Preserve
that backup for rollback. Both directions compare current values before writing
to avoid overwriting concurrent edits. Rerunning apply is safe. Exact old menu
captions in public content are also supported; slugs and article prose are not
renamed. The connected database has been updated; the backup contains all 12
original field values.

Rerun the route audit with `node scripts/audit-content-navigation.mjs`.
The JSON report records 0 unresolved route targets after accounting for the
three new redirects. This checks route existence, not HTTP rendering or fragment
IDs. Database-derived category/product routes can still fail at runtime.

For HTTP coverage run `node scripts/audit-internal-links.mjs http://localhost:3000`
against a responsive server after restarting it. The crawler follows discovered
internal page links, including those absent from the sitemap, and records HTTP
failures/timeouts. It skips action endpoints, assets, fragments and query variants.
The existing local server was unresponsive. A separate server on port 3100 with
`NEXT_DIST_DIR=.next-nav-audit` started successfully, but compilation did not finish
during verification and HTTP requests timed out. Full rendered-page verification
remains outstanding. No claim of site-wide HTTP success is made.

Blog loaders use request-scoped React cache, not a persistent content cache.
After an approved database migration, rebuild/redeploy any prerendered pages and
purge any separately configured hosting/CDN page cache. No menu Redis/tag cache
was found.
