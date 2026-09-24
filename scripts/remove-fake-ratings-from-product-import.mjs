import fs from 'node:fs'

const file = new URL('./data/products-import.json', import.meta.url)
const products = JSON.parse(fs.readFileSync(file, 'utf8'))
let removedFields = 0

for (const product of products) {
  for (const field of ['rating', 'reviewCount', 'averageRating']) {
    if (Object.hasOwn(product, field)) {
      delete product[field]
      removedFields += 1
    }
  }
}

const serialized = products.map((product) => `  ${JSON.stringify(product)}`).join(',\n')
fs.writeFileSync(file, `[\n${serialized}\n]\n`)
console.log(JSON.stringify({ products: products.length, removedFields }))
