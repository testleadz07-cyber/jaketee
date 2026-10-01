import fs from 'node:fs'
import path from 'node:path'

const baseUrl = (process.env.REDIRECT_TEST_BASE_URL || process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const redirects = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'url-redirects.json'), 'utf8'))

if (!redirects.length) throw new Error('Redirect map is empty')

let failures = 0
for (const { source, destination } of redirects) {
  const first = await fetch(`${baseUrl}${source}`, { redirect: 'manual' })
  const location = first.headers.get('location')
  const resolvedLocation = location ? new URL(location, baseUrl) : null
  const expected = new URL(destination, baseUrl)
  if (first.status !== 301 || resolvedLocation?.pathname !== expected.pathname) {
    console.error(`FAIL ${source}: expected 301 -> ${destination}, got ${first.status} -> ${location || '(none)'}`)
    failures++
    continue
  }
  const final = await fetch(expected, { redirect: 'manual' })
  if (final.status !== 200) {
    console.error(`FAIL ${source}: final ${destination} returned ${final.status}`)
    failures++
  } else {
    console.log(`PASS ${source} -> ${destination}`)
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`)
const sitemap = await sitemapResponse.text()
if (!sitemapResponse.ok) {
  console.error(`FAIL sitemap.xml returned ${sitemapResponse.status}`)
  failures++
} else {
  const sitemapPaths = new Set(
    [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname)
  )
  for (const { source, destination } of redirects) {
    if (sitemapPaths.has(source)) {
      console.error(`FAIL sitemap contains redirected URL ${source}`)
      failures++
    }
    if (!sitemapPaths.has(destination)) {
      console.error(`FAIL sitemap is missing final URL ${destination}`)
      failures++
    }
  }
}

if (failures) throw new Error(`${failures} redirect checks failed`)
console.log(`All ${redirects.length} redirects make one 301 hop to a 200 page and the sitemap contains only their final URLs.`)
