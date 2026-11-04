# Priority page ranking audit — 5 November 2026

Read-only audit of Search Console, current live pages and relevant local source. No product, article, category, database or application code changed.

## Reporting scope

- Recent: 6 October–2 November 2026. Previous: 8 September–5 October 2026.
- Web search, all devices. Complete performance data currently ends 2 November.
- Target group: US, Canada, UK, Netherlands, Germany, France, Italy, Spain, Ireland, Poland, Sweden, Belgium, Austria, Denmark, Finland, Norway, Switzerland, Portugal and Czechia. This is a defined European-market subset, not all Europe. Pakistan excluded.
- Raw browser evidence: `gsc-priority-page-audit-2026-11-05.json`. Comparison row order: current clicks, previous clicks, click difference, current impressions, previous impressions, impression difference.
- Query rows omit anonymized queries. Chart and table totals can differ; do not treat visible query sums as complete traffic attribution. The captured country/page tables did not fully reconcile with chart totals; use the directly observed rows below, not an inferred distribution of every impression.
- The earlier October audit files described in chat are absent from this checkout. Historical change dates are conversation context, not deployment proof.

## What is actually happening

Overall clicks increased from 22 to 67 and impressions from 1,560 to 5,056. CTR changed from 1.4% to 1.3%; average position from 10.7 to 16.2. These are different query mixes, not evidence that every existing keyword lost rank.

| Page | Previous impressions, worldwide | Recent impressions, worldwide | Recent clicks, worldwide | Recent target impressions | Recent target clicks | Recent target position |
|---|---:|---:|---:|---:|---:|---:|
| /size-guide | 236 | 989 | 4 | 86 | 1 | 44.0 |
| /varsity-jackets/hooded | 0 | 270 | 2 | 100 | 1 | 25.9 |
| /materials-colors | 144 | 169 | 1 | 12 | 0 | 47.9 |
| /blog/what-does-a-varsity-jacket-represent-today | 319 | 46 | 0 | 1 | 0 | 5.0 |

The selected three-month view is actually 8 September–2 November (56 days). Target-group impressions over that entire span are size guide 98, hooded 100, materials 28, meaning 28. Therefore the previous 28-day target counts were respectively 12, 0, 16 and 27. Do not subtract average positions across periods.

### 1. Hooded category: first commercial content priority

Target queries in the recent period:

| Query | Impressions | Clicks | Position |
|---|---:|---:|---:|
| varsity jacket with hood | 30 | 0 | 30.5 |
| hooded varsity jacket | 8 | 1 | 23.5 |
| varsity jacket with hoodie | 8 | 0 | 12.5 |
| letterman jacket with hood | 8 | 0 | 19.1 |
| custom varsity jacket with hood | 3 | 0 | 5.3 |

The page already has 18 products, a relevant H1, relevant intro, product links, size guide and a collection guide. Its buying intent matches collection results such as True Varsity and Dear Varsity. Do not replace it with a long informational article.

Verified gap: the FAQ labels are generic: “How do I choose a size for Hooded?”, “Which materials and colors are available for Hooded?” and “Can I customize Hooded?”. The collection guide repeats the introduction. These are opportunities for clearer purchase guidance, not proof of the cause of low rank.

Prepared additions/replacements, preserving URL, H1 and existing product descriptions:

**Is a hooded varsity jacket the same as a hoodie?**

A hooded varsity jacket combines the varsity jacket shape with a hood. A hoodie is usually a sweatshirt. Compare the actual body fabric, sleeve material, lining and closure on the product page rather than choosing by the word “hoodie” alone.

**Which hooded letterman jacket should I choose?**

Start with the body and sleeve colors you want, then compare the materials and lining listed for that style. For a wool-and-leather option, review the Black Wool and White Leather Sleeves Varsity Hoodie Jacket or the Light Grey Wool and Black Leather Sleeves Varsity Hoodie. Check the exact product specifications before ordering.

Link those names to the existing hooded product URLs, not new landing pages. The five owner-confirmed wool/cowhide styles have fixed hoods and quilted lining; do not apply that claim to all 18 without checking each product.

**How do I choose a size for a varsity jacket with a hood?**

Measure your chest and waist, then compare the selected product’s measurements. If you will wear layers underneath, also compare a jacket that fits comfortably over those layers. Use the size guide and ask for the style’s measurements when you are between sizes.

Keep the existing customization/returns answers where accurate; do not add duplicate questions or rewrite confirmed product copy. Before implementation, check the category FAQ renderer so changes affect only this collection.

### 2. Size guide: broad keyword position is weak

Recent target queries include “jacket size guide” (10 impressions, position 76.6), “jacket sizing guide” (3, 75.3), “jacket measurement chart” (2, 84.0), and “varsity jacket size chart” (1, 39.0). These are small samples; the page-wide 13.6 worldwide position does not describe these buying queries.

The live guide already contains a chart, body-versus-garment explanation, measuring illustrations, unit options, fit guidance and related articles. A missing-size-chart diagnosis would be incorrect.

Next controlled content test: improve relevance to varsity/letterman buyers using an existing fit article and clear context around the reference chart. Do not invent measurements, create country-specific duplicate pages, or represent reference dimensions as a specification for every product. A title change alone is not an established remedy for position 70+.

Suggested short context, only if not covered by adjacent copy at implementation time:

**Using this guide for a varsity or letterman jacket**

Use the body chart to compare chest and waist circumferences. If you are comparing a jacket you own, use the finished-garment chart instead: flat chest width is a different measurement from body chest circumference. Check the chosen style’s sleeve and back length, and allow for the clothing you plan to wear underneath.

