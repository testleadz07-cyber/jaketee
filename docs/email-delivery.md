# Email delivery on Cloudflare

Production runtime settings (not public NEXT_PUBLIC variables):
- EMAIL_PROVIDER=cloudflare-api
- CLOUDFLARE_ACCOUNT_ID: the sending account ID
- CLOUDFLARE_EMAIL_API_TOKEN: secret with Email Sending permission for that account
- EMAIL_FROM: sender on a verified Email Sending domain
- ADMIN_NOTIFICATION_EMAIL: intended admin recipient
- MIGRATION_TEST_MODE=true: include each intended recipient in EMAIL_TEST_RECIPIENTS (comma-separated bare addresses).

Workers Paid alone does not confirm Email Sending entitlement or sender verification. Check these in Email Service before deployment. Do not replace credentials unnecessarily. No subscription is activated by this change.

Official REST contract: https://developers.cloudflare.com/email-service/api/send-emails/rest-api/

Missing or unknown EMAIL_PROVIDER fails closed; SMTP requires explicit EMAIL_PROVIDER=smtp. SMTP remains available for compatible environments, with bounded connection/greeting/socket timeouts. No automatic transport fallback or blind delivery retry (an uncertain timeout can already have sent an email).

Subscription save is independent of welcome email acceptance. UI never claims inbox delivery. Failed newsletter acceptance is recorded on the subscriber. Resubmitting the same address after one minute atomically reserves one retry without creating a second subscriber. Accepted and legacy subscriptions are not resent. Old failed deliveries created before status tracking require support review; no historical bulk resend runs. An interrupted pending attempt also requires review rather than an automatic potentially duplicate send. Saved inquiries are preserved on delivery failure. Guest claim responses stay neutral to prevent order/email enumeration; failed resend does not invalidate earlier valid links. No cron, Queue, deployment or real email tests are enabled.

Manual deployment checks:
- Configure the runtime settings above, then deploy the reviewed code.
- Submit a new newsletter address: saved status and accurate email acceptance/failure message.
- Test bulk quote/contact and guest claim with allowlisted test recipients.
- Verify received mail and Email Service activity; API acceptance alone does not guarantee inbox placement.
- Request a second guest claim and confirm earlier valid links remain usable.

## Validation for this change

- `npm run typecheck`: passed.
- `npm run test:email`: passed; no real provider calls. Covers explicit configuration, API acceptance/rejection/timeout, recipient isolation, SMTP cleanup, newsletter save/failure/retry and guest-claim non-enumerating responses/resend preservation.
- `npm run test:merge-safety`, `npm run test:security`, `npm run test:cloudflare`: passed; offline mocks only.
- Normal local production build: Windows Turbopack child-process failure in existing GoogleSans CSS processing. An initial encoding issue in the edited newsletter file was corrected before the retry.
- OpenNext production entry with an ignored temporary Webpack build override: passed, including credential sanitization and artifact scan. Build environment masked; no real delivery credentials used. Production build configuration unchanged.
- Wrangler local dry-run: 22,815.48 KiB, gzip 4,918.63 KiB. No upload.
- Isolated local preview: `/contact` 200, `/api/auth/session` 200, anonymous `POST /api/orders/claim` 401. Database, email, push and cron disabled. Preview stopped after checks.
- Existing static-assets incremental cache logged a read-only cache write warning during `/contact`; response remained 200. Cache behavior was outside this email-only change.
- Production Email Sending configuration and real mailbox delivery still require deployment-time verification. No remote settings, push, deployment or real emails performed.
