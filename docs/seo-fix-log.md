# SEO Fix Log

## Task 1: Indexing Readiness (Technical)

Status: Done

Files changed:
- `next.config.ts`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/app/layout.tsx`
- Route metadata/page files with canonical URL fallbacks under `src/app`
- `src/app/api/newsletter/subscribe/route.ts`
- `public/llms-full.txt`
- `docs/seo-fix-log.md`

Before:
- Canonical and sitemap fallbacks used `https://jacketee.com` in several server metadata files.
- No application-level 301 redirected non-www `jacketee.com` requests to `https://www.jacketee.com`.
- `/track-order` was missing from the sitemap static support routes.
- No SEO fix log existed.

After:
- Canonical and sitemap fallbacks use `https://www.jacketee.com`.
- `next.config.ts` permanently redirects the non-www host to `https://www.jacketee.com/:path*`.
- `robots.txt` allows `/` and disallows only `/admin/`, `/api/`, `/checkout/`, `/cart`, `/profile/`, and `/order-confirmation/`.
- Sitemap includes public static routes, dynamic category routes, product routes, blog index, blog posts, and used blog categories. Private/account/checkout URLs are excluded.
- Product, category, and blog pages fetch and render primary content in server components before passing it to client views, so the content is present in server-rendered HTML when data is available.
- No `X-Robots-Tag` header was found in `next.config.ts` or proxy/middleware. `noindex` metadata is limited to admin, checkout, profile, order confirmation, login, forgot/reset password, and missing blog/blog-category states.
- Public crawler-facing `llms-full.txt` links and newsletter fallback links now use the www host.

Verification:
- `npm run build`: Passed.
- `npm run lint`: Failed on pre-existing repo-wide lint issues unrelated to Task 1, including `scripts/import-pdf-seo-content.js` CommonJS imports, multiple admin pages calling state-setting fetches in effects, and `src/components/rich-text-editor.tsx` defining a component during render.

Manual checklist:
- Verify `https://www.jacketee.com` in Google Search Console.
- Verify `https://www.jacketee.com` in Bing Webmaster Tools.
- Submit `https://www.jacketee.com/sitemap.xml` in both tools.
- Request indexing for the top 20 URLs after deployment.

Open notes:
- Live non-200 URL reporting requires checking the deployed site after this build is deployed.
