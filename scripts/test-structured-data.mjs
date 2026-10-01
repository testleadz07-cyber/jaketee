const baseUrl = (process.env.SCHEMA_TEST_BASE_URL || process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`)
if (!sitemapResponse.ok) throw new Error(`Sitemap returned ${sitemapResponse.status}`)
const sitemap = await sitemapResponse.text()
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
const failures = []

function schemaTypes(schema) {
  const values = Array.isArray(schema?.['@type']) ? schema['@type'] : [schema?.['@type']]
  return new Set(values.filter(Boolean))
}

for (let index = 0; index < urls.length; index += 8) {
  await Promise.all(urls.slice(index, index + 8).map(async (canonicalUrl) => {
    const response = await fetch(canonicalUrl.replace(/^https:\/\/www\.jacketee\.com/, baseUrl))
    const html = await response.text()
    const schemas = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
      .map((match) => { try { return JSON.parse(match[1]) } catch { return null } })
      .filter(Boolean)
    const allTypes = new Set(schemas.flatMap((schema) => [...schemaTypes(schema)]))
    const product = schemas.find((schema) => schemaTypes(schema).has('Product'))
    const isCategory = schemas.some((schema) => schemaTypes(schema).has('CollectionPage'))
    const isBlogPost = /\/blog\/[^/]+$/.test(canonicalUrl) && !canonicalUrl.includes('/blog/category/')
    const failed = []

    if (response.status !== 200) failed.push('status')
    if (canonicalUrl === 'https://www.jacketee.com/' && (!allTypes.has('Organization') || !allTypes.has('WebSite'))) failed.push('site schemas')
    if (product) {
      const offer = product.offers
      if (!offer?.price || offer.priceCurrency !== 'USD' || !offer.availability || !offer.url) failed.push('offer')
      if (!offer?.shippingDetails?.shippingRate || !offer?.shippingDetails?.shippingDestination) failed.push('shipping')
      if (!offer?.hasMerchantReturnPolicy?.merchantReturnDays || !offer?.hasMerchantReturnPolicy?.url) failed.push('returns')
      if (!product.brand || !allTypes.has('BreadcrumbList') || !allTypes.has('FAQPage')) failed.push('product supporting schemas')
      if (product.aggregateRating && Number(product.aggregateRating.reviewCount) <= 0) failed.push('rating gate')
    }
    if (isCategory && (!allTypes.has('BreadcrumbList') || !schemas.some((schema) => schema.mainEntity?.['@type'] === 'ItemList'))) failed.push('category schemas')
    if (isBlogPost && !schemas.some((schema) => schemaTypes(schema).has('Article'))) failed.push('article')
    if (failed.length) failures.push({ url: canonicalUrl, failed })
  }))
}

console.log(`Audited structured data on ${urls.length} public URLs; ${failures.length} failed.`)
for (const failure of failures) console.log(failure)
if (failures.length) process.exitCode = 1
