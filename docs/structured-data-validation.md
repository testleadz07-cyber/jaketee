# Structured Data Validation

Use Google's Rich Results Test after deployment: https://search.google.com/test/rich-results

Test these representative URLs:

| URL | Expected structured data |
| --- | --- |
| https://www.jacketee.com/ | Organization, WebSite, SearchAction |
| https://www.jacketee.com/varsity-jackets | CollectionPage, ItemList, BreadcrumbList, FAQPage |
| https://www.jacketee.com/varsity-jackets/wool-leather | CollectionPage, ItemList, BreadcrumbList, FAQPage |
| https://www.jacketee.com/varsity-jackets/all-leather/all-black-nappa-leather-letterman-jacket | Product, Offer, shipping, returns, BreadcrumbList, FAQPage |
| https://www.jacketee.com/bomber-jackets | CollectionPage, ItemList, BreadcrumbList, FAQPage |
| https://www.jacketee.com/custom-letterman-jackets | CollectionPage, ItemList, BreadcrumbList, FAQPage |
| https://www.jacketee.com/faq | FAQPage |
| https://www.jacketee.com/blog/varsity-jacket-vs-letterman-jacket | Article and BlogPosting |

Product AggregateRating and Review objects should appear only on products with approved reviews. Confirm that Google reports no fabricated rating data on products without approved reviews.
