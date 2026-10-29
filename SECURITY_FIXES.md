# Cloudflare security fixes — local review

Scope: `cloudflare-migration`; Cloudflare Workers/OpenNext only. No push or deployment is authorized. The existing Edge middleware is unchanged. No cron triggers, billing subscriptions, credentials, database schemas or production records were changed. No real email sweep or payment was executed.

## Changes and decisions

1. `src/lib/require-admin.ts` supplies server page/API guards using the existing NextAuth session callback. That callback reads the current active account, current role and unrevoked login. Pages redirect to `/login?callbackUrl=/admin/dashboard`; APIs return JSON 401 for missing sessions and 403 for non-admins.
2. The async admin layout runs the guard before rendering its existing shell. Middleware remains the first gate; the layout and API handlers provide independent server checks.
3. Every supported blog-category admin method is protected. The public blog already uses cached server helpers; no public browser caller needs a new `/api/blog-categories` endpoint. Unsupported methods are not introduced.
4. Public return submission moved to `/api/returns`. The old admin POST requires admin auth and returns 405; admin GET/PATCH behavior remains. Input is bounded to 10 KiB and rejects unknown fields, invalid types and excessive lengths. The existing form fields are preserved. Guests must provide the order email; a signed-in owner may match by current account ID. Matching is case-insensitive for email and uses the customer-facing `Order.orderNumber`. Wrong email and missing order receive the same generic response.
5. Returns require same-origin POST and a fresh Turnstile token with action `returns`. The existing frontend challenge mounts on submission, then unmounts after completion so retries obtain a fresh token. No security bypass or test key is enabled in production code.
6. The Worker perimeter applies the existing native limiter and one durable 3/hour/IP route budget. The endpoint does not increment that IP counter again. Client IP comes from `cf-connecting-ip`. No new binding is needed.
7. The existing `SECURITY_LIMITER` also owns a separate per-order reservation, not a duplicate IP counter. Reservations serialize admission; unfinished retries reuse the same Mongo `_id`, making insert retries idempotent. The handler rechecks pending records after reservation, permits at most three database records in a rolling 24 hours, and conservatively reserves at most three submission identities per order/24 hours. A failed/ambiguous attempt may consume a reservation until expiry. No Mongo transaction, new collection, schema field or index is required. Legacy records containing the order's Mongo ID are included in duplicate/daily checks.
8. A new insert creates the same pending refund record and one admin notification. An idempotent retry does not send another notification. Customer email/name are validated but are not added to the existing refund schema. No automatic approval, payment or refund is performed.
9. Existing stricter push, guest-activity and home-cache guards remain unchanged. Other admin endpoints and admin-only catalog/order writes use the shared helper. User/session/order queries use explicit projections where sensitive records are read. Customer review uploads remain authenticated; guest designer snapshot/artwork uploads remain public with same-origin, bounded payload checks and Worker perimeter quotas (20 snapshot requests/hour/IP, 10 artwork requests/hour/IP). The artwork route's former counter moved to the perimeter instead of being duplicated.
10. Both cron endpoints retain their secret/enabled/migration checks. Tests use mocked providers or unauthorized local requests only.

Full method inventory: [Route | Method | Before | After | Notes](docs/security-auth-audit.md). It covers all 52 exported admin methods in 24 route files and relevant external write/upload/cron handlers.

## Automated checks

- [x] Shared guard: anonymous 401, customer 403, admin permitted; page denial redirects.
- [x] Real session callback/current-account helper: demoted, disabled and revoked sessions rejected.
- [x] All 52 admin HTTP methods plus 8 external catalog/order writes: 120 anonymous/customer denials without business DB/provider calls before authorization. Existing stricter status behavior is preserved.
- [x] Returns parser: unknown fields, object injection, invalid/oversized fields rejected.
- [x] Returns endpoint: wrong origin, oversized body, invalid Turnstile rejected before writes; real verifier rejects the wrong action/hostname and unsuccessful provider responses.
- [x] Missing order/wrong email generic response; email case normalization; signed-in ownership.
- [x] Twenty concurrent submissions produce one pending record.
- [x] Pending duplicate, exact durable hourly budget, rolling daily DB quota, expired claim ID reuse and next-day recovery when the cleanup alarm is delayed.
- [x] Idempotent retry does not duplicate notification.
- [x] Admin tag behavior and existing catalog/newsletter/contact/bulk-quote checks.
- [x] Existing Cloudflare request isolation, limiter, cache, cron-claim/mock-send and provider contracts.
- [x] Existing Google/push behavior tests, including signed-cookie and revoked-login checks.
- [x] Main TypeScript check (`npx tsc --noEmit`).
- [x] Separate Worker TypeScript check (`tsc --noEmit -p tsconfig.worker.json`).
- [x] Full OpenNext build and artifact credential scan passed.
- [x] Local `npm run preview` security smoke: 68 HTTP checks completed; database-dependent blog integration explicitly remains unverified below.

