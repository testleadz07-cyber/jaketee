// Dedicated CI entry: preserve configured build variables, then use the same
// sanitizer and fail-closed artifact verification as the isolated local build.
// This command builds only; it never uploads or deploys the Worker.
process.env.CLOUDFLARE_PRODUCTION_BUILD = 'true'
await import('./cloudflare-build.mjs')
