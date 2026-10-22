interface ImageCategory { id: string; parentId?: string | null; name: string; image?: string; productImages?: string[] }
/** Exact collection first, then descendants; use an ancestor only for an empty collection. */
export function collectionDesignImages(categories: ImageCategory[], categoryId: string): string[] {
  const valid = (url: string) => /^https?:\/\//.test(url) || (url.startsWith('/') && !url.startsWith('//'))
  const visited = new Set<string>()
  const collect = (id: string): string[] => {
    if (visited.has(id)) return []
    visited.add(id)
    const current = categories.find(item => item.id === id)
    if (!current) return []
    return [...(current.productImages || []), current.image || '', ...categories.filter(item => item.parentId === id).flatMap(item => collect(item.id))].map(url => url.trim()).filter(valid)
  }
  const own = [...new Set(collect(categoryId))]
  if (own.length) return own
  let parent = categories.find(item => item.id === categoryId)?.parentId
  const ancestors = new Set<string>()
  while (parent && !ancestors.has(parent)) {
    ancestors.add(parent)
    const category = categories.find(item => item.id === parent)
    if (!category) break
    const images = [...(category.productImages || []), category.image || ''].map(url => url.trim()).filter(valid)
    if (images.length) return [...new Set(images)]
    parent = category.parentId
  }
  return []
}
