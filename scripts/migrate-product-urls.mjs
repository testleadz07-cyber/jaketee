import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'

const ROOT = process.cwd()
const APPLY = process.argv.includes('--apply')
const REDIRECTS_PATH = path.join(ROOT, 'src', 'data', 'url-redirects.json')
const CSV_PATH = path.join(ROOT, 'docs', 'product-url-redirects.csv')
const REPORT_PATH = path.join(ROOT, 'docs', 'product-url-migration-report.md')
const IMPORT_PATH = path.join(ROOT, 'scripts', 'data', 'products-import.json')

const redundantCategories = [
  ['bomber-jacket', 'bomber-jackets'],
  ['coach-jacket', 'coach-jackets'],
  ['denim-jacket', 'denim-jackets'],
  ['puffer-jacket', 'puffer-jackets'],
  ['hoodies', 'fleece-hoodies'],
]

const changes = [
  ['black-wool-and-black-leather-sleeves-letterman-jacket', null, 'wool-leather'],
  ['black-wool-and-white-leather-sleeves-letterman-jacket', null, 'wool-leather'],
  ['royal-blue-wool-and-white-leather-sleeves-letterman-jacket', null, 'wool-leather'],
  ['royal-blue-wool-and-gold-leather-sleeves-letterman-jacket', null, 'wool-leather'],
  ['dark-green-wool-and-gold-leather-sleeves-letterman-jacket', null, 'wool-leather'],
  ['red-wool-varsity-jacket-with-hood-black-leather-sleeves', null, 'hooded'],
  ['maroon-letterman-jacket-hood', null, 'hooded'],
  ['baby-pink-letterman-jacket-with-hood', null, 'hooded'],
  ['cotton-fleece-varsity-jackets-schools-seniors-affordable', null, 'fleece'],
  ['clothing-cotton-varsity-jackets-lightweight-us-football-game', 'lightweight-cotton-varsity-jacket', 'cotton-twill', 'Lightweight Cotton Varsity Jacket'],
  ['denim-varsity-jacket-cotton-twill-sleeves', null, 'cotton-twill'],
  ['classic-melton-wool-varsity-letterman-jackets-high-schools', null, 'wool', 'Classic Maroon All-Wool Varsity Jacket'],
  ['clemson-varsity-jacket-orange-white', 'orange-white-wool-varsity-jacket', 'wool', 'Orange & White Wool Varsity Jacket'],
  ['all-leather-nappa-varsity-jacket-gold-black', null, 'all-leather'],
  ['classic-wool-leather-varsity-jacket', 'satin-varsity-jacket-with-piping', 'satin'],
  ['black-athletic-gold-varsity-jacket-with-hood', 'red-wool-white-leather-sleeves-varsity-jacket-with-hood', 'hooded'],
  ['cardinal-wool-varsity-jacket-varsity-jacket', 'cardinal-wool-varsity-jacket', 'wool'],
  ['luxurious-all-black-nappa-leather-letterman-jacket-leather-jackets', 'all-black-nappa-leather-letterman-jacket', 'all-leather'],
  ['premium-qaulity-sheep-leather-bomber-jacket-in-red', 'red-sheep-leather-bomber-jacket', 'bomber-jackets', 'Red Sheep Leather Bomber Jacket'],
  ['premium-quality-suede-bomber-jacket', 'camel-brown-suede-leather-bomber-jacket', 'bomber-jackets'],
  ['custom-bomber-jackets', 'royal-blue-nylon-bomber-jacket', 'bomber-jackets'],
  ['corporate-event-team-bomber-jackets', 'black-nylon-bomber-jacket', 'bomber-jackets'],
  ['college-bomber-class', 'royal-blue-softshell-bomber-jacket', 'bomber-jackets'],
  ['bomber-jacket-goat-suede-blue', 'softshell-bomber-jacket-with-panels', 'bomber-jackets'],
  ['sheep-leather-bomber-jacket', 'sky-blue-satin-bomber-jacket-womens', 'bomber-jackets'],
  ['lightweight-bomber-jacket-womens-spring-outfit-on-steps', 'red-satin-bomber-jacket', 'bomber-jackets'],
  ['custom-coach-jackets', 'black-coach-jacket', 'coach-jackets', 'Black Coach Jacket'],
  ['coach-jacket-vs-puffer-jacket-city-rain-evening', 'black-orange-hooded-jacket', 'coach-jackets', 'Black & Orange Hooded Jacket'],
]