These automated access tests mock identity/provider boundaries. They do not claim every authenticated business mutation has been executed against a real account or database.

## Review/integration checklist (not run against production)

- [ ] Anonymous direct `/admin/dashboard` and deep admin links redirect; customer cannot enter; active admin can.
- [ ] Client navigation and refresh retain the existing admin shell; no login redirect loop.
- [ ] For every route/method in the auth table: anonymous denied, customer denied, admin allowed only for the existing supported operation. Unsupported methods return 405.
- [ ] Demote/disable/revoke a disposable admin login: subsequent page/API access denied; stronger push/guest-activity checks unchanged.
- [ ] Public `/blog`, categories, posts and pagination render from the existing server cache; admin category management still works.
- [ ] With a disposable order: correct email or signed-in owner may submit a pending return; wrong email/unknown order rejected; unexpected fields/oversized payload rejected.
- [ ] Real Turnstile success, invalid action/token, expired token and retry behavior on the Returns form.
- [ ] Pending duplicate and simultaneous submissions create one record/notification; rejected historical requests count toward the daily limit.
- [ ] Four `/api/returns` requests from one IP in the same hourly window: the fourth is 429; different IP budget independent. The native limiter remains approximate; the Durable Object enforces the long window.
- [ ] Guest designer snapshot/artwork still upload; invalid formats/oversized bodies/cross-origin rejected; quota exhaustion returns 429.
- [ ] Signed-in customer review media still upload; anonymous `/api/upload` denied.
- [ ] Admin catalog/category/order write paths work; customers cannot perform them; response bodies contain no password/reset/session-token/payment-secret fields.
- [ ] Cron GET/POST without/with wrong secret denied; disabled/migration mode refuses execution. Do not execute a real sweep for this review.

## Explicit limitations / decisions

- Guest order number/email matching is not email-possession verification. This preserves guest support without adding OTP/email delivery; all requests remain pending for manual review.
- Reservation failures are fail-closed. An interrupted request can require waiting 60 seconds before retry; reserved attempts can reduce that order's available attempts for 24 hours.
- `/api/admin/refunds` POST no longer creates unverified records, even for admins. Submission belongs to the verified public endpoint; admin review/status changes remain GET/PATCH.
- No new public blog-category endpoint was needed. Existing public blog server caching/invalidation remains intact.
- The two uncommitted autocomplete changes (`src/lib/public-json.ts`, `scripts/test-public-data-cache.cjs`) predate this task and are excluded from these security commits.
- CPU-plan and Stripe configuration remain outside this task. No production readiness/load-test claim is made from an isolated preview.

## Build and preview results

Validated locally on 2026-10-29; no remote push/deployment:

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | Passed (exit 0) |
| Worker TypeScript (`tsc --noEmit -p tsconfig.worker.json`) | Passed (exit 0) |
| `npx opennextjs-cloudflare build` | Passed (exit 0); Next compilation and TypeScript completed, 114 static entries generated |
| Artifact credential scan | Passed after full build and again after preview cleanup |
| `npm run preview` | Local Worker started; explicitly credential-free test configuration; reused the verified Next build for the script's second adapter build; stopped after smoke tests |
| Local HTTP security smoke | 68 checks: all 52 anonymous admin methods401; `/admin/dashboard`307; home/shop/Returns200; cron GET/POST401; anonymous upload401; cross-origin guest uploads403; return origin403, payload400, invalid Turnstile403, fourth hourly request429 |
| Public blog integration | `/blog`500 with `MONGODB_URI` deliberately empty; not counted as a successful data integration test. Public blog code was not changed; a disposable DB is required for acceptance |
| Wrangler bundle measurement | Final dry-run only, exit0: **24050.90 KiB uncompressed / 5233.63 KiB gzip** (about23.49 MiB /5.11 MiB) |
| Middleware/cron/stronger guards | Byte-for-byte unchanged against the starting commit |

OpenNext emitted its existing Windows/config-wrapper warnings and Next's middleware deprecation warning. Preview's platform-proxy initialization also warned about internal Durable Object classes; the actual local Worker loaded the exported classes and passed the durable fourth-request429 smoke check. No warning was treated as a successful functional check by itself.

Smoke used `localhost` because Next normalizes local127.0.0.1 URLs for same-origin checks; the existing push endpoint used its explicitly configured local `NEXTAUTH_URL` origin. No actual Turnstile/provider credentials were used. Real authenticated business operations, real public blog data, and a real accepted return remain the integration checklist above.

The build covers the current working tree, including the two pre-existing uncommitted autocomplete files noted above; those files are not included in these security commits. The local dry-run measured the final custom Worker entry and bindings without uploading anything.

