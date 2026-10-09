import fs from 'node:fs'
import { loadTypeScript } from './lib/load-typescript.mjs'

// Produces review artifacts only. It never writes to the database.
const shared = { exports: loadTypeScript('src/lib/faq-page-data.ts') }
const snapshot = JSON.parse(fs.readFileSync('output/seo-fixes/content-before.json', 'utf8'))
const applied = JSON.parse(fs.readFileSync('output/seo-fixes/content-migration-applied.json', 'utf8'))
const changes = new Map(applied.changes.filter(change => change.collection === 'faqs').map(change => [change.id, change.after]))
const records = snapshot.faqs.map(faq => ({ ...faq, ...changes.get(faq._id), source: 'database', id: faq._id }))
const defaults = shared.exports.buildFaqCategories([]).flatMap(category => category.items.map(faq => ({ ...faq, category: category.title, source: 'fallback', id: null, answer: Array.isArray(faq.answer) ? faq.answer : [faq.answer], bullets: faq.bullets || [], ordered: faq.ordered || [] })))
const all = [...records, ...defaults]
const groups = [
  {
    title: 'Patches without a jacket', category: 'Patches & Embroidery',
    questions: ['Can we order custom patches only without jackets?', 'Can I buy patches without a jacket?'],
    question: 'Can I buy patches without a jacket?',
    answer: ['Yes. Letterman Patch Packs can be bought on their own as single patches or bundles. We also offer wholesale production of custom embroidered, felt, and chenille patches for school logos, team emblems, and brand designs. Contact our sales team with your requirements for a custom quote.'],
  },
  {
    title: 'Order tracking', category: 'Orders',
    questions: ['How can I track my order?', 'Can I track my order after it has been shipped?'],
    question: 'How can I track my order?',
    answer: ['Once your approved jacket ships, you receive an email with tracking information. You can also view order status and tracking in your account order history. Use the tracking details to check delivery progress and any pickup or delivery options offered by the carrier.'],
  },
  {
    title: 'Cancel or change an order', category: 'Orders',
    questions: ['Can I change or cancel my order after placing it?', 'Can Jacketee cancel my order?', 'How can I cancel my order?', 'Can I request changes after placing my order?'],
    question: 'Can I change or cancel my order after placing it?',
    answer: ['Contact Jacketee as soon as possible with your order number and requested change or cancellation. We review requests against the current production stage. Changes to materials, embroidery, or patches may affect the price.', 'Jacketee may need to cancel an order if artwork cannot be produced, production questions go unanswered, or a billing and shipping address discrepancy cannot be resolved through verification. Artwork with excessive complexity, colors, or gradients may require a different technique such as sublimation instead of embroidery.'],
    notes: ['The source promises a 24-hour cancellation/change window, no cancellation fee, refunds in a few days, and a five-digit order number. These are not established on the shipping or returns policy pages. They are preserved in the before text below but excluded from this draft pending confirmation.'],
  },
  {
    title: 'International shipping', category: 'Shipping',
    questions: ['Do you ship internationally?', 'Do you ship to all countries?'],
    question: 'Do you ship internationally?',
    answer: ['Contact Jacketee with your destination and jacket quantity to confirm shipping availability and delivery timing.'],
    notes: ['The source excludes Russia, Israel, and all of Africa. The published policy requests destination confirmation rather than stating that blanket exclusion; the draft follows the policy.'],
  },
  {
    title: 'Shipping costs', category: 'Shipping',
    questions: ['How much is shipping?', 'Are there any delivery charges?', 'Shipping Rates'],
    question: 'How much is shipping?',
    answer: ['Shipping for one jacket is $45 USD. Shipping for two or more jackets is quoted according to quantity and total package weight. Contact Jacketee for a quote.'],
    notes: ['There are three sources, including the hard-coded fallback. The source $30 rate and malformed ${1}45 text conflict with the published $45 policy and are corrected in this draft.'],
  },
  {
    title: 'Returns and exchanges', category: 'Returns & Exchanges',
    questions: ['What is your return policy?', 'How do I start a return or exchange?', 'Do you offer returns and exchanges?'],
    question: 'What is your return and exchange policy?',
    answer: ['Request a return within 10 days of delivery for an eligible, non-customized stock jacket. It must be unworn, unwashed, and in original condition with its original tags. Change-of-mind returns have a restocking fee of 15% of the jacket price, with a $35 minimum.', 'Customized jackets cannot be returned or exchanged for a change of mind. If an item is faulty or incorrect, contact Jacketee with photos and your order number so we can review an appropriate remedy.', 'Submit your order number through the [Returns & Exchanges page](/returns). Wait for confirmation of eligibility, charges, and return instructions before shipping the item.'],
  },
  {
    title: 'Rush orders', category: 'Production & Delivery',
    questions: ['Do you offer rush order services?', 'How do I place a RUSH order?'],
    question: 'Can I request a rush order?',
    answer: ['Rush production may be available depending on your order size and the current workload. Contact the sales team with your required delivery date before ordering so they can confirm whether it can be met.'],
    notes: ['The source fixed 7–10 production days plus 4–5 shipping days and a RUSH PRODUCTION checkout option are not verified by the policy or current purchase controls. This draft avoids those promises.'],
  },
  {
    title: 'Minimum quantities', category: 'Bulk & Team Orders',
    questions: ['Do you have a minimum order?', 'Is there a minimum order for team or staff jackets?', 'What is the minimum order for private label jackets?'],
    question: 'Is there a minimum order quantity?',
    answer: ['You can order one jacket. Bulk pricing applies to orders of 10 or more jackets. For team, staff, or private label orders, contact Jacketee with your design, quantity, sizes, and branding requirements for a quote.', 'Private label production requirements depend on the material, label requirements, customization level, and production plan. Provide quantities by size and color, material choices, label and packaging requirements, and patch or embroidery details so the team can confirm the production route.'],
  },
  {
    title: 'Private labels, neck labels, and hang tags', category: 'Bulk & Team Orders',
    questions: ['Do you offer private labeling or neck labels?', 'Can I add custom neck labels or hang tags?'],
    question: 'Can I add private labels, neck labels, or hang tags?',
    answer: ['Yes. Private label orders can include custom neck labels, size labels, care labels, hang tags, packaging inserts, and other brand details for resale or branded distribution. Prepare clear logo files, confirm the label size and placement, and approve the label artwork before production. Contact Jacketee for a quote.'],
    notes: ['The source one-time $50 setup fee covering up to 100 jackets is preserved in the before text. It is not stated on the policy pages and is excluded from this draft pending confirmation.'],
  },
  {
    title: 'Ordering a single jacket', category: 'Orders',
    questions: ['Can I order just one garment from Jacketee?', 'Can I order just one jacket for myself?'],
    question: 'Can I order just one jacket?',
    answer: ['Yes. You can order a single jacket for yourself or multiple jackets for a team. There is no minimum quantity for a standard jacket order. Use the online jacket builder or browse our in-stock wool and leather or satin jackets.'],
  },
  {
    title: 'Production and delivery time', category: 'Production & Delivery',
    questions: ['How long does shipping take?', 'How long does it take to get my jacket in the U.S.?', 'How long does my custom jacket order take to deliver?', 'How fast can I get my bulk order?'],
    question: 'How long does production and delivery take?',
    answer: ['Bulk orders of 10 or more jackets typically take about 3 to 4 weeks in total, including production and delivery. We confirm the schedule before production begins. Contact Jacketee for a current estimate for individual jackets or to discuss an urgent deadline. Rush availability depends on the order size and current workload.'],
    notes: ['The source separates 5–7 blank production days, 7–10 customized production days, and 4–5 shipping days. Those fixed individual timelines are not on the published policy. The draft uses its 3–4 weeks total for 10+ jackets instead.'],
  },
  {
    title: 'Genuine or faux leather', category: 'Leather Jackets',
    questions: ['Can I choose genuine leather or faux leather sleeves?', 'Is the leather genuine or faux?'],
    question: 'Can I choose genuine or faux leather?',
    answer: ['Most leather styles offer genuine and faux leather options, including varsity jacket sleeves. Check the material selections on the individual product page. Genuine leather offers a premium, long-lasting finish; faux leather offers a more affordable, animal-friendly alternative with a similar look. Choose the option that suits your style and budget.'],
  },
  {
    title: 'Where to get embroidery done', category: 'Design & Customization',
    questions: ['Where can I get my jacket embroidered?', 'Do I need to find an embroidery shop near me?'],
    question: 'Where can I get my jacket embroidered?',
    answer: ['You can arrange embroidery online with Jacketee. Send your logo, name, or artwork, choose a jacket, and approve the design. Our in-house team handles embroidery and shipping, so you do not need to find a local embroidery shop. Confirm shipping availability for your destination before ordering.'],
    notes: ['The source says embroidery can reach you wherever you are located. The draft makes destination confirmation explicit to match the shipping policy.'],
  },
]

