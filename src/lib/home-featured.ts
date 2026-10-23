export interface FeaturedCategory {
  id: string
  parentId?: string | null
  name: string
  slug: string
}

/** Match unique products to the entire category tree, protecting narrower categories. */
export function selectHomeFeatured<T extends FeaturedCategory>(
  categories: T[],
  directProducts: Map<string, string[]>,
  preferredRoots: string[] = ['varsity-jackets'],
) {
  const byId = new Map(categories.map(category => [category.id, category]))
  const children = new Map<string, T[]>()
  for (const category of categories) {
    const parent = category.parentId && byId.has(category.parentId) ? category.parentId : ''
    children.set(parent, [...(children.get(parent) || []), category])
  }
  const rank = (category: T) => {
    const index = preferredRoots.indexOf(category.slug)
    return index < 0 ? preferredRoots.length : index
  }
  const ordered: Array<{ category: T; depth: number }> = []
  const visited = new Set<string>()
  const walk = (category: T, depth: number) => {
    if (visited.has(category.id)) return
    visited.add(category.id)
    ordered.push({ category, depth })
    for (const child of (children.get(category.id) || []).sort((a, b) => a.name.localeCompare(b.name, 'en'))) walk(child, depth + 1)
  }
  for (const root of (children.get('') || []).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'en'))) walk(root, 0)
  // Keep malformed/orphaned branches visible rather than silently dropping them.
  for (const category of categories) walk(category, 0)

  const candidates = new Map<string, string[]>()
  for (const { category } of ordered) {
    const ids: string[] = []
    const seen = new Set<string>()
    const collect = (id: string) => {
      if (seen.has(id)) return
      seen.add(id)
      ids.push(...(directProducts.get(id) || []))
      for (const child of children.get(id) || []) collect(child.id)
    }
    collect(category.id)
    candidates.set(category.id, [...new Set(ids)])
  }

  const productOwner = new Map<string, string>()
  const assignments = new Map<string, string>()
  const assign = (categoryId: string, tried: Set<string>): boolean => {
    for (const productId of candidates.get(categoryId) || []) {
      if (tried.has(productId)) continue
      tried.add(productId)
      const owner = productOwner.get(productId)
      if (!owner || assign(owner, tried)) {
        productOwner.set(productId, categoryId)
        assignments.set(categoryId, productId)
        return true
      }
    }
    return false
  }
  for (const { category } of [...ordered].sort((a, b) => b.depth - a.depth)) assign(category.id, new Set())
  return {
    selections: ordered.flatMap(({ category }) => {
      const productId = assignments.get(category.id)
      return productId ? [{ category, productId }] : []
    }),
    empty: ordered.filter(({ category }) => !candidates.get(category.id)?.length).map(({ category }) => category),
    unmatched: ordered.filter(({ category }) => candidates.get(category.id)?.length && !assignments.has(category.id)).map(({ category }) => category),
  }
}
