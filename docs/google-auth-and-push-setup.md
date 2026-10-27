# Google login and Firebase admin push

Google login uses the existing NextAuth JWT session and MongoDB User collection.
Firebase Cloud Messaging (FCM) handles admin push delivery. Firebase Auth,
Firestore, Firebase Hosting and Cloud Functions are not required.
Use Node.js 22 or later for the Firebase Admin SDK. The web SDK is pinned to
12.14.0 with a matching app dependency so this repository's Node 24.1 runtime
does not pull the newer SDK's Node 24.12 minimum.

## 1. Google OAuth

1. Create/select a project in https://console.cloud.google.com/ (it can be the
   same project as Firebase).
2. Open Google Auth Platform. Complete Branding, support/developer contact,
   homepage, privacy policy and terms. Add `jacketee.com` as the authorized
   domain if that is the deployed domain.
3. Choose External under Audience for a public store. Add your Google email as
   a test user while testing. Complete publishing/verification as required
   before opening sign-in to all customers.
4. Under Clients, create a **Web application** OAuth client.
5. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://www.jacketee.com`
6. Authorized redirect URIs (must match exactly):
   - `http://localhost:3000/api/auth/callback/google`
   - `https://www.jacketee.com/api/auth/callback/google`
7. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in local and hosting
   environment settings. Keep the secret server-side.
8. Keep the existing `NEXTAUTH_SECRET`. Set `NEXTAUTH_URL` to
   `http://localhost:3000` locally and `https://www.jacketee.com` in production.
   Use the actual port/domain if different. Restart/redeploy.

Google buttons appear on /login and /register only when the provider is
configured. First sign-in creates a customer; later sign-ins resolve the same
Google identity to the same MongoDB ID. Roles come from MongoDB, never Google.
Disabled users cannot log in. Google-only accounts do not have fake passwords;
they can use the existing email password-reset flow to set a password.
Successful Google login/signup returns through `/auth/complete`, a server-only
redirect to `/profile` for customers or `/admin/dashboard` for admins. Safe
requested return paths (such as checkout) are preserved. The sign-in form is not
rendered between successful OAuth and the destination. Keep Google's registered
OAuth redirect URI as `/api/auth/callback/google`; it has not changed.

### Existing password accounts

An email match alone never silently links an account. Sign in using the existing
password, open Profile, click **Connect Google account**, and choose the Google
account with the same verified email. A Google account linked to a different user
is rejected. Existing duplicate email records are rejected for linking and need
manual cleanup rather than guessing which account to use.

The existing password form and its Turnstile verification remain in place.
Google's OAuth flow uses NextAuth's state/PKCE protection instead.

## 2. Firebase FCM

1. Open https://console.firebase.google.com/ and create/select your project.
   Analytics is optional.
2. Project settings > General > Your apps > Web (`</>`): register Jacketee Web.
   Hosting is not required.
3. Copy Firebase web config into:
   - `NEXT_PUBLIC_FIREBASE_API_KEY` = apiKey
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = authDomain
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = projectId
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = messagingSenderId
   - `NEXT_PUBLIC_FIREBASE_APP_ID` = appId
4. Project settings > Cloud Messaging > Web configuration > Web Push
   certificates > Generate key pair. Set the public key as
   `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
5. In the same Cloud project confirm Firebase Cloud Messaging API (HTTP v1)
   and FCM Registration API are enabled. Do not use a legacy server key.
6. Project settings > Service accounts > Firebase Admin SDK > Generate new
   private key. Keep the downloaded JSON outside the repository/public folder.
   Set server-only environment variables from its fields:
   - `FIREBASE_PROJECT_ID` = project_id
   - `FIREBASE_CLIENT_EMAIL` = client_email
   - `FIREBASE_PRIVATE_KEY` = private_key
7. In an env file, the private key can use quoted escaped newlines:

   ```dotenv
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
   ```

8. Public and server project IDs must reference the same Firebase project.
   Restrict any browser API key to the intended application/APIs carefully;
   confirm Firebase Installations and FCM registration still work afterward.
9. Add these variables to the production hosting environment, rebuild, and
   restart/redeploy. NEXT_PUBLIC variables are embedded during the build.
10. Sign out and sign in again once after this update. Older JWTs did not have
    the corrected loginSessionId needed to bind push devices.
11. As an admin, open /admin/notifications > Device notifications > Enable
    notifications. Accept browser permission and click Send test.

FCM itself is no-cost; existing hosting/database/network quotas still apply.
The Firebase service-account key must never appear in public variables, source
control, screenshots or the service worker.

## Behavior

- Admin subscriptions are stored in MongoDB PushDevice, one FCM token per device.
- Explicit opt-in is saved locally. Returning opted-in admins refresh device
  registration when opening the app or returning to it.
- Concurrent refreshes share one registration operation. The settings panel
  shows permission, worker startup, Firebase connection and device-save progress.
  Each stage has a deadline; a stalled operation reports an error and releases
  the controls for retry. Use `Check settings again` after fixing configuration.
  Settings checks decode the signed NextAuth cookie directly and validate the
  current database role/login, without loading the Google/Firebase sending SDKs.
  Database waits return a specific error after eight seconds per stage. The local
  development request deadline allows one-time Next.js compilation; production
  requests remain bounded. Timeout messages identify settings load, device save,
  or test send separately.
- Local browser push requires `http://localhost` or HTTPS. A plain HTTP LAN IP
  is not a secure context, even if the server runs on your own computer.