function categoryChain(category, byId) {
  const chain = []
  const visited = new Set()
  let current = category
  while (current && !visited.has(String(current._id))) {
    chain.unshift(current.slug === 'wool' ? 'all-wool' : current.slug)
    visited.add(String(current._id))
    current = current.parentId ? byId.get(String(current.parentId)) : null
  }
  return chain
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')
  await mongoose.connect(process.env.MONGODB_URI)
  const db = mongoose.connection.db
  const [categories, products] = await Promise.all([
    db.collection('categories').find({}).toArray(),
    db.collection('products').find({}).toArray(),
  ])
  const categoryById = new Map(categories.map((category) => [String(category._id), category]))
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]))
  const changeBySlug = new Map(changes.flatMap((change) => [[change[0], change], [change[1], change]].filter(([slug]) => slug)))
  const redundantBySlug = new Map(redundantCategories)

  for (const [, parentSlug] of redundantCategories) {
    if (!categoryBySlug.has(parentSlug)) throw new Error(`Missing destination category: ${parentSlug}`)
  }
  for (const change of changes) {
    if (!categoryBySlug.has(change[2])) throw new Error(`Missing destination category: ${change[2]}`)
  }

  const planned = []
  const destinations = new Set()
  for (const product of products) {
    const currentCategory = categoryById.get(String(product.categoryId))
    if (!currentCategory) throw new Error(`Product ${product.slug} has no resolvable category`)
    const change = changeBySlug.get(product.slug)
    const flattenedParent = redundantBySlug.get(currentCategory.slug)
    const finalCategorySlug = change?.[2] || flattenedParent || currentCategory.slug
    const finalSlug = change?.[1] || product.slug
    const finalName = change?.[3] || product.name
    const finalCategory = categoryBySlug.get(finalCategorySlug)
    const oldUrl = `/${[...categoryChain(currentCategory, categoryById), product.slug].join('/')}`
    const newUrl = `/${[...categoryChain(finalCategory, categoryById), finalSlug].join('/')}`
    if (destinations.has(newUrl)) throw new Error(`Duplicate final URL: ${newUrl}`)
    destinations.add(newUrl)
    const imagesNeedRename = Boolean(change?.[3]) && (product.images || []).some((image) => image.alt !== finalName)
    if (oldUrl !== newUrl || product.name !== finalName || imagesNeedRename) {
      planned.push({ product, oldUrl, newUrl, finalSlug, finalName, finalCategory })
    }
  }

  const finalSlugs = new Set(planned.map((item) => item.finalSlug))
  if (finalSlugs.size !== planned.length) throw new Error('Planned product slugs are not unique')
  const plannedIds = new Set(planned.map((item) => String(item.product._id)))
  const collisions = products.filter((product) => finalSlugs.has(product.slug) && !plannedIds.has(String(product._id)))
  if (collisions.length) throw new Error(`Slug collision: ${collisions.map((product) => product.slug).join(', ')}`)

  const existingRedirects = fs.existsSync(REDIRECTS_PATH)
    ? JSON.parse(fs.readFileSync(REDIRECTS_PATH, 'utf8'))
    : []
  const redirects = [
    ...existingRedirects,
    ...redundantCategories.map(([child, parent]) => ({
      source: `/${parent}/${child}`,
      destination: `/${parent}`,
    })),
    ...planned.filter((item) => item.oldUrl !== item.newUrl).map((item) => ({ source: item.oldUrl, destination: item.newUrl })),
  ]
  const uniqueRedirects = [...new Map(redirects.map((redirect) => [redirect.source, redirect])).values()]
    .sort((a, b) => a.source.localeCompare(b.source))
  const redirectSources = new Set(uniqueRedirects.map((redirect) => redirect.source))
  for (const redirect of uniqueRedirects) {
    if (redirectSources.has(redirect.destination)) throw new Error(`Redirect chain detected: ${redirect.source} -> ${redirect.destination}`)
  }

  const categoryChanges = planned.filter((item) => String(item.product.categoryId) !== String(item.finalCategory._id))
  const slugChanges = planned.filter((item) => item.product.slug !== item.finalSlug)
  console.log(JSON.stringify({ apply: APPLY, productsChanged: planned.length, categoryChanges: categoryChanges.length, slugChanges: slugChanges.length, redirects: uniqueRedirects.length }, null, 2))
  for (const item of planned) console.log(`${item.oldUrl} -> ${item.newUrl}`)
  if (!APPLY) {
    console.log('\nDry run only. Re-run with --apply after reviewing this output.')
    await mongoose.disconnect()
    return
  }

  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      if (planned.length) {
        await db.collection('products').bulkWrite(planned.map((item) => ({
          updateOne: {
            filter: { _id: item.product._id },
            update: {
              $set: {
                slug: item.finalSlug,
                name: item.finalName,
                categoryId: item.finalCategory._id,
                images: (item.product.images || []).map((image) => ({
                  ...image,
                  alt: item.finalName,
                })),
                updatedAt: new Date(),
              },
            },
          },
        })), { session })
      }
      const redundantIds = redundantCategories.map(([slug]) => categoryBySlug.get(slug)?._id).filter(Boolean)
      if (redundantIds.length) await db.collection('categories').deleteMany({ _id: { $in: redundantIds } }, { session })
    })
  } finally {
    await session.endSession()
  }

  const sourceProducts = JSON.parse(fs.readFileSync(IMPORT_PATH, 'utf8'))
  const importChangeBySlug = new Map(changes.map((change) => [change[0], change]))
  for (const product of sourceProducts) {
    const change = importChangeBySlug.get(product.slug)
    if (change) {
      product.slug = change[1] || product.slug
      product.category = change[2]
      if (change[3]) product.name = change[3]
      delete product.subCategory
    } else if (redundantBySlug.has(product.category)) {
      product.category = redundantBySlug.get(product.category)
      delete product.subCategory
    }
  }

  fs.writeFileSync(REDIRECTS_PATH, `${JSON.stringify(uniqueRedirects, null, 2)}\n`)
  fs.writeFileSync(CSV_PATH, `old_url,new_url\n${uniqueRedirects.map((redirect) => `${csvCell(redirect.source)},${csvCell(redirect.destination)}`).join('\n')}\n`)
  fs.writeFileSync(IMPORT_PATH, `${JSON.stringify(sourceProducts, null, 2)}\n`)
  fs.writeFileSync(REPORT_PATH, `# Product URL Migration Report\n\n- Products changed: ${planned.length}\n- Category assignments changed: ${categoryChanges.length}\n- Product slugs changed: ${slugChanges.length}\n- Direct 301 redirects: ${uniqueRedirects.length}\n- Redundant categories removed: ${redundantCategories.length}\n\n## Material review\n\n- The five wool-body/leather-sleeve products named in the audit were moved from Satin to Wool & Leather. Their generic descriptions did not contradict their product names.\n- The three products with \"hood\" in their names were moved to Hooded.\n- The cotton fleece product was moved to Fleece.\n- The two cotton/denim products were moved to Cotton Twill.\n- The classic maroon jacket has matching fabric sleeves in its gallery and was moved to All Wool.\n- The orange and white trademarked product was renamed generically and moved to All Wool, following the supplied product-name correction.\n- The all-leather Nappa varsity jacket was moved from Leather Jackets to Varsity Jackets / All Leather.\n- The black coach listing and black/orange hooded listing were renamed from their visible gallery content without asserting an unverified fabric.\n`)
  console.log(`\nApplied migration and wrote ${path.relative(ROOT, CSV_PATH)}.`)
  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await mongoose.disconnect().catch(() => undefined)
  process.exit(1)
})
