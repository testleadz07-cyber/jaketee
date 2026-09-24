Here are the rest of the fixes as detailed Codex prompts, numbered 6 to 16 so they follow on from the five you already sent. Each prompt is built around what Jacketee is: a made-to-order store for custom varsity and letterman jackets, plus other custom jackets for individuals, schools, teams and brands.

**How to run them:**

- Paste the context block below at the start of each Codex session.
- Run one prompt per branch or PR, and test on staging first.
- Do prompt 6 in a single release, because it changes URLs.

---

### Context block (paste first, every time)

```
PROJECT CONTEXT: Jacketee (https://www.jacketee.com) is a Next.js e-commerce store selling made-to-order CUSTOM jackets. Core business: custom varsity jackets and letterman jackets (wool body, leather/faux leather/satin sleeves, chenille patches, embroidery, names, numbers, team colors). Secondary: other customizable jackets (bomber, coach, denim, puffer, leather, fleece hoodies). Customers: individuals, high schools, sports teams, seniors/leavers groups, corporate teams, and streetwear/private label brands. Markets: USA (primary), UK, Canada. Currency USD.

PRIMARY SEO KEYWORDS: custom varsity jackets, custom letterman jackets, varsity jackets. SECONDARY: custom bomber jackets, custom coach jackets, custom denim jackets, custom puffer jackets, custom hoodies, chenille patches, varsity jacket patches, team jackets, bulk custom jackets.

COPY STYLE for any text you write: plain, confident, human. No hype words ("elevate", "unleash", "game-changer"). No em dashes. Short sentences. US English. Always accurate: never invent reviews, ratings, stats, awards, or delivery promises. If a fact is unknown (turnaround days, minimum order), insert a clearly marked placeholder like {{TURNAROUND_DAYS}} and list all placeholders at the end of your response.

RULES: Keep changes data-driven where possible (CMS/DB/config fields, not hardcoded strings). Do not break existing URLs without a 301 redirect. After changes, list every file changed and how to test.
```

---

### 6. URL cleanup and 301 redirect map (do this as one release)

