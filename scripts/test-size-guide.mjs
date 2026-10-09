import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { loadTypeScript } from './lib/load-typescript.mjs'

const require = createRequire(import.meta.url)
const sizing = loadTypeScript('src/lib/jacket-sizing.ts')
const international = loadTypeScript('src/lib/international-sizing.ts')
function load(file, mocks) {
  const module = { exports: {} }
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  new Function('require', 'module', 'exports', source)(id => id in mocks ? mocks[id] : require(id), module, module.exports)
  return module.exports
}
let selectedFit = 'male'
const { InternationalSizeChart } = load('src/components/international-size-chart.tsx', {
  '@/lib/international-sizing': international,
  react: { ...React, useState: () => [selectedFit, value => { selectedFit = value }] },
})
const { GarmentSizeChart } = load('src/components/garment-size-chart.tsx', { '@/lib/jacket-sizing': sizing, '@/components/international-size-chart': { InternationalSizeChart } })
// Compare every transcribed row with the verified official-source values.
assert.deepEqual(international.internationalSizing.male.rows.map(row => [row.us, row.uk, row.eu, ...row.chestCm, ...row.waistCm]), [
  ['34', '34', '44', 90, 90, 78.5, 78.5],
  ['36–38', '36–38', '46–48', 94, 98, 82.5, 86.5],
  ['38–40', '38–40', '48–50', 98, 102, 86.5, 90.5],
  ['40–42', '40–42', '50–52', 102, 106, 90.5, 94.5],
  ['42–44', '42–44', '52–54', 106, 110, 94.5, 98.5],
  ['44–46', '44–46', '54–56', 110, 114, 98.5, 102.5],
  ['46–48', '46–48', '56–58', 114, 118, 102.5, 106.5],
])
assert.deepEqual(international.internationalSizing.female.rows.map(row => [row.us, row.uk, row.eu, ...row.chestCm, ...row.waistCm, ...row.hipCm]), [
  ['4', '8', '36', 83, 88, 67, 72, 92, 97],
  ['6', '10', '38', 88, 93, 72, 77, 97, 102],
  ['8', '12', '40', 93, 98, 77, 82, 102, 107],
  ['10', '14', '42', 98, 103, 82, 87, 107, 112],
  ['12', '16', '44', 103, 108, 87, 92, 112, 117],
  ['14', '18', '46', 108, 113, 92, 97, 117, 122],
])
const internationalMarkup = unit => renderToStaticMarkup(React.createElement(InternationalSizeChart, { unit }))
let internationalHtml = internationalMarkup('cm')
assert.match(internationalHtml, />US</)
assert.match(internationalHtml, />UK</)
assert.match(internationalHtml, /EU \/ Italy/)
assert.match(internationalHtml, /Male \(Men\)/)
assert.match(internationalHtml, /Female \(Women\)/)
const controls = InternationalSizeChart({ unit: 'cm' }).props.children[0].props.children
controls[1].props.onClick()
internationalHtml = internationalMarkup('cm')
assert.match(internationalHtml, /Female international size chart/)
assert.match(internationalHtml, /Bust \/ Chest/)
assert.match(internationalHtml, /83–88/)
assert.match(internationalMarkup('in'), /32.68–34.65/)
controls[0].props.onClick()
assert.match(internationalMarkup('cm'), /Male international size chart/)
const renderChart = (kind, unit) => renderToStaticMarkup(React.createElement(GarmentSizeChart, { kind, unit }))
const inches = renderChart('jacket', 'in')
const centimeters = renderChart('jacket', 'cm')
for (const row of sizing.bodyRows) {
  assert.ok(inches.includes(sizing.formatRange(row.chest, 'in')))
  assert.ok(centimeters.includes(sizing.formatRange(row.waist, 'cm')))
}
assert.equal(sizing.format(38, 'cm'), '96.52')
assert.ok(centimeters.includes('60.96')) // M finished chest width: 24 inches.
const vest = renderChart('vest', 'in')
assert.match(vest, /Chest/)
assert.match(vest, /Waist/)
assert.doesNotMatch(vest, /Sleeve|Half shoulder|Finished jacket/)
assert.equal(sizing.estimateSize(38, 32).size, 'M')
assert.ok(Math.abs(Number(sizing.convertEntry(sizing.convertEntry('38', 'in', 'cm'), 'cm', 'in')) - 38) < 1e-9)

// Render all popup panels to inspect content; real Radix controls visibility.
const element = tag => ({ children }) => React.createElement(tag, null, children)
let defaultTab
const { SizeGuide } = load('src/components/size-guide.tsx', {
  'next/link': element('a'),
  '@/components/ui/dialog': Object.fromEntries(['Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription', 'DialogTrigger'].map(name => [name, element('div')])),
  '@/components/ui/tabs': { Tabs: props => { defaultTab = props.defaultValue; return React.createElement('div', null, props.children) }, TabsList: element('div'), TabsTrigger: element('button'), TabsContent: element('div') },
  '@/components/ui/button': { Button: element('button') },
  '@/components/garment-size-chart': { GarmentSizeChart },
  '@/lib/jacket-sizing': sizing,
  '@/lib/activity': { logUserActivity() {} },
})
const popup = renderToStaticMarkup(React.createElement(SizeGuide, { categorySlug: 'leather-vests' }))
assert.equal(defaultTab, 'vest')
assert.match(popup, />Jackets</)
assert.match(popup, />Vests</)
assert.match(popup, /How to Measure/)
assert.doesNotMatch(popup, /Tops|Bottoms|Shoes|Foot Length|Inseam/)
assert.ok(popup.includes(vest))
const fullPage = fs.readFileSync('src/components/jacket-size-reference.tsx', 'utf8')
assert.match(fullPage, /GarmentSizeChart kind="vest" unit=\{unit\}/)
assert.match(fullPage, /@\/lib\/jacket-sizing/)
assert.match(fullPage, /InternationalSizeChart unit=\{unit\}/)
console.log('PASS: verified US/UK/EU source rows, male/female switching, shared popup/full-page references, jacket/vest measurements, inch/cm conversion, estimator and measurement instructions.')
