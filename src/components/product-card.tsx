'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Star, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useWishlistStore } from '@/store/wishlist'
import { buildProductUrl } from '@/lib/categories'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    description: string
    price: number
    compareAtPrice?: number | null
    images: Array<{ url: string; alt: string }>
    category?: {
      name: string
      slug: string
    }
    categoryPath?: Array<{ name: string; slug: string }>
    isFeatured: boolean
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { data: session } = useSession()
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id))
  const addToWishlist = useWishlistStore((state) => state.addItem)
  const removeFromWishlist = useWishlistStore((state) => state.removeItem)
  const imageUrl = product.images[0]?.url || '/placeholder.png'

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100
        )
      : 0

  return (
    <Link href={buildProductUrl(product)}>
      <div className="interactive-lift h-full">
        <Card className="h-full overflow-hidden border hover:border-primary/60 transition-colors group cursor-pointer shadow-sm">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={imageUrl}
              alt={product.images[0]?.alt || product.name}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
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
                } else {
                  await addToWishlist({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0]?.url || '',
                    slug: product.slug,
                  }, (session?.user as any)?.id)
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
              <Badge className="absolute top-3 left-3 border-red-800 bg-red-800 text-white">
                -{discount}%
              </Badge>
            )}
            {product.isFeatured && (
              <Badge className="absolute top-3 right-13 z-10" variant="secondary">
                <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                Featured
              </Badge>
            )}
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
          </div>

          <CardContent className="p-4">
            <Badge variant="outline" className="mb-2 text-xs">
              {product.category?.name || 'Uncategorized'}
            </Badge>

            <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {product.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  ${product.price.toFixed(2)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <Button
                size="icon"
                aria-label={`View ${product.name}`}
                className="rounded-full"
                onClick={(e) => {
                  e.preventDefault()
                  // Will be handled by product detail page
                }}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Link>
  )
}