```
Goal: fix product categorization and messy URLs in ONE release with a single 301 redirect map, so there are no redirect chains.

STEP A: Remove the redundant middle folder. These intermediate listing pages add nothing and create thin duplicates:
/bomber-jackets/bomber-jacket, /coach-jackets/coach-jacket, /denim-jackets/denim-jacket, /puffer-jackets/puffer-jacket, /fleece-hoodies/hoodies
- New product URL pattern: /bomber-jackets/{slug}, /coach-jackets/{slug}, /denim-jackets/{slug}, /puffer-jackets/{slug}, /fleece-hoodies/{slug}
- 301 each intermediate page to its parent (e.g. /bomber-jackets/bomber-jacket -> /bomber-jackets).
- 301 every old product URL to the new flat URL.
- Keep the /varsity-jackets/{subcategory}/{slug} pattern because varsity subcategories are real (wool-leather, all-wool, satin, etc.).

STEP B: Recategorize varsity products that are wrongly in /varsity-jackets/satin/. Read each product's actual body and sleeve material from product data and move it to the correct subcategory. Suggested mapping (verify against product data, and tell me where data disagrees):
- black-wool-and-black-leather-sleeves-letterman-jacket -> wool-leather
- black-wool-and-white-leather-sleeves-letterman-jacket -> wool-leather
- royal-blue-wool-and-white-leather-sleeves-letterman-jacket -> wool-leather
- royal-blue-wool-and-gold-leather-sleeves-letterman-jacket -> wool-leather
- dark-green-wool-and-gold-leather-sleeves-letterman-jacket -> wool-leather
- red-wool-varsity-jacket-with-hood-black-leather-sleeves -> hooded
- maroon-letterman-jacket-hood -> hooded
- baby-pink-letterman-jacket-with-hood -> hooded
- cotton-fleece-varsity-jackets-schools-seniors-affordable -> fleece
- clothing-cotton-varsity-jackets-lightweight-us-football-game -> cotton-twill
- denim-varsity-jacket-cotton-twill-sleeves -> cotton-twill
- classic-melton-wool-varsity-letterman-jackets-high-schools -> all-wool or wool-leather (check sleeves)
- clemson-varsity-jacket-orange-white -> check material
Also move /leather-jackets/all-leather-nappa-varsity-jacket-gold-black -> /varsity-jackets/all-leather/all-leather-nappa-varsity-jacket-gold-black (it is a varsity jacket).

STEP C: Rename slugs that do not match the product (new slug = descriptive product name):
- /varsity-jackets/satin/classic-wool-leather-varsity-jacket -> /varsity-jackets/satin/satin-varsity-jacket-with-piping
- /varsity-jackets/wool-leather/black-athletic-gold-varsity-jacket-with-hood -> /varsity-jackets/hooded/red-wool-white-leather-sleeves-varsity-jacket-with-hood
- cardinal-wool-varsity-jacket-varsity-jacket -> cardinal-wool-varsity-jacket
- luxurious-all-black-nappa-leather-letterman-jacket-leather-jackets -> all-black-nappa-leather-letterman-jacket
- clothing-cotton-varsity-jackets-lightweight-us-football-game -> lightweight-cotton-varsity-jacket
- bomber: premium-qaulity-sheep-leather-bomber-jacket-in-red -> red-sheep-leather-bomber-jacket
- bomber: premium-quality-suede-bomber-jacket -> camel-brown-suede-leather-bomber-jacket
- bomber: custom-bomber-jackets -> royal-blue-nylon-bomber-jacket
- bomber: corporate-event-team-bomber-jackets -> black-nylon-bomber-jacket
- bomber: college-bomber-class -> royal-blue-softshell-bomber-jacket
- bomber: bomber-jacket-goat-suede-blue -> softshell-bomber-jacket-with-panels
- bomber: sheep-leather-bomber-jacket -> sky-blue-satin-bomber-jacket-womens
- bomber: lightweight-bomber-jacket-womens-spring-outfit-on-steps -> red-satin-bomber-jacket
- coach: custom-coach-jackets -> rename to the actual product (color + material + "coach-jacket")
- coach: coach-jacket-vs-puffer-jacket-city-rain-evening -> rename to the actual product
The slugs custom-bomber-jackets and custom-coach-jackets are being freed for landing pages (prompt 7).

STEP D: Implementation requirements
- Create ONE redirect map file (e.g. redirects.json or next.config redirects) with old URL -> final URL. No chains: every old URL (including ones affected by both Step A and C) points directly to its final URL. Permanent 301.
- Update all internal links, menus, breadcrumbs, related products, blog links, canonicals, JSON-LD, and sitemap.xml to the final URLs.
- sitemap.xml must contain only final 200 URLs, no redirected URLs.
- Update subcategory product counts.
- Output: a CSV of old_url,new_url and a test script that requests every old URL and asserts a single 301 hop to a 200 page.
```

---

### 7. Custom landing pages for secondary keywords

```
Create a reusable "Custom Jacket Landing Page" template and build these pages. They are SEO landing pages for high-intent "custom" searches. They are NOT product pages.

Pages:
1. /custom-bomber-jackets  (keyword: custom bomber jackets)
2. /custom-coach-jackets   (keyword: custom coach jackets)
3. /custom-denim-jackets   (keyword: custom denim jackets)
4. /custom-puffer-jackets  (keyword: custom puffer jackets)
5. /custom-hoodies         (keyword: custom hoodies, leavers hoodies)
6. /custom-letterman-jackets (keyword: custom letterman jackets; must link prominently to /varsity-jackets and not duplicate its content; angle: letterman tradition, earning letters, school awards, chenille)

Template sections, in order:
- H1 with exact keyword (e.g. "Custom Bomber Jackets")
- Intro, 2 to 3 sentences: what it is, who it is for, primary CTA "Start Your Design" and secondary CTA "Get a Bulk Quote" (/bulk-orders)
- Product grid pulling products from the matching category (server-rendered, crawlable links)
- "How customization works" 3 steps: Choose your style and colors, Add patches, embroidery or print, Approve your free mockup ({{MOCKUP_POLICY}})
- Customization options: materials, colors, decoration methods relevant to that jacket type (e.g. coach = screen print, embroidery; bomber = embroidery, patches, leather/satin/nylon)
- Who it is for: teams, schools, corporate, events, brands (link to /bulk-orders/schools, /bulk-orders/corporate, /bulk-orders/private-label)
- Pricing and minimums: placeholders {{STARTING_PRICE}}, {{MIN_ORDER_QTY}}, {{TURNAROUND_DAYS}}
- FAQ, 5 to 6 real buyer questions, with FAQPage JSON-LD
- Related guides: 3 relevant blog links
- Final CTA band

SEO:
- Unique title (max 60 chars) and meta description (140 to 160 chars) per page, keyword first
- Self canonical, BreadcrumbList JSON-LD (Home > Custom Bomber Jackets), CollectionPage + ItemList JSON-LD
- 700 to 1,000 words of unique copy per page; write the copy following the COPY STYLE rules
- Add all pages to sitemap.xml
- Link each landing page from: the matching category page intro, the main nav under "Other Styles", and the footer

Also link each category page (e.g. /bomber-jackets) to its landing page with the anchor "custom bomber jackets".
```

