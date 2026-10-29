# Cloudflare migration

## Current status — 2026-10-29

The deployed test service is `jaketee`, production branch `cloudflare-migration`,
at https://jaketee.testleadz07.workers.dev. Commit `7e0ed65` built and deployed
successfully. Live shop, session and location probes returned 200; guest address
confirmation returned 200 in 292 ms. Email/push and login were confirmed by the
operator. These checks do not prove payment completion or resolve CPU limits.

`cloudflare-worker.ts` now delegates to the generated OpenNext handler through
`src/cloudflare/protected-fetch.ts`. The active guard calls native LOGIN_LIMITER
or API_LIMITER, then SECURITY_LIMITER to enforce the existing longer route
windows globally. Native limits are approximate and local to a Cloudflare
location; the Durable Object counter is authoritative for the configured route
budget. Existing anonymous route/IP keys are preserved, so people sharing an IP
share these abuse budgets; these are not individual customer quotas.
Session/CSRF/auth discovery, OPTIONS, provider webhooks and cron routes bypass
this outer guard. Webhooks retain their existing signature verification. Missing
protection bindings fail closed for protected API routes. No cron trigger or
scheduled handler is enabled, and `worker.ts` remains historical and unused.
The generated request wrapper still owns streaming and MongoDB cleanup.

### Workers Builds and Previews

- Production and Previews Base **build command**: `npx opennextjs-cloudflare build`.
- Production **deploy command**: `npx opennextjs-cloudflare deploy`.
- New Worker Previews **preview command**: `npx wrangler preview`.
- Root directory: `/`; production branch: `cloudflare-migration`.
- Build-time public variables and runtime variables/secrets remain separate.
  Preserve configured public keys; do not use the isolated local build helper as
  the dashboard build command without its explicit configured-environment opt-in.
- `npm run preview` / `opennextjs-cloudflare preview` is a local development
  preview; it is not the new remote Worker Previews command.
- Do not replace the new remote preview command with `versions upload` or the
  adapter `upload` command. Those belong to the older version-upload workflow.
- The Previews Base build command was changed from `npm run build` to the
  OpenNext command above in the dashboard, saved, and verified after reloading.
  Production already used the correct OpenNext build/deploy commands.

Main domains `jacketee.com` and `www.jacketee.com` still resolve to Vercel.
Switching them is a separate traffic cutover: confirm timing, move the domain
route, then align NEXTAUTH_URL/NEXT_PUBLIC_APP_URL, OAuth callback allowlists,
Turnstile hostnames and external callback endpoints. Do not add an active domain
route to Wrangler while the service is still being tested on workers.dev.

Persistent R2/D1/cache bindings remain optional and inactive. Stripe webhook
configuration and CPU-plan changes are explicitly excluded from this work.

Verification of the active protection wiring: app/Worker type checks,
Cloudflare contract tests and checkout tests passed. The full isolated OpenNext
build passed the credential scan. Wrangler dry run: 23417.13 KiB uncompressed /
5059.93 KiB gzip. Actual local workerd accepted 60 visitor-country requests and
returned 429 with Retry-After on request 61; session polling remained 200 without
rate-limit headers after that limit was reached. These probes used no database,
email, payment or push credentials.

References checked against current documentation:
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/
- https://opennext.js.org/cloudflare/howtos/custom-worker

## Earlier implementation notes (historical)

The notes below record earlier migration stages. Statements about missing
deployments, old entry points, disabled integrations and unperformed tests are
historical; the current status above takes precedence.

Visitor metadata now comes from Cloudflare only: `CF-Connecting-IP` for IP and
OpenNext's `getCloudflareContext().cf` for country, region, city and postal code.
Forwarded chains and Vercel geo headers are ignored. Activity, login records,
session heartbeat and checkout/delivery suggestions share these helpers. Location
remains an approximate suggestion and never replaces the confirmed shipping address.

Guest address confirmation validates/signs locally without opening MongoDB.
Authenticated confirmation retains account validation. The client bounds the
confirmation request to 20 seconds and shows a readable error for HTML outages;
optional profile-address saving runs separately with a 10-second timeout.

## Current generated-entry configuration

After changing Cloudflare's production branch to `cloudflare-migration`, save
the build settings. A subsequent push to this branch triggers a new build;
changing the branch setting alone does not rebuild an already-pushed commit.
Check the new build's branch and commit instead of retrying an old `main` build.

