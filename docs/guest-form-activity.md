# Guest form activity

Implemented 27 October 2026. No database migration, new index or backfill is required. No live data writes or functional tests were run during implementation.

## Capture rules

- Only signed-out visitors; the API independently skips authenticated sessions before storing form events.
- Requires Analytics enabled **and** the current form-activity consent version. Older Analytics choices do not authorize this feature; those visitors receive the updated notice with optional choices initially off.
- No collection before opt-in. After enabling it, editing must start again or the visitor must intentionally submit the form. No historical entries are recovered.
- Updates after 1.5 seconds without edits, on blur, on form submit, and best-effort on page departure. This is a latest-value snapshot, not a keystroke/session replay.
- One mutable draft per guest/form instance, using a deterministic unique document ID. A successful submission reported by the frontend promotes that instance to `guest_form_submitted`; stale drafts cannot overwrite it. New submissions use a new instance.
- Values cleared from an unfinished form are removed from that draft snapshot. Successfully submitted historical snapshots are retained separately.
- Telemetry is optional and best-effort; it cannot prove server acceptance, payment success or malicious intent. Submission success is reported only after the relevant form operation returns successfully. Login identifiers may have a draft without a submitted event because successful sign-in changes the visitor into an authenticated user.
- Consent withdrawal or sign-in stops future guest snapshots. Queued jobs recheck consent, and optional telemetry is given only a bounded opportunity before successful-form redirects proceed.

## Forms and allowed fields

| Form | Allowed fields |
| --- | --- |
| Newsletter | Email |
| Contact | Name, email, subject, message excerpt, delivery country |
| Bulk quote | Name, email, organization, quantity, jacket style, deadline, country, program, notes excerpt |
| Checkout | Name, email, phone, street, city, state, ZIP, country, gateway name, promo code, step |
| Returns | Order number, name, email, reason excerpt |
| Track order | Order number and email |
| Order-confirmation lookup | Manually entered lookup email |
| Registration | Name, username and email |
| Login | Identifier only |
| Forgot password | Email only |

Passwords, reset/security tokens, session cookies, API secrets, card/bank credentials and uploaded file contents are not captured. The code never serializes arbitrary DOM inputs or request bodies into activity. Allowlisted strings are length-limited; all fields together have a 6 KB JSON budget within the existing 8 KB activity request limit. Common credential/token patterns and card-like numbers pasted into otherwise allowed text fields are redacted as a best-effort additional measure. It cannot recognize every secret someone might type into a free-text enquiry; the notice asks visitors not to do that. Truncated snapshots are labelled in the admin UI. Original successfully submitted enquiries/orders remain in their existing business records.

Authenticated profile/address/review/admin forms are excluded. Product filters, FAQ/catalog searches and designer interactions keep their existing event logic rather than being treated as personal-detail forms. This change does not add checkout Turnstile or modify payment processing/deduplication.

## Storage and access

New actions use the existing `GuestActivity.details` field. They carry the form name, signed-cookie guest identity linkage, form instance ID, browser-reported consent timestamp, server capture time, allowed fields and a browser-reported provenance marker. IP/agent/location use the same request metadata as existing guest activity. Do not use these snapshots as authoritative security or transaction records.

At the owner's request, automatic snapshot expiry, value hiding and cleanup are disabled. Both draft and submitted values remain in the database and visible to authorized administrators until a retention policy or manual deletion is implemented later. No TTL/index migration or database cleanup was run. Any old expiresAt metadata is ignored by the admin API; previously removed values cannot be restored by this code change.

Guest activity admin access retains its current-database role/active-account check. Responses use `private, no-store`. The Details column displays labelled, expandable fields, capture status and last update rather than dumping new form snapshots as raw JSON. React text rendering prevents saved text from being interpreted as HTML. No form field values are sent to Google Analytics or printed in activity error logs.

## Owner verification after deployment

1. With Analytics rejected, edit a guest form: no form-activity requests should be sent.
2. Opt in using the updated notice; edit newsletter/contact/bulk/checkout fields, pause or leave a field, then view Guest Activity filtered to Guest Form Draft.
3. Change or clear values: the same draft should update, not add one row per edit.
4. Submit a real permitted form: look for the reported-submission snapshot. A checkout snapshot means checkout initiation, not payment completion.
5. Sign in or withdraw Analytics: new guest form snapshots must stop. Older entries are not automatically deleted by withdrawal and remain in the database under the current owner-directed retention setting.
6. Verify mobile/desktop details display and ensure password, card, reset/security token and file fields never appear.

These checks are documented for the owner; they were not executed against live customer data during implementation. No new environment variables are needed. Deploy the updated code and accept the updated Analytics notice to enable capture.

References: [OWASP Logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), [ICO data minimisation](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/data-minimisation/).
