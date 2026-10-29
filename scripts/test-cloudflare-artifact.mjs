import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { sanitizeCloudflareArtifact, verifyCloudflareArtifact } from './verify-cloudflare-artifact.mjs'

const previous = process.cwd()
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'jaketee-artifact-test-'))
const key = 'JAKETEE_ARTIFACT_TEST_SECRET'
const publicKey = 'NEXT_PUBLIC_JAKETEE_ARTIFACT_TEST_TOKEN'
const original = process.env[key], originalPublic = process.env[publicKey]
const secret = 'synthetic-artifact-secret-93710\nsecond-line'
try {
  process.chdir(temporary)
  fs.mkdirSync('.open-next/cloudflare', { recursive: true })
  fs.writeFileSync('.open-next/worker.js', 'export default {}')
  verifyCloudflareArtifact()
  process.env[key] = secret
  fs.writeFileSync('.open-next/worker.js', `export const accidental = ${JSON.stringify(secret)}`)
  assert.throws(verifyCloudflareArtifact, error => error.message.includes(key) && !error.message.includes(secret), 'CI-only escaped secrets must fail without printing their value')
  fs.writeFileSync('.open-next/worker.js', secret)
  assert.throws(verifyCloudflareArtifact, /credential check failed/, 'Raw secret bytes must fail')
  fs.writeFileSync('.open-next/worker.js', 'export default {}')
  fs.writeFileSync('.open-next/public-route.cache', JSON.stringify({ accidental: secret }))
  assert.throws(verifyCloudflareArtifact, /credential check failed/, 'Generated static/RSC cache payloads must also be scanned')
  fs.unlinkSync('.open-next/public-route.cache')
  fs.writeFileSync('.env.test', 'LOCAL_API_KEY=synthetic-local-api-key-58213\n')
  fs.writeFileSync('.open-next/worker.js', 'export const accidental="synthetic-local-api-key-58213"')
  assert.throws(verifyCloudflareArtifact, /LOCAL_API_KEY/)
  fs.writeFileSync('.open-next/worker.js', 'export default {}')
  fs.writeFileSync('.open-next/.env', 'PRIVATE_TOKEN=fixture-file-secret')
  assert.throws(verifyCloudflareArtifact, /environment file must not be packaged/)
  fs.writeFileSync('.open-next/cloudflare/next-env.mjs', `export const production = { TOKEN: ${JSON.stringify(secret)} }`)
  sanitizeCloudflareArtifact()
  assert.ok(!fs.existsSync('.open-next/.env'))
  assert.match(fs.readFileSync('.open-next/cloudflare/next-env.mjs', 'utf8'), /production = \{\}/)
  assert.match(fs.readFileSync('.env.test', 'utf8'), /synthetic-local-api-key/, 'Source env files must be preserved')
  process.env[publicKey] = 'intentional-public-value-32985'
  fs.writeFileSync('.open-next/worker.js', process.env[publicKey])
  verifyCloudflareArtifact()
  console.log('PASS: CI/local secret leaks fail closed, raw and escaped values are detected, source env files survive sanitization, public values remain allowed')
} finally {
  process.chdir(previous)
  if (original === undefined) delete process.env[key]; else process.env[key] = original
  if (originalPublic === undefined) delete process.env[publicKey]; else process.env[publicKey] = originalPublic
  // Delete only the mkdtemp fixture directory verified inside the OS temp root.
  const resolved = path.resolve(temporary)
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('jaketee-artifact-test-')) throw Error('Unexpected fixture cleanup path')
  fs.rmSync(resolved, { recursive: true, force: true })
}