The active Worker is **jaketee**, with main **cloudflare-worker.ts**. This minimal
entry re-exports the generated **.open-next/worker.js** default handler and the
SecurityRateLimiter class. No cron triggers or scheduled handler are configured.
The old worker.ts is unused.
Package preview/deploy/upload scripts use the standard OpenNext CLI commands.
R2, D1 and Durable Object cache bindings are commented examples only.
`keep_vars: true` preserves runtime variables managed in the Cloudflare dashboard
across Wrangler deployments. Store MONGODB_URI and other credentials as encrypted
runtime Secrets, save/deploy that settings change, and verify the active Worker
version receives them. Build variables are separate and do not supply runtime
bindings. This setting preserves existing values; it cannot restore a deleted URI.
The generated-entry OpenNext build passed. Wrangler's local dry run reported
23426.47 KiB uncompressed / 5062.97 KiB gzip, with the requested self-reference,
Images, assets and minute-level rate-limit bindings. No deployment was performed.

MongoDB request isolation is now installed through the OpenNext server wrapper
in `open-next.config.ts`, while retaining the generated Worker entry. It delegates
to the adapter's own `cloudflare-node` wrapper, scopes models/connections per
invocation, and closes connections after response streaming and registered
background tasks finish. No new runtime variable is needed. The custom wrapper
requires the adapter's explicit config-validation opt-out because its validator
only accepts the literal stock wrapper name. Recheck this integration on adapter
upgrades; offline regression tests exercise the real stock wrapper concurrently.

SECURITY_LIMITER now binds the exported SecurityRateLimiter class, with the
security-v1 SQLite migration for Free-plan compatibility. Existing account
lockouts and strict API limiter callers use this binding. Its counters live in
Cloudflare storage, not MongoDB. Native LOGIN_LIMITER/API_LIMITER bindings remain
configured separately. The unused old entry's route-wide guard is not restored.
This build check uses MIGRATION_TEST_MODE=true with local production credentials
masked. Set MIGRATION_TEST_MODE=true in Workers Builds for the same database-free
test build; otherwise the existing homepage prerender needs database access.

Standard adapter builds may copy local .env values into ignored output. Keep
runtime secrets in Cloudflare settings; the earlier isolated build/sanitization
helpers remain available separately. Do not commit generated artifacts.

The notes below describe the earlier migration and are historical where they
refer to the custom entry, its guards or its security Durable Object binding.

Branch: `cloudflare-migration`, created from `feature/checkout-shipping-address`.
This is an isolated testing profile, not a production cutover. No domain, DNS,
Cloudflare deployment, production database, payment, email or device was changed.

## Safe defaults and intentional differences from the original plan

- Worker vars enable `MIGRATION_TEST_MODE=true`, request-local MongoDB, and disable
  email, push and scheduled jobs. No cron triggers are active.
- Supplying a database in test mode requires `MIGRATION_TEST_DATABASE=true` to
  acknowledge that the URI points to a separate test database. This assertion
  cannot inspect an Atlas database and does not replace operator verification.
- Live Stripe secret keys and `PAYPAL_MODE=live` are rejected in test mode.
- The default Cloudflare build masks local application credentials, sets a local
  test origin, and never prerenders the homepage against the live database.
- `scripts/cloudflare-build.mjs` removes OpenNext's generated `.env` fallback.
  Runtime secrets must be supplied through Cloudflare bindings. Use this wrapper,
  rather than invoking the adapter build directly when local `.env` files exist.
- The Free profile deliberately uses OpenNext's dummy cache. It does not promise
  ISR or tag invalidation. The sitemap remains dynamic: switching it to daily ISR
  before a persistent cache is provisioned would not provide reliable freshness.
- All previous API limits and account lockout windows are retained. Native
  Cloudflare rate limit bindings provide additional minute-level protection;
  SQLite Durable Objects enforce the original longer windows across locations.
- Edge middleware keeps the prior memory fallback for Vercel. On Workers, the
  custom entry independently enforces durable protection before Next runs.
- Dynamic legacy product resolution runs in a public Node route handler before
  rendering begins. Workers invoke it internally, preserving HTTP 301 despite
  Next loading boundaries. Vercel's Edge middleware fetches that lookup using the
  configured NEXTAUTH_URL and preserves HTTP 301. Static redirects remain 301.
- Both cron routes process at most five records per invocation, leaving headroom
  under Free's subrequest budget. Raise only after measuring on a paid plan.
