import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import fs from 'node:fs'
import { sanitizeCloudflareArtifact, verifyCloudflareArtifact } from './verify-cloudflare-artifact.mjs'
import { migrationEnv } from './migration-env.mjs'

const require = createRequire(import.meta.url)
const [tool, ...args] = process.argv.slice(2)
const commands = {
  next: require.resolve('next/dist/bin/next'),
  wrangler: path.resolve(path.dirname(require.resolve('wrangler/package.json')), 'bin/wrangler.js'),
  opennext: path.resolve(path.dirname(require.resolve('@opennextjs/cloudflare')), '../cli/index.js'),
}
if (!commands[tool]) throw new Error('Expected next, wrangler or opennext')
let command = commands[tool]
const env = migrationEnv()
if (tool === 'opennext') env.OPEN_NEXT_BUILD = 'true'
if (tool === 'opennext' && args[0] === 'preview') {
  // No cache population is needed with the test profile. The adapter's preview
  // forces dotenv loading off, so use Wrangler directly for the explicit file.
  command = commands.wrangler
  args[0] = 'dev'
  // Wrangler otherwise loads .dev.vars/.env directly, bypassing process.env
  // masking. Pass a dedicated, credential-free file for the smoke-test runner.
  fs.mkdirSync('migration-artifacts', { recursive: true })
  const file = path.resolve('migration-artifacts/smoke.env')
  const safe = {
    MIGRATION_TEST_MODE: 'true', MONGO_PER_REQUEST: 'true', CLOUDFLARE_WORKER: 'true',
    EMAIL_PROVIDER: 'disabled', PUSH_ENABLED: 'false', CRON_ENABLED: 'false',
    NEXTAUTH_SECRET: env.NEXTAUTH_SECRET, NEXTAUTH_URL: env.NEXTAUTH_URL,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL, MONGODB_URI: '', PAYPAL_MODE: 'sandbox',
  }
  fs.writeFileSync(file, Object.entries(safe).map(([key, value]) => key + '=' + JSON.stringify(value)).join('\n') + '\n')
  args.push('--env-file', file)
  env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = 'true'
  env.CLOUDFLARE_INCLUDE_PROCESS_ENV = 'false'
}
const result = spawnSync(process.execPath, [command, ...args], { stdio: 'inherit', env })
if (tool === 'opennext' && args[0] === 'build') {
  sanitizeCloudflareArtifact()
  if (result.status === 0) verifyCloudflareArtifact()
}
process.exit(result.status ?? 1)
