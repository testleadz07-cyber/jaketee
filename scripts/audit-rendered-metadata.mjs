import fs from 'node:fs/promises'

const baseUrl = (process.env.METADATA_TEST_BASE_URL || process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const decode = (value = '') => value
  .replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'")
  .replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>')
const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`)
if (!sitemapResponse.ok) throw new Error(`Sitemap returned ${sitemapResponse.status}`)
const sitemap = await sitemapResponse.text()
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
const rows = []

for (let index = 0; index < urls.length; index += 8) {
  const batch = urls.slice(index, index + 8)
  rows.push(...await Promise.all(batch.map(async (canonicalUrl) => {
    const localUrl = canonicalUrl.replace(/^https:\/\/www\.jacketee\.com/, baseUrl)
    const response = await fetch(localUrl)
    const html = await response.text()
    const title = decode(html.match(/<title>(.*?)<\/title>/is)?.[1] || '').replace(/\s+/g, ' ').trim()
    const description = decode(html.match(/<meta name="description" content="([^"]*)"/i)?.[1] || '').replace(/\s+/g, ' ').trim()
    return { url: canonicalUrl, status: response.status, title, description }
  })))
}

const titleCounts = new Map()
for (const row of rows) titleCounts.set(row.title.toLowerCase(), (titleCounts.get(row.title.toLowerCase()) || 0) + 1)
for (const row of rows) {
  row.result = row.status === 200 && row.title && row.description && titleCounts.get(row.title.toLowerCase()) === 1 && !/[\r\n]/.test(row.title + row.description) && row.title.length <= 60 && row.description.length <= 155 ? 'Pass' : 'Review'
}

const lines = [
  ['URL', 'HTTP', 'Title', 'Title length', 'Description', 'Description length', 'Result'].map(csv).join(','),
  ...rows.map((row) => [row.url, row.status, row.title, row.title.length, row.description, row.description.length, row.result].map(csv).join(',')),
]
await fs.writeFile('docs/metadata-report.csv', `${lines.join('\n')}\n`, 'utf8')

const review = rows.filter((row) => row.result !== 'Pass')
console.log(`Audited ${rows.length} sitemap URLs: ${rows.length - review.length} passed, ${review.length} need review.`)
for (const row of review) console.log(row)
if (review.length) process.exitCode = 1
