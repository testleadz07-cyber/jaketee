# Production Readiness Checklist — LUXE STORE

Tracks what's implemented vs. missing to make this a professional, production-grade
e-commerce store. Based on a source review of this repo (not a live/running audit).
Check items off as they land. Supersedes the older, partly-stale `missing_features_checklist.md`.

Legend: `[x]` confirmed implemented · `[ ]` missing/needs work · `[~]` partially done

---

## 1. SEO

### Pages & indexability
- [x] `robots.ts` — blocks `/admin/`, `/api/`, `/checkout/`, points to sitemap
- [x] `sitemap.ts` — includes static routes, products, categories
- [ ] **Dedicated category pages** (`/category/[slug]`) — categories currently only exist
      as `/?category=slug` on the homepage, which is not a real crawlable/indexable
      landing page. This also means `sitemap.ts`'s category URLs point to a query
      string, not a real page.
- [ ] **FAQ page has no metadata** — `/faq` is a client component (`'use client'`)
      with no `layout.tsx`, so it inherits the generic site-wide title/description
      instead of its own. No content to target FAQ-specific search queries.
- [ ] Canonical tags on blog posts (product pages already have this; blog layout does not)

### Structured data (JSON-LD)
- [x] `Organization` + `WebSite` schema (root layout)
- [x] `Product` + `BreadcrumbList` schema (product detail page)
- [ ] `Article` schema on blog posts
- [ ] `BreadcrumbList` schema on blog posts
- [ ] `FAQPage` schema on the FAQ page
- [ ] `AggregateRating`/`Review` schema (review data already exists in the `Review` model — just not exposed as schema.org markup)
- [ ] `BreadcrumbList` schema on category pages (once they exist)

### Performance / Core Web Vitals (ranking factor)
- [ ] **Next.js image optimization is disabled site-wide** — `next.config.ts` has
      `images: { unoptimized: true }` (left over from old Netlify constraints).
      No automatic WebP/AVIF, no responsive srcset. Directly hurts LCP.
- [ ] **Mixed image handling** — 8 files still use raw `<img>` instead of `next/image`
      (9 files already use `next/image` correctly)
- [ ] No Lighthouse/PageSpeed baseline established yet

### Content-driven SEO
- [ ] Blog category/tag landing pages (browsable, indexable, not just individual posts)
- [ ] No apparent internal-linking strategy between blog posts and relevant products

---

## 2. Technical / Infrastructure

- [ ] **No automated tests** — no test framework in `package.json`, no test files under `src/`
- [ ] **No CI/CD pipeline** — no `.github/workflows`, no equivalent found
- [ ] **Rate limiting is in-memory, single-process only** — documented as a known
      limitation in `src/lib/rate-limit.ts`; will silently stop working correctly
      under multi-instance/serverless deployment (needs Redis/Upstash-backed store)
- [ ] **No caching layer** (Redis or similar) anywhere in the stack
- [ ] **No error tracking / structured logging** (e.g. Sentry) — only `console.error`
- [ ] **No analytics/conversion tracking** (GA4, Meta Pixel, TikTok Pixel, etc.) —
      confirmed absent from `.env.example` and `src/`
- [ ] No monitoring/alerting or documented backup strategy in-repo
- [x] Security headers configured (`X-Frame-Options`, CSP, HSTS, etc. in `next.config.ts`)
- [x] Admin route protection + API rate limiting via `src/proxy.ts`
- [ ] `typescript: { ignoreBuildErrors: true }` in `next.config.ts` — TS errors don't fail the build
- [ ] No tax calculation engine (no field/service found)
- [ ] No real shipping-rate calculation (carrier API integration) — appears flat/manual
- [ ] Search is a MongoDB text index (`ProductSchema.index({name, description})`) —
      no dedicated search engine (typo-tolerance, relevance tuning, faceted filters)
- [ ] Binary role model (`role: 'admin' | 'customer'` in `User`) — no granular RBAC
      for support/staff-level accounts
