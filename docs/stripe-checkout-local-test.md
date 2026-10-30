# Stripe checkout loader and retry fix

Changes are local and uncommitted. No real payments, emails, staging, push or deployment performed.

## Runtime behavior
- Browser payment request has a 45-second deadline and an immediate in-flight guard. HTML/provider failures release the loader and preserve checkout fields.
- The browser keeps a random attempt ID plus payload digest in sessionStorage; an in-memory fallback covers blocked storage within the page lifetime. Reload with storage blocked cannot retain an attempt.
- Order has a unique sparse stripeAttemptKey index. Existing non-Stripe/legacy orders remain valid. The server reserves one order per owner/attempt and rejects altered payloads.
- Stripe coupon and Checkout Session calls use separate stable idempotency keys and frozen order amounts. Fetch HTTP transport, 10-second SDK timeout, no configured network retries, and a shared 25-second Stripe request deadline.
- A timeout does not mean the server/Stripe canceled creation. The same attempt recovers the same session. Completed/paid attempts are not recreated; confirmed expired sessions allow the UI to start a fresh attempt. Uncertain attempts older than 23h require support review.
- Admin notification runs through Next after(); telemetry does not delay the hosted redirect. Invocation-scoped Mongo cleanup remains unchanged.
- Existing webhook/verification fulfilment logic is not rewritten in this patch. This patch does not claim full exactly-once stock/email fulfilment.

## Local setup
Existing .env has test secret and publishable Stripe keys and local app URL. No new API keys required to open Stripe Checkout.
- Use a separate test Mongo database. Existing MONGODB_URI is present; its data isolation has not been verified. First request initializes the new unique index and requires the DB user to be able to create it.
- For normal next dev: MONGO_PER_REQUEST must not be true (it requires Workers request scope).
- NEXT_PUBLIC_APP_URL and NEXTAUTH_URL should be http://localhost:3000. Restart dev server after env changes.
- Disable email and push for local payment tests: EMAIL_PROVIDER=disabled, PUSH_ENABLED=false. Do not enable cron.
- Run npm run dev; open http://localhost:3000.
- Local STRIPE_WEBHOOK_SECRET is missing/placeholder. For payment webhook tests, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, put the CLI-issued whsec value in local STRIPE_WEBHOOK_SECRET and restart dev. Do not use/change the production endpoint secret.
- Official local forwarding reference: https://github.com/stripe/stripe-cli/wiki/listen-command

## Manual checklist
1. Guest and signed-in checkout: confirm shipping, click Stripe and reach checkout.stripe.com; return URL remains localhost.
2. Test quantity/shipping/free-shipping/promo against order and Stripe amounts.
3. Cancel and retry the same checkout: same pending order/session, not another order.
4. Simulate an HTML 503/offline/timeout: loader stops, fields remain; retry retains attempt ID.
5. Double-click: one browser request. Concurrent same-attempt API calls reserve one order.
6. If Stripe created a session but response/save failed, retry and recover that session.
7. Confirmed expired session: retry starts fresh; completed/paid session never silently starts another payment.
8. Use Stripe test mode only for test payment/CLI webhook; inspect paid status separately. Do not infer paid status from the redirect alone.

## Verification
Offline tests exercise the real route with mocked Stripe/DB, and the checkout component handlers for timeout/HTML failure/attempt reuse. Real Mongo concurrency/index creation, hosted Stripe navigation and test payment remain manual integration checks.

Validation results: TypeScript, checkout handler/UI tests, retry/concurrency tests and security tests passed. Masked OpenNext production build with the existing temporary Windows Webpack override passed, including credential sanitization/artifact scan. Production configuration unchanged. No real DB/payment/hosted Stripe tests performed; those remain manual. No files staged, committed or pushed.


## Confirmation/auth follow-up

- `/api/auth/session` normalizes only successful JSON `null` to `{}` for the NextAuth v4 browser client. Server-side revoked/inactive-session checks still return null; response cookies are preserved.
- Verification has a 45-second browser deadline, cancellation on unmount, a duplicate-click guard and an explicit verification retry. Retrying never creates a new charge.
- Webhook and browser verification share a MongoDB transaction for payment status, stock and discount usage. Atlas supports transactions; a standalone local MongoDB server must run as a replica set. No new service or paid Mongo tier is required for the existing Atlas deployment.
- Transaction retries have a 20-second deadline. Stripe retrieval has a 10-second timeout with automatic network retries disabled.
- The session ID, references, currency and amount must match the saved order. Failed/expired webhook updates cannot cancel a paid order.
- Email is attempted outside the transaction with a single atomic claim. Accepted means accepted by provider, not inbox delivery. Failed or uncertain attempts are not automatically resent. A process crash after payment commit can leave email pending/sending; another verified request can claim pending, but sending requires manual review. Existing paid orders are not backfilled or reprocessed.
- The confirmation screen no longer claims an email was sent when it failed. Dark-mode delivery text, item-name wrapping and action-button sizing were adjusted.
- Non-Cloudinary images use direct delivery by default instead of the global Cloudinary custom loader. Explicit per-image loaders/unoptimized settings remain supported.

### Local regression checklist

1. Restart the dev server after the build: `npm run dev`.
2. With a stale/revoked login, `/api/auth/session` should return `{}` without CLIENT_FETCH_ERROR. Admin endpoints must still deny access. Sign in again to test a valid user.
3. Test a new guest and signed-in Stripe test payment. Confirmation must show the correct order and total.
4. Refresh confirmation and resend its webhook, including concurrent requests: one paid history entry, one stock decrement, one coupon increment, and at most one email attempt.
5. Simulate offline/failed verification: loading ends and Retry verification checks the existing payment. Do not create another payment.
6. With email disabled/unconfigured, the order stays paid and the screen never says email sent. With configured test delivery, accepted status should appear.
7. Check confirmation in light/dark themes and at mobile width: readable delivery schedule, wrapped names, visible success icon, usable buttons.
8. Start `stripe listen --forward-to localhost:3000/api/webhooks/stripe` using the same test account as the app; use its signing secret only in local STRIPE_WEBHOOK_SECRET.

Automated confirmation tests use offline mocked MongoDB transactions and provider calls. They do not replace a real Atlas + Stripe test-mode webhook/refresh test.

References: [MongoDB transaction retries and atomicity](https://www.mongodb.com/docs/drivers/node/current/crud/transactions/), [Stripe CLI login](https://support.stripe.com/questions/sign-in-to-stripe-cli).

Latest follow-up validation: TypeScript passed; checkout, confirmation UI, session normalization and admin/security tests passed. Masked production OpenNext build (Webpack verification config on Windows) and credential artifact scan passed. The first sandbox build hit Windows EPERM in .next; the retry outside the sandbox succeeded. No live Stripe payment, email delivery or Atlas mutation was performed by these checks. All source changes remain unstaged; no commit, push or deployment.
