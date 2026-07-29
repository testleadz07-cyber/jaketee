import { PRODUCTS } from '@/data/products'
import { CATEGORIES } from '@/data/categories'
import { resolveDescendantIds, resolveAncestorChain, type CategoryNode } from '@/lib/categories'

function categoryPathFor(categoryId: string) {
  const nodes = CATEGORIES.map((c) => ({ _id: c._id, parentId: c.parentId, name: c.name, slug: c.slug }))
  return resolveAncestorChain(nodes, categoryId).map((c) => ({ name: c.name, slug: c.slug }))
}

export function getStaticCategories() {
  return CATEGORIES.map((c) => ({ ...c, id: c._id }))
}

export function getStaticCategoriesWithCount() {
  const nodes: CategoryNode[] = CATEGORIES.map((c) => ({
    _id: c._id,
    parentId: c.parentId,
  }))

  return CATEGORIES.map((cat) => {
    const descendantIds = new Set(resolveDescendantIds(nodes, cat._id))
    return {
      ...cat,
      id: cat._id,
      _count: {
        products: PRODUCTS.filter((p) => descendantIds.has(p.categoryId) && p.inStock).length,
      },
    }
  })
}

export function getStaticProducts() {
  return PRODUCTS.map((p) => ({
    ...p,
    id: p._id,
    category: p.category || CATEGORIES.find((c) => c._id === p.categoryId),
    categoryPath: categoryPathFor(p.categoryId),
  }))
}

export function findStaticProduct(idOrSlug: string) {
  const product = PRODUCTS.find(
    (p) => p._id === idOrSlug || p.id === idOrSlug || p.slug === idOrSlug
  )
  if (!product) return null
  return {
    ...product,
    id: product._id,
    category: product.category || CATEGORIES.find((c) => c._id === product.categoryId),
    categoryPath: categoryPathFor(product.categoryId),
    averageRating: 0,
    reviewCount: 0,
  }
}