- [ ] No admin audit log (who changed a product/order/discount, and when)
- [x] Webhook-verified payment confirmation for both Stripe and PayPal (not just client redirect)
- [x] **Inventory decrements on payment confirmation** — fixed a gap where real
      checkout orders (PayPal and Stripe) never touched `Product.stockCount` at
      all (only the largely-unused `/api/orders` fallback route did). Added
      `src/lib/inventory.ts` (`decrementStockForOrder`), wired into all 4 places
      an order transitions to `'paid'` (PayPal capture + webhook, Stripe verify
      + webhook), reusing each route's existing idempotency guard so it fires
      exactly once per order. Decrements on payment confirmation rather than
      order creation, since there's no expiry/cleanup job for abandoned
      `pending` orders that reserving stock earlier would require. Verified via
      `scripts/verify-stock-decrement.ts` (self-cleaning, run against a real DB).

## Housekeeping (from earlier codebase review — kept here for tracking)
- [ ] Prune ~39 unused dependencies (`zod`, `sharp`, `date-fns`, `next-intl`, `uuid`,
      `react-markdown`, `@tanstack/react-query`, `@dnd-kit/*`, etc. — see prior review)
- [ ] Remove dead files: `src/components/_test1-4.tsx`, stray `src/app/api/%5Bid%5D/`
      folder (URL-encoded duplicate route), unused `scripts/seed*.ts`

---

## 3. Content: Blog

- [x] Blog data is DB-driven (`/api/blog`, admin blog editor at `/admin/blog`)
- [x] Per-post SEO title/description/OG image fields (`seoTitle`, `seoDescription`, `ogImage`)
- [x] Blog categories exist (`BlogCategory` model)
- [ ] No `Article` JSON-LD (see SEO section)
- [ ] No canonical URL on blog post metadata
- [ ] No visible related-posts / internal linking to relevant products
- [ ] No content calendar / scheduled-publish confirmation beyond the `scheduled` status field found in the query

---

## 4. Content: FAQ

- [ ] **FAQ content is hardcoded** in `src/app/faq/page.tsx` (static array), not
      DB-driven — admin cannot update FAQs without a code deploy
- [ ] No `FAQPage` schema markup
- [ ] No per-page metadata (see SEO section)
- [ ] No FAQ search/filter for larger FAQ sets

---

## 5. Customer-Facing UX

- [x] Order tracking page, reviews (with moderation + photo/video), search autocomplete,
      recently viewed, wishlist, cart sync, cookie consent, newsletter popup, live chat widget
- [ ] **No dedicated category browsing experience** (filter/sort/pagination) — same
      root cause as the missing category pages above
- [ ] Confirm guest checkout is actually possible (not verified)
- [ ] Confirm stock/low-stock messaging is surfaced in UI (`stockCount` exists in
      schema but not confirmed as shown to customers)
- [ ] Accessibility audit not yet done (labels, focus states, contrast, keyboard nav)
- [ ] Mobile responsiveness not yet verified in-browser
- [ ] Loading/empty/error state consistency not yet audited across listing pages

---

## 6. Marketing & Admin (carried over from prior checklist, still open)

- [ ] Low-stock alert system (dashboard/email notifications)
- [ ] Newsletter provider integration (Klaviyo/Mailchimp/SendGrid) — currently just
      captures emails via `Subscriber` model, no ESP sync confirmed
- [ ] Conversion pixel events (`ViewContent`, `AddToCart`, `Purchase`, etc.)

---

## 7. Modern & Security Practices (2026 research)

Sourced from a live web search on current (2026) e-commerce security, architecture,
payments, SEO, and UX standards — cross-checked against this stack (Next.js 16 App
Router, MongoDB/Mongoose, NextAuth, Stripe + PayPal, in-memory rate limiter).

### Security
- [ ] Passkey/WebAuthn login option (alongside existing credentials auth) — now
      mainstream for high-value/risk-flagged actions at major US merchants
- [ ] Move rate limiting from in-memory to Redis (e.g. Upstash) — flagged repeatedly
      as a real weak point once deployed across multiple instances (see §2 above)
- [ ] MFA on admin accounts — currently a single password gate
- [ ] OWASP Top 10 pen-test pass before launch (SQLi, XSS, broken auth, SSRF,
      business-logic abuse) — not yet done
- [ ] Confirm `isomorphic-dompurify` (already a dependency) is actually applied to
      every user-generated/rich-text path (blog editor, review text) — not verified
- [ ] Data-flow map of anything touching payment info, even though raw card data
      never touches your servers (Stripe/PayPal handle that) — confirms your CDE
      boundary for future compliance audits

