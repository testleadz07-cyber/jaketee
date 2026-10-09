import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import mongoose from 'mongoose'
import ts from 'typescript'

const require = createRequire(import.meta.url)
function loadConfig(file) {
  const compiled = { exports: {} }
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  new Function('require', 'module', 'exports', source)(id => id.startsWith('.') ? loadConfig(path.resolve(path.dirname(file), `${id}.ts`)) : require(id), compiled, compiled.exports)
  return compiled.exports
}
const config = loadConfig(path.resolve('src/config/fulfillment.ts'))
const countryMention = /United States|United Kingdom|Canada|US,?\s+UK|UK and Canada/i
const shippingContext = /\bship(?:ping|ped|s)?\b|\bdeliver(?:y|ies|ed|s)?\b|destination|dispatch|transit/i
const safeShippingClaim = /\b(?:we|jacketee)\s+(?:currently\s+)?(?:ship|deliver)|\b(?:shipping|delivery|ships?|delivers?)\s+(?:is\s+(?:available|standard)\s+)?(?:only\s+)?(?:to|within|across)\b|delivery timing for|shipping worldwide/i

function textFields(value, prefix = '') {
  if (typeof value === 'string') return [{ field: prefix, text: value }]
  if (!value || typeof value !== 'object' || value instanceof Date || value._bsontype) return []
  return Object.entries(value).flatMap(([key, item]) => textFields(item, prefix ? `${prefix}.${key}` : key))
}

// Replace only a complete text sentence with an explicit shipping claim.
// HTML tags are retained; all uncertain matches are reported for manual review.
function replaceShippingSentences(value) {
  return value.replace(/[^<>.!?\n]+(?:[.!?](?=\s|<|$)|$)/g, sentence => {
    if (!countryMention.test(sentence) || !safeShippingClaim.test(sentence)) return sentence
    const leading = sentence.match(/^\s*/)[0]
    const trailing = sentence.match(/\s*$/)[0]
    const remainder = sentence.includes(';') ? sentence.slice(sentence.indexOf(';') + 1).trim() : ''
    return `${leading}${config.fulfillmentConfig.internationalShipping}${remainder ? ` ${remainder[0].toUpperCase()}${remainder.slice(1)}` : ''}${trailing}`
  })
}

export function planDocument(collection, document) {
  const fields = textFields(document)
  const matches = fields.filter(item => countryMention.test(item.text) &&
    (item.text.split(/(?<=[.!?])\s+|<\/p>|\n/).some(sentence => countryMention.test(sentence) && shippingContext.test(sentence)) ||
      shippingContext.test(`${document.question || ''} ${document.key || ''} ${item.field}`)))
  const changes = []
  for (const item of matches) {
    const after = replaceShippingSentences(item.text)
    if (after !== item.text) changes.push({ field: item.field, before: item.text, after })
  }
  const question = document.question?.trim().toLowerCase()
  if (collection === 'faqs' && ['do you ship internationally?', 'how long does production and delivery take?'].includes(question)) {
    // These approved policy requirements replace the complete answer, including
    // obsolete timing bullets, rather than leaving contradictory fragments.
    const answer = question.startsWith('do you') ? [config.internationalShippingAnswer] : [
      `Individual orders are made and shipped within ${config.deliverySettings.handlingMin}–${config.deliverySettings.handlingMax} business days after design approval, and delivery takes ${config.deliverySettings.transitMin}–${config.deliverySettings.transitMax} business days. Customs processing in some countries can add time.`,
      'Orders of 10 or more jackets typically take 3–4 weeks in total.',
    ]
    for (const [field, after] of Object.entries({ answer, bullets: [], ordered: [] })) {
      for (let i = changes.length - 1; i >= 0; i--) if (changes[i].field === field || changes[i].field.startsWith(`${field}.`)) changes.splice(i, 1)
      const before = document[field] ?? []
      if (JSON.stringify(before) !== JSON.stringify(after)) changes.push({ field, before, after })
    }
  }
  if (!matches.length && !changes.length) return null
  return {
    collection, id: String(document._id), title: document.question || document.title || document.name || document.key || '',
    matches, changes, reviewOnly: !changes.length,
  }
}

