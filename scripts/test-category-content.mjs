const baseUrl = (process.env.CATEGORY_TEST_BASE_URL || process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')

const pages = [
  '/varsity-jackets',
  '/varsity-jackets/wool-leather',
  '/varsity-jackets/all-wool',
  '/varsity-jackets/satin',
  '/varsity-jackets/faux-leather',
  '/varsity-jackets/all-leather',
  '/varsity-jackets/hooded',
  '/varsity-jackets/retro',
  '/varsity-jackets/fleece',
  '/varsity-jackets/cotton-twill',
  '/bomber-jackets',
  '/coach-jackets',
  '/denim-jackets',
  '/puffer-jackets',
  '/leather-jackets',
  '/fleece-hoodies',
]

let failures = 0

for (const page of pages) {
  const response = await fetch(`${baseUrl}${page}`)
  const html = await response.text()
  const result = {
    page,
    status: response.status,
    h1Count: (html.match(/<h1[ >]/g) || []).length,
    shortIntro: html.includes('Collection guide'),
    longGuide: html.includes('Materials and feel') && html.includes('Sizing and fit'),
    collectionSchema: html.includes('CollectionPage'),
    itemListSchema: html.includes('ItemList'),
    badPlural: />\s*1 products\s*</.test(html),
  }

  console.log(result)
  if (
    result.status !== 200 || result.h1Count !== 1 || !result.shortIntro ||
    !result.longGuide || !result.collectionSchema || !result.itemListSchema || result.badPlural
  ) failures++
}

if (failures) throw new Error(`${failures} category content checks failed`)
console.log(`All ${pages.length} category content pages passed.`)