### Payments & fraud prevention
- [ ] Confirm Stripe integration uses PaymentIntents (not legacy Charges API) with
      3D Secure 2.x enabled — authenticates silently via device/behavioral signals,
      protects revenue without adding checkout friction
- [ ] Confirm Stripe Radar fraud rules are actively configured, not just default-on
- [ ] Confirm PayPal's equivalent fraud protection is enabled
- [x] Tokenization — already correct by construction (card data never touches your
      servers via Stripe/PayPal), just keep verifying no card data leaks into logs

### Architecture & performance
- [ ] Re-enable Next.js image optimization (ties directly into §1 SEO section above)
- [ ] Audit `'use client'` usage — some pages (e.g. FAQ) are client components with
      no interactivity that requires it; converting to Server Components reduces JS
      payload and improves Core Web Vitals
- [ ] Adopt ISR for product/category listing pages once category pages exist
      (static-fast, but stays fresh on price/stock)
- [ ] SSR reserved for genuinely personalized pages (cart, checkout) — confirm this
      is already the case, not over-applied elsewhere

### SEO reinforcement
- [ ] Watch for "schema drift" — JSON-LD must always match visible page content
      (e.g. `Product` schema price/stock has to stay in sync with what's rendered)
- [ ] Site hierarchy Homepage → Category → Subcategory → Product is the standard
      crawl structure — reinforces category pages as the top SEO priority (§1)

### Checkout / conversion UX
- [ ] Show tax/shipping as early as possible in the flow — "surprise cost at final
      step" is cited as the primary cause of cart abandonment
- [ ] Confirm guest checkout is actually available (still unverified — see §5)
- [ ] Checkout-page performance is a conversion metric, not just UX polish — every
      100ms of added latency at checkout can cost up to ~7% conversion

### Sources (2026 web research, for reference)
- [PCI DSS E-commerce Guidelines](https://listings.pcisecuritystandards.org/pdfs/PCI_DSS_v2_eCommerce_Guidelines.pdf)
- [A Comprehensive PCI DSS Compliance Checklist for 2026](https://www.cybercrestcompliance.com/blog/pci-dss-compliance-checklist)
- [E-commerce Website Penetration Testing: The 2026 Strategic Guide](https://pentesys.com/e-commerce-website-penetration-testing-the-2026-strategic-guide/)
- [Security Features for Online Marketplaces: Ultimate 2026 Guide](https://greenmoov.app/articles/en/security-features-for-online-marketplaces-ultimate-2026-guide-implementation-checklist/)
- [Building an E-Commerce Store with Next.js: Full Guide [2026]](https://www.ksolves.com/blog/next-js/building-an-e-commerce-store)
- [Next.js for e-commerce: the complete guide in 2026](https://www.elevaseo.com/en/blog/headless/nextjs-ecommerce-guide)
- [Ecommerce UX: Best Practices to Boost Conversions in 2026](https://www.fullsession.io/blog/ecommerce-ux/)
- [10 Ecommerce Checkout Best Practices To Implement In Your Store In 2026](https://belvg.com/blog/ecommerce-checkout-best-practices.html)
- [The Complete Guide To Ecommerce SEO in 2026](https://www.debugbear.com/blog/ecommerce-website-seo)
- [Full Technical SEO Checklist: The 2026 Guide](https://www.yotpo.com/blog/full-technical-seo-checklist/)
- [7 Headless Commerce Trends That Matter Most in 2026](https://www.netguru.com/blog/headless-commerce-trends)
- [Headless Commerce in 2026 (Everything You Need to Know)](https://www.bigcommerce.com/articles/headless-commerce/)
- [What Is 3D Secure? A Complete 2026 Guide](https://www.gpayments.com/blog/article/what-is-3d-secure-a-complete-2026-guide-for-enterprise-payment-teams/)
- [Payment Security and Fraud Prevention in the US in 2026](https://techbullion.com/payment-security-and-fraud-prevention-in-the-us-in-2026-ai-risk-scoring-passkeys-and-the-push-fraud-problem/)

---

## 8. Feature Spec: Jackets Category Customization (thejacketmaker-inspired)

**Scope decision (confirmed):** this customization feature applies **only to a new,
dedicated "Jackets" category** — split out from the existing `Outerwear` category, not
applied site-wide. Rest of the catalog (Tops, Bottoms, Activewear, Footwear,
Accessories) is unaffected. Inspired by thejacketmaker.com's validated, SEO-proven
approach (see prior comparison — 46% organic-search traffic, 1.9K ranked keywords,
4.7★/456 Trustpilot reviews).

### 8.1 Catalog change — taxonomy (confirmed against clothaa.com's live nav)

Two-level structure: **Level 1 = Jacket Type**, **Level 2 = Material/Style
subcategory** — but the material breakdown only goes deep on the hero jacket type;
the rest stay flat single-level categories.

> **✅ Prerequisite / blocker — built.** Real subcategory support now exists in the
> `Category` model and is fully wired through the API, admin UI, and storefront.
> Rollup is implemented (browsing a parent shows descendant products/counts too).
> Delivered pieces:
> - [x] `Category` model: `parentId?: ObjectId` (self-referencing, `ref: 'Category'`,
>       indexed) — `src/models/Category.ts`
> - [x] `Product.categoryId` unchanged, continues to point at the leaf category
> - [x] `src/lib/categories.ts` — pure `resolveDescendantIds`/`resolveAncestorChain`
>       helpers (client- and server-safe), used everywhere below
> - [x] `GET /api/categories` returns a flat list including `parentId`, with rollup
>       product counts; `POST`/`PUT` validate the parent and reject cycles; `DELETE`
>       blocks if the category still has subcategories
> - [x] `GET /api/products?category=slug` now rolls up descendant categories (both
>       the DB path and the static-data fallback path)
> - [x] Admin categories UI (`/admin/categories`) — parent-picker on add/edit (with
>       self/descendant exclusion), depth-indented tree list, "has subcategories"
>       delete guard
> - [x] New `/category/[slug]` pages (`src/app/category/[slug]/page.tsx` +
>       `layout.tsx`) — breadcrumbs walk the full ancestor chain, `generateMetadata`
>       + `CollectionPage`/`BreadcrumbList` JSON-LD, subcategory chip row, 404 via
>       `notFound()` for unknown slugs
> - [x] Homepage pills, footer links, and `sitemap.ts` all updated to use real
>       `/category/slug` URLs and top-level-only filtering (pills/footer)
> - [x] Product page breadcrumbs (visible UI + JSON-LD) updated to link to the new
>       category pages instead of the old `/?category=slug` pattern
>
> **Decision made:** rollup (not direct-only) — confirmed with the user. Full
> implementation plan: `C:\Users\arehman\.claude\plans\sharded-noodling-flamingo.md`.
>
> **Verified:** `npx tsc --noEmit` clean (only pre-existing errors in unrelated dead
> `_test2.tsx`/`_test4.tsx` files). Manually walked through in-browser against the
> static-data fallback path (no DB reachable in this environment): homepage pills +
> rollup counts, category filtering, `/category/tops` page render + breadcrumbs +
> metadata, 404 on an unknown slug, sitemap emitting `/category/...` URLs. The
> DB-backed code paths (Mongoose queries in the API routes, admin CRUD with a live
> parent-picker) compile cleanly and were carefully written against the actual
> existing route code, but could not be exercised live — this sandbox has no
> network path to the configured MongoDB Atlas cluster. Worth a live pass against
> a real DB connection before considering this fully verified end-to-end.
>
> Still open, deliberately deferred (not blockers for building the Jackets tree
> below): homepage `?category=` filter UI and the new `/category/[slug]` pages
> intentionally coexist rather than redirecting one to the other; delete requires
> removing subcategories bottom-up (no cascading delete).

- [ ] Add new top-level `Jackets` parent category (currently jackets fall under `Outerwear`)
- [ ] Decide fate of existing `Outerwear` products that are actually jackets — migrate
      them into the new category tree so the customization UI applies correctly
- [ ] Level 1 — Jacket Type (top-level subcategories under `Jackets`):
  - [ ] Varsity Jackets
  - [ ] Bomber Jackets
  - [ ] Coach Jackets
  - [ ] Denim Jackets
  - [ ] Fleece Hoodies
  - [ ] Leather Jackets
  - [ ] Puffer Jackets
- [ ] Level 2 — Material/Style (sub-subcategory, deep breakdown only on the hero
      type — pick which of the 7 above gets this; Clothaa uses Varsity Jackets):
  - [ ] Wool & Leather
  - [ ] All Wool
  - [ ] Faux Leather
  - [ ] All Leather
  - [ ] Hooded
  - [ ] Retro
  - [ ] Satin
  - [ ] Fleece
  - [ ] Cotton Twill
- [ ] "Design Your Own" and "Bulk Orders" implemented as cross-cutting global CTAs/
      entry points, **not** nested category pages (matches Clothaa's nav structure)

### 8.2 Customization builder (jackets only)
- [x] Multi-step builder scoped to Jackets category products: style → material
      → color → lining → optional embroidery/monogram → sizing → review, built
      as `src/components/jacket-customizer.tsx`, rendered from
      `product-detail-view.tsx` only when the product resolves under a jacket
      category (`isJacketCategoryPath` in `src/lib/categories.ts`) — every other
      product keeps the original flat variant UI, unaffected
- [x] Live preview — selecting a Color option with an uploaded image swaps the
      main product photo (reuses the pre-existing `variant.image` +
      `setOverrideImage` mechanism). **Limitation:** only Color selection
      triggers a photo swap today; Style/Material/Lining do not change the
      image. No true composited/rendered preview.
- [x] Dynamic price calculation: base price + summed variant `priceAdjust`
      (style/material/color/lining) + monogram fee, shown live at every step
      and in the final "Add to Cart" total
- [x] **Made-to-measure option** — admin defines `measurementFields: string[]`
      per product (e.g. Chest, Shoulder, Sleeve Length); customer toggles
      between Standard Size and Made-to-Measure on the Sizing step, entering a
      number per field. Stored as `{name: 'Measurement: <Field>', value}`
      entries alongside the rest of the selections — flows through cart →
      checkout → `Order.items[].variants` with zero schema changes, and
      already displays correctly on the admin Orders page.
- [x] Admin editor (`/admin/products/new` and `/admin/products/[id]`) has a
      "Jacket Customization" panel (embroidery toggle + fee + max chars,
      add/remove measurement-field chips) shown only for Jackets-category
      products, plus Style/Material/Lining "Quick Suggestions" — currently only
      populated for **Varsity Jackets** (the "hero" type per the original spec);
      the other 6 jacket types only get Color/Size suggestions. Varsity Jackets
      (and its subcategories) also get embroidery + a default measurement-field
      set auto-populated on category selection.
- [ ] "Design Your Own Jacket" entry point on the Jackets category page — not
      built; the builder only exists on individual product pages today, no
      standalone landing-page CTA

### 8.3 Order & fulfillment (jackets only)
- [ ] Extended order status stages for custom/made-to-measure jacket orders (Design
      Confirmed → In Production → QC → Shipped), distinct from standard in-stock orders
      elsewhere in the store
- [ ] Non-standard return policy messaging on jacket PDPs (custom/made-to-measure
      goods are typically final-sale except manufacturing defects)

### 8.4 Trust & conversion (jackets only, but cheap to reuse elsewhere later)
- [ ] Review count + star rating shown directly on Jackets category product cards
- [ ] Category-specific trust stat (e.g. "X jackets made to measure and shipped")

### 8.5 SEO (jackets only)
- [ ] Dedicated `/category/jackets` landing page (depends on the general
      category-pages gap already tracked in §1)
- [ ] Jacket-specific content: materials guide, sizing/measurement guide, care guide

### 8.6 Data model note (design decision, not yet built)
Two implementation paths — needs a decision before building:
- **A. Extend `Product`** with an optional `customization` sub-schema, populated only
  when `categoryId` = Jackets. Simpler, single collection, less new plumbing.
- **B. Separate `CustomizableProduct` model/type** for jackets only. Cleaner
  separation, but more new admin UI and query paths to maintain.

---

## Notes
- This file reflects a **static source-code review**, not a live/runtime audit — items
  marked `[x]` are confirmed present in code, not verified working end-to-end in a browser.
- Update this file as items are implemented — flip `[ ]` to `[x]` and add a short note
  if useful (e.g. `[x] Category pages — added 2026-08-xx`).