- MongoDB isolation needs small export wrappers in every model. Schemas and
  collection names are unchanged; routes continue importing the same exports.

## Changed files

### Build and hosting

- `package.json` / `package-lock.json`: pinned OpenNext and Wrangler; supported
  Node engine; build/preview/deploy/upload/typegen/test commands; removed direct
  firebase-admin and geoip-lite dependencies. Cloudinary SDK and sharp are retained
  only as development dependencies because existing maintenance scripts need them;
  the app uses HTTP uploads and does not import them. Compatible build-tool
  dependency overrides address glob and Zod advisories.
- `next.config.ts`: conditional standalone output, optional binding-aware local
  dev (`CLOUDFLARE_DEV=true`), custom image loader, removed geoip tracing.
- `open-next.config.ts`: no-persistence test cache and commented R2/DO/D1 option.
- `wrangler.jsonc`: assets, compatibility, observability, test defaults, native
  rate limiters, security DO migration, disabled schedules, commented ISR setup.
  Compatibility is pinned to 2026-10-23, the newest date supported by the installed
  workerd; using the client date 2026-10-29 caused local startup to fail.
- `worker.ts`: wraps OpenNext fetch with test isolation checks, durable API limits,
  request-local connection lifetime through response streams and `waitUntil`,
  legacy 301 handling, and optional internal scheduled dispatch.
- `src/app/api/legacy-product-resolution/route.ts`: uncached, public canonical URL
  lookup before streaming; no MongoDB import enters Edge middleware.
- `public/_headers`: immutable hashed assets and uncached Firebase service worker.
- `.gitignore`: ignores generated bundles, local vars, generated types and logs.
- `.dev.vars.example`: names only, no credentials or usable secret values.
- `tsconfig.json` / `tsconfig.worker.json`: separate browser/Next and workerd
  globals so Workers' stricter `Response.json()` types do not affect client code.
- `scripts/cloudflare-build.mjs`, `scripts/migration-env.mjs`,
  `scripts/migration-run.mjs`, `scripts/verify-cloudflare-artifact.mjs`: isolated
  build helpers and a generated-artifact check for local runtime credentials.

### Database and security

- `src/lib/worker-request-scope.ts`: shared AsyncLocalStorage scope and cleanup.
- `src/lib/mongodb.ts`: request-local connection and model selection on Workers;
  cached connection on Node/Vercel, timeouts, no buffering, no automatic schema
  creation/index builds on Workers. Provision existing indexes on the test DB.
  `MONGO_PER_REQUEST=true` fails closed without the custom Worker scope.
- All model exports wrap their unchanged schemas: `AbandonedCart`, `Activity`,
  `BlogCategory`, `BlogPost`, `Category`, `ContactMessage`, `Discount`, `Faq`,
  `GuestActivity`, `GuestOrderClaim`, `LoginSession`, `Notification`,
  `NotificationRetryState`, `Order`, `Product`, `PushDevice`, `RefundRequest`,
  `Review`, `SectionImage`, `Settings`, `StoreSettings`, `Subscriber`, `Tag`,
  `User`, and `Wishlist` in `src/models/`.
- `src/proxy.ts` becomes `src/middleware.ts`: Edge-safe admin gate and Vercel
  fallback API protection; no database resolver import.
- `src/lib/route-rate-limits.ts`: original route budgets and exemptions.
- `src/lib/rate-limit-memory.ts`: original Node/Vercel fallback with Cloudflare IP
  header support. It remains per-process, as it was before this migration.
- `src/lib/rate-limit.ts`: async binding-aware API and account-lockout helpers.
- `src/lib/cloudflare-security.ts`: hashes limiter keys and calls the security DO.
- `src/cloudflare/security-rate-limiter.ts`: transactional counters, long windows,
  login reset, and expiration alarms. Binding failures fail closed on Workers.
- `src/lib/auth-options.ts`, `src/app/api/admin/push/route.ts`,
  `src/app/api/bulk-quote/route.ts`, `src/app/api/customizations/artwork/route.ts`:
  await asynchronous rate-limit operations.

### Integrations and jobs

- `src/lib/geo.ts`, `src/app/api/visitor-country/route.ts`,
  `src/app/api/chat-visibility/route.ts`: Cloudflare-only metadata, including city,
  region and postal-code suggestions through OpenNext's request context. No
  geoip database or Vercel/Netlify detection. Location is never an authorization boundary.
