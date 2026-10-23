import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'

// Read-only audit. Never reads customer, order, authentication, or payment collections.
const output = 'docs/navigation-audit.json'
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
const files = walk('src').filter(f => /\.(tsx?|json)$/.test(f))
const staticPaths = new Set(walk('src/app').filter(f => /[/\\]page\.tsx$/.test(f)).map(f => '/' + path.relative('src/app', path.dirname(f)).split(path.sep).filter(s => !s.startsWith('(')).join('/')).filter(p => !p.includes('[')))
const references = []
const labelMatches = []
const labels = { 'Design Your Own': 'Build Your Jacket', 'Other Styles': 'Bombers & More', 'Bulk Order': 'Bulk & Teams' }
const strings = (value, field = '') => typeof value === 'string' ? [[field, value]] : Array.isArray(value) ? value.flatMap((v, i) => strings(v, `${field}.${i}`)) : value && typeof value === 'object' && value.constructor === Object ? Object.entries(value).flatMap(([k, v]) => strings(v, field ? `${field}.${k}` : k)) : []
function inspect(source, field, value, code = false) {
  if (labels[value.trim()]) labelMatches.push({ source, field, before: value, after: labels[value.trim()] })
  for (const match of value.matchAll(/(?:href\s*(?:=|:)\s*\{?\s*["']|\]\()([^"'\s<>)}]+)|<a\b[^>]*>([^<]*)<\/a>/gi)) {
    if (match[1]) references.push({ source, field, href: match[1].replaceAll('&amp;', '&') })
  }
  // Exact navigation anchor text only: do not rename article/product titles or prose.
  if (!code) for (const match of value.matchAll(/<a\b[^>]*>(\s*)(Design Your Own|Other Styles|Bulk Order)(\s*)<\/a>/g)) labelMatches.push({ source, field, before: match[2], after: labels[match[2]], anchor: true })
}
for (const file of files) inspect(file.replaceAll('\\', '/'), 'source', fs.readFileSync(file, 'utf8'), true)

const report = { generatedAt: new Date().toISOString(), mode: 'read-only route and content audit', collections: {}, labelMatches, broken: [], redirects: [], unverified: [], references: 0 }
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  const db = mongoose.connection.db
  const docs = {}
  report.collectionInventory = (await db.listCollections({}, { nameOnly: true }).toArray()).map(c => c.name)
  report.navigationCollectionScan = []
  // Inspect navigation-shaped fields in every collection without exporting private records.
  const navigationProjection = Object.fromEntries(['label', 'title', 'menu', 'menus', 'navigation', 'header', 'headerLinks', 'links', 'items', 'settings'].map(k => [k, 1]))
  for (const name of report.collectionInventory) {
    let inspected = 0, obsoleteCaptions = 0
    for await (const row of db.collection(name).find({}, { projection: navigationProjection })) {
      inspected++
      for (const [, value] of strings(row)) if (labels[value.trim()]) obsoleteCaptions++
    }
    report.navigationCollectionScan.push({ collection: name, documents: inspected, obsoleteCaptions })
  }
  for (const collection of ['blogposts', 'faqs', 'categories', 'blogcategories', 'products', 'settings', 'storesettings', 'sectionimages']) {
    docs[collection] = await db.collection(collection).find({}).toArray()
    report.collections[collection] = docs[collection].length
    for (const row of docs[collection]) for (const [field, value] of strings(row)) inspect(`${collection}:${row._id}`, field, value)
  }
  const categories = new Map(docs.categories.map(c => [String(c._id), c]))
  report.invalidContentReferences = []
  const productIds = new Set(docs.products.map(p => String(p._id)))
  const blogCategoryIds = new Set(docs.blogcategories.map(c => String(c._id)))
  for (const post of docs.blogposts) {
    for (const id of post.taggedProducts || []) if (!productIds.has(String(id))) report.invalidContentReferences.push({ source: `blogposts:${post._id}`, field: 'taggedProducts', id: String(id) })
    for (const id of post.categories || []) if (!blogCategoryIds.has(String(id))) report.invalidContentReferences.push({ source: `blogposts:${post._id}`, field: 'categories', id: String(id) })
  }
  for (const product of docs.products) if (product.categoryId && !categories.has(String(product.categoryId))) report.invalidContentReferences.push({ source: `products:${product._id}`, field: 'categoryId', id: String(product.categoryId) })
  const categoryPath = id => {
    const slugs = [], seen = new Set()
    for (let c = categories.get(String(id)); c && !seen.has(String(c._id)); c = categories.get(String(c.parentId))) {
      seen.add(String(c._id)); slugs.unshift(c.slug === 'wool' ? 'all-wool' : c.slug)
    }
    return '/' + slugs.join('/')
  }
  for (const c of docs.categories) staticPaths.add(categoryPath(c._id))
  for (const p of docs.products.filter(p => !p.isDraft && p.status === 'active')) staticPaths.add(`${categoryPath(p.categoryId).replace(/\/$/, '') || '/products'}/${p.slug}`)
  for (const p of docs.blogposts.filter(p => p.status === 'published')) staticPaths.add(`/blog/${p.slug}`)
  for (const c of docs.blogcategories) staticPaths.add(`/blog/category/${c.slug}`)
  const redirects = new Map(['src/data/url-redirects.json', 'src/data/content-link-repairs.json'].flatMap(file => JSON.parse(fs.readFileSync(file, 'utf8'))).map(r => [r.source, r.destination]))
  for (const ref of references) {
    if (!/^(\/|https?:\/\/(?:www\.)?jacketee\.com(?:\/|$))/.test(ref.href) || ref.href.startsWith('//')) continue
    if (/\$\{|\{|\[|&quot;/.test(ref.href)) { report.unverified.push(ref); continue }
    const url = new URL(ref.href, 'https://www.jacketee.com')
    const target = decodeURIComponent(url.pathname).replace(/\/$/, '') || '/'
    if (target.startsWith('/api/') || /\.[a-z0-9]{2,5}$/i.test(target)) continue
    report.references++
    if (staticPaths.has(target)) continue
    if (redirects.has(target)) {
      const destination = redirects.get(target)
      if (!staticPaths.has(destination)) report.broken.push({ ...ref, target, destination })
      else report.redirects.push({ ...ref, destination })
      continue
    }
    // Dynamic application routes require rendering; never mark catch-all as universally valid.
    const dynamic = ['/customize/', '/product/', '/profile/orders/', '/admin/']
    if (dynamic.some(prefix => target.startsWith(prefix))) report.unverified.push(ref)
    else report.broken.push({ ...ref, target })
  }
  report.validRoutes = staticPaths.size
  report.broken = [...new Map(report.broken.map(r => [JSON.stringify(r), r])).values()]
} catch (error) {
  report.error = error.name + ': database audit could not complete'
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n')
}
console.log(JSON.stringify({ output, collections: report.collections, references: report.references, labelMatches: labelMatches.length, broken: report.broken.length, unverified: report.unverified.length, error: report.error }, null, 2))