- Sending filters current active admin roles, active login sessions and unexpired
  registrations. Sign-out removes registrations tied to that login session.
  Authentication revocation uses `LoginSession.revokedAt`; analytics `logoutAt`
  is also set when a page closes and must not disable push or admin access.
- Disable removes the server registration and deletes the browser FCM token.
- In-app notifications remain the history. Push payloads contain a generic
  message rather than customer contact/payment details.
- Existing registrations, inquiries, refunds and newsletter events send push.
  Google signups, new checkout/custom orders and confirmed Stripe/PayPal payments
  also create admin alerts. Order/payment alerts use unique MongoDB event keys
  to prevent duplicate notification records across redirect/webhook retries.
- FCM data-only messages are rendered by the native Push API in the existing
  /firebase-messaging-sw.js worker. It does not cache storefront pages or load
  external scripts. Visible admin tabs also receive a bell refresh/toast.
- The in-app notification and pending delivery state are saved before returning
  the customer response. Only this database write is awaited; Firebase delivery
  runs through Next.js `after` after the response. Notification persistence is
  still best effort if the database itself is unavailable; this is not an atomic
  transaction with the original enquiry/order.
- Pending deliveries survive process restarts. New notifications attempt only their
  own delivery. Successful admin login triggers one shared retry run per UTC
  calendar day across all admins and server instances, using a persistent atomic
  marker. Session polling and opening the bell do not trigger retries. No Vercel
  cron or scheduler secret is required. If nobody logs in that day, no retry runs. Retries back off from
  one minute to one hour without deleting exhausted entries. These are earliest
  retry times, not a guaranteed dispatch schedule. A five-minute atomic lease
  prevents normal concurrent workers claiming the same record; crashed leases
  become eligible again. Each run has a bounded batch/time budget.
- Successful device tokens are checkpointed after each Firebase batch and excluded
  on retry. A crash between provider acceptance and checkpointing can still cause
  duplicate delivery; notification IDs provide stable browser notification tags.
  No enabled device or missing Firebase configuration leaves the record pending.
  Historical notifications without a pending marker are not replayed.
- A failed push remains visible in saved in-app history. FCM acceptance is not
  proof that a phone displayed a notification; OS/browser restrictions, revoked
  permission and permanent database failures prevent an absolute delivery guarantee.
- Invalid/unregistered FCM tokens are deleted. Registration expiry follows the
  authenticated session; reopening the app refreshes it.

## 3. Verify before launch

Automated: `npm run test:google-push`, `npm run typecheck`, and
`npx next build --webpack` (the production build verified for this change).
The behavior tests mock external identity/database/messaging services. Live
Google/Firebase delivery requires real credentials and a real browser/device.

Google:
1. New Google user signs up as customer and gets a MongoDB ID.
2. Logout/login returns the same account and order history.
3. A same-email password account is rejected until explicitly connected.
4. Connect from the authenticated profile, then test both login methods.
5. Disabled account and cross-account linking are rejected.
6. Cancel Google login and verify a readable error; check both callback URLs.

Push:
1. Enable on desktop and Android Chrome; test while visible, tab closed,
   browser normally closed, and phone locked.
2. Check both site permission and Android's Chrome notification permission.
   Force-stop, battery restrictions, offline devices and OS settings can prevent
   or delay delivery. Delivery is not guaranteed to be immediate.
3. On iPhone/iPad (16.4+), add the site to Home Screen and open it there before
   requesting permission. Manifest and 192/512 icons are included.
4. Click a notification: the relevant admin page opens and still requires login.
5. Test multiple devices, Disable, logout and a revoked/disabled admin account.
6. Trigger a registration/inquiry and sandbox payment. Repeat payment webhook
   delivery and verify only one payment alert is saved.
7. Firebase Console composer sends notification payloads rather than this app's
   data-only format; use the app's **Send test** button for the intended flow.

References:
- https://next-auth.js.org/providers/google
- https://firebase.google.com/docs/cloud-messaging/web/get-started
- https://firebase.google.com/docs/cloud-messaging/web/receive-messages
- https://firebase.google.com/docs/cloud-messaging/manage-tokens
- https://firebase.google.com/pricing
- https://webkit.org/blog/13878/
