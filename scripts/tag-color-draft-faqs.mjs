import 'dotenv/config'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'

const batch = 'product-color-drafts-2026-10-21'
const plans = JSON.parse(await fs.readFile('output/color-drafts/draft-plan.json', 'utf8'))
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
  const faqs = mongoose.connection.db.collection('faqs')
  const matches = await faqs.find({ $or: plans.map(plan => ({
    displayPages: { $in: [plan.product.slug, `/${plan.product.slug}`] },
    question: { $in: plan.faqs.map(faq => faq.question) },
  })) }).toArray()
  assert.equal(matches.length, 120, 'Expected exactly the original 120 product FAQs; no changes made')
  assert.ok(matches.every(faq => !faq.sourceBatch || faq.sourceBatch === batch), 'Conflicting batch; no changes made')
  for (const plan of plans) for (const faq of plan.faqs) {
    assert.equal(matches.filter(row => row.question === faq.question && row.displayPages.some(page => [plan.product.slug, `/${plan.product.slug}`].includes(page))).length, 1)
  }
  if (process.argv.includes('--apply')) {
    await fs.writeFile(`output/color-drafts/faq-batch-backup-${Date.now()}.json`, JSON.stringify(matches, null, 2))
    const result = await faqs.updateMany({ _id: { $in: matches.map(faq => faq._id) } }, { $set: { sourceBatch: batch } })
    assert.equal(result.matchedCount, 120)
    assert.equal(await faqs.countDocuments({ sourceBatch: batch }), 120)
    const after = await faqs.find({ sourceBatch: batch }).toArray()
    for (const before of matches) {
      const row = after.find(faq => String(faq._id) === String(before._id))
      assert.deepEqual({ ...row, sourceBatch: undefined }, { ...before, sourceBatch: undefined })
    }
    console.log('Tagged and verified 120 FAQs. Publication status and content unchanged.')
  } else console.log('Matched the original 120 FAQs. Use --apply to tag them.')
} finally { await mongoose.disconnect() }
