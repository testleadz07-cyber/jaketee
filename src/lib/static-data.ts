import { PRODUCTS } from '@/data/products'
import { CATEGORIES } from '@/data/categories'

export function getStaticCategories() {
  return CATEGORIES.map((c) => ({ ...c, id: c._id }))
}

export function getStaticCategoriesWithCount() {
  return CATEGORIES.map((cat) => ({
    ...cat,
    id: cat._id,
    _count: {
      products: PRODUCTS.filter((p) => p.categoryId === cat._id && p.inStock).length,
    },
  }))
}

export function getStaticProducts() {
  return PRODUCTS.map((p) => ({
    ...p,
    id: p._id,
    category: p.category || CATEGORIES.find((c) => c._id === p.categoryId),
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
    averageRating: 0,
    reviewCount: 0,
  }
}