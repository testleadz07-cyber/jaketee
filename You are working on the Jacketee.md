You are working on the Jacketee.com codebase (Next.js e-commerce store for custom varsity, letterman, bomber and other jackets, targeting US, UK and Canada). A full SEO and conversion audit was completed. Fix the issues below ONE AT A TIME, in the exact order listed.

WORKING RULES
1. Before starting each task, explore the relevant code and tell me which files you will change and how.
2. Complete only one task, then stop. Show me a summary of changes (files, before/after) and wait for my "next" before moving on.
3. Do not skip, merge, or silently drop any task. If a task cannot be done in code, say so and give me the exact manual steps instead.
4. Do not invent data (reviews, prices, delivery times, ratings). If data is missing, add a clearly marked placeholder or config value and ask me for the real value.
5. Keep existing URLs stable. Any URL change must include a permanent 301 redirect.
6. After each task, run the build and lint and confirm nothing broke.
7. Keep a running checklist file at /docs/seo-fix-log.md, marking each task Done, Blocked or Manual.

=== PHASE 1: CRITICAL ===

TASK 1: Indexing readiness (technical)
- Confirm no page sends noindex via meta robots, X-Robots-Tag headers, or next.config / middleware.
- Confirm robots.txt allows crawling of all public pages (current rules: disallow /admin/, /api/, /checkout/, /cart, /profile/, /order-confirmation/ only).
- Confirm sitemap.xml includes every public page: home, all category and subcategory pages, all product pages, bulk-order pages, support pages, blog index and every blog post. Include accurate lastmod. Exclude cart, checkout, login and profile.
- Confirm canonicals consistently use https://www.jacketee.com and non-www redirects to www with a 301.
- Confirm product, category and blog content renders server-side (visible in raw HTML, not only after client JS).
- Report any page returning non-200 status.
- Give me a manual checklist: verify domain in Google Search Console and Bing Webmaster Tools, submit sitemap, request indexing for the top 20 URLs.

TASK 2: Pricing and fake discounts
- The "Black Wool and White Leather Sleeves Varsity Hoodie Jacket" shows $70.00 against a $379.00 compare-at price (82% off). Flag this as a likely pricing error and ask me for the correct price.
- Audit every product's compare-at price. List all products with a discount above 20% in a table (name, price, compare-at, %).
- Add a rule so a compare-at price only displays if it is explicitly flagged as a real, documented previous price. Otherwise hide the strikethrough and "% OFF" badge.
- Remove "-XX%" badges from featured and new-arrival cards unless the discount is flagged as genuine.

TASK 3: Reviews system
- Every product shows "No reviews yet" and "Loading reviews..." Check the reviews component works end to end (submit, store, moderate, display).
- Add support for importing verified reviews from a CSV (fields: product slug, reviewer name, rating, text, date, source such as "Etsy - Clothaa") with source attribution shown.
- Add a post-purchase review request email trigger (X days after delivery, configurable).
- Hide the "Loading reviews..." state if there are zero reviews; show a clean "Be the first to review" prompt instead.
- Manual steps for me: create Trustpilot and Google Business Profile listings.

TASK 4: Customization on product pages
- The homepage promises "Custom Varsity Jackets, Designed Your Way" but product pages only offer quantity and Add to Cart.
- Add a "Customize this jacket" section on every customizable product with fields: body color, sleeve color, rib trim color, size, chest patch/letter, back text or logo upload, sleeve text, name, number, notes.
- Add a "Request a bulk quote" button linking to /bulk-orders with the product pre-filled.
- Custom options must carry into the cart, order record and order confirmation email.
- If price varies by option, show the updated price live. If pricing is not yet defined, submit as a quote request and ask me for the rules.
- Add estimated production and delivery time next to the Add to Cart button, driven by a config value (ask me for the value).

TASK 5: Brand trust and About page
- A 2019 third-party warning page about a previous owner of this domain ("Jackettee Store") ranks for the brand name.
- Strengthen /about with real business history, parent company relationship to Clothaa (operating since 2013), manufacturing details, contact details and a physical/business address (ask me for these).
- Add Organization schema (name, logo, url, sameAs links to Etsy, social profiles, Trustpilot) site-wide.
- Add a visible trust strip (secure checkout, returns policy, real reviews count once available).

=== PHASE 2: ON-PAGE SEO ===

TASK 6: Duplicate product descriptions
- Find every product whose description is duplicated or near-duplicated (example: "Stylish bomber jacket with superior craftsmanship. Available in leather, suede, satin, and nylon options.").
- List them all, then write unique 150 to 300 word descriptions for each, starting with varsity products, covering material, fit, customization options, use case and care. Use the target keyword map in Task 16.
- Show me 3 samples for approval before writing the rest.

TASK 7: Typo in product title and URL
- Fix "Premium Qaulity Sheep Leather Bomber Jacket In Red" to "Premium Quality..." in title, slug and all internal links.
- Add a 301 redirect from the old URL to the new one.
- Search the entire catalog and content for other spelling errors and list them.

TASK 8: Keyword-stuffed product titles
- Rewrite titles like "Bomber Jacket With Piping Satin Women Girls Mens" and "Leather Jacket Bomber Sheep Mens" into clean, natural titles (format: [Material] [Color] [Style] Jacket, max ~60 characters).
- Keep slugs unchanged unless I approve; if changed, add 301s.
- Provide a before/after table for all renamed products.

