export const catalogFacets = { size: 'Size', color: 'Color', material: 'Material', fit: 'Fit' } as const
export type CatalogFilters = { search: string; minPrice: string; maxPrice: string; size: string[]; color: string[]; material: string[]; fit: string[] }
export const emptyCatalogFilters: CatalogFilters = { search: '', minPrice: '', maxPrice: '', size: [], color: [], material: [], fit: [] }
export function readCatalogFilters(params: URLSearchParams): CatalogFilters {
  const price = (key: string) => {
    const value = params.get(key)
    return value !== null && value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 ? String(Number(value)) : ''
  }
  return { search: (params.get('search') || '').trim().slice(0, 200), minPrice: price('minPrice'), maxPrice: price('maxPrice'), ...Object.fromEntries(Object.keys(catalogFacets).map(key => [key, [...new Set(params.getAll(key).filter(Boolean))].slice(0, 50)])) } as CatalogFilters
}
export function appendCatalogFilters(params: URLSearchParams, filters: CatalogFilters) {
  if (filters.search) params.set('search', filters.search)
  if (filters.minPrice) params.set('minPrice', filters.minPrice)
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
  for (const key of Object.keys(catalogFacets) as Array<keyof typeof catalogFacets>) for (const value of filters[key]) params.append(key, value)
  return params
}
export function catalogFilterQuery(filters: CatalogFilters) {
  const query: Record<string, unknown> = {}
  if (filters.search) {
    const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    query.$or = ['name', 'slug', 'description'].map(key => ({ [key]: { $regex: escaped, $options: 'i' } }))
  }
  if (filters.minPrice || filters.maxPrice) query.price = { ...(filters.minPrice ? { $gte: Number(filters.minPrice) } : {}), ...(filters.maxPrice ? { $lte: Number(filters.maxPrice) } : {}) }
  const variants = (Object.keys(catalogFacets) as Array<keyof typeof catalogFacets>).filter(key => filters[key].length).map(key => ({ variants: { $elemMatch: { name: catalogFacets[key], value: { $in: filters[key] }, inStock: { $ne: false } } } }))
  if (variants.length) query.$and = variants
  return query
}

export interface CatalogFacetData { groups: Array<{ key: keyof typeof catalogFacets; label: string; values: string[] }>; minPrice: number; maxPrice: number }
export function getCatalogFacetData(products: Array<{ price: number; variants?: Array<{ name: string; value: string; inStock?: boolean }> }>): CatalogFacetData {
  const prices = products.map(product => Number(product.price)).filter(Number.isFinite)
  const groups = (Object.keys(catalogFacets) as Array<keyof typeof catalogFacets>).flatMap(key => {
    const values = [...new Set(products.flatMap(product => (product.variants || []).filter(variant => variant.name === catalogFacets[key] && variant.inStock !== false).map(variant => String(variant.value))))].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    return values.length > 1 ? [{ key, label: catalogFacets[key], values }] : []
  })
  return { groups, minPrice: prices.length ? Math.min(...prices) : 0, maxPrice: prices.length ? Math.max(...prices) : 0 }
}
