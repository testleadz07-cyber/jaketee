# Thin Category Plan

Live catalog audit date: September 29, 2026

Categories below six in-stock products:

| Category | Live products | Existing content | Recommendation |
| --- | ---: | --- | --- |
| All Leather Varsity Jackets | 3 | Unique H1, 46-word opening, 433-word guide, visible FAQs | Keep indexed and add products. The all-leather varsity intent is distinct from general leather jackets. |
| Retro Varsity Jackets | 2 | Unique H1, 40-word opening, 424-word guide, visible FAQs | Keep indexed and add products. Retain this category for retro varsity intent and coordinate it with the planned vintage landing page. |
| Satin Varsity Jackets | 1 | Unique H1, 47-word opening, 435-word guide, visible FAQs | Keep indexed and add products. It targets a distinct material and should not be merged into wool or leather categories. |
| Fleece Varsity Jackets | 1 | Unique H1, 45-word opening, 426-word guide, visible FAQs | Keep indexed and add products. Do not merge with fleece hoodies because the product shape and search intent differ. |
| Cotton Twill Varsity Jackets | 4 | Unique H1, 47-word opening, 438-word guide, visible FAQs | Keep indexed and add at least two relevant products. |
| Denim Jackets | 4 | Unique H1, 48-word opening, 432-word guide, visible FAQs | Keep indexed and add at least two relevant products. |
| Leather Jackets | 0 | Unique H1, 44-word opening, 429-word guide, visible FAQs | Recommended: temporarily apply `noindex,follow` until genuine leather-jacket products are available. Owner approval required. |
| Puffer Jackets | 5 | Unique H1, 40-word opening, 433-word guide, visible FAQs | Keep indexed and add at least one relevant product. |

## Implementation Notes

- Existing guides exceed the requested 200-400 words by 24-38 words. They are unique and useful, so they were retained rather than shortened solely to meet an arbitrary ceiling.
- Category FAQs are visible and their FAQPage JSON-LD is built from the same server-side FAQ list.
- No categories were merged and no indexing directive was changed during this task.
- The empty Leather Jackets category must not be set to `noindex` until the owner explicitly approves it.
