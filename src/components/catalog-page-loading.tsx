import { ProductDetailsSkeleton } from '@/components/product-details-skeleton'
import { CollectionPageSkeleton } from '@/components/collection-page-skeleton'

export function CatalogPageLoading({ kind, collectionLayout = 'category' }: {
  kind: 'collection' | 'product' | 'pending'
  collectionLayout?: 'shop' | 'category'
  title?: string
  description?: string
  image?: string
}) {
  return kind === 'collection' ? <CollectionPageSkeleton shop={collectionLayout === 'shop'} /> : <ProductDetailsSkeleton />
}
