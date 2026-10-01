# Review System Setup

## Post-delivery Email Scheduler

1. In Admin > Settings, set **Review request delay after delivery (days)**. The default is 7; accepted values are 0 through 90.
2. Ensure production has `CRON_SECRET`, SMTP credentials, and `NEXT_PUBLIC_APP_URL=https://www.jacketee.com` configured.
3. Configure a scheduler to call `GET https://www.jacketee.com/api/cron/review-requests` once daily.
4. Send `Authorization: Bearer <CRON_SECRET>` with the request.
5. Mark an order delivered through the admin order workflow. The app records `deliveredAt`; after the configured delay, one review-request email is sent and `reviewRequestSentAt` prevents duplicates.
6. Check the scheduler response for `scanned`, `emailsSent`, `skipped`, and `delayDays`.

## Trustpilot

1. Open the [Trustpilot business signup page](https://signup.business.trustpilot.com/create-account).
2. Enter the legal business details and `https://www.jacketee.com` as the business website.
3. Use a company-controlled email address and complete Trustpilot's domain/account verification steps.
4. Claim the Jacketee company profile if Trustpilot finds an existing profile instead of creating a duplicate.
5. Complete the public profile with the same business name, website, contact details, and company description used on Jacketee.
6. Start with Trustpilot's Free plan if suitable. Trustpilot currently states that it includes a limited monthly invitation allowance; confirm current limits before choosing a plan.
7. Invite only real customers and do not selectively request only positive reviews.

Official references: [Trustpilot signup](https://signup.business.trustpilot.com/create-account), [Trustpilot plans](https://business.trustpilot.com/pricing).

## Google Business Profile

Google states that Business Profiles are for storefront or service-area businesses that interact with customers in person. An online-only business is not eligible. Confirm Jacketee has an eligible staffed location customers can visit, or that staff visit customers in person, before proceeding.

1. Sign in with a company-controlled Google Account.
2. Search Google Maps for Jacketee and its city first to avoid creating a duplicate.
3. If no profile exists, go to [business.google.com/add](https://business.google.com/add), choose **Add your business to Google**, and enter the real business details.
4. If an unverified profile exists, select **Claim this business** and **Manage now**. If another owner controls a verified profile, request ownership instead.
5. Choose an available verification method and complete it using real business evidence.
6. After verification, add the exact business name, eligible address or service area, website, phone, hours, category, logo, and authentic business/product photos.
7. Generate the official Google review link or QR code from the verified profile and send it neutrally to real customers. Never incentivize positive reviews.

Official references: [Add or claim a Business Profile](https://support.google.com/business/answer/2911778), [Google Business Profile eligibility and setup](https://support.google.com/business/answer/7039811).

