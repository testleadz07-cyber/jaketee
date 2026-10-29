import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { migrationEnv } from './migration-env.mjs'
import { sanitizeCloudflareArtifact, verifyCloudflareArtifact } from './verify-cloudflare-artifact.mjs'

const require = createRequire(import.meta.url)
const cli = path.resolve(path.dirname(require.resolve('@opennextjs/cloudflare')), '../cli/index.js')
// By default this branch builds an isolated smoke-test artifact. An intentional
// production build may opt in to configured build vars after the manual gates.
const env = process.env.CLOUDFLARE_PRODUCTION_BUILD === 'true' ? { ...process.env } : migrationEnv()
env.OPEN_NEXT_BUILD = 'true'
const result = spawnSync(process.execPath, [cli, 'build', ...process.argv.slice(2)], { stdio: 'inherit', env })
// OpenNext copies raw .env-file values into this module independently of
// process.env. Runtime secrets must come from Worker bindings, never a bundle.
sanitizeCloudflareArtifact()
if (result.status === 0) verifyCloudflareArtifact()
process.exit(result.status ?? 1)
