const baseUrl = (process.env.LANDING_TEST_BASE_URL || process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const pages = [
  '/varsity-jackets/oversized',
  '/varsity-jackets/vintage',
  '/bulk-orders/sorority-fraternity',
  '/bulk-orders/senior-class',
  '/bulk-orders/cheer',
]

const sitemap = await (await fetch(`${baseUrl}/sitemap.xml`)).text()
let failures = 0

for (const path of pages) {
  const response = await fetch(`${baseUrl}${path}`)
  const html = await response.text()
  const mainHtml = html.match(/<main[\s\S]*?<\/main>/i)?.[0] || html
  const visibleText = mainHtml
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
  const result = {
    path,
    status: response.status,
    h1Count: (html.match(/<h1[ >]/g) || []).length,
    canonical: html.includes(`rel="canonical" href="https://www.jacketee.com${path}"`),
    breadcrumbSchema: html.includes('BreadcrumbList'),
    collectionSchema: html.includes('CollectionPage'),
    faqSchema: html.includes('FAQPage'),
    productLinks: /href="\/varsity-jackets\/.+?"/.test(html),
    freeMockup: /free (?:design )?mockup/i.test(visibleText),
    visibleWords: visibleText.trim().split(/\s+/).length,
    inSitemap: sitemap.includes(`https://www.jacketee.com${path}`),
  }
  console.log(result)
  if (
    result.status !== 200 || result.h1Count !== 1 || !result.canonical ||
    !result.breadcrumbSchema || !result.collectionSchema || !result.faqSchema ||
    !result.productLinks || !result.freeMockup || result.visibleWords < 600 ||
    !result.inSitemap
  ) failures++
}

if (failures) throw new Error(`${failures} audience landing page checks failed`)
console.log(`All ${pages.length} audience landing pages passed.`)
