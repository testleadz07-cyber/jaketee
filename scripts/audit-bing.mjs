import fs from 'node:fs/promises'
import { origin, sitemapUrls } from './indexnow.mjs'

// Read-only check of every canonical page advertised in the live sitemap.
const response = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(30000) })
if (!response.ok) throw new Error(`Sitemap HTTP ${response.status}`)
const urls = sitemapUrls(await response.text())
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'")
const attr = (tag, name) => decode(tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1] || '')
const rows = []
let next = 0
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < urls.length) {
    const url = urls[next++]
    try {
      const page = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(45000) })
      const html = await page.text()
      const metas = html.match(/<meta\b[^>]*>/gi) || []
      const links = html.match(/<link\b[^>]*>/gi) || []
      const canonical = attr(links.find(tag => attr(tag, 'rel') === 'canonical') || '', 'href')
      const robots = [page.headers.get('x-robots-tag'), ...metas.filter(tag => ['robots', 'bingbot'].includes(attr(tag, 'name'))).map(tag => attr(tag, 'content'))].filter(Boolean).join('; ')
      const title = decode(html.match(/<title>(.*?)<\/title>/is)?.[1] || '')
      const description = attr(metas.find(tag => attr(tag, 'name') === 'description') || '', 'content')
      const h1Count = (html.match(/<h1\b/gi) || []).length
      const issues = [page.status !== 200 && `HTTP ${page.status}`, (!canonical || new URL(canonical).href !== new URL(url).href) && 'canonical mismatch', /\bnoindex\b/i.test(robots) && 'noindex', !title && 'missing title', !description && 'missing description', h1Count !== 1 && `${h1Count} H1 headings`].filter(Boolean)
      rows.push({ url, status: page.status, location: page.headers.get('location'), canonical, robots, title, description, h1Count, issues })
    } catch (error) {
      rows.push({ url, status: 0, issues: [error.message] })
    }
    if (rows.length % 50 === 0) console.log(`Checked ${rows.length}/${urls.length}`)
  }
}))
rows.sort((a, b) => a.url.localeCompare(b.url))
await fs.mkdir('output/bing', { recursive: true })
await fs.writeFile('output/bing/live-audit.json', JSON.stringify(rows, null, 2) + '\n')
const issues = rows.filter(row => row.issues.length)
console.log(JSON.stringify({ total: rows.length, issues }, null, 2))
if (issues.length) process.exitCode = 1
