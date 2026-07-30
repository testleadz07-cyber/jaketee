'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/header'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useRecentlyViewedStore } from '@/store/recently-viewed'
import { ReviewsSection } from '@/components/reviews-section'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { FrequentlyBoughtTogether } from '@/components/FrequentlyBoughtTogether'
import { SizeGuide } from '@/components/size-guide'
import { YouMayAlsoLike } from '@/components/YouMayAlsoLike'
import { RecentlyViewed } from '@/components/RecentlyViewed'
import { Footer } from '@/components/footer'
import { buildCategoryUrl, isJacketCategoryPath } from '@/lib/categories'
import { logUserActivity } from '@/lib/activity'
import { JacketCustomizer } from '@/components/jacket-customizer'
import {
  ShoppingBag,
  Star,
  Check,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  Shield,
  RefreshCw,
  Heart,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number | null
  inStock: boolean
  isFeatured: boolean
  category: {
    name: string
    slug: string
  }
  categoryPath?: Array<{ name: string; slug: string }>
  images: Array<{
    id: string
    url: string
    alt: string | null
    order: number
  }>
  variants: Array<{
    id: string
    name: string
    value: string
    priceAdjust: number
    inStock: boolean
    image?: string | null
  }>
  embroidery?: { available: boolean; fee: number; maxChars: number }
  measurementFields?: string[]
}

interface ProductDetailViewProps {
  slug: string
}

