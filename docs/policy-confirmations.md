# Policy publication follow-up — 23 October 2026

The privacy, terms and cookie pages were aligned with the repository. This is not a certification of legal compliance or of production provider settings. Do not replace the following gaps with invented details.

For the plain-language questions, reasons and suggested people to help answer them, see the [project TODO list](../TODO.md). Keep these audit notes aligned with that checklist when answers are confirmed.

## Business confirmation

1. **Legal identity:** registered legal name, trading-name relationship, registration number where relevant, full service/postal address, country of establishment. The public contact location remains the existing Adalatghar, Sialkot entry; it is not described as a verified registered address.
2. **Jurisdiction and contract formation:** applicable governing-law wording, merchant identity, when an order is accepted, and dispute venue/process. The former unspecified incorporation clause and undefined binding-arbitration language were removed. Mandatory consumer protections remain expressly preserved.
3. **Custom-order operations:** proof turnaround, revisions included, approval record, cancellation/change cutoffs, charges or refunds at each stage, and bulk payment/deposit terms. No unverified deadline, revision entitlement or fee was added.
4. **Artwork use:** confirm staff/provider practices support the new order-limited authorization. Customer artwork is not automatically licensed for unrelated marketing or a portfolio. Existing media use and previously collected permissions require a separate review.
5. **Returns by market:** review the existing 10-day stock return window, 15%/$35 restocking charge, shipping refunds and refund timing against actual sales destinations. Store policies now expressly defer to mandatory rights. The requested 48-hour fault reporting window is no longer stated as a limit on rights. Market-specific terms and return structured data may require subsequent changes.

## Privacy and production verification

6. **Retention:** approve and implement a schedule for accounts, orders, invoices, enquiries/quote emails, design files, activity records and backups. Purpose-based criteria are published; exact periods and automated deletion have not been invented or implemented.
7. **Providers and transfers:** verify actual hosting/email/delivery providers, MongoDB and Cloudinary regions, subprocessors, processing agreements and applicable international-transfer safeguards. Identify any legally required UK/EU representative or DPO. The previous blanket claim of signed standard contractual clauses was removed.
8. **Regional rights:** assess UK/EU and California/state-law applicability. Determine whether any provider arrangement constitutes sale/sharing under applicable definitions and whether GPC/universal opt-out handling is required. No GPC integration was added; published wording no longer claims cookie preferences implement that legal mechanism.
9. **Live storage and analytics settings:** inspect production across sign-in, shopping, design, checkout and payment flows. Verify exact NextAuth/Stripe/PayPal/Google cookie names and lifetimes, Google property retention/enhanced measurement, provider data use and any tags installed outside this repository. Local application keys and known lifetimes are documented; provider configuration is not guessed.
10. **Children and marketing:** confirm the approach to school/group orders containing children's names, newsletter consent/unsubscribe operations, and any planned advertising tools. Marketing is described as inactive in the current site implementation; fresh notices/consent assessment are needed before enabling it.

## Implemented controls

- Google Analytics uses opt-in loading; no initialization before Analytics consent.
- Withdrawal disables Google measurement and optional page-view events, including consent changes received from another tab.
- Site-generated page URLs omit query strings and fragments. Review Google enhanced-measurement/property settings separately.
- Wishlist/recently-viewed browser persistence checks Functional consent on every read/write; withdrawal clears those records. Page-memory items and requested account wishlists remain separate.
- Consent withdrawal resets the site guest-activity cookie; it does not erase historical database records or all provider cookies.
- Account sign-in/security logs remain distinct from optional browsing analytics.
- Storage and cookie controls do not subscribe/unsubscribe newsletter recipients.

## Research references

- [ICO privacy notice checklist](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/)
- [ICO storage and access exceptions](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)
- [Google consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [California privacy rights and applicability](https://oag.ca.gov/privacy/ccpa)
- [GOV.UK returns guidance](https://www.gov.uk/accepting-returns-and-giving-refunds)
