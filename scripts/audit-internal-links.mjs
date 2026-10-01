const baseUrl = (process.env.INTERNAL_LINK_BASE_URL || process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`)
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
  const response = await fetch(`${baseUrl}${sourcePath}`)
  if (!response.ok) {
    broken.push({ source: sourcePath, status: response.status })
    continue
  }
  const html = await response.text()
  for (const match of html.matchAll(/href=["']([^"'#]+)["']/gi)) {
    const href = match[1]
    if (!href.startsWith('/') || href.startsWith('//')) continue
    const parsed = new URL(href, baseUrl)
    const target = parsed.pathname.replace(/\/$/, '') || '/'
    if (incoming.has(target) && target !== sourcePath) incoming.get(target).add(sourcePath)
    if (parsed.search && publicPaths.has(target) && !crawledSources.has(`${target}${parsed.search}`)) {
      queue.push(`${target}${parsed.search}`)
    }
  }
}

const ignored = new Set(['/'])
const orphans = [...incoming]
  .filter(([path, sources]) => !ignored.has(path) && sources.size === 0)
  .map(([path]) => path)

console.log(JSON.stringify({ sitemapUrls: publicPaths.size, crawledSources: crawledSources.size, orphans, broken }, null, 2))
if (orphans.length || broken.length) process.exitCode = 1
