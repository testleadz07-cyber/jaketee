import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getWorkerRequestScope } from './worker-request-scope'

interface TagBinding {
  idFromName(name: string): unknown
  get(id: unknown): { fetch(url: string, init: RequestInit): Promise<Response> }
}

function recordCache(status: 'hits' | 'misses' | 'bypasses') {
  const metrics = (getCloudflareContext().env as { __PUBLIC_CACHE_METRICS?: Record<string, number> }).__PUBLIC_CACHE_METRICS
  if (metrics) metrics[status]++
}

async function tagVersions(tags: string[], action: 'read' | 'invalidate') {
  const scope = getWorkerRequestScope()
  const saved = scope?.values
  const unique = [...new Set(tags)].sort()
  if (action === 'read' && unique.every(tag => saved?.has('public-tag:' + tag))) {
    return Object.fromEntries(unique.map(tag => [tag, saved!.get('public-tag:' + tag)]))
  }
  const env = getCloudflareContext().env as { PUBLIC_CACHE_TAGS?: TagBinding }
  if (!env.PUBLIC_CACHE_TAGS) throw new Error('PUBLIC_CACHE_TAGS is missing')
  const binding = env.PUBLIC_CACHE_TAGS
  const response = await binding.get(binding.idFromName('public-data-tags-v1')).fetch('https://cache.internal/', {
    method: 'POST', body: JSON.stringify({ action, tags: unique }), signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error('Public cache version store unavailable')
  const versions = await response.json() as Record<string, number>
  for (const tag of unique) {
    if (!Number.isSafeInteger(versions[tag]) || versions[tag] < 0) throw new Error('Invalid public cache version')
    saved?.set('public-tag:' + tag, versions[tag])
  }
  return versions
}

export async function invalidateCloudflarePublicTags(tags: string[]) {
  await tagVersions(tags, 'invalidate')
}

/** Cache only explicitly public serialized data, never HTML, auth or API responses. */
export async function cloudflarePublicRead(key: string, args: string, seconds: number, tags: string[], load: () => Promise<string>): Promise<string> {
  let cache: Cache, request: Request
  try {
    const versions = await tagVersions(tags, 'read')
    cache = (globalThis.caches as CacheStorage & { default: Cache }).default
    if (!cache) { recordCache('bypasses'); return load() }
    const identity = JSON.stringify(['public-data-v2', process.env.OPEN_NEXT_BUILD_ID || 'current', key, args, versions])
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity))
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    const origin = new URL(String(getWorkerRequestScope()?.values.get('request-url') || 'https://jaketee.testleadz07.workers.dev')).origin
    request = new Request(`${origin}/__public-data-cache/${hash}`)
    const response = await cache.match(request)
    if (response) { recordCache('hits'); return response.text() }
  } catch {
    // Missing/failed infrastructure must not serve a possibly invalid old entry.
    console.error('Public cache unavailable; reading current data')
    try { recordCache('bypasses') } catch { /* No platform context outside Workers. */ }
    return load()
  }
  recordCache('misses')
  const scope = getWorkerRequestScope()
  const pendingKey = 'public-load:' + request.url
  const pending = scope?.values.get(pendingKey) as Promise<string> | undefined
  if (pending) return pending
  const result = (async () => {
    const body = await load()
    if (new TextEncoder().encode(body).byteLength <= 1024 * 1024) {
      try {
        await cache.put(request, new Response(body, { headers: {
          'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${Math.max(1, Math.min(3600, seconds))}`,
        } }))
      } catch { console.error('Public cache write unavailable') }
    }
    return body
  })()
  scope?.values.set(pendingKey, result)
  try { return await result } catch (error) { scope?.values.delete(pendingKey); throw error }
}
