import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import configModule from 'next/dist/server/config.js'
import constants from 'next/constants.js'
import swc from 'next/dist/build/swc/index.js'
import lockfileModule from 'next/dist/build/lockfile.js'

async function main() {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const config = await configModule.default(constants.PHASE_DEVELOPMENT_SERVER, root)
  // Next 16 resolves its development-only output to <distDir>/dev.
  // Preserve production builds and all source files.
  const target = path.resolve(root, config.distDir)
  const relative = path.relative(root, target)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || path.basename(target) !== 'dev') {
    throw new Error('Refusing to clean a path outside the project development output.')
  }
  const resolved = await fs.realpath(target).catch(error => {
    if (error.code === 'ENOENT') return null
    throw error
  })
  if (resolved && resolved !== target) throw new Error('Refusing to clean a linked development directory.')
  if (process.argv.includes('--dry-run')) {
    console.log(`Development cache to reset: ${target}`)
    return
  }
  if (resolved) {
    await swc.loadBindings()
    const lock = lockfileModule.Lockfile.tryAcquire(path.join(target, 'lock'))
    if (!lock) throw new Error('A dev server is still running. Stop it with Ctrl+C, then run npm run dev:clean again.')
    lock.unlockSync()
  }
  if (process.argv.includes('--check')) {
    console.log('Development output is safe to reset; no files changed.')
    return
  }
  console.log('Resetting Next.js development output.')
  await fs.rm(target, { recursive: true, force: true, maxRetries: 3 })
  console.log('Development output reset; production build preserved.')
}

main().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
