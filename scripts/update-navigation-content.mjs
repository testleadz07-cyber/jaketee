import 'dotenv/config'
import fs from 'node:fs'
import mongoose from 'mongoose'

// Dry-run by default. --apply writes only audited public content fields.
// --rollback --apply restores exact original values from the backup using compare-and-set.
const apply = process.argv.includes('--apply')
const rollback = process.argv.includes('--rollback')
const backupFile = 'docs/navigation-content-backup.json'
const repairs = JSON.parse(fs.readFileSync('src/data/content-link-repairs.json', 'utf8'))
const labels = { 'Design Your Own': 'Build Your Jacket', 'Other Styles': 'Bombers & More', 'Bulk Order': 'Bulk & Teams', 'Bulk Orders': 'Bulk & Teams' }
const fields = { blogposts: ['title', 'excerpt', 'content', 'seoTitle', 'seoDescription'], faqs: ['question', 'answer', 'bullets', 'ordered'], categories: ['name', 'description', 'details', 'intro', 'introShort', 'introLong'], blogcategories: ['name', 'description'], products: ['name', 'description', 'seoTitle', 'seoDescription'], sectionimages: ['alt'], settings: ['value'] }
function repairHref(href) {
  let url
  try { url = new URL(href, 'https://www.jacketee.com') } catch { return href }
  if (!['jacketee.com', 'www.jacketee.com'].includes(url.hostname)) return href
  const repair = repairs.find(r => r.source === url.pathname.replace(/\/$/, ''))
  return repair ? repair.destination + url.search + url.hash : href
}
function transform(value) {
  if (Array.isArray(value)) return value.map(transform)
  if (typeof value !== 'string') return value
  if (labels[value]) return labels[value]
  // Restrict prose changes to exact link captions and href attributes; never alter slugs.
  return value.replace(/(<a\b[^>]*>\s*)(Design Your Own|Other Styles|Bulk Order)(\s*<\/a>)/g, (_, a, label, b) => a + labels[label] + b)
    .replace(/\[(Design Your Own|Other Styles|Bulk Order)\](\([^)]*\))/g, (_, label, target) => '[' + labels[label] + ']' + target)
    .replace(/(href\s*=\s*["'])([^"']+)(["'])/gi, (_, a, href, b) => a + repairHref(href) + b)
    .replace(/(\]\()([^\s)]+)(\))/g, (_, a, href, b) => a + repairHref(href) + b)
}
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  const db = mongoose.connection.db
  let changes = []
  if (rollback) changes = JSON.parse(fs.readFileSync(backupFile, 'utf8'))
  else for (const [collection, keys] of Object.entries(fields)) {
    for (const row of await db.collection(collection).find({}).toArray()) for (const field of keys) {
      const before = row[field], after = transform(before)
      if (JSON.stringify(before) !== JSON.stringify(after)) changes.push({ collection, id: String(row._id), field, before, after })
    }
  }
  if (apply && !rollback && changes.length) {
    const existing = fs.existsSync(backupFile) ? JSON.parse(fs.readFileSync(backupFile, 'utf8')) : []
    const merged = new Map(existing.map(c => [`${c.collection}:${c.id}:${c.field}`, c]))
    for (const c of changes) {
      const key = `${c.collection}:${c.id}:${c.field}`
      if (merged.has(key) && JSON.stringify(merged.get(key)) !== JSON.stringify(c)) throw Error('Backup conflict; refusing to overwrite rollback data')
      merged.set(key, c)
    }
    fs.writeFileSync(backupFile, JSON.stringify([...merged.values()], null, 2) + '\n')
  }
  let modified = 0
  for (const c of changes) {
    console.log(`${rollback ? 'Restore' : 'Update'} ${c.collection}:${c.id} ${c.field}`)
    if (apply) {
      const before = rollback ? c.after : c.before, after = rollback ? c.before : c.after
      const result = await db.collection(c.collection).updateOne({ _id: new mongoose.Types.ObjectId(c.id), [c.field]: before }, { $set: { [c.field]: after } })
      modified += result.modifiedCount
      if (!result.matchedCount) {
        const current = await db.collection(c.collection).findOne({ _id: new mongoose.Types.ObjectId(c.id) })
        if (JSON.stringify(current?.[c.field]) !== JSON.stringify(after)) throw Error(`Content changed concurrently: ${c.collection}:${c.id}:${c.field}`)
      }
    }
  }
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', rollback, changes: changes.length, modified, backupFile: apply ? backupFile : undefined }))
} finally {
  await mongoose.disconnect()
}
