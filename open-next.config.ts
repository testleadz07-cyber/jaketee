import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// Free-plan testing: no R2 or persistent cache required.
export default defineCloudflareConfig()

// Optional R2 incremental cache (provision the matching binding first):
// import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
// export default defineCloudflareConfig({
//   incrementalCache: r2IncrementalCache,
// })
