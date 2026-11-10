import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export const origin = 'https://www.jacketee.com'
export const key = '9f1d3b7e6c824a50b3d8e7192a6c4f05'
export const keyLocation = `${origin}/${key}.txt`

export function publicUrls(values) {
  if (!values.length) throw new Error('Provide changed URLs or --sitemap for the initial submission.')
  return [...new Set(values.map(value => {
    const url = new URL(value)
    if (url.origin !== origin || url.username || url.password || url.search || url.hash ||
        /^\/(?:api|admin|cart|checkout|profile|login|register|reset-password|forgot-password|order-confirmation|search)(?:\/|$)/i.test(url.pathname) ||
        /\.(?:txt|xml|json|woff2?|png|jpe?g|webp|ico|svg)$/i.test(url.pathname)) {
      throw new Error(`Not a canonical public page: ${value}`)
    }
    return url.href
  }))]
}

export function sitemapUrls(xml) {
  if (!/<urlset[\s>]/i.test(xml) || !/<\/urlset>/i.test(xml)) throw new Error('Expected a complete URL sitemap.')
  return publicUrls([...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(match => match[1].replaceAll('&amp;', '&')))
}

export async function submitUrls(values, request = fetch) {
  const urls = publicUrls(values)
  const verification = await request(keyLocation, { redirect: 'manual', signal: AbortSignal.timeout(20000) })
  if (verification.status !== 200 || (await verification.text()).trim() !== key) {
    throw new Error('IndexNow verification file is not live. Deploy the public key file before submitting.')
  }
  const results = []
  for (let start = 0; start < urls.length; start += 10000) {
    const urlList = urls.slice(start, start + 10000)
    const response = await request('https://api.indexnow.org/indexnow', {
      method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(origin).host, key, keyLocation, urlList }),
      signal: AbortSignal.timeout(30000),
    })
    if (![200, 202].includes(response.status)) throw new Error(`IndexNow returned HTTP ${response.status}; stop and investigate before retrying.`)
    results.push({ count: urlList.length, status: response.status, verificationPending: response.status === 202 })
  }
  return results
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help')) {
    console.log('Preview: node scripts/indexnow.mjs <changed canonical URLs>\nSubmit: append --submit\nInitial discovery only: --sitemap [--submit]\nRun after deploying public content changes. Do not repeatedly resubmit unchanged sitemaps.')
    return
  }
  if (args.some(arg => arg.startsWith('--') && !['--sitemap', '--submit'].includes(arg))) throw new Error('Unknown option; use --help.')
  let values = args.filter(arg => !arg.startsWith('--'))
  if (args.includes('--sitemap')) {
    if (values.length) throw new Error('Use either explicit URLs or --sitemap.')
    const response = await fetch(`${origin}/sitemap.xml`, { redirect: 'error', signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`Sitemap HTTP ${response.status}`)
    values = sitemapUrls(await response.text())
  }
  const urls = publicUrls(values)
  const report = { mode: args.includes('--submit') ? 'submit' : 'preview', urls, results: [] }
  if (report.mode === 'submit') report.results = await submitUrls(urls)
  await fs.mkdir('output/bing', { recursive: true })
  await fs.writeFile('output/bing/indexnow-result.json', JSON.stringify(report, null, 2) + '\n')
  console.log(`${report.mode}: ${urls.length} canonical public URLs. Report: output/bing/indexnow-result.json`)
  for (const result of report.results) console.log(`HTTP ${result.status}: ${result.count} received${result.verificationPending ? '; key verification pending' : ''}. Indexing is not guaranteed.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
