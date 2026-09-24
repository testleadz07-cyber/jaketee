Here's how to check every fix, from prompt 1 to prompt 16. Each check has a clear pass or fail result.

## Before you start

**Tools (all free):**

- **View Source** (Ctrl+U) shows the raw HTML that Google sees.
- **Google Rich Results Test** (search.google.com/test/rich-results)
- **Schema Validator** (validator.schema.org)
- **Screaming Frog SEO Spider.** The free version crawls up to 500 URLs, which covers all 213 of yours.
- **Google Search Console,** mainly the URL Inspection tool.
- **Chrome DevTools:** Lighthouse, and the Network panel with "Disable cache" turned on.
- **curl** in a terminal, to check redirects.

**Quick SEO check snippet.** Paste this into the DevTools Console on any page:

```js
(()=>{const q=s=>document.querySelector(s);const ld=[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>{try{return JSON.parse(s.textContent)}catch(e){return 'INVALID JSON'}});console.table({title:document.title,titleLen:document.title.length,desc:q('meta[name=description]')?.content,descLen:q('meta[name=description]')?.content.length,canonical:q('link[rel=canonical]')?.href,robots:q('meta[name=robots]')?.content||'none',h1Count:document.querySelectorAll('h1').length,h1:q('h1')?.innerText});console.log('JSON-LD:',ld);})()
```

**Always test in two places:**

1. Staging, before release.
2. Production, after release, in an Incognito window with the cache cleared.

---

## 1. Fake ratings removed

1. Open 5 product pages, including /varsity-jackets/wool-leather/black-wool-and-gold-leather-sleeves-letterman-jacket.
2. View Source and search for `aggregateRating`.
   - **Pass:** it isn't found on any product that shows "No reviews yet."
3. Run 2 products through the Rich Results Test.
   - **Pass:** the Product result is valid, and there's no review snippet warning.
4. Test in staging: approve one real review on a test product.
   - **Pass:** aggregateRating appears with reviewCount 1 and the correct rating. Delete the review, and the rating disappears.
5. Ask Codex to search the codebase for hardcoded values such as `ratingValue: "5.0"` or random review counts.
   - **Pass:** none are left.

## 2. Crawlable pagination

1. Open /varsity-jackets and View Source. Search for `?page=2`.
   - **Pass:** a real `<a href="/varsity-jackets?page=2">` link exists.
2. Open /varsity-jackets?page=2 and View Source.
   - **Pass:** you see a different set of products in the raw HTML, the canonical is `.../varsity-jackets?page=2`, and the title ends with "Page 2".
3. Open the last page, e.g. ?page=4.
   - **Pass:** it has a Previous link and no Next link.
4. Open ?page=99.
   - **Pass:** you get a 404, or a redirect to page 1. It must not be an empty 200 page.
5. Turn off JavaScript (DevTools > Settings > Debugger > Disable JavaScript) and reload.
   - **Pass:** products and page links still show.
6. Repeat on /bomber-jackets and one varsity subcategory.

## 3. Canonicals and /shop title

1. Run the snippet on / and /shop.
   - **Pass:** each canonical is an absolute URL pointing to itself.
   - **Pass:** /shop has a different title and description from the home page.
2. In Screaming Frog, check Canonicals > Missing.
   - **Pass:** 0.

## 4. Home and varsity keyword metadata

1. Run the snippet on /, /varsity-jackets and all 9 varsity subcategories.
   - **Pass:** titles and H1s match prompt 4 exactly, and each page has exactly one H1.
   - **Pass:** titles are 60 characters or fewer, and descriptions are 120 to 160 characters.
2. Paste a URL into a SERP preview tool (such as the Mangools SERP simulator).
   - **Pass:** the title isn't cut off.
3. Check that the og:title and og:description tags match.
4. Edit a category title in the CMS.
   - **Pass:** the change shows on the site without a code deploy, which confirms it's data-driven.

## 5. FAQ, Article and Organization schema

1. Run the Rich Results Test on:
   - /varsity-jackets and the home page. **Pass:** FAQ is detected and valid.
   - Any blog post. **Pass:** Article is detected with author, datePublished and image.
2. Compare the FAQ schema text with the visible FAQ text.
   - **Pass:** the questions and answers match word for word, with no hidden extra questions.
3. On the home page, run the Schema Validator.
   - **Pass:** Organization has `sameAs` and `contactPoint`, with no placeholder values left.
4. On a blog post, inspect the date.
   - **Pass:** it's wrapped in `<time datetime="2025-04-02">`.

## 6. URL cleanup and redirects (most important to test)

1. Get the old_url,new_url CSV from Codex.
2. Run the Codex test script.
   - **Pass:** every old URL returns one 301 redirect, then a 200 page.
