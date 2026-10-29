import 'server-only'
import mongoose from 'mongoose'
import { unstable_cache } from 'next/cache'
import { connection } from 'next/server'
import { connectDB } from './mongodb'
import { getWorkerRequestScope } from './worker-request-scope'
import { cloudflarePublicRead } from './cloudflare-public-cache'

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
  // Cloudflare builds must not freeze database content into immutable SSG
  // output. Runtime SSR uses the public-data cache; Node retains Next caching.
  if (process.env.MIGRATION_TEST_MODE === 'true' || getWorkerRequestScope()) await connection()
  const encoded = EJSON.stringify(args, { relaxed: false })
  const read = async () => {
    if (!await connectDB()) throw new Error('Public data unavailable')
    return load()
  }
  if (bounded && (encoded.length > 8000 || !admit(key + encoded))) return read()
  const serialized = async () => EJSON.stringify(await read(), { relaxed: false })
  const result = getWorkerRequestScope()
    ? await cloudflarePublicRead(key, encoded, seconds, tags, serialized)
    : await unstable_cache(serialized, ['public-v2', key, encoded], { revalidate: seconds, tags })()
  return EJSON.parse(result) as T
}
