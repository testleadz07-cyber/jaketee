# Worldwide shipping review — October 9, 2026

Code changes are local. **All four MongoDB edits were approved and applied on October 10, 2026 (Asia/Karachi).** The two FAQ answers and two blog shipping statements were saved and verified. Stored modification timestamp: `2026-10-09T19:40:42.774Z` (UTC). Evidence: `output/worldwide-shipping/applied-verification.json` and the timestamped applied result in that directory.

The dry run scanned every document in `faqs`, `blogposts`, `products`, and `settings`. It proposes changes to four documents: two FAQs and two blog posts. No product or settings text matched. A UK fashion trend mention was intentionally left untouched.

The complete original text and exact proposed replacement fields are in [the dry-run report](../output/worldwide-shipping/review.md). The machine-readable reviewed plan is [plan.json](../output/worldwide-shipping/plan.json), and original documents are backed up in `output/worldwide-shipping/before.ejson`.

## Proposed database edits

1. **Do you ship internationally?** Replace the answer with:

   > Yes. We ship worldwide, except to Israel and Russia at this time. Individual orders are made and shipped within 6–7 business days after design approval, and delivery takes 5–7 business days. Customs processing in some countries can add time, and any import duties or taxes are the buyer’s responsibility.

2. **How long does production and delivery take?** Add the individual-order handling and transit timing, including customs variability; retain “Orders of 10 or more jackets typically take 3–4 weeks in total.”

3. **How Long Does a Custom Jacket Order Take? (Production & Shipping Timelines Explained)** Replace the delivery sentence naming the US, UK and Canada with worldwide coverage, the two exclusions and the dispatch-to-delivery estimate. Preserve the rest of the article.

4. **Wholesale Custom Jackets for Schools, Teams, and Corporate Programs** Replace the sentence beginning “Shipping to the United States is standard…” with worldwide coverage and the delivery estimate. Preserve its instructions about final shipping addresses and sorting cartons, and the rest of the article.

Only documents actually edited receive a new `updatedAt`; existing explicit `dateModified` fields receive the same timestamp. Published blog and product sitemap dates read those stored timestamps. The FAQ sitemap entry reads the latest published FAQ modification date. View counts do not change blog modification dates.

The approved plan was applied with:

```powershell
node scripts/update-worldwide-shipping.mjs --apply --plan=output/worldwide-shipping/plan.json
```

The apply operation uses a MongoDB transaction and refuses to change a document that differs from its reviewed snapshot. Regenerate and review the plan if concurrent content changes occur.

## Coverage and implementation

`src/config/fulfillment.ts` exports the single allowed `shippingCountries` list and derived dropdown options. It currently contains 232 ISO destinations: all 249 ISO codes, minus IL and RU, minus the 15 codes absent from Stripe Checkout's shipping-address enum: AS, CC, CU, CX, FM, HM, IR, KP, MH, MP, NF, PW, SY, UM and VI. This matches the installed Stripe SDK 22.3.0 and the current [Stripe API reference](https://docs.stripe.com/api/checkout/sessions/create?query=shipping_address_collection).

Additional carrier restrictions can be configured in `deliverySettings.carrierExcludedCountries`; no carrier-specific restrictions were supplied or inferred. Payment-account restrictions specific to the merchant still need to be supplied if applicable.

Checkout, the quote country selector, admin custom orders, product shipping JSON-LD, returns JSON-LD, shipping policy country list and server validation read the shared configuration. Product delivery selection also shows unavailable destinations with an explanatory message. Stripe collects its shipping address using the shared allowed codes; payment confirmation persists that confirmed address to the order.

Organization JSON-LD states Worldwide. Shipping metadata and Open Graph text use the shared coverage wording. Search found no US/UK/Canada-only shipping claims in public `llms.txt`, `llms-full.txt`, `/.well-known/mcp.json`, email templates, footer or banners. Unrelated country references, artwork flags, sizing standards, business address and privacy jurisdiction text remain unchanged.

## Validation

- `node scripts/test-delivery-policies.mjs` passes: Central 11:58 PM/12:01 AM and Saturday, holidays, both DST transitions, configured countries versus Stripe's SDK enum, IL/RU messages, server rejection by both payment handlers, confirmed Stripe shipping address, initial skeleton, shipping cost and migration preservation/idempotence.
- Schema.org validation of the actual shared `OfferShippingDetails` object: zero errors and zero warnings. Evidence: `output/worldwide-shipping/schema-validator.json` and `shipping-schema.json`.
- Actual local HTTP product and shipping pages pass checks for all 232 destinations, IL/RU exclusions, $45 shipping, handling/transit/business days, expanded policy section, correct placement and initial date skeleton. Evidence: `output/worldwide-shipping/http-results.json`.
- Actual HTTP requests to Stripe checkout, PayPal create-order and the quote/contact endpoint each reject IL and RU with status 400 before creating orders or sending messages. Evidence: `output/worldwide-shipping/http-rejections.json`. The local sitemap includes the FAQ entry's stored last-modification timestamp.
- Schema.org also validated the complete product HTML returned by the local server: zero errors and zero warnings. Evidence: `output/worldwide-shipping/rendered-product-validator.json`.
- Changed server/config/helper files pass ESLint. Checkout and admin orders retain their six and five existing lint errors respectively; comparison against HEAD found no new lint errors.
- Project TypeScript check remains blocked by existing errors in unrelated migration scripts, analytics, statistics, blog Map inference, header session typing and static product data. No errors were reported in the shipping changes.
- Google interactive Rich Results Test, browser interaction checks and deployment have not been completed. Schema.org validation does not replace Google's test.