3. Spot-check 5 URLs by hand with curl:

   ```
   curl -sIL https://www.jacketee.com/bomber-jackets/bomber-jacket/premium-qaulity-sheep-leather-bomber-jacket-in-red | grep -iE "^HTTP|^location"
   ```

   - **Pass:** you see exactly one `301`, one `location:` line, then `200`. Two 301s means there's a redirect chain, which is a fail.
4. Check these specific URLs:
   - /bomber-jackets/bomber-jacket should go to /bomber-jackets.
   - Each satin product that was moved should land in its correct subcategory.
   - /leather-jackets/all-leather-nappa-varsity-jacket-gold-black should go to /varsity-jackets/all-leather/...
   - The Clemson product should go to its new name.
5. Screaming Frog (Mode > List) with all the old URLs.
   - **Pass:** Response Codes shows 100% 301s and no 404s.
6. Screaming Frog, full crawl of the live site.
   - **Pass:** Internal > Redirection (3xx) is 0, which means no internal links still point to old URLs.
   - **Pass:** Sitemaps > "URLs in sitemap that redirect" is 0.
7. Open /varsity-jackets/satin.
   - **Pass:** only real satin products are listed.
   - **Pass:** product counts on the category pages are correct.
8. After release:
   - Resubmit sitemap.xml in Search Console.
   - Run URL Inspection on 3 new URLs and click "Request indexing."
   - Watch Pages > "Page with redirect" and "Not found (404)" for 2 to 4 weeks.

## 7. Custom landing pages

For each landing page (bomber, coach, denim, puffer, hoodies, letterman):

1. It returns 200. The H1 contains the exact keyword, the canonical points to itself, and the page is in sitemap.xml.
2. View Source.
   - **Pass:** the product grid links are in the raw HTML.
   - **Pass:** FAQ, Breadcrumb and ItemList schema are valid in the Rich Results Test.
3. Count the words.
   - **Pass:** 700 or more unique words. Paste two landing pages into a text comparison tool (such as copyleaks or diffchecker) to confirm the copy isn't shared.
4. Check the links.
   - **Pass:** each page is linked from its category page, the main nav and the footer.
   - **Pass:** the quote CTA opens /bulk-orders.
5. Search the page for `{{`.
   - **Pass:** no placeholders are left.

## 8. Category content and metadata

1. In Screaming Frog, export Page Titles and Meta Descriptions.
   - **Pass:** all 15+ category rows match the table in prompt 8.
   - **Pass:** there are no duplicates, and no title follows the old "X - Jacketee" pattern.
2. Check the H1s.
   - **Pass:** no subcategory has a one-word H1 like "Satin" or "Retro."
3. Check the content.
   - **Pass:** the intro text sits above the product grid, and the long text sits below it.
   - **Pass:** /varsity-jackets has 700+ words of pillar content, and subcategories have 400+.
   - **Pass:** every section links to the right page (patches, size guide, bulk orders).
4. Check the grammar.
   - **Pass:** "1 products" is gone.

## 9. Product pages

1. In Screaming Frog, export all product titles.
   - **Pass:** each is 65 characters or fewer, the varsity ones include "Custom," and there are no duplicates.
2. Search every page for the old problem names: "Qaulity," "Women Girls Mens," "Dtf," "Clemson," "City Rain Evening."
   - **Pass:** 0 results. In Screaming Frog, use Configuration > Custom > Search.
3. Check meta descriptions.
   - **Pass:** no line breaks remain. The same custom search can look for `\n`.
4. Review the description CSV before it goes live.
   - **Pass:** check 10 random rows. Each description is unique, mentions the right materials, and has no invented claims.
5. Run 3 products through the Rich Results Test.
   - **Pass:** the Product has sku, image, offers, shippingDetails and hasMerchantReturnPolicy, with no errors.
6. Check the image alt text on one product gallery.
   - **Pass:** each image has different alt text (front view, back view, and so on).

## 10. Blog internal links and trust

1. Open 5 random posts and count the links to shop pages inside the body text.
   - **Pass:** 3 to 5 links, and the first appears within the first 150 words.
   - **Pass:** the anchor text matches the link map, and no anchor is repeated.
2. In Screaming Frog, check Inlinks on /varsity-jackets and /patches-embroidery.
   - **Pass:** they have far more inlinks than before. /varsity-jackets had 84, and the blog alone should add 40 or more.
3. Check every post for trust signals.
   - **Pass:** the "views" counter is gone.
   - **Pass:** a named author box links to an author page.
   - **Pass:** the published and updated dates are visible.
4. Check the updated posts.
   - **Pass:** the trends post says 2026, and the 3 varsity-vs-bomber posts have clearly different titles and H1s.