TASK 9: Meta titles and meta descriptions
- Product meta descriptions currently use raw spec lines with line breaks (example: "Melton Wool & Cowhide Leather. Diamond quilted lining...").
- Generate unique meta titles (50 to 60 chars) and meta descriptions (140 to 155 chars, no line breaks) for every product, category, subcategory, bulk page, support page and blog post.
- Add a fallback template so no page ever outputs an empty, duplicate or line-broken description.
- Output a table of all pages with the new title and description.

TASK 10: Remove meta keywords tag
- Remove the site-wide meta keywords tag ("Jacketee,custom jackets,varsity jackets,...") from all pages.

TASK 11: Open Graph and Twitter tag consistency
- The homepage Twitter title/description ("Custom Varsity & Bomber Jackets", mentions puffer and leather) does not match the page title and meta description (varsity and letterman). Align all OG and Twitter tags with each page's title and description.
- Set og:type to "product" on product pages and "article" on blog posts.
- Ensure every page has og:image with correct dimensions and alt text.

TASK 12: Structured data
- Add or fix JSON-LD on:
  - Product pages: Product, Offer (price, priceCurrency USD, availability, url, shipping details, return policy), AggregateRating and Review only when real reviews exist, brand.
  - Category pages: BreadcrumbList and ItemList.
  - FAQ blocks on product and FAQ pages: FAQPage.
  - Blog posts: Article with author and dates.
  - Site-wide: Organization and WebSite with SearchAction.
- Validate the output shape and tell me which URLs to test in Google's Rich Results Test.

TASK 13: Thin categories
- Leather Jackets has 1 product, Denim 4, Puffer 5.
- For each category under 6 products: add a 200 to 400 word intro and FAQ block, and propose whether to add products, merge into a parent, or set noindex until populated. Ask me before applying noindex.
- Ensure every category page has a unique H1 and intro copy.

TASK 14: Delivery time and shipping clarity on product pages
- Show estimated production time and shipping window on every product page, bulk page and cart (config-driven values from Task 4).
- Clarify how the "Free standard shipping over $50" rule applies to custom items and international orders (US, UK, Canada). Ask me for the actual policy.

TASK 15: Image SEO
- Audit all product and category images for descriptive alt text; many alt texts only repeat the product name. Write alt text that describes view and detail (front, back, sleeve detail, patch close-up).
- Confirm images are served in modern formats with proper sizes and lazy loading below the fold, and that the hero image is prioritized for LCP.

=== PHASE 3: CONTENT AND KEYWORDS ===

TASK 16: Keyword mapping
Map one primary keyword per page and add it to the title, H1, first paragraph and meta description. Avoid two pages targeting the same primary keyword.
- Home: custom varsity jackets
- /varsity-jackets: custom letterman jackets / personalized letterman jacket
- /varsity-jackets/wool-leather: wool and leather varsity jacket / leather sleeve letterman jacket
- /varsity-jackets/satin: satin varsity jacket
- /varsity-jackets/all-leather: all leather varsity jacket
- /bulk-orders: bulk varsity jackets / wholesale varsity jackets
- /bulk-orders/schools: school letterman jackets / team varsity jackets
- /bulk-orders/corporate: corporate varsity jacket / custom company jackets
- /patches-embroidery: chenille patches for letterman jacket / varsity jacket embroidery / varsity jacket letters
- /bomber-jackets: custom bomber jacket
- /coach-jackets: custom coach jacket
- /leather-jackets: custom leather jacket
Output the full mapping table and flag any page with no clear target.

TASK 17: New landing pages
Create these pages with unique copy (600 to 1000 words), relevant product grid, FAQ with FAQPage schema, internal links, and a customize/quote CTA:
1. /varsity-jackets/oversized (oversized varsity jacket)
2. /varsity-jackets/vintage (vintage varsity jacket)
3. /bulk-orders/sorority-fraternity (sorority jackets, fraternity jackets, Greek life jackets)
4. /bulk-orders/senior-class (senior jackets, class of 2027 jackets)
5. /bulk-orders/cheer (cheer jackets)
Add them to navigation, footer where relevant, and the sitemap.

TASK 18: Informational blog content
- Check existing blog posts for these topics; for any missing, create a draft post:
  - How to wear a letterman jacket
  - Varsity jacket vs letterman jacket
  - How much does a letterman jacket cost
  - How long does it take to make a letterman jacket
- Each post must link to at least 2 relevant category or product pages and include an FAQ block.
- Show me outlines before writing full posts.

TASK 19: Internal linking
- Add contextual links from blog posts to categories and products, from product pages to /patches-embroidery and /materials-colors, and from category pages to relevant bulk-order pages.
- Report any orphan pages (no internal links pointing to them).

=== PHASE 4: MANUAL AND SECURITY ===

TASK 20: Public GitHub repository
- A public repo (github.com/testleadz07-cyber/jaketee) references support@jacketee.com. Check whether this repo belongs to our team. If yes, give me steps to make it private and to rotate any secrets, API keys or env values ever committed to it. Scan this codebase for hardcoded secrets as well.

TASK 21: Final verification
- Re-run build and lint.
- Produce a final report in /docs/seo-fix-log.md listing every task (1 to 21) with status, files changed, redirects added, and all open questions or manual steps remaining for me.
- Give me a list of 20 priority URLs to submit for indexing in Search Console.

Start with Task 1 now.