---

### 8. Category page content and metadata (all 22 categories)

```
Make category and subcategory metadata and intro content editable fields in the CMS/data layer (seoTitle, metaDescription, h1, introShort, introLong), then populate them.

Set these exactly:
| URL | Title | Meta description |
|---|---|---|
| /varsity-jackets/wool-leather | Custom Wool & Leather Varsity Jackets \| Jacketee | Classic custom letterman jackets with a melton wool body and genuine leather sleeves. Add chenille patches, names and numbers in your team colors. |
| /varsity-jackets/all-wool | Custom All-Wool Varsity Jackets \| Jacketee | Warm melton wool varsity jackets made to order in your school or team colors. Add chenille letters, embroidery and custom details. Bulk pricing available. |
| /varsity-jackets/satin | Custom Satin Varsity Jackets \| Jacketee | Lightweight satin varsity jackets with a glossy finish, made to order. Add embroidered names, logos and patches for teams, crews and brands. |
| /varsity-jackets/faux-leather | Custom Faux Leather Varsity Jackets \| Jacketee | Custom varsity jackets with vegan faux leather sleeves. The classic letterman look at a lower price, with patches, names and your team colors. |
| /varsity-jackets/all-leather | Custom Leather Varsity Jackets \| Jacketee | Premium all-leather letterman jackets in nappa and cowhide, made to order. Personalize with chenille patches, embroidery and your choice of colors. |
| /varsity-jackets/hooded | Custom Hooded Varsity Jackets \| Jacketee | Custom hooded varsity jackets made to order. Choose your wool body, sleeve colors, chenille patches and embroidery. Individual and team orders. |
| /varsity-jackets/retro | Custom Retro Varsity Jackets \| Jacketee | Vintage-inspired custom letterman jackets with classic collars and colorways. Add chenille letters and patches for an authentic retro look. |
| /varsity-jackets/fleece | Custom Fleece Varsity Jackets \| Jacketee | Soft, affordable fleece varsity jackets made to order for schools, seniors and teams. Add names, numbers and patches in your colors. |
| /varsity-jackets/cotton-twill | Custom Cotton Twill Varsity Jackets \| Jacketee | Lightweight cotton twill varsity jackets for warmer weather and everyday wear. Customize colors, embroidery and patches for teams or brands. |
| /bomber-jackets | Custom Bomber Jackets \| Leather, Satin & Nylon \| Jacketee | Custom bomber jackets in leather, suede, satin and nylon. Add your logo, embroidery or patches for teams, events and brands. Bulk orders welcome. |
| /coach-jackets | Custom Coach Jackets for Teams & Brands \| Jacketee | Lightweight custom coach jackets with screen printing or embroidery. A go-to for coaches, staff, events and streetwear labels. |
| /denim-jackets | Custom Denim Jackets \| Embroidery & Patches \| Jacketee | Custom denim jackets with embroidery, chenille patches and back artwork. Made to order for individuals, teams, crews and brands. |
| /puffer-jackets | Custom Puffer Jackets with Logo \| Jacketee | Insulated custom puffer jackets with embroidered or printed logos. Warm options for staff, teams and cold-weather events. |
| /leather-jackets | Custom Leather Jackets \| Jacketee | Genuine leather and suede jackets you can personalize with embroidery, patches and lining details. Crafted to order for individuals and brands. |
| /fleece-hoodies | Custom Hoodies & Leavers Hoodies \| Jacketee | Custom fleece hoodies with chenille patches, tackle twill letters and embroidery. Ideal for seniors, leavers, teams and school groups. |

H1 = "Custom " + category name (e.g. "Custom Satin Varsity Jackets"). Subcategory H1s must never be a single word.

Content layout on each category page:
- ABOVE the product grid: introShort, 40 to 60 words, containing the keyword once, plus link to the matching custom landing page or /patches-embroidery.
- BELOW the product grid: introLong, H2 "About Custom {Category}", 400 to 600 words for /varsity-jackets subcategories and 350+ for others. Cover: materials and feel, who it suits, customization options (chenille, embroidery, tackle twill, names, numbers, lining), sizing link (/size-guide), bulk/team orders link (/bulk-orders), care link to a relevant blog guide.

MAIN PILLAR /varsity-jackets introLong: 700 to 900 words with H3s:
"What makes a custom varsity jacket", "Choose your body and sleeve materials" (link every subcategory), "Chenille patches, embroidery and lettering" (link /patches-embroidery), "Varsity vs letterman jacket" (link blog post), "Ordering for a school or team" (link /bulk-orders/schools), "Sizing and fit" (link /size-guide).

Write all intros using COPY STYLE rules and unique text per page (no shared boilerplate). Add ItemList JSON-LD of the listed products and FAQPage JSON-LD for the existing "Top 10 questions" block. Remove product counts like "1 products" or fix pluralization.
```

