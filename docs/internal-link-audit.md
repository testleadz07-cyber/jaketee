# Internal Link Audit

## Coverage Added

- Every published or scheduled blog post now has at least one relevant, in-stock tagged product. Existing product selections were preserved.
- Blog product cards now use canonical nested category URLs instead of legacy `/product/{slug}` paths.
- Every blog article displays a topic-aware category or bulk-order link.
- Every blog article links to Materials & Colors, Patches & Embroidery, Size Guide, About Jacketee, FAQ, and Contact.
- Product pages already link contextually to Materials & Colors and Patches & Embroidery. Their sizing, FAQ, policy, and contact sections provide the related support links.
- Category pages already link to materials, decoration, shipping, returns, size guidance, contact, and the relevant school/team bulk-order path.
- Header and footer navigation provide site-wide links to About, Contact, Size Guide, FAQ, materials, patches, tracking, policies, bulk-order audiences, custom landing pages, and primary shopping categories.

## Orphan Assessment

No known public orphan route was found in the source-level review:

- Products receive incoming links from category grids and, where assigned, blog product cards.
- Categories and subcategories receive incoming links from navigation, category hierarchy, home content, and blog recommendations.
- Published posts receive incoming links from the blog index, blog-category pages, and related-post sections.
- The five new Task 17 landing pages are linked from header and footer navigation.
- Support, trust, fulfillment, and legal pages are linked from global navigation or contextual resource sections.

Draft blog posts are intentionally excluded from public navigation until published. Admin, API, cart, checkout, account, and order-flow URLs are not treated as indexable content pages.

## Final Rendered Audit

Run the sitemap-driven crawler against the final local or deployed site:

```bash
npm run audit:internal-links
```

Set `INTERNAL_LINK_BASE_URL` when the site is not running at `http://localhost:3000`. The crawler reports sitemap URLs with no incoming crawlable link and any sitemap page returning a non-success status.

The rendered crawl is deferred until the final combined verification pass at the owner's request.
