const baseUrl = (process.env.SOCIAL_TEST_BASE_URL || process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const meta = (html, property) => html.match(new RegExp(`<meta (?:property|name)="${property}" content="([^"]*)"`, 'i'))?.[1] || ''

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`)
if (!sitemapResponse.ok) throw new Error(`Sitemap returned ${sitemapResponse.status}`)
const sitemap = await sitemapResponse.text()
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
const failures = []

for (let index = 0; index < urls.length; index += 8) {
  await Promise.all(urls.slice(index, index + 8).map(async (canonicalUrl) => {
    const response = await fetch(canonicalUrl.replace(/^https:\/\/www\.jacketee\.com/, baseUrl))
    const html = await response.text()
    const title = html.match(/<title>(.*?)<\/title>/is)?.[1] || ''
    const description = meta(html, 'description')
    const ogType = meta(html, 'og:type')
    const isBlogPost = /\/blog\/[^/]+$/.test(canonicalUrl) && !canonicalUrl.includes('/blog/category/')
    const isProduct = html.includes('"@type":"Product"')
    const checks = {
      status: response.status === 200,
      ogTitle: meta(html, 'og:title') === title,
      ogDescription: meta(html, 'og:description') === description,
      twitterTitle: meta(html, 'twitter:title') === title,
      twitterDescription: meta(html, 'twitter:description') === description,
      image: Boolean(meta(html, 'og:image')),
      imageWidth: meta(html, 'og:image:width') === '1200',
      imageHeight: meta(html, 'og:image:height') === '630',
      imageAlt: Boolean(meta(html, 'og:image:alt')),
      type: isProduct ? ogType === 'product' : isBlogPost ? ogType === 'article' : Boolean(ogType),
    }
    const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name)
    if (failed.length) failures.push({ url: canonicalUrl, failed })
  }))
}

console.log(`Audited social metadata on ${urls.length} public URLs; ${failures.length} failed.`)
for (const failure of failures) console.log(failure)
if (failures.length) process.exitCode = 1