After the HTTP preview smoke, the per-order Durable Object gained a tested guard for next-day expired state when an alarm is delayed. Its source is outside the generated Next server bundle: the final Worker typecheck, reservation regression tests and final custom-entry Wrangler dry-run cover this final change. No page/API source changed after the full Next build/HTTP smoke.

## Changed files

| File | One-line summary |
| --- | --- |
| `docs/security-auth-audit.md` | Document every admin method and relevant external write/upload/cron route. |
| `package.json` | Add the offline security regression test command. |
| `scripts/test-admin-authorization.cjs` | Test page/API guards and real session callback revocation/demotion/disable behavior. |
| `scripts/test-admin-route-access.cjs` | Exercise all 52 admin HTTP methods with anonymous/customer identities and no provider I/O. |
| `scripts/test-admin-tags.cjs` | Update helper boundary mocks and retain existing tag behavior tests. |
| `scripts/test-merge-safety.cjs` | Update shared guard mock while retaining catalog visibility tests. |
| `scripts/test-return-security.cjs` | Test ownership, validation, Turnstile ordering, concurrent inserts, quotas and notification idempotency. |
| `src/app/admin/layout.tsx` | Run the current-session admin guard before rendering the existing shell. |
| `src/app/api/admin/analytics/route.ts` | Replace the local/inline admin authorization with the shared current-session helper; preserve business behavior. |
| `src/app/api/admin/blog-categories/route.ts` | Protect previously public GET and existing POST/DELETE with the shared guard. |
| `src/app/api/admin/blog/[id]/route.ts` | Replace the local/inline admin authorization with the shared current-session helper; preserve business behavior. |
| `src/app/api/admin/blog/route.ts` | Replace the local/inline admin authorization with the shared current-session helper; preserve business behavior. |
| `src/app/api/admin/bulk-edit/route.ts` | Replace the local/inline admin authorization with the shared current-session helper; preserve business behavior. |
| `src/app/api/admin/contact-messages/route.ts` | Replace the local/inline admin authorization with the shared current-session helper; preserve business behavior. |
| `src/app/api/admin/discounts/[id]/route.ts` | Replace the local/inline admin authorization with the shared current-session helper; preserve business behavior. |
| `src/app/api/admin/discounts/route.ts` | Replace the local/inline admin authorization with the shared current-session helper; preserve business behavior. |
| `src/app/api/admin/faqs/route.ts` | Replace the local/inline admin authorization with the shared current-session helper; preserve business behavior. |
| `src/app/api/admin/notifications/route.ts` | Replace the local/inline admin authorization with the shared current-session helper; preserve business behavior. |
| `src/app/api/admin/refunds/route.ts` | Protect GET/PATCH and retire unverified POST after admin authorization. |
| `src/app/api/admin/reviews/[id]/route.ts` | Replace the local/inline admin authorization with the shared current-session helper; preserve business behavior. |
| `src/app/api/admin/reviews/route.ts` | Replace the local/inline admin authorization with the shared current-session helper; preserve business behavior. |
| `src/app/api/admin/settings/route.ts` | Replace the local/inline admin authorization with the shared current-session helper; preserve business behavior. |
| `src/app/api/admin/stats/route.ts` | Use the shared guard and limit order reads to dashboard fields. |
| `src/app/api/admin/subscribers/route.ts` | Replace the local/inline admin authorization with the shared current-session helper; preserve business behavior. |
| `src/app/api/admin/tags/route.ts` | Replace the local/inline admin authorization with the shared current-session helper; preserve business behavior. |
| `src/app/api/admin/users/[id]/route.ts` | Use the shared guard and explicit user projections; preserve self-protection/revocation. |
| `src/app/api/admin/users/[id]/sessions/route.ts` | Use the shared guard and explicit session metadata projection. |
| `src/app/api/admin/users/route.ts` | Use the shared guard and explicit public-to-admin user field projection. |
| `src/app/api/categories/[id]/route.ts` | Use the shared guard for category update/deletion. |
| `src/app/api/categories/route.ts` | Use the shared guard for category creation; preserve public GET. |
| `src/app/api/customizations/artwork/route.ts` | Bound multipart bodies, enforce origin and remove the duplicate route-level counter. |
| `src/app/api/orders/[id]/route.ts` | Use the shared guard for admin PATCH; preserve owner/admin GET. |
| `src/app/api/products/[id]/route.ts` | Use the shared guard for PUT/DELETE; preserve public/draft-aware GET. |
| `src/app/api/products/bulk-delete/route.ts` | Use the shared admin guard before bulk deletion. |
| `src/app/api/products/route.ts` | Use the shared guard for POST; retain public/admin-filtered GET semantics. |
| `src/app/api/returns/route.ts` | Provide bounded same-origin Turnstile-protected public return submission. |
| `src/app/api/upload-snapshot/route.ts` | Require same-origin requests while preserving guest designer access. |
| `src/app/returns/returns-client.tsx` | Submit to the verified endpoint with fresh Turnstile token and bounded existing inputs. |
| `src/cloudflare/security-rate-limiter.ts` | Add serialized per-order return reservations with recoverable idempotent insert IDs. |
| `src/lib/cloudflare-security.ts` | Expose the existing hashed Durable Object lookup for return reservations. |
| `src/lib/require-admin.ts` | Provide shared current-session admin page/API authorization. |
| `src/lib/return-request.ts` | Validate existing payload and verify order ownership, duplicates and daily quotas. |
| `src/lib/return-submission-gate.ts` | Access existing Cloudflare security binding for order reservations without a fallback. |
| `src/lib/route-rate-limits.ts` | Set exact durable return/snapshot/artwork budgets at the existing Worker perimeter. |
| `src/lib/turnstile.ts` | Allow the distinct returns verification action. |
| `SECURITY_FIXES.md` | Record scope, decisions, changed files, auth inventory and test/review checklist. |