export function ProductDetailView({ slug }: ProductDetailViewProps) {
  const { data: session } = useSession()

  const [product, setProduct] = useState<Product & { averageRating?: number; reviewCount?: number; stockCount?: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [overrideImage, setOverrideImage] = useState<string | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({})
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product?.id || ''))
  const addToWishlist = useWishlistStore((state) => state.addItem)
  const removeFromWishlist = useWishlistStore((state) => state.removeItem)
  const addItem = useCartStore((state) => state.addItem)
  const addRecentlyViewed = useRecentlyViewedStore((state) => state.addItem)

  useEffect(() => {
    fetchProduct()
  }, [slug])

  useEffect(() => {
    if (!product) return
    addRecentlyViewed({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      images: (product.images || []).map((img) => ({
        url: img.url,
        alt: img.alt || '',
      })),
      category: product.category,
      isFeatured: product.isFeatured,
    })
    logUserActivity('view_product', { productId: product.id, name: product.name })
  }, [product?.id])

  const fetchProduct = async () => {
    setLoading(true)
    setOverrideImage(null)
    try {
      const res = await fetch(`/api/products/${slug}`, { cache: 'no-store' })
      if (!res.ok) {
        setProduct(null)
        return
      }
      const data = await res.json()
      setProduct(data)

      // Set default variants
      if (data.variants && data.variants.length > 0) {
        const groupedVariants = groupVariants(data.variants)
        const defaults: Record<string, string> = {}
        Object.keys(groupedVariants).forEach((key) => {
          const available = groupedVariants[key].filter((v: any) => v.inStock)
          if (available.length > 0) {
            defaults[key] = available[0].value
          }
        })
        setSelectedVariants(defaults)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }

  const groupVariants = (variants: Product['variants']) => {
    const list = variants || []
    return list.reduce((acc, variant) => {
      if (!acc[variant.name]) {
        acc[variant.name] = []
      }
      if (acc[variant.name].some((v) => v.value === variant.value)) {
        return acc
      }
      acc[variant.name].push(variant)
      return acc
    }, {} as Record<string, Product['variants']>)
  }

  const getSelectedVariantPriceAdjust = () => {
    if (!product || !product.variants) return 0
    let total = 0
    Object.values(selectedVariants).forEach((value) => {
      const variant = product.variants.find(
        (v) => v.name === Object.keys(selectedVariants).find(k => selectedVariants[k] === value) && v.value === value
      )
      if (variant) {
        total += variant.priceAdjust
      }
    })
    return total
  }

  const getSelectedVariantCombination = () => {
    if (!product || Object.keys(selectedVariants).length === 0) return null

    const selectedValues = Object.values(selectedVariants)
    const selectedNames = Object.keys(selectedVariants)

    return selectedNames.map((name, index) => ({
      name,
      value: selectedValues[index],
    }))
  }

  const getPrice = () => {
    if (!product) return 0
    return product.price + getSelectedVariantPriceAdjust()
  }

  const getCompareAtPrice = () => {
    if (!product || !product.compareAtPrice) return null
    return product.compareAtPrice + getSelectedVariantPriceAdjust()
  }

  const getDiscount = () => {
    const price = getPrice()
    const compareAt = getCompareAtPrice()
    if (!compareAt || compareAt <= price) return 0
    return Math.round(((compareAt - price) / compareAt) * 100)
  }

  const handleAddToCart = (
    extraVariants: Array<{ name: string; value: string }> = [],
    extraFee: number = 0
  ) => {
    if (!product) return

    const variantCombination = getSelectedVariantCombination()
    const combined = [...(variantCombination || []), ...extraVariants]
    const variants = combined.length > 0 ? combined : [{ name: 'Standard', value: 'Default' }]
    const price = getPrice() + extraFee

    addItem({
      productId: product.id,
      name: product.name,
      price,
      image: product.images?.[0]?.url || '/placeholder.png',
      variants,
      quantity,
    })

    logUserActivity('add_to_cart', {
      productId: product.id,
      name: product.name,
      price,
      quantity,
      variants,
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    notFound()
  }

  const groupedVariants = groupVariants(product.variants)
  const discount = getDiscount()
  const categoryPath = product.categoryPath && product.categoryPath.length > 0
    ? product.categoryPath
    : product.category
      ? [product.category]
      : []
  const categoryHref = categoryPath.length > 0 ? buildCategoryUrl(categoryPath) : '/'
  const isJacket = isJacketCategoryPath(categoryPath)

  const handleSelectCustomizerVariant = (groupName: string, value: string, image?: string | null) => {
    setSelectedVariants((prev) => ({ ...prev, [groupName]: value }))
    if (image) setOverrideImage(image)
  }

  const wishlistButton = (
    <Button
      variant="outline"
      size="icon"
      className="h-14 w-14 rounded-xl flex-shrink-0 border-2"
      onClick={async () => {
        if (isInWishlist) {
          await removeFromWishlist(product.id, (session?.user as any)?.id)
        } else {
          await addToWishlist({
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0]?.url || '',
            slug: product.slug,
          }, (session?.user as any)?.id)
        }
      }}
    >
      <Heart
        className={`h-6 w-6 transition-all duration-300 ${
          isInWishlist ? 'fill-rose-500 text-rose-500 scale-110' : 'text-muted-foreground'
        }`}
      />
    </Button>
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showBack backHref="/" />

      {/* Product Detail */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs
            items={[
              ...categoryPath.map((ancestor, index) => ({
                label: ancestor.name,
                href: buildCategoryUrl(categoryPath.slice(0, index + 1)),
              })),
              { label: product.name }
            ]}
            className="mb-6"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-square overflow-hidden rounded-2xl bg-muted"
              >
                <Image
                  src={overrideImage || (product.images?.[selectedImage]?.url || '/placeholder.png')}
                  alt={product.images?.[selectedImage]?.alt || product.name || 'Product Image'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                {discount > 0 && (
                  <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1">
                    -{discount}% OFF
                  </Badge>
                )}
                {product.isFeatured && (
                  <Badge className="absolute top-4 right-4" variant="secondary">
                    <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                    Featured
                  </Badge>
                )}
              </motion.div>

              {(product.images?.length || 0) > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images?.map((image, index) => (
                    <button
                      key={image.id || `image-${index}`}
                      onClick={() => {
                        setSelectedImage(index)
                        setOverrideImage(null)
                      }}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                        selectedImage === index
                          ? 'border-primary scale-105'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `${product.name} ${index + 1}`}
                        fill
                        sizes="(max-width: 1024px) 25vw, 15vw"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="space-y-6"
            >
              <div>
                <Link
                  href={categoryHref}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {product.category?.name}
                </Link>
                <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-3">
                  {product.name}
                </h1>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(product.averageRating || 0)
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-1">
                      {product.averageRating ? product.averageRating.toFixed(1) : ''}
                      {product.reviewCount ? `(${product.reviewCount})` : ''}
                    </span>
                  </div>
                  <span className={`text-sm ${product.inStock ? 'text-green-600' : 'text-destructive'}`}>
                    {product.inStock ? (product.stockCount ? `${product.stockCount} in stock` : 'In Stock') : 'Out of Stock'}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-primary">
                    ${getPrice().toFixed(2)}
                  </span>
                  {getCompareAtPrice() && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">
                        ${getCompareAtPrice()!.toFixed(2)}
                      </span>
                      {discount > 0 && (
                        <Badge className="bg-green-600">
                          Save {discount}%
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {isJacket && (
                <JacketCustomizer
                  product={product}
                  selectedVariants={selectedVariants}
                  onSelectVariant={handleSelectCustomizerVariant}
                  basePrice={getPrice()}
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  addedToCart={addedToCart}
                  inStock={product.inStock}
                  onAddToCart={handleAddToCart}
                  wishlistButton={wishlistButton}
                />
              )}

              {/* Variants */}
              {!isJacket && Object.keys(groupedVariants).length > 0 && (
                <div className="space-y-4">
                  {Object.entries(groupedVariants).map(
                    ([variantName, variants]) => (
                      <div key={variantName}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium block">
                            {variantName}
                          </label>
                          {variantName.toLowerCase() === 'size' && (
                            <SizeGuide
                              categorySlug={product.category?.slug}
                              sizeValues={variants.map((v) => v.value)}
                            />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {variants.map((variant, idx) => {
                            const isSelected =
                              selectedVariants[variantName] === variant.value
                            const isAvailable = variant.inStock

                            return (
                              <button
                                key={variant.id || `${variantName}-${variant.value}-${idx}`}
                                onClick={() => {
                                  if (isAvailable) {
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [variantName]: variant.value,
                                    }))
                                    if (variant.image) {
                                      setOverrideImage(variant.image)
                                    }
                                  }
                                }}
                                disabled={!isAvailable}
                                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : isAvailable
                                    ? 'border-border hover:border-primary/50 bg-background'
                                    : 'border-border bg-muted opacity-50 cursor-not-allowed'
                                }`}
                              >
                                {variant.value}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              <Separator />

              {/* Quantity and Add to Cart */}
              {!isJacket && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setQuantity(Math.max(1, quantity - 1))
                        }
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center text-lg font-semibold">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      size="lg"
                      className="flex-1 h-14 text-lg"
                      onClick={() => handleAddToCart()}
                      disabled={!product.inStock}
                    >
                      <AnimatePresence mode="wait">
                        {addedToCart ? (
                          <motion.div
                            key="added"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-2"
                          >
                            <Check className="h-5 w-5" />
                            Added to Cart!
                          </motion.div>
                        ) : (
                          <motion.div
                            key="add"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-2"
                          >
                            <ShoppingCart className="h-5 w-5" />
                            Add to Cart -
                            ${(getPrice() * quantity).toFixed(2)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                    {wishlistButton}
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <Truck className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-medium">Free Shipping</p>
                </div>
                <div className="text-center">
                  <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-medium">2-Year Warranty</p>
                </div>
                <div className="text-center">
                  <RefreshCw className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-medium">30-Day Returns</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-12 space-y-12 border-t pt-12">
            <FrequentlyBoughtTogether currentProduct={product} />
            <YouMayAlsoLike currentProduct={product} />
            <RecentlyViewed excludeProductId={product.id} />
          </div>

          <ReviewsSection productId={product.id} onReviewSubmitted={fetchProduct} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
