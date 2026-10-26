'use client'

import { usePathname } from 'next/navigation'
import { CATEGORIES } from '@/data/categories'
import { categoryHeroDescriptions } from '@/data/category-hero-copy'
import { buildCategoryUrl, resolveAncestorChain } from '@/lib/categories'
import { CatalogPageLoading } from '@/components/catalog-page-loading'

const knownCollections = new Map(CATEGORIES.map(category => [buildCategoryUrl(resolveAncestorChain(CATEGORIES, category._id)), category]))

export function getLoadingCollection(pathname: string) {
  const category = knownCollections.get(pathname)
  if (category) return { title: category.name, description: category.description }
  // Only complete collection URLs match; product descendants never match.
  if (Object.hasOwn(categoryHeroDescriptions, pathname)) return { title: undefined, description: categoryHeroDescriptions[pathname] }
  return null
}

export function CatalogRouteLoading() {
  const pathname = usePathname() || ''
  const collection = getLoadingCollection(pathname)
  if (collection) return <CatalogPageLoading kind="collection" {...collection} />
  // The server has not resolved the catalog item yet; do not invent its title.
  return <CatalogPageLoading kind="pending" />
}
