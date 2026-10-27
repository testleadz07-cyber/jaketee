# Jacketee Turnstile setup

Configured 27 October 2026. No database migration or data update is required.

## Cloudflare

- Widget: **Jacketee website forms**.
- Mode: Managed; pre-clearance off.
- Allowed domain: `jacketee.com` (Cloudflare also permits its subdomains, including `www.jacketee.com`). Server verification explicitly restricts successful responses to the configured exact hostnames.
- Site key: `0x4AAAAAAFoH6Ueod_0fxizy` (public).
- Secret is stored in the ignored local `.env`; never add it to source control, screenshots, client bundles or documentation. It can also be retrieved from the widget's settings in the owner's Cloudflare dashboard.
- The dashboard showed both website CNAMEs pointing to Vercel with **DNS only**. They were not changed. Turnstile does not require Cloudflare DNS proxying. Enabling broad bot challenges or changing DNS proxying needs a separate review of Vercel and payment-webhook compatibility.

## Vercel activation — required before deploying this change

Set these variables in the Jacketee Vercel project's **Production** environment:

```text
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<public site key above>
TURNSTILE_SECRET_KEY=<private secret from local .env or Cloudflare>
TURNSTILE_HOSTNAMES=jacketee.com,www.jacketee.com
```

Then deploy/rebuild the application. The public site key is embedded at build time, so changing environment variables alone does not update an existing deployment. Keep the secret server-only. Missing/invalid settings or an unavailable verification provider reject submissions instead of silently bypassing protection.

Preview deployments need their own allowed hostnames and preferably a separate widget/secret, configured in Vercel's Preview environment. Do not weaken production hostname validation for arbitrary preview domains. Local `next dev` uses Cloudflare's official development keys and does not require allowing localhost on the production widget. Development keys are never selected in production, and production rejects the development always-pass secret.

## Protected submissions

| Submission | Verified action |
| --- | --- |
| Credentials login, including registration's automatic login | `login` |
| Registration | `register` |
| Forgot password | `forgot_password` |
| Contact | `contact` |
| Bulk quote | `bulk_quote` |
| Newsletter | `newsletter` |

Each form requests a fresh token on submission. It is verified by the existing handler before database writes, password checking or sending email. Registration uses a separate fresh token for automatic login; if that verification cannot finish after account creation, the visitor is sent to login with the account-created message. Turnstile is lazy-loaded on submission, not on passive homepage/footer visits. Expired, duplicate, wrong-action and wrong-hostname tokens fail; network/provider errors fail closed. Existing rate limiting remains, with stricter forgot/reset-password budgets added.

The widget uses automatic light/dark appearance and compact dimensions to fit narrow forms. A failed check leaves entered form values available for a retry. No additional cookie pre-clearance is requested. Privacy information discloses Cloudflare form security processing.

## Deployment verification

The user requested no functional/browser tests; those were not run as part of implementation. After deployment, the owner should check real submissions on desktop/mobile, retry after validation errors, registration's automatic login, script-blocked/network-failure messaging, and Cloudflare's token validation analytics. Do not create or submit production customer records solely for automated verification without authorization.

Turnstile protects these submissions, not every page visit. It does not replace database least privilege, dependency upgrades, live admin-account checks, trusted-edge configuration or a distributed rate limiter.

References: [server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [hostname management](https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/), [CSP](https://developers.cloudflare.com/turnstile/reference/content-security-policy/).
