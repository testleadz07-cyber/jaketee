const baseUrl = (process.env.LANDING_TEST_BASE_URL || process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const pages = [
  'custom-bomber-jackets',
  'custom-coach-jackets',
  'custom-denim-jackets',
  'custom-puffer-jackets',
  'custom-hoodies',
  'custom-letterman-jackets',
]

const sitemap = await (await fetch(`${baseUrl}/sitemap.xml`)).text()
let failures = 0

for (const page of pages) {
  const response = await fetch(`${baseUrl}/${page}`)
  const html = await response.text()
  const visibleText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
  const result = {
    page,
    status: response.status,
    h1Count: (html.match(/<h1[ >]/g) || []).length,
    canonical: html.includes(`rel="canonical" href="https://www.jacketee.com/${page}"`),
    breadcrumbSchema: html.includes('BreadcrumbList'),
    collectionSchema: html.includes('CollectionPage'),
    faqSchema: html.includes('FAQPage'),
    serverRenderedProductLinks: /href="\/(?:varsity|bomber|coach|denim|puffer|fleece-hoodies)-jackets?\//.test(html) || html.includes('href="/fleece-hoodies/'),
    visibleWords: visibleText.trim().split(/\s+/).length,
    inSitemap: sitemap.includes(`https://www.jacketee.com/${page}`),
  }
  console.log(result)
  if (
    result.status !== 200 || result.h1Count !== 1 || !result.canonical ||
    !result.breadcrumbSchema || !result.collectionSchema || !result.faqSchema ||
    !result.serverRenderedProductLinks || result.visibleWords < 700 || !result.inSitemap
  ) failures++
}

if (failures) throw new Error(`${failures} custom landing page checks failed`)
console.log(`All ${pages.length} custom landing pages passed.`)