## 11. Expanded blog posts

For each of the 8 posts:

- **Pass:** 1,200 words or more.
- **Pass:** the FAQ schema is valid.
- **Pass:** it has 3 to 5 shop links.
- **Pass:** no `{{` placeholders are left.

Then:

1. Read each post yourself for accuracy on prices, turnaround time and minimum orders.
2. Search Google for one sentence from each post in quotes.
   - **Pass:** the only result is your site.

## 12. Home page

1. Visual check.
   - **Pass:** the hero CTA uses your red accent color.
   - **Pass:** the varsity tile is the largest one, the "Shop by material" section exists, and 3 or more of the 4 featured products are varsity.
   - **Pass:** the "How customization works" section is there.
2. View Source.
   - **Pass:** the SEO text block is in the raw HTML, with links to /varsity-jackets, /custom-letterman-jackets and /patches-embroidery.
3. Run the Rich Results Test.
   - **Pass:** FAQ is valid and has 6 questions.
4. Count keyword mentions: `(document.body.innerText.match(/custom varsity/gi)||[]).length`.
   - **Pass:** between 3 and 8. More than that looks like keyword stuffing.

## 13. Trust pages and footer

1. Check word counts.
   - **Pass:** /about 500+, /contact 150+, /shipping 300+, and each bulk page 600+.
2. Test the quote form on staging: submit it with an artwork file attached.
   - **Pass:** the email or record arrives, and all fields are captured.
   - **Pass:** the honeypot blocks a bot-style submission.
   - **Pass:** the upload size limit works.
3. Check the footer.
   - **Pass:** email, phone or WhatsApp, and social icons are present and work, each icon has an aria-label, and "Designed for excellence" is gone.
4. Check heading structure with the HeadingsMap Chrome extension.
   - **Pass:** there are no duplicate footer H3s.
5. Check the header.
   - **Pass:** the dark mode toggle has moved to the footer.

## 14. Pricing and reviews

1. Check discounts.
   - **Pass:** no product shows a discount over 40% unless it's marked as verified.
   - **Pass:** the admin report lists every product that was flagged.
2. Test the full review flow on staging:
   - Place a test order and mark it delivered.
   - **Pass:** the review request email arrives.
   - Submit a review. **Pass:** it shows as pending and isn't visible on the site.
   - Approve it. **Pass:** it now shows on the product page, and aggregateRating appears in the source.
3. Check pages with no reviews.
   - **Pass:** the category and home pages show no review section at all.

## 15. UI fixes

1. **Blank sections:** scroll quickly from top to bottom, then back up, three times, in Chrome and Safari and on a phone.
   - **Pass:** no section is ever blank or white.
   - View Source: **Pass:** section HTML has no `opacity:0` inline styles.
2. **Reduced motion:** turn on DevTools > Rendering > "Emulate prefers-reduced-motion."
   - **Pass:** the page shows no animations.
3. **Accessibility:** run Lighthouse > Accessibility on the home page, a category page and a product page.
   - **Pass:** a score of 95 or higher, no "Buttons do not have an accessible name" warning, and no contrast failures.
   - Tab through the page with the keyboard. **Pass:** a visible focus outline appears on every link and button.
4. **Mobile:** in DevTools device mode, test iPhone SE and Pixel 7 sizes.
   - **Pass:** no horizontal scrolling, tap targets are at least 44px, and the category grid is 2 columns.
5. **Visual check:**
   - **Pass:** the brand navy and red are used, section backgrounds alternate, and category tiles use only a bottom gradient.
   - **Pass:** product cards are equal height.

## 16. SEO check script

1. Run `npm run seo:check` on staging.
   - **Pass:** 0 critical errors, and a CSV report is produced.
2. **Test that it catches problems:** temporarily break one page by removing its canonical or adding a fake rating, then run the script again.
   - **Pass:** the script fails.
3. Confirm the check runs in CI on every PR.

---

## Final check after release

1. Run a full Screaming Frog crawl and check these reports. **Pass:** all are 0.
   - 4xx
   - Internal redirects
   - Missing canonical
   - Duplicate titles
   - Missing H1
   - Multiple H1
2. In Search Console > Enhancements, check Products, FAQ and Breadcrumbs.
   - **Pass:** no new errors appear within 7 to 14 days.
3. In Search Console > Pages, watch the "Indexed" count.
   - **Pass:** it climbs toward about 230 URLs (213 plus the new landing pages) over the next 2 to 6 weeks.
4. Track rankings weekly for these queries:
   - custom varsity jackets
   - custom letterman jackets
   - custom bomber jackets
   - custom coach jackets

Once the fixes are live, I can re-crawl all the pages from your browser the same way I did the original audit and give you a pass/fail report for each prompt.