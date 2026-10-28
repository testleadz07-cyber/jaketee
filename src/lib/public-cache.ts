import 'server-only'
import mongoose from 'mongoose'
import { unstable_cache } from 'next/cache'

const admitted = new Map<string, number>()
function admit(key: string) {
  const now = Date.now()
  for (const [item, expiresAt] of admitted) if (expiresAt <= now) admitted.delete(item)
  if (admitted.has(key)) return true
  if (admitted.size >= 128) return false
  admitted.set(key, now + 60_000)
  return true
}

// Preserve ObjectIds/Dates when database results cross Next's JSON cache boundary.
// Call only for explicitly public reads; never sessions, drafts, orders or customers.
export async function publicRead<T>(key: string, args: unknown, seconds: number, tags: string[], load: () => Promise<T>, bounded = false): Promise<T> {
  const { EJSON } = mongoose.mongo.BSON
  const encoded = EJSON.stringify(args, { relaxed: false })
  if (bounded && (encoded.length > 8000 || !admit(key + encoded))) return load()
  const result = await unstable_cache(async () => EJSON.stringify(await load(), { relaxed: false }),
    ['public-v1', key, encoded], { revalidate: seconds, tags })()
  return EJSON.parse(result) as T
}
