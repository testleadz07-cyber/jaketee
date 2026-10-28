import { getCustomLandingConfig } from '@/data/custom-jacket-landings'

export type BulkProgramKey = 'all' | 'schools' | 'corporate' | 'private-label' | 'senior-class' | 'sorority-fraternity' | 'cheer'
export interface BulkProgram {
  path: string
  label: string
  title: string
  intro: string
  imageKey: 'varsity' | 'bomber' | 'puffer'
  details: Array<{ title: string; text: string }>
  faqs: Array<{ question: string; answer: string }>
  guides: Array<{ title: string; slug: string }>
}

const commonFaqs = [
  { question: 'What is the minimum quantity for a bulk quote?', answer: 'This bulk quote form is for 10 or more jackets. An estimated quantity is enough to start. For a smaller order, browse the jacket collections or contact us to discuss your design.' },
  { question: 'How long does a bulk order take?', answer: 'Orders of 10 or more jackets typically take about 3–4 weeks including production and delivery. This is a planning estimate, not a guaranteed arrival date. Samples, artwork revisions, material availability and customs may extend the schedule. Confirm your required date before ordering.' },
  { question: 'Can each jacket have a different name or number?', answer: 'Include names, numbers and sizes in your brief. Personalization and placement affect the quote. Check the final roster, spelling and artwork carefully before approving production.' },
  { question: 'Do I need finished artwork or a complete size list?', answer: 'No. Start with your best quantity estimate and a rough idea. Upload a logo if available. The team will confirm artwork, decoration placements, sizes and the production brief with you.' },
  { question: 'Can I request a sample?', answer: 'Tell us if you need a sample. Availability, cost and timing are confirmed for your project. Allow extra time for review and changes before committing to a delivery date.' },
]
const guides = [
  { title: 'Prepare your custom jacket brief', slug: 'how-to-write-design-brief-custom-jacket-order' },
  { title: 'What affects a custom jacket quote?', slug: 'what-does-a-custom-jacket-cost-pricing-guide-for-schools-teams-brands' },
  { title: 'Design your custom jacket online', slug: 'design-your-own-custom-jacket-online' },
]