const proposals = groups.map(group => {
  const before = group.questions.map(question => {
    const faq = all.find(faq => faq.question === question)
    if (!faq) throw new Error(`Missing source: ${question}`)
    return { id: faq.id, source: faq.source, question: faq.question, category: faq.category, answer: faq.answer, bullets: faq.bullets || [], ordered: faq.ordered || [], displayPages: faq.displayPages || [] }
  })
  return { title: group.title, before, after: { question: group.question, category: group.category, answer: group.answer, bullets: [], ordered: [], status: 'published', displayPages: [...new Set(before.flatMap(faq => faq.displayPages))] }, notes: group.notes || [] }
})
fs.writeFileSync('output/seo-fixes/faq-merge-proposals.json', JSON.stringify(proposals, null, 2))
const lines = ['# FAQ merge proposals for approval', '', 'Prepared October 8, 2026. No merges or unpublishing have been saved.', '', 'Policy facts follow /shipping and /returns. Conflicting or unverified source claims remain visible in the before text and are called out below. Approving these proposals also approves replacing those claims with policy-consistent wording.', '', 'After approval, retain one database record per group, combine its display-page targets, and mark the remaining database records as drafts. For duplicate fallback questions, add draft records to suppress the corresponding fallback. No records will be deleted.', '']
for (const [index, proposal] of proposals.entries()) {
  lines.push(`## ${index + 1}. ${proposal.title}`, '', '### Before', '')
  for (const faq of proposal.before) {
    lines.push(`**${faq.question}** (${faq.source}${faq.id ? `, ${faq.id}` : ''})`, '', ...faq.answer.map(answer => answer + '\n'))
    if (faq.bullets.length) lines.push(...faq.bullets.map(text => `- ${text}`), '')
    if (faq.ordered.length) lines.push(...faq.ordered.map((text, i) => `${i + 1}. ${text}`), '')
  }
  lines.push('### Proposed after', '', `**${proposal.after.question}**`, '', `Section: ${proposal.after.category}`, '', ...proposal.after.answer.map(answer => answer + '\n'))
  if (proposal.notes.length) lines.push('### Decisions included in approval', '', ...proposal.notes.map(note => `- ${note}`), '')
}
fs.writeFileSync('docs/faq-merge-proposals-2026-10-08.md', lines.join('\n'))
console.log(`Prepared ${proposals.length} merge groups for review; database unchanged.`)