The existing “How to Choose the Right Size for a Custom Varsity Jacket” article was inspected live. Its “Use the official size chart” section contains a generic paragraph without a contextual chart link. A shared support block and footer already link to `/size-guide`, so this is a contextual-link improvement, not an orphan fix.

Prepared replacement for that paragraph: “Use the [jacket body and garment size charts](/size-guide#size-charts) to compare measurements using the same method and units. Start with chest and waist circumferences for the body chart; use flat garment measurements when comparing a jacket you already own. For a team order, confirm the selected style’s measurements before collecting everyone’s final sizes.”

### 3. Meaning article: real visibility decline, cause unproven

Worldwide page impressions declined 319 → 46 (about 86%). Target-group impressions declined 27 → 1. The query “varsity jacket meaning” had 71 worldwide reported impressions in the previous period and none reported in the recent period. Only 8 of its previous impressions were in the defined target group.

The current article already has a direct definition, patch meaning, letterman terminology, modern use, examples and contextual collection/material links. Its title and summary match informational intent. Competitor results also use definitions and guide formats. No demonstrated intent mismatch or duplicate article requiring deletion was found in this focused review.

The complete 56-day daily table was inspected. Visibility was concentrated in 25 September–3 October: 14, 32, 36, 41, 35, 31, 52, 41 and 32 impressions respectively. It dropped to 4 on 4 October and 1 on 5 October; subsequent daily counts were 0–5 through 2 November. The observed break therefore predates the reported 28 October rewrite by over three weeks. It cannot have been caused by that later rewrite. Why the earlier burst ended remains unproven; the data does not distinguish demand, query exposure or competition as the cause.

After the recorded 29 October crawl, 30 October–2 November delivered 1, 3, 5 and 3 impressions. That is too little post-crawl evidence to grade the revised content. Preserve it. No redirect, merge or second meaning article justified yet.

### 4. Materials: worldwide ranking overstates target-market performance

Worldwide “varsity jacket material”: 33 recent impressions at position 5.4. In the defined target group: just 1 recent impression at position 11.0. The target page has only 12 impressions and average position 47.9. This does not establish a title/CTR failure in the US/UK/Canada.

The current live page already has the direct material answer, material comparison, swatches, product-category links and care/selection context. Google’s recorded crawl predates the reported content update. Do not repeat another rewrite before a new crawl can evaluate the existing work.

## Crawl and canonical checks

All four URLs: indexed, crawl allowed, fetch successful, indexing allowed; Google selected the inspected main URL.

| Page | Recorded last crawl | Canonical in recorded crawl | Current live canonical |
|---|---|---|---|
| Size guide | 2 Nov, 06:44:04 | `https://jaketee.testleadz07.workers.dev/size-guide` | Correct production URL |
| Meaning article | 29 Oct, 22:27:07 | None reported | Correct production URL |
| Materials | 24 Oct, 02:42:24 | Correct production URL | Correct production URL |
| Hooded | 23 Oct, 23:33:56 | Correct production URL | Correct production URL |

**Size-guide discrepancy resolved for the current response:** a fresh Google live test on 5 November returned “URL is available to Google”. Searching its tested HTML for `canonical` showed `https://www.jacketee.com/size-guide`, also confirmed in the normal live DOM. The old workers.dev canonical is a historical signal, not a confirmed current broken canonical. The live test does not update Google’s indexed version or guarantee ranking.

Local size-guide metadata still derives the origin from `NEXT_PUBLIC_APP_URL`; current live output is correct. Before a future deployment, validate that variable is the production origin. A production-origin guard is a preventive engineering option, not an urgent content change proven necessary now.

All recorded inspections showed “Temporary processing error” under Sitemaps. This alone does not prove sitemap failure: these four pages are indexed. Check the Sitemaps report before opening a sitemap repair task.

## Execution order and measurement

1. Meaning article daily decline timing is complete: the break occurred 4 October, before the reported rewrite. Preserve the article and measure post-crawl target queries rather than reverting it on this evidence.
2. Implement the small hooded-category guide/FAQ improvement above after verifying the category data structure and taking a targeted backup. No changes to the 18 product descriptions or slug.
3. The sizing article link was checked. Replace its generic chart paragraph with the specific contextual link prepared above. Add the short varsity-specific chart context on the guide only if it provides information not already covered.
4. Materials: preserve current content; verify the next successful indexed crawl contains it. Repeated indexing requests do not establish ranking improvement.
5. Record release date, first post-release crawl, target query impressions/clicks/position. Review after 14 days for crawl status and after a comparable 28-day period for performance. Sparse queries need more time. Do not infer causality from whole-site averages or unequal cumulative periods.

Daily timing and the selected sizing article's link check are complete. This focused audit does not claim to have measured backlinks, penalties, all-country SERPs, or a full-site cannibalization graph. Exact ranking causality cannot be established from these small samples.

## Sources

- Authenticated Search Console UI; raw snapshot alongside this report.
- Current live pages: https://www.jacketee.com/size-guide, https://www.jacketee.com/materials-colors, https://www.jacketee.com/varsity-jackets/hooded, https://www.jacketee.com/blog/what-does-a-varsity-jacket-represent-today.
- Intent examples, not verified country-specific Google positions: https://truevarsity.com/collections/hooded-varsity-jackets, https://dearvarsity.com/product-category/hooded-varsity-jacket/, https://truevarsity.com/blogs/guides/varsity-jacket-guide.
- Google report interpretation: https://support.google.com/webmasters/answer/7576553.
- Google canonical guidance: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls.
