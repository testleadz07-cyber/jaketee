/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

const source = ts.transpileModule(fs.readFileSync('src/config/shipping-countries.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText
function load(regionName) {
  const exports = {}
  const context = vm.createContext({ exports, Intl: { DisplayNames: class { of() { return regionName } } } })
  vm.runInContext("String.prototype.localeCompare = function () { throw Error('Country ordering must not depend on runtime ICU') }", context)
  vm.runInContext(source, context)
  return JSON.parse(JSON.stringify(exports))
}
const server = load('Falkland Islands')
const browser = load('Falkland Islands (Islas Malvinas)')
assert.deepEqual(server, browser)
assert.equal(server.allCountries.length, 249)
assert.equal(new Set(server.allCountries.map(c => c.code)).size, 249)
assert.deepEqual(server.allCountries.map(c => c.code).sort(), [...server.allCountryCodes].sort())
assert.equal(server.allCountries.find(c => c.code === 'FK').name, 'Falkland Islands')
assert.ok(server.allCountries.every(c => c.name && c.name !== c.code))
console.log('Country hydration checks passed: 249 fixed names and ordering, identical across different runtime region names.')
