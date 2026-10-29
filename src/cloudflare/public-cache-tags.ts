/** Private binding: public-data invalidation versions, never customer records. */
export class PublicCacheTags {
  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const { action, tags } = await request.json() as { action: string; tags: string[] }
    if (!['read', 'invalidate'].includes(action) || !Array.isArray(tags) || tags.length > 64 ||
      tags.some(tag => typeof tag !== 'string' || !/^[a-z0-9:-]{1,80}$/.test(tag))) {
      return new Response('Invalid cache operation', { status: 400 })
    }
    const unique = [...new Set(tags)].sort()
    if (!unique.length) return Response.json({})
    const versions = await this.state.storage.transaction(async storage => {
      const saved = await storage.get<number>(unique)
      const result: Record<string, number> = {}
      for (const tag of unique) {
        result[tag] = Number(saved.get(tag) || 0) + (action === 'invalidate' ? 1 : 0)
        if (action === 'invalidate') await storage.put(tag, result[tag])
      }
      return result
    })
    return Response.json(versions)
  }
}
