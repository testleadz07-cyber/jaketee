import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const cache = new Map()
// Read the same storefront helpers in maintenance scripts, including @/ aliases.
export function loadTypeScript(filename) {
  const file = path.resolve(filename)
  if (cache.has(file)) return cache.get(file).exports
  const compiled = { exports: {} }
  cache.set(file, compiled)
  const require = createRequire(file)
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText
  new Function('require', 'module', 'exports', source)(id => {
    if (id.startsWith('@/')) return loadTypeScript(path.resolve('src', `${id.slice(2)}.ts`))
    if (id.startsWith('.') && fs.existsSync(path.resolve(path.dirname(file), `${id}.ts`))) return loadTypeScript(path.resolve(path.dirname(file), `${id}.ts`))
    return require(id)
  }, compiled, compiled.exports)
  return compiled.exports
}
