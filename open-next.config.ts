import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// Free-plan smoke tests: no persistent incremental cache. SSR works, but ISR
// and cross-request tag invalidation are NOT production-ready in this profile.
export default defineCloudflareConfig({})

// Production: provision the matching bindings in wrangler.jsonc, then use:
// import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
// import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue'
// import d1NextModeTagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache'
// export default defineCloudflareConfig({
//   incrementalCache: r2IncrementalCache,
//   queue: doQueue,
//   tagCache: d1NextModeTagCache,
// })
