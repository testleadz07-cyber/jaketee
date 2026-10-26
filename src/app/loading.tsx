'use client'

import { usePathname, useSelectedLayoutSegments } from 'next/navigation'
import { PageLoading } from '@/components/page-loading'
import { CatalogRouteLoading, getLoadingCollection } from '@/components/catalog-route-loading'
import { CatalogPageLoading } from '@/components/catalog-page-loading'

export default function Loading() {
  const pathname = usePathname()
  const segments = useSelectedLayoutSegments()
  const section = pathname?.split('/')[1] || ''
  if (!section) return null
  if (section === 'shop') return <CatalogPageLoading kind="collection" collectionLayout="shop" />
  // Next returns a catch-all match as one joined segment. Static branches
  // such as /profile/orders/id have separate segments and retain their loader.
  if (getLoadingCollection(pathname || '') || segments[0]?.includes('/') || section === 'product') return <CatalogRouteLoading />
  return <PageLoading label={section === 'checkout' ? 'Preparing checkout…' : section === 'design' || section === 'customize' ? 'Preparing your designer…' : 'Loading page…'} storefront={section !== 'admin'} />
}