## Full authorization table

| Route | Method | Before | After | Notes |
| --- | --- | --- | --- | --- |
| /api/admin/analytics | GET | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/blog | GET, POST | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/blog/[id] | GET, PATCH, DELETE | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/blog-categories | GET | Public / no auth | Shared admin helper | Public blog uses server helpers; no new public endpoint needed |
| /api/admin/blog-categories | POST, DELETE | Local session/admin helper | Shared admin helper | Unsupported methods remain 405 |
| /api/admin/bulk-edit | GET, PUT | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/contact-messages | GET, PATCH, DELETE | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/discounts | GET, POST | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/discounts/[id] | PUT, DELETE | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/faqs | GET, POST, PATCH, DELETE | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/guest-activity | GET | Guest-activity admin helper + DB account check | Unchanged stricter guard | Preserved; not weakened |
| /api/admin/guest-activity/stats | GET | Guest-activity admin helper + DB account check | Unchanged stricter guard | Preserved; not weakened |
| /api/admin/home-cache | POST | Session + admin + DB account + origin | Unchanged stricter guard | Preserved; not weakened |
| /api/admin/notifications | GET, PATCH | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/push | GET, POST, DELETE, PATCH | JWT + active admin + unrevoked login + origin + account limit | Unchanged stricter guard | Preserved; not weakened |
| /api/admin/refunds | GET, PATCH | Session + admin | Shared admin helper | Admin review/status behavior preserved |
| /api/admin/refunds | POST | Public, unverified creation | Shared admin helper, then 405 | Submission moved to /api/returns; old unverified write removed |
| /api/admin/reviews | GET | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/reviews/[id] | PATCH, DELETE | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/settings | GET, PUT | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/stats | GET | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/subscribers | GET, DELETE | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/tags | GET, POST, PUT, DELETE | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/users | GET, POST | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/users/[id] | GET, PATCH, DELETE | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/admin/users/[id]/sessions | GET | Session + admin (inline/local helper) | Shared admin helper | 401 anonymous / 403 customer; DB-backed current session |
| /api/returns | POST | Did not exist | Public + Turnstile + verified order match + origin | 3/hour/IP at Worker; per-order DO reservations and DB max3/rolling24h; idempotent insert ID |
| /api/products | POST | Session + admin | Shared admin helper | Public GET unchanged; all=true GET remains admin-protected |
| /api/products/[id] | PUT, DELETE | Session + admin | Shared admin helper | Public active-product GET unchanged; PATCH remains 405 |
| /api/products/bulk-delete | POST | Session + admin | Shared admin helper | Admin-only |
| /api/categories | POST | Session + admin | Shared admin helper | Public GET unchanged |
| /api/categories/[id] | PUT, DELETE | Session + admin | Shared admin helper | PATCH remains 405 |
| /api/orders/[id] | PATCH | Session + admin | Shared admin helper | Owner/admin GET unchanged |
| /api/upload | POST | Current signed-in user | Unchanged | Customer review uploads and admin media remain allowed |
| /api/upload-snapshot | POST | Public + size/PNG validation | Public + existing validation + same-origin + Worker limit | Guest designer preserved; 20/hour/IP at perimeter |
| /api/customizations/artwork | POST | Public + route-level hourly limit | Public + bounded body + same-origin + Worker hourly limit | 10/hour/IP moved to perimeter; no duplicate counter |
| /api/cron/abandoned-cart | GET, POST | CRON_SECRET + enabled/migration guard | Unchanged | No trigger enabled; only denied/mock requests tested |
| /api/cron/review-requests | GET, POST | CRON_SECRET + enabled/migration guard | Unchanged | No real sweep executed |
