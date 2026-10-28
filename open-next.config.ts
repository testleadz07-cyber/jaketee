import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// Free-plan testing: no R2 or persistent cache required.
const config = defineCloudflareConfig()
config.default!.override!.wrapper = async () => (await import('./src/cloudflare/request-wrapper')).default
// Both config variants are bundled by the Cloudflare adapter. Keep Node
// built-ins external, but bundle the wrapper itself into the generated config.
config.edgeExternals = [...(config.edgeExternals ?? []), 'node:stream', 'node:async_hooks']
// OpenNext's validator only accepts the literal "cloudflare-node". Our wrapper
// delegates to that exact implementation, adding invocation-local DB cleanup.
config.cloudflare = { ...config.cloudflare, dangerousDisableConfigValidation: true }
export default config

// Optional R2 incremental cache (provision the matching binding first):
// import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
// export default defineCloudflareConfig({
//   incrementalCache: r2IncrementalCache,
// })
