/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const postcss = require('postcss')
const tailwind = require('@tailwindcss/postcss')

const cssPath = path.resolve('src/app/globals.css')
const css = fs.readFileSync(cssPath, 'utf8')
function tokens(selector) {
  const rule = postcss.parse(css).nodes.find(node => node.type === 'rule' && node.selector === selector)
  assert.ok(rule, selector)
  return Object.fromEntries(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]))
}
function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}
function ratio(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}
const results = []
for (const selector of [':root', '.dark']) {
  const palette = tokens(selector)
  assert.equal(palette['color-scheme'], selector === ':root' ? 'light' : 'dark')
  for (const [foreground, background] of [
    ['foreground', 'background'], ['card-foreground', 'card'], ['popover-foreground', 'popover'],
    ['secondary-foreground', 'secondary'], ['accent-foreground', 'accent'], ['muted-foreground', 'background'],
    ['muted-foreground', 'card'], ['muted-foreground', 'muted'], ['primary', 'background'], ['primary', 'card'],
    ['primary-foreground', 'primary'], ['destructive', 'background'], ['destructive', 'card'],
    ['destructive-foreground', 'destructive'],
  ]) {
    const contrast = ratio(palette[`--${foreground}`], palette[`--${background}`])
    results.push({ theme: selector, pair: `${foreground}/${background}`, ratio: Number(contrast.toFixed(2)) })
    assert.ok(contrast >= 4.5, `${selector}: ${foreground}/${background}: ${contrast.toFixed(2)} < 4.5`)
  }
  for (const foreground of ['input', 'ring']) for (const background of ['background', 'card']) {
    const contrast = ratio(palette[`--${foreground}`], palette[`--${background}`])
    assert.ok(contrast >= 3, `${selector}: ${foreground}/${background}: ${contrast.toFixed(2)} < 3`)
  }
}
const footer = tokens('.site-footer')
assert.ok(ratio(footer['--input'], footer['--background']) >= 3, 'Footer input border contrast')
for (const [foreground, background] of [['foreground', 'background'], ['muted-foreground', 'background'], ['primary', 'background'], ['primary-foreground', 'primary']]) assert.ok(ratio(footer[`--${foreground}`], footer[`--${background}`]) >= 4.5)
assert.equal(tokens(':root')['--background'], '#faf9f6')
assert.equal(tokens('.dark')['--background'], '#1c1d1b')
assert.ok(!css.includes('hsl(var('), 'Use actual color tokens, not HSL wrappers around hex colors')
assert.ok(!/\.(?:home|category)-page main\s*\{/.test(css), 'No page-specific light palette overriding dark mode')
for (const file of ['src/components/category-filters.tsx', 'src/components/catalog-sort.tsx']) {
  const source = fs.readFileSync(file, 'utf8')
  assert.ok(!/color-scheme:light|#faf9f6|bg-white/.test(source), `${file} must follow the active theme`)
}
function walk(directory) { return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]) }
for (const file of walk('src/app').filter(file => file.endsWith('.tsx') && !file.includes(`${path.sep}admin${path.sep}`) && !file.includes(`${path.sep}api${path.sep}`))) assert.ok(!fs.readFileSync(file, 'utf8').includes('bg-gradient-to-b from-background via-background to-muted/20'), `Remove page-wide gradient in ${file}`)
assert.ok(fs.readFileSync('src/components/providers.tsx', 'utf8').includes('defaultTheme="system"'), 'Preserve system dark-mode preference')
assert.ok(fs.readFileSync('src/lib/jacket-design-preview.ts', 'utf8').includes("context.fillStyle = '#f4f4f5'"), 'Keep neutral jacket preview rendering')

async function main() {
  const compiled = await postcss([tailwind({ base: process.cwd(), optimize: false })]).process(css, { from: cssPath })
  assert.ok(compiled.css.includes('text-destructive-foreground'))
  assert.ok(compiled.css.includes('color-scheme: dark'))
  assert.ok(compiled.css.includes('var(--background)'))
  const warnings = compiled.warnings()
  assert.equal(warnings.length, 0, warnings.map(item => item.toString()).join('\n'))
  fs.mkdirSync('output/theme-audit', { recursive: true })
  fs.writeFileSync('output/theme-audit/contrast.json', JSON.stringify(results, null, 2))
  console.log(`Theme checks passed: ${results.length} text pairs meet 4.5:1, input/focus colors meet 3:1, footer pairs pass, gradients removed, filters follow both themes, and Tailwind CSS compiles.`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
