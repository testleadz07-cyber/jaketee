import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'dotenv'
import { fileURLToPath } from 'node:url'

export function sanitizeCloudflareArtifact() {
  const root = path.resolve('.open-next')
  if (!fs.existsSync(root)) return
  function clean(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.resolve(directory, item.name)
      if (!file.startsWith(root + path.sep)) throw new Error('Unexpected build artifact path')
      if (item.isDirectory()) clean(file)
      else if (/^\.env(?:\.|$)|^\.dev\.vars(?:\.|$)/.test(item.name)) fs.unlinkSync(file)
    }
  }
  clean(root)
  const fallback = path.join(root, 'cloudflare/next-env.mjs')
  if (fs.existsSync(fallback)) fs.writeFileSync(fallback, 'export const production = {};\nexport const development = {};\nexport const test = {};\n')
}

export function verifyCloudflareArtifact() {
  const secrets = new Map()
  const collect = (key, value) => {
    if (typeof value !== 'string' || value.length < 8 || key.startsWith('NEXT_PUBLIC_')) return
    // Ignore example placeholders, never print the actual value in diagnostics.
    if (/^(?:your[_-]|(?:sk_test_|whsec_)your[_-])/i.test(value)) return
    if (/SECRET|PASSWORD|PASS$|TOKEN|PRIVATE_KEY|API_KEY|MONGODB_URI|DATABASE_URL|CLOUDINARY_URL/i.test(key)) secrets.set(value, key)
  }
  // Workers Builds usually supplies secrets through process.env, without a local
  // .env file. Scan those values too, not only developer workstation env files.
  for (const [key, value] of Object.entries(process.env)) collect(key, value)
  for (const file of fs.readdirSync('.').filter(name => /^\.env(?:\.|$)|^\.dev\.vars(?:\.|$)/.test(name))) {
    if (!fs.statSync(file).isFile()) continue
    for (const [key, value] of Object.entries(parse(fs.readFileSync(file)))) {
      collect(key, value)
    }
  }
  const findings = []
  function scan(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name)
      if (item.isDirectory()) scan(file)
      else {
        if (/^\.env(?:\.|$)|^\.dev\.vars(?:\.|$)/.test(item.name)) findings.push(`${file}: environment file must not be packaged`)
        if (!/\.(?:[cm]?js|json|map|html|txt|cache|rsc|body)$/.test(item.name)) continue
        const text = fs.readFileSync(file, 'utf8')
        for (const [value, key] of secrets) {
          if (text.includes(value) || text.includes(JSON.stringify(value).slice(1, -1))) findings.push(`${file}: contains runtime credential ${key}`)
        }
      }
    }
  }
  scan('.open-next')
  if (findings.length) throw new Error('Worker artifact credential check failed:\n' + findings.join('\n'))
  console.log('Worker artifact check passed: no known runtime credentials from CI/local env or environment files packaged.')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) verifyCloudflareArtifact()
