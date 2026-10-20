# Checkout address suggestions and confirmation

Checkout prefers the current browser-tab draft, then the customer's default saved address. Guest and account drafts have separate keys and expire after 24 hours. Vercel location suggestions are only used for a new destination, never merged with an existing destination or used to overwrite edits. Browser shipping autofill is supported.

`GET /api/checkout/location` reads the trusted provider selected by `getGeoFromRequest`. On Vercel (`VERCEL=1`, or an explicitly trusted `ACTIVITY_GEO_PROVIDER=vercel`), the available country, region, city and nearby postal code become editable suggestions. Missing headers, unsupported countries and network failures leave ordinary manual entry. Plain Caddy must leave the provider unset unless a trusted edge overwrites incoming geo headers. This endpoint is private and not cached. It does not use Google services.

The buyer enters the remaining details and reviews the full address. The confirmation button calls `POST /api/checkout/address/confirm`. The server validates the shipping fields and supported country and refreshes signed-in account status/contact data from MongoDB. It issues a two-hour HMAC token using `NEXTAUTH_SECRET`, bound to the exact normalized address, email and account identity. The token contains hashes, not address text. Confirmation records the buyer's choice; it is not postal deliverability verification.

Both payment-creation endpoints require a valid matching token and repeat their existing customer, product, stock, price and coupon checks. Changing the address, email or account invalidates confirmation. Expired confirmation returns the buyer to review while preserving their entries. New orders store `shippingAddressConfirmedAt`; older orders and admin-created orders may omit it.

PayPal receives the confirmed shipping address with `SET_PROVIDED_ADDRESS`. Stripe retains the shipping address on the merchant order and does not collect a second shipping address. Billing details remain under the payment provider's requirements. Do not infer billing details from IP location or automatically equate billing and shipping addresses.

Drafts preserve entries and confirmation across back navigation, payment-method changes, refreshes and hosted-payment cancellation within the same tab. After a completed order, the confirmation page clears the draft's confirmation but retains the address for reuse. If browser storage is blocked, entry and payment still work, but reload recovery is unavailable.

Run `npm run test:checkout` for backend/payment and component-flow checks, and `node scripts/test-delivery-policies.mjs` for delivery rendering and supported-country checks. Tests mock database/provider boundaries and never charge cards or write live orders.