- `src/lib/email.ts`: environment-controlled SMTP TLS and request-local transport;
  optional Cloudflare REST provider; attachments; test recipient allowlist;
  missing configuration and rejected/bounced delivery return failure.
- Contact/bulk-quote/order-claim routes select the configured provider and use
  `ADMIN_NOTIFICATION_EMAIL` (or support/address fallback) instead of treating an
  SMTP username such as `api_token` as an email recipient. Registration, password
  reset and profile updates await mail so Workers cannot terminate it early.
- `src/lib/firebase-admin.ts`: Web Crypto RS256, escaped PKCS#8 key, OAuth token
  value cache, ordered HTTP v1 multicast results, explicit unregistered-device
  errors, and a 20-send budget shared across each Worker request. Deferred sends
  remain pending through the existing notification delivery code.
- `src/lib/push-config.ts`: explicit push disable switch.
- `src/lib/cloudinary.ts`: signed multipart HTTP upload, compatible File/Buffer
  input and return shape; no intermediate Buffer copy for File uploads.
- `src/lib/request-body.ts` and upload/snapshot routes bound incoming bytes while
  reading, before multipart or JSON parsing can allocate an oversized body.
- `src/lib/image-loader.ts`: Cloudinary transforms; other sources served directly,
  including local raster images. No `/_next/image` fallback or global unoptimized.
- `src/app/page.tsx`: request-time homepage rendering in migration test mode;
  normal Vercel builds retain their 60-second ISR setting.
- `src/app/api/cron/abandoned-cart/route.ts`: eligible-record query, stable sorting,
  five-record batch, atomic claim using the existing timestamp, failed-send lease
  restoration, and no sends in migration test mode. No schema fields added.
- `src/app/api/cron/review-requests/route.ts`: eligible delivery date filtering,
  stable five-record batches, existing atomic claims, and test-mode denial.
- `vercel.json` is retained for rollback.

### Verification

- `scripts/test-cloudflare-migration.cjs`: offline request isolation, model/ref
  rebinding, durable limits, preserved windows, email safety/attachments,
  Cloudinary signing, country precedence, image fallback, RS256 and FCM results.
- Existing checkout/Google-push tests adapt their loaders to model wrappers and
  the new platform-header contract. Existing contact/bulk/merge test mocks are
  brought up to date with current catalog and Turnstile imports.

## Environment inventory

The example lists every application variable with an empty value. Never commit a populated copy.

### Browser build variables

Set under Workers Builds build variables. These values are public in the browser bundle; use test-project values and rebuild after changes. Set NEXT_PUBLIC_APP_URL to the test origin.

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_BULK_PRODUCTION_DELIVERY_WINDOW`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`

### Runtime settings and secrets

Set under Worker Settings → Variables and Secrets, separately for every test/production service. Treat database URIs, passwords, private keys, OAuth secrets, webhook secrets and API tokens as encrypted secrets. Other flags and identifiers can be plain variables. BING_SITE_VERIFICATION and GOOGLE_SITE_VERIFICATION are public and may also be needed at build time for prerendered metadata.

