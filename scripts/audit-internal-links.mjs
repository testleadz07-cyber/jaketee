const baseUrl = (process.env.INTERNAL_LINK_BASE_URL || process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const request = url => fetch(url, { signal: AbortSignal.timeout(20000) })
const sitemapResponse = await request(`${baseUrl}/sitemap.xml`)
if (!sitemapResponse.ok) throw new Error(`Sitemap returned ${sitemapResponse.status}`)

const sitemap = await sitemapResponse.text()
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
const publicPaths = new Set(urls.map((url) => new URL(url).pathname.replace(/\/$/, '') || '/'))
const incoming = new Map([...publicPaths].map((path) => [path, new Set()]))
const broken = []
const queue = [...publicPaths]
const crawledSources = new Set()

while (queue.length > 0) {
  const sourcePath = queue.shift()
  if (crawledSources.has(sourcePath)) continue
  crawledSources.add(sourcePath)
  let response
  try { response = await request(`${baseUrl}${sourcePath}`) } catch (error) {
    broken.push({ source: sourcePath, error: error.name })
    continue
  }
  if (!response.ok) {
    broken.push({ source: sourcePath, status: response.status })
    continue
  }
  const html = await response.text()
  for (const match of html.matchAll(/href=["']([^"'#]+)["']/gi)) {
    const href = match[1]
    let parsed
    try { parsed = new URL(href.replaceAll('&amp;', '&'), `${baseUrl}${sourcePath}`) } catch { continue }
    const origin = new URL(baseUrl).origin
    if (parsed.origin !== origin && !['jacketee.com', 'www.jacketee.com'].includes(parsed.hostname)) continue
    if (!['http:', 'https:'].includes(parsed.protocol)) continue
    const target = parsed.pathname.replace(/\/$/, '') || '/'
    if (incoming.has(target) && target !== sourcePath) incoming.get(target).add(sourcePath)
    // Crawl every discovered page, including targets absent from the sitemap.
    // Ignore action endpoints/assets and query variants to avoid writes and infinite faceted URLs.
    if (!target.startsWith('/api/') && !/\.[a-z0-9]{2,5}$/i.test(target) && !crawledSources.has(target) && !queue.includes(target)) queue.push(target)
  }
}

const ignored = new Set(['/'])
const orphans = [...incoming]
  .filter(([path, sources]) => !ignored.has(path) && sources.size === 0)
  .map(([path]) => path)

console.log(JSON.stringify({ sitemapUrls: publicPaths.size, crawledSources: crawledSources.size, orphans, broken }, null, 2))
if (orphans.length || broken.length) process.exitCode = 1