async function main() {
  const apply = process.argv.includes('--apply')
  const planArgument = process.argv.find(arg => arg.startsWith('--plan='))
  if (apply && !planArgument) throw new Error('Apply requires the reviewed plan: --apply --plan=output/worldwide-shipping/plan.json')
  const output = path.resolve('output/worldwide-shipping')
  fs.mkdirSync(output, { recursive: true })
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
  const { EJSON } = mongoose.mongo.BSON
  try {
    const db = mongoose.connection.db
    if (!apply) {
      const results = []; const snapshots = []
      for (const collection of ['faqs', 'blogposts', 'products', 'settings']) {
        for (const document of await db.collection(collection).find({}).toArray()) {
          const entry = planDocument(collection, document)
          if (entry) { results.push(entry); snapshots.push({ collection, document }) }
        }
      }
      const plan = { generatedAt: new Date().toISOString(), applied: false, entries: results }
      fs.writeFileSync(path.join(output, 'plan.json'), JSON.stringify(plan, null, 2))
      fs.writeFileSync(path.join(output, 'before.ejson'), EJSON.stringify(snapshots, null, 2))
      const lines = ['# Worldwide shipping: database dry run', '', 'No database changes have been applied. Review the exact edits below before applying.', '',
        `Documents listed: ${results.length}. Documents with proposed edits: ${results.filter(entry => entry.changes.length).length}.`, '']
      for (const entry of results) {
        lines.push(`## ${entry.collection}: ${entry.title} (${entry.id})`, '')
        for (const match of entry.matches) lines.push(`Matched field: \`${match.field}\``, '', '```text', match.text, '```', '')
        if (entry.reviewOnly) lines.push('Review only: no safe automatic shipping sentence replacement found.', '')
        for (const change of entry.changes) lines.push(`Proposed field: \`${change.field}\``, '', '**Before**', '```text', typeof change.before === 'string' ? change.before : JSON.stringify(change.before, null, 2), '```', '**After**', '```text', typeof change.after === 'string' ? change.after : JSON.stringify(change.after, null, 2), '```', '')
      }
      fs.writeFileSync(path.join(output, 'review.md'), lines.join('\n'))
      console.log(JSON.stringify({ applied: false, documents: results.length, proposedEdits: results.filter(entry => entry.changes.length).length,
        byCollection: Object.fromEntries(['faqs', 'blogposts', 'products', 'settings'].map(name => [name, results.filter(entry => entry.collection === name).length])), report: 'output/worldwide-shipping/review.md' }, null, 2))
    } else {
      const planPath = path.resolve(planArgument.slice('--plan='.length))
      const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'))
      const snapshots = EJSON.parse(fs.readFileSync(path.join(path.dirname(planPath), 'before.ejson'), 'utf8'))
      const session = await mongoose.startSession()
      let changed = 0
      const modifiedAt = new Date()
      try {
        await session.withTransaction(async () => {
          changed = 0
          for (const entry of plan.entries.filter(item => item.changes.length)) {
            if (!['faqs', 'blogposts', 'products', 'settings'].includes(entry.collection)) throw new Error('Invalid plan collection')
            const snapshot = snapshots.find(item => item.collection === entry.collection && String(item.document._id) === entry.id)
            if (!snapshot) throw new Error('Missing original snapshot')
            const collection = db.collection(entry.collection)
            const current = await collection.findOne({ _id: snapshot.document._id }, { session })
            if (EJSON.stringify(current) !== EJSON.stringify(snapshot.document)) throw new Error(`Document changed since review: ${entry.collection}/${entry.id}; regenerate and review the plan.`)
            const updates = Object.fromEntries(entry.changes.map(change => [change.field, change.after]))
            updates.updatedAt = modifiedAt
            // Existing explicit dateModified fields track the same content edit.
            if ('dateModified' in current) updates.dateModified = modifiedAt
            const result = await collection.updateOne({ _id: current._id }, { $set: updates }, { session })
            changed += result.modifiedCount
          }
        })
      } finally { await session.endSession() }
      fs.writeFileSync(path.join(output, `applied-${Date.now()}.json`), JSON.stringify({ changed, modifiedAt, planPath }, null, 2))
      console.log(JSON.stringify({ applied: true, changed, modifiedAt }, null, 2))
    }
  } finally { await mongoose.disconnect() }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
