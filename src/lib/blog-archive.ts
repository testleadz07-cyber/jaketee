// These published guides use static routes rather than database records.
export const STATIC_BLOG_GUIDES = [
  { _id: 'guide-custom-jacket', slug: 'custom-jacket-design-guide', title: 'How to design a bomber, coach, or puffer jacket', excerpt: 'Compare jacket silhouettes, materials, colors, and artwork before saving your custom design.', categories: [], tags: [], author: { name: 'Jacketee' }, views: 0 },
  { _id: 'guide-varsity', slug: 'custom-varsity-jacket-design-guide', title: 'How to design a custom varsity jacket', excerpt: 'Plan materials, colors, lettering, patches, and measurements for your varsity jacket.', categories: [], tags: [], author: { name: 'Jacketee' }, views: 0 },
]

export function blogPageNumber(value?: string) {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : 1
}

export function blogArchivePath(page: number, category?: string, path = '/blog') {
  const query = new URLSearchParams()
  if (category) query.set('category', category)
  if (page > 1) query.set('page', String(page))
  return `${path}${query.size ? `?${query}` : ''}`
}
