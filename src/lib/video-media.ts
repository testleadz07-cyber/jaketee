export function parseVideoUrl(value: unknown): { url: string; embedUrl?: string; poster: string; provider: 'youtube' | 'cloudinary' } | null {
  if (typeof value !== 'string' || value.length > 2048) return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
    const host = url.hostname.toLowerCase()
    let id: string | null = null
    if (host === 'youtu.be') id = url.pathname.slice(1)
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
      id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)\/?$/)?.[1] || null
    }
    if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
      return { provider: 'youtube', url: `https://www.youtube.com/watch?v=${id}`, embedUrl: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1`, poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` }
    }
    if (host === 'res.cloudinary.com' && /^\/[^/]+\/video\/upload\/.+/.test(url.pathname)) {
      url.hash = ''
      const poster = new URL(url)
      poster.pathname = poster.pathname.replace(/\.[^/.]+$/, '') + '.jpg'
      poster.pathname = poster.pathname.replace('/video/upload/', '/video/upload/c_limit,w_480,q_auto,so_0/')
      return { provider: 'cloudinary', url: url.href, poster: poster.href }
    }
  } catch { /* Invalid URL */ }
  return null
}

export function validateVideoUrls(value: unknown, limit: number): string[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > limit) return null
  const parsed = value.map(parseVideoUrl)
  if (parsed.some((video) => !video)) return null
  return [...new Set(parsed.map((video) => video!.url))]
}
