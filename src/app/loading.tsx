'use client'

import { usePathname } from 'next/navigation'
import { PageLoading } from '@/components/page-loading'
import { CatalogPageLoading } from '@/components/catalog-page-loading'
import { CATEGORIES } from '@/data/categories'
import { buildCategoryUrl, resolveAncestorChain } from '@/lib/categories'

// Match complete known paths; a product beneath a category must never match.
const knownCollections = new Map(CATEGORIES.map(category => [buildCategoryUrl(resolveAncestorChain(CATEGORIES, category._id)), category]))

export default function Loading() {
  const pathname = usePathname()
  const section = pathname?.split('/')[1] || ''
  if (!section) return null
  const collection = knownCollections.get(pathname || '')
  if (collection) return <CatalogPageLoading kind="collection" title={collection.name} description={collection.description} />
  return <PageLoading label={section === 'checkout' ? 'Preparing checkout…' : section === 'design' || section === 'customize' ? 'Preparing your designer…' : 'Loading page…'} storefront={section !== 'admin'} />
}
