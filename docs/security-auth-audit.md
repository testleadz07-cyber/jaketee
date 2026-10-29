# Security authorization audit

52 admin HTTP methods across 24 files. Shared helper uses the current NextAuth session callback, which checks active accounts, current roles and unrevoked logins. Existing stronger guards remain unchanged.

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