export const bulkPrograms: Record<BulkProgramKey, BulkProgram> = {
  all: {
    path: '/bulk-orders', label: 'Bulk & Teams', title: 'Custom jackets for your whole group.', imageKey: 'varsity',
    intro: 'Plan bulk varsity jackets and custom jacket orders for schools, teams, companies and brands. Bring your colors, artwork and quantity; we’ll help organize sizing, proofing and production around one agreed brief.',
    details: [
      { title: 'Materials & decoration', text: 'Choose a starting jacket, body and sleeve materials, lining and trims. Plan embroidery, chenille patches, names, numbers and artwork placements before final pricing.' },
      { title: 'What affects your quote?', text: 'Quantity, jacket style, material, patch count, embroidery detail and individual personalization affect the price. Labels, packaging, samples and delivery requirements can also change the total. Wholesale and group pricing is confirmed for your specification; no fixed discount is assumed.' },
      { title: 'Sizes & rosters', text: 'Collect names, numbers, sizes and roles in one document. Use measured sizes and allow for layers. You do not need a complete roster to make your first inquiry.' },
      { title: 'Samples, shipping & reorders', text: 'Discuss samples, the destination and any required arrival date early. Confirm shipping charges, customs responsibilities and the project schedule in your quote. Keep approved specifications for future reorder discussions.' },
    ], faqs: commonFaqs, guides,
  },
  schools: {
    path: '/bulk-orders/schools', label: 'Schools & Teams', title: 'School letterman jackets. Shared pride.', imageKey: 'varsity',
    intro: 'Plan bulk varsity jackets and wholesale letterman jacket orders for school classes, athletes, clubs and alumni. Choose a starting style, coordinate school colors and award details, and organize names and measured sizes in one roster. Request a quote for 10 or more jackets; the final price, specification and schedule are confirmed for your group.',
    details: [
      { title: 'School letters, colors & award placement', text: 'Plan the body, sleeves, ribbing and approved school artwork together. Identify the main letter or mascot, then record graduation years, activities and award details separately. Have the school confirm what each award represents and who may use it. Review chest, sleeve and back placement against the actual jacket and any hood before approving the proof.' },
      { title: 'One roster, individual details', text: 'Use one row per wearer with a name, measured size, number or role and requested individual patches. Check spelling and graduation years with each person. Use the same measuring method for everyone and account for intended layers. Keep the approved roster version with the design proof, and identify one coordinator for final changes.' },
      { title: 'Prepare a wholesale or bulk quote', text: 'Share your preferred product, an estimated quantity of 10 or more, school colors, approved artwork and placements, size requirements, delivery country and required date. Include sample or packaging requests and any individual names or patches. A completed size roster is useful but is not required for the first inquiry. Pricing follows the actual materials and decoration; no fixed wholesale discount is assumed.' },
      { title: 'Plan around the school calendar', text: 'Share your presentation, graduation or season date early. Allow time for committee approval, artwork revisions and any requested sample before production.' },
      { title: 'Quote & delivery planning', text: 'Price depends on jacket construction, quantity and personalization. Confirm the final roster, shipping destination and required arrival date with the team; delivery timing is project specific.' },
    ], faqs: [
      { question: 'How should we organize a school or team roster?', answer: 'Use one coordinator and one verified list of names, numbers, measured sizes and achievements. Have each wearer check their details and allow time for school artwork approvals before production.' },
      { question: 'Can we request wholesale letterman jacket pricing?', answer: 'Yes. For 10 or more jackets, share the product, quantity, colors, decoration and delivery brief through the bulk quote form. The final price reflects the specification and personalization; there is no automatic fixed discount.' },
      { question: 'Can each student have different award patches?', answer: 'Include the individual patch requirements beside each student’s name and size. The school should confirm the awards and artwork permissions, and the team confirms suitable methods, placements and pricing before approval.' },
      { question: 'What should we check on a school jacket proof?', answer: 'Check school colors, letter and mascot artwork, patch dimensions and positions, names, numbers, graduation years and the matching size roster. Consolidate feedback through one coordinator before approving production.' },
      ...commonFaqs,
    ], guides: [{ title: 'Varsity jackets for academic achievement', slug: 'varsity-jackets-for-academic-achievement-not-just-sports' }, { title: 'Varsity jackets at colleges and universities', slug: 'do-colleges-and-universities-still-use-varsity-jackets' }, guides[0]],
  },
  corporate: {
    path: '/bulk-orders/corporate', label: 'Corporate', title: 'Custom Corporate Jackets with Your Company Logo', imageKey: 'bomber',
    intro: 'Create a coordinated jacket order for staff uniforms, company events, onboarding or employee gifts. Compare bomber, coach and varsity styles, then plan your logo, colors, sizes and any individual names or departments. Share your quantity, preferred jacket and delivery destination to start the brief. Bulk inquiries are for 10 or more jackets; the final specification, price and schedule are confirmed for your order.',
    details: [
      { title: 'Plan a company logo that reads clearly', text: 'Share vector artwork or the highest-resolution file available, along with your brand colors and preferred placement. Include the intended logo size and note any small text or detailed elements. Embroidery, patches and print have different requirements. The selected jacket’s fabric, seams and lining can affect the suitable method and placement. Confirm those details before approving the proof.' },
      { title: 'Organize sizes and individual names', text: 'Collect each wearer’s size using the same measurement method. Keep names, departments or roles beside the corresponding size so the order can be checked consistently. Agree on one final approver for the shared design. Consolidated feedback makes spelling, placement and color decisions easier to review.' },
      { title: 'Prepare your bulk-order brief', text: 'Include your preferred style, an estimated quantity of 10 or more, company logo and brand colors, requested artwork placements, size list, individual names, delivery country and required date. You can request a quote before every detail is finalized; the team will discuss missing information before confirming the order.' },
      { title: 'Ordering for the US, UK, Canada or Europe', text: 'Provide the destination country, postcode and required date when requesting your quote. Delivery arrangements, charges and timing are confirmed for the actual destination and order. Ask the team to clarify destination-specific questions before approving production.' },
      { title: 'Events, gifting & packaging', text: 'Include your conference or gifting date and any packaging needs in the brief. Samples, revisions and packaging requirements can affect pricing and timing.' },
      { title: 'Consistent future orders', text: 'Keep approved artwork, colors and specifications together for reorder discussions. Confirm current materials, quantities, shipping and prices for each new order.' },
    ], faqs: [
      { question: 'What logo files should we provide for company jackets?', answer: 'Share vector artwork or the highest-resolution version available, your brand colors and intended placements. Decoration method, logo size and detail will be reviewed before you approve the proof.' },
      { question: 'Which jacket is best for a company logo?', answer: 'The answer depends on the artwork, work setting and selected construction. Compare the usable panels, fabric, fit and decoration options of the actual products.' },
      { question: 'Can we order for a fixed event date?', answer: 'Share the date at the inquiry stage. The team must confirm whether the production and delivery schedule can meet it before you commit.' },
      { question: 'Can we reorder later?', answer: 'Keep the approved artwork and specifications for future discussions. Materials, availability, quantities, prices and timing should be confirmed again for each reorder.' },
      ...commonFaqs,
    ], guides: [{ title: 'Coach or bomber jackets for company uniforms', slug: 'coach-jacket-vs-bomber-jacket-corporate-uniforms' }, { title: 'Varsity jackets for business events', slug: 'are-varsity-jackets-professional-enough-for-business-events' }, guides[1]],
  },
  'private-label': {
    path: '/bulk-orders/private-label', label: 'Private Label', title: 'Private label jackets. Built around your brand.', imageKey: 'puffer',
    intro: 'Discuss private label custom jackets for your clothing brand or resale collection. Plan materials, decoration, labels, trims, samples and packaging before confirming your jacket manufacturing brief.',
    details: [
      { title: 'Define your collection', text: 'Share your intended customer, fit, jacket style and material direction. Agree colors, lining, closures and trims alongside decoration placements.' },
      { title: 'Labels & packaging', text: 'Include brand labels, label placement and packaging direction in the quote request. Availability and costs are confirmed for your specification.' },
      { title: 'Samples & approvals', text: 'Request a sample if needed and allow time for review and changes. Confirm sample cost and availability, then lock artwork and specifications before production.' },
      { title: 'From launch to restock', text: 'Keep a record of the approved design, sizes and construction details. Discuss launch dates and repeat-order requirements; current availability, quantities, pricing and timing must be confirmed for each order.' },
    ], faqs: [{ question: 'Can the quote include brand labels and packaging?', answer: 'Yes, include your label artwork, placement and packaging direction in the brief. Availability, sample requirements, costs and timing must be confirmed for your project before approval.' }, ...commonFaqs], guides: [{ title: 'Build your own private label jacket line', slug: 'private-label-varsity-jackets-how-brands-can-build-their-own-jacket-line' }, { title: 'Private label vs custom jacket orders', slug: 'private-label-vs-custom-jacket-orders-what-is-the-difference' }, { title: 'Brand launch checklist', slug: 'varsity-jacket-brand-launch-checklist-labels-samples-packaging-and-reorders' }],
  },
  ...Object.fromEntries([
    ['senior-class', 'senior-class-jackets', 'Senior Class'],
    ['sorority-fraternity', 'sorority-fraternity-jackets', 'Sorority & Fraternity'],
    ['cheer', 'cheer-jackets', 'Cheer Teams'],
  ].map(([key, landingKey, label]) => {
    const config = getCustomLandingConfig(landingKey)
    return [key, { path: config.path, label, title: config.keyword, intro: config.intro, imageKey: 'varsity', details: [...config.options, ...config.guide.map((text, index) => ({ title: [config.guideTitle, 'Agree the shared specification', 'Check artwork & personalization', 'Confirm pricing & delivery'][index] || config.guideTitle, text }))], faqs: [...config.faqs, ...commonFaqs.filter(faq => !/minimum/i.test(faq.question))], guides: config.guides }]
  })) as Record<'senior-class' | 'sorority-fraternity' | 'cheer', BulkProgram>,
}