---

### 9. Product pages: titles, descriptions and schema

```
Improve all 107 product pages.

A. TITLES (<title>, max 60 chars before " | Jacketee"):
- Pattern for varsity: "Custom {Color} {Material} Letterman Jacket" or "Custom {Color} Varsity Jacket with {Sleeve}" based on product data. Example: "Custom Black Wool & Gold Leather Letterman Jacket | Jacketee".
- Other jackets: "Custom {Color} {Material} {Type} Jacket".
- Keep the on-page H1 as the clean product name without "Custom" if that reads better, but fix these names:
  "Premium Qaulity Sheep Leather Bomber Jacket In Red" -> "Red Sheep Leather Bomber Jacket"
  "Bomber Jacket With Piping Satin Women Girls Mens" -> "Satin Bomber Jacket with Piping"
  "Leather Jacket Bomber Sheep Mens" -> "Men's Sheep Leather Bomber Jacket"
  "Dtf Print On Hoodie" -> "DTF Print Custom Hoodie"
  "Clothing Cotton Varsity Jackets Lightweight Us Football Game" -> "Lightweight Cotton Varsity Jacket"
  "Coach Jacket Vs Puffer Jacket City Rain Evening" -> real product name
  "Clemson Varsity Jacket Orange White" -> "Orange & White Wool Varsity Jacket" (remove university trademark from name, slug, alt text and description; add to redirect map)
- Fix Title Case issues ("For Mens And Women" -> "for Men and Women").

B. META DESCRIPTIONS:
- Strip all newline characters and bullet fragments; 140 to 160 chars.
- Template: "{Short benefit description}. Customize with chenille patches, embroidery, names and numbers. Made to order{{, ships in TURNAROUND}}." Adapt per product type.

C. UNIQUE DESCRIPTIONS:
Currently one description is reused on 25 products, others on 14, 9, 8, 7, 6. Build a description generator that composes UNIQUE copy (180 to 250 words) from product attributes (color, body material, sleeve material, lining, collar, cuffs, hood, fit, category) with these sections:
- Opening paragraph specific to this colorway and who it suits
- "Materials and construction" bullet list from real data
- "Make it yours": customization options available for THIS product
- "Great for": 2 to 3 use cases (school letterman, team, seniors, brand drop, gift)
- Link to /size-guide and /patches-embroidery
Output as a draft field for my review, do not auto-publish. Generate a CSV (url, old_description, new_description) for review.

D. PRODUCT JSON-LD additions:
- sku, mpn if available, brand Jacketee, color, material, image array (all gallery images)
- offers: priceCurrency USD, price, availability, url, itemCondition NewCondition, shippingDetails (OfferShippingDetails with US, UK, CA destinations using {{SHIPPING_RATE}} and {{DELIVERY_DAYS}}), hasMerchantReturnPolicy (from /returns policy data)
- If a sale price is shown, include priceValidUntil for the sale end date
- aggregateRating only when real approved reviews exist (already done in prompt 1)

E. ON PAGE:
- Add a visible "Customize this jacket" block listing options with a link to /patches-embroidery
- "You may also like": same subcategory first, then related custom landing page
- Image alt: "{Product name} front view", "back view", "sleeve detail" etc. (not identical alt on all gallery images)
```

---

### 10. Blog internal linking and trust signals