- `ABANDONED_CART_DISCOUNT_CODE`
- `ADMIN_NOTIFICATION_EMAIL`
- `BING_SITE_VERIFICATION`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_EMAIL_API_TOKEN`
- `CLOUDFLARE_WORKER`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CRON_ENABLED`
- `CRON_SECRET`
- `EMAIL_FROM`
- `EMAIL_PROVIDER`
- `EMAIL_TEST_RECIPIENTS`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_PROJECT_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_SITE_VERIFICATION`
- `MIGRATION_TEST_DATABASE`
- `MIGRATION_TEST_MODE`
- `MONGODB_URI`
- `MONGO_PER_REQUEST`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_MODE`
- `PAYPAL_WEBHOOK_ID`
- `PUSH_ENABLED`
- `PUSH_TEST_TOKENS`
- `SMTP_HOST`
- `SMTP_PASS`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPPORT_EMAIL`
- `TURNSTILE_HOSTNAMES`
- `TURNSTILE_SECRET_KEY`

### Local/build controls

- `CLOUDFLARE_DEV`
- `CLOUDFLARE_PRODUCTION_BUILD`
- `NEXTJS_ENV`

`MONGO_PER_REQUEST` is mandatory for the configured Worker profile; Worker scopes always isolate connections. Leave it unset on normal Node/Vercel. Runtime secrets are never NEXT_PUBLIC variables.

## Local tests

Use Node 22.16+ (the installed Wrangler requires Node 22+, Mongoose requires
20.19+, so the original proposal's Node 20.9 minimum was insufficient).

```sh
npm ci
npm run cf-typegen
npm run typecheck
npx tsc --noEmit -p tsconfig.worker.json
npm run test:cloudflare
npm run test:checkout
npm run test:google-push
npm run test:merge-safety
node scripts/migration-run.mjs next build
npm run build:cloudflare
```

`node scripts/migration-run.mjs next build` runs the ordinary `next build` with
production credentials masked. It is the safe equivalent of `npm run build` for
this local checkout, which already has a production `.env` file.

For a credential-free runtime smoke test:

```sh
node scripts/migration-run.mjs opennext preview
```

For integrated local tests copy `.dev.vars.example` to ignored `.dev.vars`, fill
only separate test credentials, and keep these values explicit (empty entries
otherwise override the safe Wrangler defaults):

```dotenv
MIGRATION_TEST_MODE=true
MIGRATION_TEST_DATABASE=true
MONGO_PER_REQUEST=true
CLOUDFLARE_WORKER=true
CRON_ENABLED=false
EMAIL_PROVIDER=disabled
PUSH_ENABLED=false
NEXTAUTH_URL=http://localhost:8787
```

Then run `npm run preview`. It builds first and serves in workerd, not Node.
Keep `CLOUDFLARE_DEV` unset for ordinary `npm run dev`. Prefer preview for database
tests: the plain Next development server has no custom Worker request scope.
Do not copy production `.env` or `.env.vercel` into `.dev.vars`.

The default build intentionally clears public integration keys. To build an
isolated integrated preview with real test public keys, explicitly set
`CLOUDFLARE_PRODUCTION_BUILD=true` for the build process and configure only test
build variables. Despite its name, this switch means "use configured build
environment"; it does not deploy or disable runtime migration guards.

## Cloudflare dashboard setup

1. Push this branch only after reviewing its commits. Create a separate Workers
   test service; keep production domains and the existing Vercel project intact.
2. Workers & Pages → create/import a Worker → connect the GitHub repository.
   Select production branch `cloudflare-migration` **for that test service**.
3. Set the root to this project and Node to a supported version (22.16+).
4. Build command: `npm run build:cloudflare`. Deploy command:
   `npx opennextjs-cloudflare deploy`. Non-production version command:
   `npx opennextjs-cloudflare upload`. Do not use `npm run deploy` as the dashboard
   deploy command, because that would repeat the build.
5. The worker name in `wrangler.jsonc` is `jaketee`. Ensure this is not an existing
   live Worker in your account. If occupied, change it to a distinct test name
   before connecting Builds. Also update the commented self-reference service.
6. Wrangler provisions the SQLite security DO migration. These bindings are
   necessary even on the Free testing profile; do not remove them to make a
   deployment pass. No R2 bucket is required by the test cache profile.
7. Set runtime variables/secrets under the Worker → Settings → Variables and
   Secrets. Set build-time public variables under Builds → build variables and
   secrets. Runtime values do not rebuild `NEXT_PUBLIC_*` values in browser JS.
8. Use a workers.dev test URL. Update NEXTAUTH_URL, test Google OAuth callbacks
   (`/api/auth/callback/google`), Turnstile allowed hostnames and test payment
   webhook URLs to that origin. Keep email/push/cron disabled initially.
9. Use an Atlas test DB with a least-privilege test user and appropriate network
   access. Workers do not provide a single stable egress IP; do not silently open
   the production Atlas allowlist. Provision existing application indexes in the
   test DB through your normal controlled database setup.

## Email setup

Onboard the sending domain in Cloudflare Email Service, publish and verify its
required DNS authentication records, and obtain an Email Sending API token with
the account-scoped sending permission. Availability/quotas depend on the account;
Email Routing alone is not outbound email sending.

- HTTP: `EMAIL_PROVIDER=cloudflare-api`, account ID, email API token and EMAIL_FROM.
- SMTP: `EMAIL_PROVIDER=smtp`, `SMTP_HOST=smtp.mx.cloudflare.net`, `SMTP_PORT=465`,
  `SMTP_SECURE=true`, `SMTP_USER=api_token`, `SMTP_PASS=<email API token>`.
- In migration tests also set `EMAIL_TEST_RECIPIENTS` to individual bare test
  email addresses separated by commas. The requested recipient must match one
  exact address. Verify a real invoice attachment before allowing customer mail.
- No automatic retry through a second provider: a timeout may already have sent
  the message, so automatic cross-provider fallback could duplicate it.

## Production caching

R2/D1/DO cache configuration remains optional and inactive. Provision and test
the matching resources before enabling persistent ISR or tag invalidation.
Cron scheduling is out of scope and disabled.

## Acceptance checklist and remaining risks

Implementation verification completed: Next/OpenNext build, app and Worker type
checks, offline migration contracts, checkout tests, 19 Google/push tests and
contact/bulk/permission regressions passed. Local Workers preview verified login,
checkout, About, robots, the service-worker headers, the admin redirect, real 301
legacy product redirects, missing-product 404s and durable contact rate limits
surviving a restart. Generated artifacts passed the local credential scan.
Final Wrangler dry-run upload: **23412.07 KiB uncompressed / 5064.86 KiB gzip**
(about 22.86 MiB / 4.95 MiB). The dry run did not deploy anything.

No deployment or real-service integration test was performed. A separate Atlas
database and test credentials are still required. Without a database, catalog
APIs return 503 and sitemap returns 500; do not mistake the credential-free smoke
profile for a fully configured store. A local Node measurement of one bcrypt
cost-12 hash plus one comparison used 1624 ms CPU; deployed Workers CPU still
needs measurement. Password strength was preserved.

The dependency audit still reports existing advisories for Nodemailer/NextAuth
and the development-only sharp version. Their major upgrades are outside this
migration and remain a maintenance task; no forced audit upgrade was applied.

- [ ] Isolated Atlas database: simultaneous requests, model populate, login,
  logout and `next/after` cleanup; no cross-request I/O errors or leaked sockets.
- [ ] Render homepage, a product, category and blog with test DB content.
- [ ] Credentials and Google login, inactive accounts, admin access and expiry.
- [ ] Account lockout, reset after successful login, hourly limits across regions.
- [ ] Cart and checkout with confirmed addresses; Stripe/PayPal sandbox only.
- [ ] Webhooks: raw-body signature validation, duplicate delivery and retries.
- [ ] Cloudinary image, 25 MB video and snapshot uploads; memory/CPU measurements.
- [ ] Invoice PDF generation, attachment content and email delivery to allowlist.
- [ ] Test-device push success, invalid tokens, partial retries and send budgets.
- [ ] Sitemap/robots, canonical redirects (301/308), query strings and final pages.
- [ ] Private API/session responses never cached; catalog edits invalidate caches
  after enabling the production cache profile.
- [ ] Cron overlap, failures, lease expiry, backlog and disabling the old scheduler.
- [ ] Deployed Worker CPU/startup/memory and compressed upload size measured.

Free limits currently include 10 ms CPU per HTTP request **and cron invocation**,
128 MB memory, 50 subrequests per invocation and 100,000 Worker requests/day.
Network wait time is not CPU time. Bcrypt cost 12 is preserved; do not weaken
password hashes to fit a hosting budget. Authentication, SSR, PDFs and multipart
parsing may require paid Workers even for light traffic. Local workerd does not
prove that a deployed request fits the Free CPU allowance.

Watch observability for CPU limit errors (1102), memory exhaustion, request I/O
ownership errors, MongoDB timeout/pool errors, failed DO bindings, OAuth errors,
SMTP/TLS failures, FCM failures, upload failures and cron backlogs. Do not log
credentials, recipient payloads or private keys. Cached FCM access tokens are
plain token values; in-flight fetch promises are never shared between requests.

## Rollback

Keep the current Vercel deployment and its environment configuration. Before a
future cutover, save routing/DNS settings and the previous deployment ID. To roll
back, disable Workers schedules first, restore the previous domain route/DNS and
Vercel deployment, and re-enable only the old scheduler. Switching traffic does
not reverse database writes or already delivered emails; reconcile those using
order/payment IDs. No schema migration is part of this branch. Do not delete
Durable Object migrations as a rollback method.

## References

- https://opennext.js.org/cloudflare/get-started
- https://opennext.js.org/cloudflare/caching
- https://opennext.js.org/cloudflare/howtos/custom-worker
- https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- https://developers.cloudflare.com/workers/databases/third-party-integrations/mongodb/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/email-service/api/send-emails/rest-api/
- https://developers.cloudflare.com/email-service/api/send-emails/smtp/
