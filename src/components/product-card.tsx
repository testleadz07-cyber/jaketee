'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Heart } from 'lucide-react'
import Image from '@/components/optimized-image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useWishlistStore } from '@/store/wishlist'
import { buildProductUrl } from '@/lib/categories'
import { getDisplayCompareAtPrice } from '@/lib/pricing'
import { logUserActivity } from '@/lib/activity'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    description: string
    price: number
    compareAtPrice?: number | null
    compareAtPriceVerified?: boolean
    images: Array<{ url: string; alt: string }>
    category?: {
      name: string
      slug: string
    }
    categoryPath?: Array<{ name: string; slug: string }>
    isFeatured: boolean
  }
  listingPosition?: number
}

export function ProductCard({ product, listingPosition }: ProductCardProps) {
  const { data: session } = useSession()
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id))
  const addToWishlist = useWishlistStore((state) => state.addItem)
  const removeFromWishlist = useWishlistStore((state) => state.removeItem)
  const imageUrl = product.images[0]?.url || '/placeholder.png'

  const displayCompareAtPrice = getDisplayCompareAtPrice(product)
  const discount =
    displayCompareAtPrice
      ? Math.round(
          ((displayCompareAtPrice - product.price) / displayCompareAtPrice) *
            100
        )
      : 0

  const logListingClick = () => {
    logUserActivity('product_listing_click', {
      productId: product.id,
      category: product.category?.slug || 'uncategorized',
      listingPosition: listingPosition ?? null,
    })
  }

  return (
    <Link href={buildProductUrl(product)} onClick={logListingClick} className="block h-full min-w-0">
      <div className="interactive-lift h-full">
        <Card className="h-full gap-0 overflow-hidden border py-0 hover:border-primary/60 transition-colors group cursor-pointer shadow-sm">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={imageUrl}
              alt={product.images[0]?.alt || product.name}
              fill
              sizes="(max-width: 1023px) 50vw, (max-width: 1279px) 25vw, 320px"
              quality={70}
              className="media-zoom object-cover"
              onError={(event) => { event.currentTarget.src = '/placeholder.png' }}
            />
            
            <Button
              size="icon"
              variant="secondary"
              aria-label={isInWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
              className="absolute top-3 right-3 h-8 w-8 rounded-full z-10 bg-background/80 backdrop-blur hover:bg-background hover:scale-110 shadow-sm border border-border transition-all"
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                if (isInWishlist) {
                  await removeFromWishlist(product.id, (session?.user as any)?.id)
                  logUserActivity('wishlist_changed', { productId: product.id, action: 'removed' })
                } else {
                  await addToWishlist({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0]?.url || '',
                    slug: product.slug,
                  }, (session?.user as any)?.id)
                  logUserActivity('wishlist_changed', { productId: product.id, action: 'added' })
                }
              }}
            >
              <Heart
                className={`h-4.5 w-4.5 transition-all duration-300 ${
                  isInWishlist ? 'fill-rose-500 text-rose-500 scale-110' : 'text-muted-foreground hover:text-rose-500'
                }`}
              />
            </Button>

            {discount > 0 && (
              <Badge className="absolute top-3 left-3 z-10 border-red-800 bg-red-800 text-white">
                {discount}% OFF
              </Badge>
            )}
            {product.isFeatured && (
              <Badge className="absolute bottom-3 left-3 z-10" variant="secondary">
                <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                Featured
              </Badge>
            )}
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
          </div>

          <CardContent className="flex flex-1 flex-col p-3 sm:p-4">
            <Badge variant="outline" className="mb-2 max-w-full self-start truncate text-xs">
              {product.category?.name || 'Uncategorized'}
            </Badge>

            <h3 className="mb-3 min-h-10 text-sm font-semibold leading-5 line-clamp-2 group-hover:text-primary transition-colors sm:min-h-12 sm:text-base sm:leading-6">
              {product.name}
            </h3>

            <div className="mt-auto flex items-center justify-between">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-lg font-bold text-primary sm:text-xl">
                  ${product.price.toFixed(2)}
                </span>
                {displayCompareAtPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${displayCompareAtPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Link>
  )
}