```
The blog has 53 posts and ZERO contextual links to shop pages. Fix site-wide.

A. INTERNAL LINK MAP. Create a config (e.g. seo/linkMap.ts) of target URL -> preferred anchors:
- /varsity-jackets: "custom varsity jackets", "varsity jackets"
- /custom-letterman-jackets: "custom letterman jackets", "letterman jacket"
- /patches-embroidery: "chenille patches", "varsity jacket patches", "embroidery"
- /bulk-orders/schools: "school varsity jackets", "team jackets", "bulk orders"
- /bulk-orders/corporate: "corporate jackets"
- /bulk-orders/private-label: "private label jackets"
- /varsity-jackets/{sub}: "wool and leather varsity jacket", "satin varsity jacket", "hooded varsity jacket", "leather letterman jacket", etc.
- /custom-bomber-jackets, /custom-coach-jackets, /custom-denim-jackets, /custom-puffer-jackets, /custom-hoodies
- /size-guide: "size guide", "sizing chart"
- /materials-colors: "materials and colors"

B. For EACH post, add 3 to 5 contextual links inside the body text (not only a footer block):
- First link in the first 150 words should point to the most relevant money page.
- Max one link per target per post, never link the same anchor twice, no links in headings.
- Prefer editing the source content (MDX/CMS). If content is in a CMS, produce a migration script plus a review CSV (post, anchor, target, sentence) instead of blind injection.

C. Add at the end of every post: a "Shop the look" server-rendered product row (4 products from the most relevant category) and a CTA band "Design your custom varsity jacket" -> /varsity-jackets and "Ordering for a team?" -> /bulk-orders.

D. TRUST / E-E-A-T:
- Remove the visible "views" counter.
- Replace author "Jacketee Team" with a real author profile component (name, role, short bio, photo) using {{AUTHOR_NAME}} placeholders; create /blog/author/{slug} pages.
- Show published and updated dates in <time datetime>.
- BlogPosting JSON-LD (done in prompt 5) must reference the author.

E. OUTDATED/DUPLICATE POSTS:
- Update "/blog/varsity-jackets-trends-2025" title/H1 to 2026 (keep URL, or create a year-free slug with a 301).
- "/blog/bomber-vs-varsity-vs-puffer-jacket-guide-2025": remove year from title.
- Cannibalization: "/blog/varsity-jacket-vs-bomber-jacket-which-one-right-for-team", "/blog/bomber-vs-varsity-vs-puffer-jacket-guide-2025", "/blog/what-is-a-bomber-jacket" all target varsity vs bomber. Keep what-is-a-bomber-jacket as the bomber explainer, make varsity-vs-bomber the team comparison, and refocus the 3-way post on "puffer vs varsity vs bomber for winter". Differentiate titles and H1s.
- "/blog/private-label-vs-custom-jacket-orders-what-is-the-difference" and "/blog/private-label-varsity-jackets-how-brands-can-build-their-own-jacket-line": link them to each other and to /bulk-orders/private-label with different intents.
```

---

### 11. Expand the high-intent blog posts

```
Expand these posts to 1,200 to 1,800 words each. They target buyers close to purchase. Keep existing URLs. Follow COPY STYLE. Add a short FAQ section (3 to 4 Qs) to each with FAQPage JSON-LD. Include 3 to 5 contextual links per the link map. Use {{PLACEHOLDERS}} for any business fact you do not have.

1. /blog/design-your-own-custom-jacket-online (265 words) -> step-by-step: pick style, body and sleeve material, colors, front chest letter, back design, sleeve and pocket embroidery, lining, sizing, mockup approval, production, shipping. Link every step to the relevant page.
2. /blog/wholesale-custom-jackets-schools-teams (295) -> minimums, pricing tiers {{}}, timeline planning backwards from event date, collecting sizes, approvals, payment options, reorders.
3. /blog/how-to-choose-custom-varsity-jacket-size (300) -> measurement guide, fit by material (wool vs leather vs satin), layering, youth vs adult, table of chest measurements from /size-guide data.
4. /blog/letterman-patches-chenille-embroidery-guide (320) -> chenille vs embroidery vs tackle twill vs felt, where each goes, pricing impact, durability, examples.
5. /blog/what-does-a-custom-jacket-cost-pricing-guide-for-schools-teams-brands (554) -> cost factors table (material, decoration count, quantity, rush), example price ranges using {{}}.
6. /blog/how-long-does-a-custom-jacket-order-take-production-shipping-timelines-explained -> timeline table per stage with {{}}.
7. /blog/varsity-jacket-vs-letterman-jacket (477) -> history, differences, when each term is used, which to search for when buying.
8. /blog/what-to-put-on-a-varsity-jacket (504) -> front, back, sleeves, pockets, lining; ideas by sport, grad year, achievements.

Output each post as a draft for review, not auto-published.
```

