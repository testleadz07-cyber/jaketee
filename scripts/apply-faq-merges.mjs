import 'dotenv/config'
import fs from 'node:fs'
import mongoose from 'mongoose'
import ts from 'typescript'
import { createRequire } from 'node:module'

const apply = process.argv.includes('--apply')
const proposals = JSON.parse(fs.readFileSync('output/seo-fixes/faq-merge-proposals.json', 'utf8'))
const output = 'output/seo-fixes'
const normalize = text => text.trim().toLowerCase().replace(/\s+/g, ' ')
const fields = ['question', 'category', 'answer', 'bullets', 'ordered', 'displayPages']
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const shared = { exports: {} }
new Function('module', 'exports', 'require', ts.transpileModule(fs.readFileSync('src/lib/faq-page-data.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(shared, shared.exports, createRequire(import.meta.url))

function verify(records) {
  const published = records.filter(faq => faq.status !== 'draft')
  const seen = new Set()
  for (const faq of published) {
    const key = normalize(faq.question)
    if (seen.has(key)) throw new Error(`Duplicate published question: ${faq.question}`)
    seen.add(key)
  }
  const visible = shared.exports.buildFaqCategories(records.map(faq => ({ ...faq, id: String(faq._id) }))).flatMap(section => section.items)
  for (const proposal of proposals) {
    const merged = published.filter(faq => normalize(faq.question) === normalize(proposal.after.question))
    if (merged.length !== 1 || !same(merged[0].answer, proposal.after.answer)) throw new Error(`Merged answer mismatch: ${proposal.title}`)
    for (const source of proposal.before) {
      if (normalize(source.question) !== normalize(proposal.after.question) && visible.some(faq => normalize(faq.question) === normalize(source.question))) throw new Error(`Old question still visible: ${source.question}`)
    }
    if (visible.filter(faq => normalize(faq.question) === normalize(proposal.after.question)).length !== 1) throw new Error(`Merged question not visible exactly once: ${proposal.title}`)
  }
  return { publishedDatabaseFaqs: published.length, visiblePageFaqs: visible.length, mergedTopics: proposals.length, uniquePublishedQuestions: seen.size }
}

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
const session = await mongoose.startSession()
try {
  const collection = mongoose.connection.db.collection('faqs')
  const before = await collection.find({}).toArray()
  const byId = new Map(before.map(faq => [String(faq._id), faq]))
  const operations = []
  const involved = new Set()
  for (const proposal of proposals) {
    const sources = proposal.before.filter(source => source.id).map(source => {
      const record = byId.get(source.id)
      if (!record) throw new Error(`Missing source record: ${source.id}`)
      return { source, record }
    })
    const survivor = sources.find(({ record }) => normalize(record.question) === normalize(proposal.after.question)) || sources[0]
    if (!survivor) throw new Error(`No database source: ${proposal.title}`)
    const survivorId = String(survivor.record._id)
    const alreadyMerged = survivor.record.status === 'published' && same(survivor.record.answer, proposal.after.answer) && normalize(survivor.record.question) === normalize(proposal.after.question)
    if (!alreadyMerged) {
      for (const { source, record } of sources) {
        for (const field of fields) {
          if (!same(record[field] || (['question', 'category'].includes(field) ? '' : []), source[field] || (['question', 'category'].includes(field) ? '' : []))) throw new Error(`Source changed since approval: ${source.question} (${field})`)
        }
      }
    }
    for (const { record } of sources) {
      const id = String(record._id)
      if (involved.has(id)) throw new Error(`Overlapping merge source: ${id}`)
      involved.add(id)
      const after = id === survivorId
        ? { ...proposal.after, mergedQuestions: [...new Set([...proposal.before.map(source => source.question), ...(record.mergedQuestions || [])])].filter(question => normalize(question) !== normalize(proposal.after.question)), displayPages: [...new Set([...proposal.after.displayPages, ...sources.flatMap(source => source.record.displayPages || [])])] }
        : { status: 'draft', mergedInto: survivor.record._id }
      if (Object.entries(after).every(([key, value]) => same(record[key], value))) continue
      operations.push({ title: proposal.title, id, before: record, after })
    }
  }
  const projected = before.map(record => {
    const operation = operations.find(operation => operation.id === String(record._id))
    return operation ? { ...record, ...operation.after } : record
  })
  const expected = verify(projected)
  const plan = { apply, operations, expected }
  fs.writeFileSync(`${output}/faq-merge-${apply ? 'apply-plan' : 'dry-run'}.json`, JSON.stringify(plan, null, 2))
  console.log(JSON.stringify({ apply, changedRecords: operations.length, ...expected }))
  for (const operation of operations) console.log(`${operation.title}: ${operation.before.question} -> ${operation.after.question || operation.before.question} (${operation.after.status})`)
  if (apply && operations.length) {
    fs.writeFileSync(`${output}/faq-merge-backup-${Date.now()}.json`, JSON.stringify(before, null, 2))
    await session.withTransaction(async () => {
      for (const operation of operations) {
        const filter = { _id: operation.before._id, question: operation.before.question, answer: operation.before.answer, category: operation.before.category }
        if (operation.before.updatedAt) filter.updatedAt = operation.before.updatedAt
        const result = await collection.updateOne(filter, { $set: { ...operation.after, updatedAt: new Date() } }, { session })
        if (result.matchedCount !== 1) throw new Error(`Concurrent edit: ${operation.id}`)
      }
      verify(await collection.find({}, { session }).toArray())
    })
  }
  if (apply) {
    const records = await collection.find({}).toArray()
    const result = verify(records)
    fs.writeFileSync(`${output}/faq-merge-result.json`, JSON.stringify({ ...result, appliedAt: new Date().toISOString(), changedRecords: operations.length }, null, 2))
    fs.writeFileSync(`${output}/faqs-after-merge.json`, JSON.stringify(records, null, 2))
    console.log('Verified saved FAQ data:', JSON.stringify(result))
  }
} finally {
  await session.endSession()
  await mongoose.disconnect()
}
