import fs from 'node:fs'
import path from 'node:path'

export function migrationEnv() {
  const env = { ...process.env }
  const keys = new Set()
  function scan(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name)
      if (item.isDirectory()) scan(file)
      else if (/\.[cm]?[jt]sx?$/.test(item.name)) {
        for (const match of fs.readFileSync(file, 'utf8').matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) keys.add(match[1])
      }
    }
  }
  scan('src')
  // Read variable NAMES only. Mask local env files so a build or preview never
  // picks up the production database or delivery credentials by accident.
  for (const name of fs.readdirSync('.').filter(name => /^\.env(?:\.|$)|^\.dev\.vars(?:\.|$)/.test(name))) {
    if (!fs.statSync(name).isFile()) continue
    for (const line of fs.readFileSync(name, 'utf8').split(/\r?\n/)) {
      const key = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1]
      if (key) keys.add(key)
    }
  }
  for (const key of keys) {
    if (!['NODE_ENV', 'NEXT_RUNTIME'].includes(key)) env[key] = ''
  }
  return Object.assign(env, {
    NODE_ENV: 'production', MIGRATION_TEST_MODE: 'true', MONGO_PER_REQUEST: '',
    EMAIL_PROVIDER: 'disabled', PUSH_ENABLED: 'false', CRON_ENABLED: 'false',
    NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:8787', NEXTAUTH_URL: 'http://127.0.0.1:8787',
    NEXTAUTH_SECRET: 'local-migration-tests-only-never-use-in-production',
    PAYPAL_MODE: 'sandbox', WRANGLER_SEND_METRICS: 'false',
    WRANGLER_LOG_PATH: path.resolve('migration-artifacts/wrangler.log'),
  })
}