---

### 12. Home page content and structure (SEO and UX together)

```
Update the home page so it clearly signals "custom varsity jackets" while staying a strong store front. (Title/H1/meta already done in prompt 4.)

1. Hero: keep the image; subheadline: "Design your own varsity or letterman jacket with chenille patches, embroidery and your team colors. Made to order for individuals, schools and brands." Primary CTA "Design Your Varsity Jacket" -> /varsity-jackets (brand accent color, not black). Secondary CTA "Get a Bulk Quote" -> /bulk-orders.
2. Trust bar under hero: replace generic items with {{TURNAROUND}} production, Free design mockup {{if true}}, Ships to US, UK & Canada, Easy returns on non-personalized items {{verify policy}}.
3. "Shop by category": varsity tile first and larger (spans 2 columns). Replace product counts with short descriptors. Lighten image overlay: use a bottom gradient only behind text so jacket colors show.
4. NEW section "Shop Custom Varsity Jackets by Material": 6 linked cards to wool-leather, all-wool, all-leather, hooded, satin, retro with thumbnails.
5. Featured Jackets: at least 3 of 4 must be varsity/letterman. Make featured products a CMS-controlled list.
6. NEW section "How Customization Works": 3 steps with icons, CTA to /patches-embroidery.
7. New Arrivals: mix categories, max 2 per category.
8. NEW SEO text block near bottom, H2 "Custom Varsity Jackets and Letterman Jackets, Made to Order": 250 to 350 words, links to /varsity-jackets, /custom-letterman-jackets, /patches-embroidery, /bulk-orders/schools, and 2 to 3 other custom landing pages.
9. Home FAQ: expand to 6 questions (what is a custom varsity jacket, how long, minimum order, can I add names/numbers, sizing, shipping countries) with FAQPage JSON-LD.
10. Organization JSON-LD: add sameAs {{SOCIAL_URLS}}, contactPoint {{EMAIL}}, {{PHONE}}.
```

---

### 13. Trust pages, bulk pages and footer

```
Several key pages are thin: /contact (50 words), /shipping (113), /bulk-orders (254), /bulk-orders/schools (276), /about (276), /shop (243).

1. /bulk-orders and children (/schools, /corporate, /private-label): 600 to 900 words each. Sections: who it is for, what you can customize, process timeline, minimums {{MIN_QTY}}, pricing tiers table {{}}, sample/mockup policy, FAQ with FAQPage JSON-LD, and an embedded quote form (name, organization, email, phone, jacket style, quantity, needed-by date, artwork upload, notes). Form submits to existing backend or email; add spam protection (honeypot + rate limit). Titles:
   /bulk-orders: "Bulk Custom Jackets for Teams, Schools & Brands | Jacketee"
   /bulk-orders/schools: "School Varsity Jackets & Team Letterman Jackets | Jacketee"
   /bulk-orders/corporate: "Custom Corporate Jackets with Logo | Jacketee"
   /bulk-orders/private-label: "Private Label Varsity Jackets Manufacturer | Jacketee"
2. /about: 500+ words: the story, how jackets are made, materials sourcing, quality checks (link to the QC blog post), team/workshop photos placeholders. AboutPage JSON-LD.
3. /contact: email, phone/WhatsApp, business hours with timezone, response time, contact form, links to FAQ, order tracking and bulk quote. ContactPage JSON-LD.
4. /shipping: rates and delivery windows table for US, UK, Canada {{}}, production vs shipping time explained, customs/duties note for UK and Canada, tracking info.
5. /shop: unique H1 "Shop All Custom Jackets", 150-word intro, category filter links (crawlable <a> links), pagination like prompt 2.
6. Footer: add contact email, phone/WhatsApp, social icons (Instagram, TikTok, Facebook, Pinterest {{URLs}}) with aria-labels, payment method icons, and a "Custom Jackets" column linking all custom landing pages. Remove "Designed for excellence". Fix duplicate hidden H3 headings in the footer (use <p> or <h2 class="sr-only"> once).
7. Move the dark mode toggle from the header to the footer.
```

