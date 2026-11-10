import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { origin, key, keyLocation, publicUrls, sitemapUrls, submitUrls } from './indexnow.mjs'

assert.equal((await fs.readFile(new URL(`../public/${key}.txt`, import.meta.url), 'utf8')).trim(), key)
assert.deepEqual(publicUrls([`${origin}/shop`, `${origin}/shop`]), [`${origin}/shop`])
for (const url of ['https://jacketee.com/shop', 'https://evil.example/shop', `${origin}/api/products`, `${origin}/admin`, `${origin}/checkout`, `${origin}/shop?page=2`, `${origin}/blog#tag`, `${origin}/sitemap.xml`, 'https://user:pass@www.jacketee.com/shop']) {
  assert.throws(() => publicUrls([url]))
}
assert.throws(() => sitemapUrls('<html>Unavailable</html>'))
assert.deepEqual(sitemapUrls(`<urlset><url><loc>${origin}/shop</loc></url></urlset>`), [`${origin}/shop`])
let posts = 0
await assert.rejects(() => submitUrls([`${origin}/shop`], async () => new Response('missing', { status: 404 })), /not live/)
for (const status of [200, 202, 403, 422, 429, 500]) {
  const request = async (url, options) => {
    if (url === keyLocation) return new Response(key)
    posts++
    assert.equal(options.method, 'POST')
    assert.equal(url, 'https://api.indexnow.org/indexnow')
    assert.deepEqual(JSON.parse(options.body), { host: 'www.jacketee.com', key, keyLocation, urlList: [`${origin}/shop`] })
    return new Response('', { status })
  }
  if ([200, 202].includes(status)) assert.equal((await submitUrls([`${origin}/shop`], request))[0].verificationPending, status === 202)
  else await assert.rejects(() => submitUrls([`${origin}/shop`], request), new RegExp(`HTTP ${status}`))
}
assert.equal(posts, 6)
console.log('IndexNow checks passed: verification, canonical/private URL guards, payload, pending validation, and failure handling.')
