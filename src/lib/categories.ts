export interface CategoryNode {
  _id: string
  parentId?: string | null
}

/**
 * Returns [rootId, ...all descendant ids] for the given category, walking
 * parentId pointers over the provided (small, in-memory) category list.
 * Cycle-safe via a visited set, even though the write path already prevents cycles.
 */
export function resolveDescendantIds(categories: CategoryNode[], rootId: string): string[] {
  const childrenByParent = new Map<string, string[]>()
  for (const cat of categories) {
    if (!cat.parentId) continue
    const list = childrenByParent.get(cat.parentId) || []
    list.push(cat._id)
    childrenByParent.set(cat.parentId, list)
  }

  const result: string[] = []
  const visited = new Set<string>()
  const queue: string[] = [rootId]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)
    result.push(current)
    const children = childrenByParent.get(current) || []
    for (const childId of children) {
      if (!visited.has(childId)) queue.push(childId)
    }
  }

  return result
}

/**
 * Returns the root→leaf ancestor chain (inclusive of the leaf) for the given
 * category id. Generic over T so callers can pass full category docs
 * (name/slug/etc), not just bare {_id, parentId} nodes.
 */
export function resolveAncestorChain<T extends CategoryNode>(categories: T[], leafId: string): T[] {
  const byId = new Map<string, T>()
  for (const cat of categories) byId.set(cat._id, cat)

  const chain: T[] = []
  const visited = new Set<string>()
  let current = byId.get(leafId)

  while (current && !visited.has(current._id)) {
    chain.unshift(current)
    visited.add(current._id)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }

  return chain
}

/**
 * Depth-first ordering (parent immediately followed by its descendants) with
 * a depth for each entry — used to render a flat category list as an indented
 * tree (e.g. in a <select>) without building a real tree component.
 */
export function orderCategoriesForDisplay<T extends CategoryNode>(
  categories: T[]
): Array<{ category: T; depth: number }> {
  const childrenByParent = new Map<string, T[]>()
  for (const cat of categories) {
    const key = cat.parentId || '__root__'
    const list = childrenByParent.get(key) || []
    list.push(cat)
    childrenByParent.set(key, list)
  }

  const result: Array<{ category: T; depth: number }> = []
  const walk = (parentKey: string, depth: number) => {
    for (const cat of childrenByParent.get(parentKey) || []) {
      result.push({ category: cat, depth })
      walk(cat._id, depth + 1)
    }
  }
  walk('__root__', 0)

  return result
}

export interface CategoryPathSegment {
  slug: string
}

/**
 * Jacket-type top-level category slugs (independent categories, not children
 * of a "Jackets" parent - see fix-jackets-category-structure.ts). Used to scope
 * the jacket customization builder to only these categories and their
 * subcategories.
 */
export const JACKET_CATEGORY_SLUGS = [
  'varsity-jackets',
  'bomber-jackets',
  'coach-jackets',
  'denim-jackets',
  'fleece-hoodies',
  'leather-jackets',
  'puffer-jackets',
]

/**
 * True if the given root->leaf category ancestor chain is under one of the
 * jacket-type categories (i.e. the chain's first/root segment is a jacket type).
 */
export function isJacketCategoryPath(categoryPath: CategoryPathSegment[]): boolean {
  return categoryPath.length > 0 && JACKET_CATEGORY_SLUGS.includes(categoryPath[0].slug)
}

/**
 * True if the given root->leaf category ancestor chain is Varsity Jackets or one
 * of its material/style subcategories - the "hero" jacket type that gets the full
 * default customization builder (embroidery + made-to-measure) out of the box.
 */
export function isVarsityJacketPath(categoryPath: CategoryPathSegment[]): boolean {
  return categoryPath.length > 0 && categoryPath[0].slug === 'varsity-jackets'
}

export const DEFAULT_VARSITY_EMBROIDERY = { available: true, fee: 15, maxChars: 20 }
export const DEFAULT_VARSITY_MEASUREMENT_FIELDS = ['Chest', 'Shoulder', 'Sleeve Length', 'Body Length']

/**
 * Root-level nested category URL, e.g. /varsity-jackets or
 * /varsity-jackets/wool-leather - built from an ancestor chain (as returned
 * by resolveAncestorChain).
 */
export function buildCategoryUrl(categoryPath: CategoryPathSegment[]): string {
  return '/' + categoryPath.map((c) => c.slug).join('/')
}

/**
 * Root-level nested product URL, e.g. /varsity-jackets/wool-leather/product-slug
 * - categoryPath is the product's category ancestor chain (root -> leaf),
 * empty if the product has no resolvable category.
 */
export function buildProductUrl(product: { slug: string; categoryPath?: CategoryPathSegment[] }): string {
  const segments = [...(product.categoryPath || []).map((c) => c.slug), product.slug]
  return '/' + segments.join('/')
}