---

### 14. Honest pricing and a real review system

```
A. PRICING TRUST:
- Current discounts go up to -82% (e.g. $379 -> $70). Compare-at prices must reflect a real former selling price, or they risk Google Merchant and consumer protection issues and they hurt trust.
- Add a data field compareAtPriceVerified (boolean) and only show strike-through and % badge when true.
- Cap displayed discount badges at a configurable max (default 40%) and flag any product above it in an admin report.
- Alternative display option per product: "From ${price}" without a compare price.

B. REVIEW SYSTEM (needed before rating stars can return):
- Reviews model: productId, orderId, rating 1-5, title, body, customer first name + last initial, country, photos, verifiedPurchase, status (pending/approved/rejected), createdAt.
- Post-purchase email request {{X}} days after delivery with a tokenized link to leave a review (no login needed).
- Admin moderation screen. Never auto-generate or import fake reviews.
- Show approved reviews on product pages, rating summary, photo reviews first.
- Category and home pages: show a "Recent customer reviews" strip from approved reviews only; hide the section entirely when none exist (no "no reviews yet" text).
- JSON-LD aggregateRating and review only from approved reviews (connect to prompt 1 logic).
- Optional: integrate Trustpilot or Google Customer Reviews via env config.
```

---

### 15. UI and visual fixes from the UX audit

```
1. BLANK SECTIONS BUG: while scrolling, sections (New Arrivals, Journal) render as empty white blocks. Find the scroll-reveal/animation logic (framer-motion, IntersectionObserver, AOS, etc.).
   - Content must be visible by default (no opacity:0 in SSR HTML).
   - Trigger reveal earlier (rootMargin "200px 0px"), animate only transform/opacity with short duration, and respect prefers-reduced-motion.
   - Product images: priority on above-the-fold, lazy with proper sizes and a neutral placeholder color elsewhere.
2. BRAND COLORS: define design tokens from the logo (navy {{#hex}}, red {{#hex}}, plus cream neutral). Use red for primary CTAs and sale badges, navy for dark bands. Replace the plain black primary buttons.
3. SECTION VARIETY: alternate backgrounds (white, cream, navy band for Bulk Orders, split image layout for Customization). Add real photography slots to Bulk Orders, Customization and Shop with Confidence sections.
4. CATEGORY TILES: remove the full dark overlay; use a bottom gradient behind text only.
5. ACCESSIBILITY: add aria-labels to all 26 icon-only buttons/links (wishlist, cart, add to cart, arrows, theme toggle, search, chat). Raise grey body text to at least 4.5:1 contrast. Visible focus styles on all interactive elements.
6. PRODUCT CARDS: same height, 2-line title clamp, consistent badge position, add-to-cart button aria-label "Add {product} to cart".
7. Mobile: check hero text size, sticky header height, tap targets >= 44px, category grid 2 columns.
```

---

### 16. Automated SEO checks (stops these problems coming back)

```
Create an SEO regression check script (Node, runnable locally and in CI) that:
1. Fetches /sitemap.xml and requests every URL.
2. Asserts: status 200, exactly one H1, <title> 30 to 65 chars and unique, meta description 120 to 165 chars, unique, no newline characters, self-referencing absolute canonical, no noindex, og:title and og:image present.
3. Parses JSON-LD: valid JSON; Product pages have Product+Offer+BreadcrumbList; aggregateRating present ONLY if the page shows approved reviews; category pages have CollectionPage+ItemList; blog posts have BlogPosting with author and datePublished.
4. Checks every redirect in the redirect map: single 301 hop to a 200 URL; no redirected URLs in sitemap or internal links.
5. Flags: pages under 300 words (categories/landing pages), products under 180 words, blog posts under 800 words, duplicate descriptions, product URLs with fewer than 2 internal inlinks, blog posts with fewer than 3 links to shop pages, images without alt, discounts over 40%.
6. Outputs a CSV report and fails CI on critical errors (status, canonical, H1, fake rating, redirect chain).
Add an npm script "seo:check".
```

---

**Things Codex can't do for you:**

- Remove the Clothaa watermarks and reshoot or edit shared product photos.
- Fill in the placeholders: turnaround time, minimums, prices, shipping rates, social URLs and author details.
- Review the generated product descriptions and blog drafts before they go live.
- Resubmit the sitemap in Search Console after prompt 6 goes live.