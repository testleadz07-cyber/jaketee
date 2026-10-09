import assert from 'node:assert/strict'
import fs from 'node:fs'
import { loadTypeScript } from './lib/load-typescript.mjs'

const base = process.env.SEO_TEST_BASE_URL || 'http://localhost:3000'
const output = 'output/seo-fixes'
fs.mkdirSync(output, { recursive: true })
const checks = []
const cache = new Map()
async function page(path) {
  if (cache.has(path)) return cache.get(path)
  const response = await fetch(`${base}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(120000) })
  const html = await response.text()
  fs.writeFileSync(`${output}/rendered-${path.replace(/[^a-z0-9]/gi, '_')}.html`, html)
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  const schemas = scripts.map(match => JSON.parse(match[1]))
  const body = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  const result = { response, html, body, schemas }
  cache.set(path, result)
  console.log(`Fetched ${path}: ${response.status}`)
  return result
}
function check(name, condition) {
  checks.push({ name, passed: !!condition })
  assert.ok(condition, name)
}
function canonical(html) {
  return html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1]?.replaceAll('&amp;', '&')
}
function decode(text) {
  return text.replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&quot;', '"').replace(/<!--[^>]*-->/g, '').replace(/<\/(?:p|li|div)>/g, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
function faqParity(result, name) {
  const faqs = result.schemas.filter(schema => schema['@type'] === 'FAQPage')
  check(`${name}: exactly one FAQPage`, faqs.length === 1)
  const panels = [...result.body.matchAll(/<div\b[^>]*data-slot="accordion-content"[^>]*>([\s\S]*?)<\/div><\/div>/g)].map(match => decode(match[1]))
  for (const question of faqs[0].mainEntity) {
    check(`${name}: rendered question ${question.name}`, decode(result.body).includes(question.name))
    check(`${name}: rendered answer ${question.name}`, panels.some(panel => panel.includes(question.acceptedAnswer.text)))
  }
}
function footerOnce(result, name) {
  const footers = [...result.body.matchAll(/<footer\b[^>]*>([\s\S]*?)<\/footer>/g)]
  const footer = footers.find(match => match[1].includes('Cookie Preferences'))?.[1]
  check(`${name}: site footer exists`, footer)
  for (const title of ['Categories', 'Customer Care', 'Custom Jackets']) {
    check(`${name}: one ${title} heading`, (footer.match(new RegExp(`<h3[^>]*>${title}</h3>`, 'g')) || []).length <= 1)
  }
  check(`${name}: no reviews link to shop`, !/href="\/shop"[^>]*>[\s\S]*?Customer reviews/.test(footer))
}
try {
  const shared = { exports: loadTypeScript('src/lib/faq-page-data.ts') }
  const { shippingCountries, deliverySettings } = loadTypeScript('src/config/fulfillment.ts')
  const example = { id: 'override', question: 'How much is shipping?', category: 'Shipping', answer: ['Updated answer'], bullets: [], ordered: [] }
  const categories = shared.exports.buildFaqCategories([example])
  check('database overrides fallback', categories.flatMap(section => section.items).find(faq => faq.question === example.question)?.answer[0] === 'Updated answer')
  check('draft suppresses fallback', !shared.exports.buildFaqCategories([{ ...example, status: 'draft' }]).flatMap(section => section.items).some(faq => faq.question === example.question))
  const combined = { ...example, question: 'Combined shipping question', mergedQuestions: [example.question] }
  const combinedVisible = shared.exports.buildFaqCategories([combined]).flatMap(section => section.items)
  check('merged question suppresses old fallback', !combinedVisible.some(faq => faq.question === example.question) && combinedVisible.filter(faq => faq.question === combined.question).length === 1)
  check('empty FAQ section omitted', !shared.exports.buildFaqCategories([{ ...example, question: 'Empty', category: 'Puffer Jackets', answer: [' '] }]).some(section => section.title === 'Puffer Jackets'))
  const faq = await page('/faq')
  check('FAQ 200', faq.response.status === 200)
  check('curl acceptance answer outside scripts', faq.body.includes('Genuine sheepskin is natural'))
  faqParity(faq, 'FAQ'); footerOnce(faq, 'FAQ')
  const product = await page('/leather-jackets/leather-puffer-jacket')
  const products = product.schemas.filter(schema => schema['@type'] === 'Product')
  check('one Product schema', products.length === 1)
  const offer = products[0].offers
  check('price, stock, condition', Number(offer.price) > 0 && offer.priceCurrency === 'USD' && /InStock|OutOfStock/.test(offer.availability) && offer.itemCondition.endsWith('/NewCondition'))
  check('shipping rate', Number(offer.shippingDetails.shippingRate.value) === 45 && offer.shippingDetails.shippingRate.currency === 'USD')
  check('shipping destinations match settings', JSON.stringify(offer.shippingDetails.shippingDestination.map(region => region.addressCountry)) === JSON.stringify(shippingCountries))
  check('shipping timeline matches settings', offer.shippingDetails.deliveryTime.handlingTime.minValue === deliverySettings.handlingMin && offer.shippingDetails.deliveryTime.transitTime.maxValue === deliverySettings.transitMax)
  check('canonical product', canonical(product.html) === 'https://www.jacketee.com/leather-jackets/leather-puffer-jacket')
  faqParity(product, 'Product'); footerOnce(product, 'Product')
  const legacy = await page('/products/letterman-patch-packs')
  check('legacy product 301', legacy.response.status === 301 && legacy.response.headers.get('location') === 'https://www.jacketee.com/patches-embroidery/letterman-patch-packs')
  const returns = await page('/returns')
  const policies = returns.schemas.filter(schema => schema['@type'] === 'Organization' && schema.hasMerchantReturnPolicy)
  check('one returns policy graph', policies.length === 1)
  check('returns policy facts', policies[0].hasMerchantReturnPolicy.merchantReturnDays === 10 && policies[0].hasMerchantReturnPolicy.description.includes('15%') && policies[0].hasMerchantReturnPolicy.description.includes('$35'))
  const blog = await page('/blog')
  check('blog title', blog.html.includes('<title>Jacketee Journal: Custom Jacket Guides and Style Tips | Jacketee</title>'))
  check('blog canonical', canonical(blog.html) === 'https://www.jacketee.com/blog')
  check('page 1 no Previous', !/<a[^>]+aria-label="Go to previous page"/.test(blog.body))
  footerOnce(blog, 'Blog')
  const second = await page('/blog?page=2')
  check('page 2 canonical', canonical(second.html) === 'https://www.jacketee.com/blog?page=2')
  check('no page=1 links', !/href="\/blog\?page=1"/.test(second.body))
  const lastPage = Number(decode(blog.body).match(/Showing page 1 of (\d+)/)?.[1])
  const last = await page(`/blog?page=${lastPage}`)
  check('last page no Next', !/<a[^>]+aria-label="Go to next page"/.test(last.body))
  const categorySlug = blog.body.match(/href="\/blog\/category\/([^"]+)"/)?.[1]
  if (categorySlug) {
    const filtered = await page(`/blog?category=${categorySlug}`)
    check('filtered archive canonical', canonical(filtered.html) === `https://www.jacketee.com/blog?category=${categorySlug}`)
    const categoryArchive = await page(`/blog/category/${categorySlug}`)
    check('category archive canonical', canonical(categoryArchive.html) === `https://www.jacketee.com/blog/category/${categorySlug}`)
    const pages = Number(decode(categoryArchive.body).match(/Showing page 1 of (\d+)/)?.[1])
    if (pages > 1) {
      const secondCategory = await page(`/blog/category/${categorySlug}?page=2`)
      check('category page 2 canonical', canonical(secondCategory.html) === `https://www.jacketee.com/blog/category/${categorySlug}?page=2`)
      check('category no page=1 links', !/href="\/blog\/category\/[^"?]+\?page=1"/.test(secondCategory.body))
    }
  }
  const sitemap = await page('/sitemap.xml')
  const urls = [...sitemap.html.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1])
  const articleCount = urls.filter(url => /^https:\/\/www\.jacketee\.com\/blog\/[^/]+$/.test(url)).length
  const count = Number(decode(blog.body).match(/\((\d+) posts\)/)?.[1])
  check('blog count matches sitemap articles', count === articleCount)
  check('sitemap no priority/changefreq', !/<priority>|<changefreq>/.test(sitemap.html))
  console.log(`Blog: ${count} posts; sitemap: ${articleCount} article URLs.`)
  const category = await page('/leather-jackets')
  faqParity(category, 'Category')
  const home = await page('/')
  footerOnce(home, 'Home')
  for (const slug of ['letterman-patches-explained-year-chevrons-activity', 'faux-shearling-vs-genuine-shearling-b3-aviator-jacket']) {
    const post = await page(`/blog/${slug}`)
    check(`${slug}: status 200`, post.response.status === 200)
    check(`${slug}: no Continue planning`, !post.body.includes('Continue planning'))
    check(`${slug}: middle-dot byline`, post.body.includes('·'))
  }
  console.log(`${checks.length} checks passed.`)
} finally {
  fs.writeFileSync(`${output}/acceptance-results.json`, JSON.stringify(checks, null, 2))
}
