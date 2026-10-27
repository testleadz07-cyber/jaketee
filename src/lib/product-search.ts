import { resolveAncestorChain } from '@/lib/categories'
import { getDefaultProductVariants } from '@/lib/product-variants'

export interface SearchCategory { _id: unknown; parentId?: unknown; name: string; slug: string }
export interface SearchVariant { name: string; value: string; inStock?: boolean; image?: string | null; priceAdjust?: number }
export interface SearchMatch { color?: string; variantName?: string; variantValue?: string; image?: string; options?: Record<string, string>; price?: number }
const colors = new Set('black white cream ivory beige burgundy maroon red pink blue navy green olive sage teal purple lavender brown chocolate tan sand grey gray gold yellow orange charcoal silver'.split(' '))
const materials = new Set('leather wool cotton satin fleece denim nylon suede polyester shearling sheepskin lambskin twill'.split(' '))
const types = new Set('jacket jackets varsity letterman bomber bombers hoodie hoodies coat coats vest vests puffer coach aviator'.split(' '))
const aliases: Record<string, string> = { womens: 'women', woman: 'women', mens: 'men', man: 'men', jackets: 'jacket', bombers: 'bomber', hoodies: 'hoodie', coats: 'coat', vests: 'vest', gray: 'grey' }
const colorChoices = (term: string) => colors.has(term) ? [term] : term.length >= 3 ? [...colors].filter(color => color.startsWith(term)) : []
const isColorTerm = (term: string) => colorChoices(term).length > 0
function colorSearchTerms(terms: string[]) {
  const base = terms.filter(isColorTerm)
  return base.length ? terms.filter(term => isColorTerm(term) || ['royal', 'forest', 'light', 'dark', 'heather', 'baby', 'off', 'mid'].includes(term)) : []
}
export const escapeSearch = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
export function searchTerms(value: string) {
  return [...new Set(value.normalize('NFKC').toLowerCase().replace(/['’]/g, '').match(/[\p{L}\p{N}]+/gu) || [])].filter(term => !['and', 'with', 'for', 'the', 'a', 'an', 'of', 'in'].includes(term)).slice(0, 12).map(term => aliases[term] || term)
}

export function broaderSearches(value: string) {
  const terms = searchTerms(value)
  return terms.length < 2 ? [] : [...new Set(terms.map((_, index) => terms.filter((_, other) => other !== index).join(' ')))].slice(0, 3)
}
function termPattern(term: string) {
  if (term === 'women') return "\\bwom(?:e|a)n(?:['’]?s)?\\b"
  if (term === 'men') return "\\bm(?:e|a)n(?:['’]?s)?\\b"
  const choices = colorChoices(term)
  if (choices.length) return `\\b(?:${choices.map(color => color === 'grey' || color === 'gray' ? 'gr[ae]y' : escapeSearch(color)).join('|')})\\b`
  return `\\b${escapeSearch(term)}${types.has(term) ? '(?:s)?\\b' : materials.has(term) ? '\\b' : '[a-z0-9]*'}`
}
const colorName = { $regex: 'colou?r', $options: 'i' }

export function buildProductSearch(value: string, categories: SearchCategory[], selectedColors: string[] = []) {
  const terms = searchTerms(value)
  const requestedColors = colorSearchTerms(terms)
  const colorIntent = (term: string) => requestedColors.includes(term)
  const nodes = categories.map(category => ({ _id: String(category._id), parentId: category.parentId ? String(category.parentId) : null, name: category.name, slug: category.slug }))
  const chains = nodes.map(category => ({ id: category._id, text: resolveAncestorChain(nodes, category._id).map(node => `${node.name} ${node.slug}`).join(' ') }))
  const conditions: any[] = []
  const scores: any[] = []
  for (const term of terms) {
    const regex = termPattern(term)
    const test = new RegExp(regex, 'i')
    const categoryIds = chains.filter(category => test.test(category.text)).map(category => category.id)
    const textMatch = { $or: [{ name: { $regex: regex, $options: 'i' } }, { slug: { $regex: regex, $options: 'i' } }] }
    const variant = { variants: { $elemMatch: { value: { $regex: regex, $options: 'i', ...(colorIntent(term) && selectedColors.length ? { $in: selectedColors } : {}) }, inStock: { $ne: false }, ...(colorIntent(term) ? { name: colorName } : term === 'women' || term === 'men' ? { name: { $regex: '^(fit|gender|audience)$', $options: 'i' } } : materials.has(term) ? { name: { $regex: 'material|fabric|body|sleeve|shell', $options: 'i' } } : {}) } } }
    const strict = colorIntent(term) || materials.has(term) || types.has(term) || term === 'women' || term === 'men'
    if (colorIntent(term)) {
      conditions.push({ $or: [variant, { $and: [textMatch, { variants: { $not: { $elemMatch: { name: colorName } } } }] }] })
    } else {
      conditions.push({ $or: [textMatch, variant, ...(categoryIds.length ? [{ categoryId: { $in: categoryIds } }] : []), { tags: { $regex: regex, $options: 'i' } }, ...(!strict ? [{ description: { $regex: regex, $options: 'i' } }] : [])] })
    }
    const matches = (field: string) => ({ $regexMatch: { input: { $ifNull: [`$${field}`, ''] }, regex, options: 'i' } })
    scores.push({ $cond: [matches('name'), 100, 0] }, { $cond: [matches('slug'), 30, 0] }, { $cond: [matches('description'), 2, 0] })
    const variantScores = { $map: { input: { $cond: [{ $isArray: '$variants' }, '$variants', []] }, as: 'variant', in: { $and: [{ $ne: ['$$variant.inStock', false] }, { $regexMatch: { input: { $ifNull: ['$$variant.value', ''] }, regex, options: 'i' } }] } } }
    scores.push({ $cond: [{ $anyElementTrue: [variantScores] }, 80, 0] })
    scores.push({ $cond: [{ $anyElementTrue: [{ $map: { input: { $cond: [{ $isArray: '$tags' }, '$tags', []] }, as: 'tag', in: { $regexMatch: { input: '$$tag', regex, options: 'i' } } } }] }, 20, 0] })
    if (categoryIds.length) scores.push({ $cond: [{ $in: [{ $toString: '$categoryId' }, categoryIds] }, 60, 0] })
  }
  const colorTerms = requestedColors
  if (colorTerms.length > 1) conditions.push({ $or: [
    { variants: { $elemMatch: { name: colorName, inStock: { $ne: false }, ...(selectedColors.length ? { value: { $in: selectedColors } } : {}), $and: colorTerms.map(term => ({ value: { $regex: termPattern(term), $options: 'i' } })) } } },
    { $and: [{ variants: { $not: { $elemMatch: { name: colorName } } } }, ...colorTerms.map(term => ({ $or: [{ name: { $regex: termPattern(term), $options: 'i' } }, { slug: { $regex: termPattern(term), $options: 'i' } }] }))] },
  ] })
  const phrase = value.trim().slice(0, 200)
  scores.push({ $cond: [{ $eq: [{ $toLower: '$name' }, phrase.toLowerCase()] }, 2000, 0] })
  return { filter: terms.length ? { $and: conditions } : phrase ? { _id: { $in: [] } } : {}, score: { $add: scores } }
}

export function getSearchMatch(product: { variants?: SearchVariant[]; price?: number }, value: string, selectedColors: string[] = []): SearchMatch | undefined {
  const variants = Array.isArray(product.variants) ? product.variants : []
  const terms = searchTerms(value)
  const colorTerms = colorSearchTerms(terms)
  const variant = variants.find(item => /colou?r/i.test(item.name) && item.inStock !== false && (!selectedColors.length || selectedColors.includes(item.value)) && colorTerms.every(term => new RegExp(termPattern(term), 'i').test(item.value)))
  const color = colorTerms.length ? variant : undefined
  const options: Record<string, string> = color ? { [color.name]: color.value } : {}
  for (const item of variants) {
    if (item.inStock === false || options[item.name] !== undefined) continue
    const relevant = /^(fit|gender|audience)$/i.test(item.name) ? terms.filter(term => term === 'women' || term === 'men') : /material|fabric|body|sleeve|shell/i.test(item.name) ? terms.filter(term => materials.has(term)) : []
    if (relevant.some(term => new RegExp(termPattern(term), 'i').test(item.value))) options[item.name] = item.value
  }
  if (!Object.keys(options).length) return undefined
  const defaults = getDefaultProductVariants(variants.map(item => ({ ...item, inStock: item.inStock !== false, priceAdjust: item.priceAdjust || 0 })))
  const selected = { ...defaults, ...options }
  const price = typeof product.price === 'number' ? product.price + Object.entries(selected).reduce((sum, [name, selectedValue]) => sum + Number(variants.find(item => item.name === name && item.value === selectedValue && item.inStock !== false)?.priceAdjust || 0), 0) : undefined
  return { options, price, ...(color ? { color: color.value, variantName: color.name, variantValue: color.value } : {}), ...(color?.image ? { image: color.image } : {}) }
}

export function searchProductHref(href: string, match?: SearchMatch) {
  if (!match) return href
  const params = new URLSearchParams()
  for (const [name, value] of Object.entries(match.options || {})) params.set(`variant.${name}`, value)
  if (!params.size && match.variantName && match.variantValue) { params.set('option', match.variantName); params.set('value', match.variantValue) }
  if (!params.size) return href
  return `${href}?${params}`
}

export function readSearchSelection(variants: SearchVariant[], query: string) {
  const params = new URLSearchParams(query)
  const selected = variants.filter(item => item.inStock !== false && /colou?r|^(fit|gender|audience)$|material|fabric|body|sleeve|shell/i.test(item.name) && (params.get(`variant.${item.name}`) === item.value || params.get('option') === item.name && params.get('value') === item.value))
  const color = selected.find(item => /colou?r/i.test(item.name))
  return { options: Object.fromEntries(selected.map(item => [item.name, item.value])), image: color?.image || null }
}

export function searchFacetVariants(variants: SearchVariant[], search: string) {
  const terms = colorSearchTerms(searchTerms(search))
  return !terms.length ? variants : variants.filter(item => !/colou?r/i.test(item.name) || terms.every(term => new RegExp(termPattern(term), 'i').test(item.value)))
}

export function catalogSortValue(value: string | null | undefined, searching: boolean) {
  return ['featured', 'newest', 'price-asc', 'price-desc', 'name', ...(searching ? ['relevance'] : [])].includes(value || '') ? value! : searching ? 'relevance' : 'featured'
}
