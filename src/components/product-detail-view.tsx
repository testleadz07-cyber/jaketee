'use client'

import { apiFetch as fetch } from '@/lib/api-fetch'

import { startTransition, useState, useEffect, useRef, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { readSearchSelection } from '@/lib/product-search'
import { CopySection, ProductCopy } from '@/components/product-copy'
import { FaqText } from '@/components/faq-text'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Header } from '@/components/header'
import { ProductReviewsSkeleton } from '@/components/product-details-skeleton'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useRecentlyViewedStore } from '@/store/recently-viewed'
import { VideoMedia } from '@/components/video-media'
import dynamic from 'next/dynamic'
const ProductImageZoom = dynamic(() => import('@/components/product-image-zoom'), { ssr: false })
const ReviewsSection = dynamic(() => import('@/components/reviews-section').then((mod) => mod.ReviewsSection), { loading: () => <ProductReviewsSkeleton /> })
import { Breadcrumbs } from '@/components/breadcrumbs'
// import { FrequentlyBoughtTogether } from '@/components/FrequentlyBoughtTogether'
const SizeGuide = dynamic(() => import('@/components/size-guide').then((mod) => mod.SizeGuide))
const RecentlyViewed = dynamic(() => import('@/components/RecentlyViewed').then((mod) => mod.RecentlyViewed))
import { Footer } from '@/components/footer'
import { buildCategoryUrl, isJacketCategoryPath } from '@/lib/categories'
import { logUserActivity } from '@/lib/activity'
import { useActivityView } from '@/hooks/use-activity-view'
import {
  Star,
  Check,
  Minus,
  Plus,
  ShoppingCart,
  ShoppingBag,
  Heart,
  ZoomIn,
  Ruler,
  Palette,
} from 'lucide-react'
import Link from 'next/link'
import Image from '@/components/optimized-image'
import { useRouter } from 'next/navigation'
import type { JacketCustomization } from '@/types/jacket-customization'
import { productImageAlt } from '@/lib/image-alt'
import { getDisplayCompareAtPrice } from '@/lib/pricing'
import { buildProductFaqs, type ProductFaq as ProductFaqData } from '@/lib/product-faqs'
import { ProductDeliveryPolicies } from '@/components/product-delivery-policies'
import { ReturnToCollectionLink } from '@/components/browsing-context'
import { getProductVariants, getDefaultProductVariants } from '@/lib/product-variants'

export interface ProductDetailData {
  id: string
  name: string
  slug: string
  videos?: string[]
  description: string
  specificationDetails?: string
  careInstructions?: string
  price: number
  compareAtPrice?: number | null
  compareAtPriceVerified?: boolean
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
  averageRating?: number
  reviewCount?: number
  stockCount?: number
}

interface ProductDetailViewProps {
  slug: string
  initialProduct: ProductDetailData
  relatedProducts?: ReactNode
  faqs?: ProductFaqData[]
}

export function ProductDetailView({ slug, initialProduct, faqs = [], relatedProducts }: ProductDetailViewProps) {
  const searchParams = useSearchParams()
  const requestedSelection = readSearchSelection(initialProduct.variants, searchParams.toString())
  const requestedKey = JSON.stringify(requestedSelection)
  const { data: session } = useSession()
  const router = useRouter()

  const [product, setProduct] = useState<ProductDetailData>(initialProduct)
  const [selectedImage, setSelectedImage] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [overrideImage, setOverrideImage] = useState<string | null>(() => requestedSelection.image)
  const [loadedImageUrl, setLoadedImageUrl] = useState('')
  const galleryImage = overrideImage || product.images?.[selectedImage]?.url || '/placeholder.png'
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => ({ ...getDefaultProductVariants(getProductVariants(initialProduct)), ...requestedSelection.options }))
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const sizeGroupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const selection = JSON.parse(requestedKey) as ReturnType<typeof readSearchSelection>
    if (!Object.keys(selection.options).length) return
    startTransition(() => {
      setSelectedVariants({ ...getDefaultProductVariants(getProductVariants(initialProduct)), ...selection.options })
      setOverrideImage(selection.image)
    })
  }, [requestedKey])

  const requestSizeSelection = () => {
    setSizeError(true)
    const group = sizeGroupRef.current
    group?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const firstAvailableSize = group?.querySelector<HTMLButtonElement>('button[aria-pressed]:not(:disabled)')
    const focusTarget = firstAvailableSize || group
    focusTarget?.focus({ preventScroll: true })
  }

  const isInWishlist = useWishlistStore((state) => state.items.some((item) => item.productId === (product?.id || '')))
  const addToWishlist = useWishlistStore((state) => state.addItem)
  const removeFromWishlist = useWishlistStore((state) => state.removeItem)
  const addItem = useCartStore((state) => state.addItem)
  const setDirectOrderItem = useCartStore((state) => state.setDirectOrderItem)
  const addRecentlyViewed = useRecentlyViewedStore((state) => state.addItem)

  function groupVariants(variants: ProductDetailData['variants']) {
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
    }, {} as Record<string, ProductDetailData['variants']>)
  }

  async function fetchProduct() {
    try {
      const res = await fetch(`/api/products/${slug}`, { cache: 'no-store' })
      if (!res.ok) {
        return
      }
      const data: ProductDetailData = await res.json()
      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
    }
  }

  useEffect(() => {
    addRecentlyViewed({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      compareAtPriceVerified: product.compareAtPriceVerified,
      images: (product.images || []).map((img) => ({
        url: img.url,
        alt: img.alt || '',
      })),
      category: product.category,
      categoryPath: product.categoryPath,
      isFeatured: product.isFeatured,
    })
  }, [product?.id])

  useActivityView('view_product', { productId: product.id })

  const getSelectedVariantPriceAdjust = () => {
    return Object.entries(selectedVariants).reduce((total, [name, value]) =>
      total + (product.variants.find((variant) => variant.name === name && variant.value === value)?.priceAdjust || 0), 0)
  }

  const getSelectedVariantCombination = () => {
    if (Object.keys(selectedVariants).length === 0) return null

    const selectedValues = Object.values(selectedVariants)
    const selectedNames = Object.keys(selectedVariants)

    return selectedNames.map((name, index) => ({
      name,
      value: selectedValues[index],
    }))
  }

  const getPrice = () => {
    return product.price + getSelectedVariantPriceAdjust()
  }

  const getCompareAtPrice = () => {
    const compareAtPrice = getDisplayCompareAtPrice(product)
    if (!compareAtPrice) return null
    return compareAtPrice + getSelectedVariantPriceAdjust()
  }

  const getDiscount = () => {
    const price = getPrice()
    const compareAt = getCompareAtPrice()
    if (!compareAt || compareAt <= price) return 0
    return Math.round(((compareAt - price) / compareAt) * 100)
  }

  const handleAddToCart = (
    extraVariants: Array<{ name: string; value: string }> = [],
    extraFee: number = 0,
    customization?: JacketCustomization
  ) => {
    if (!product.inStock) return
    if (!hasSelectedSize) { requestSizeSelection(); return }
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
      customization,
      quantity,
    })

    logUserActivity('add_to_cart', {
      productId: product.id,
      price,
      quantity,
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleBuyNow = (
    extraVariants: Array<{ name: string; value: string }> = [],
    extraFee: number = 0,
    customization?: JacketCustomization
  ) => {
    if (!product.inStock) return
    if (!hasSelectedSize) { requestSizeSelection(); return }
    const variantCombination = getSelectedVariantCombination()
    const combined = [...(variantCombination || []), ...extraVariants]
    const variants = combined.length > 0 ? combined : [{ name: 'Standard', value: 'Default' }]
    const price = getPrice() + extraFee

    setDirectOrderItem({
      productId: product.id,
      name: product.name,
      price,
      image: product.images?.[0]?.url || '/placeholder.png',
      variants,
      customization,
      quantity,
    })

    logUserActivity('begin_checkout', {
      source: 'buy_now',
      productId: product.id,
      price,
      quantity,
    })

    router.push('/checkout?mode=buy-now')
  }

  const effectiveVariants = getProductVariants(product)
  const groupedVariants = groupVariants(effectiveVariants as ProductDetailData['variants'])
  const discount = getDiscount()
  const categoryPath = product.categoryPath && product.categoryPath.length > 0
    ? product.categoryPath
    : product.category
      ? [product.category]
      : []
  const categoryHref = categoryPath.length > 0 ? buildCategoryUrl(categoryPath) : '/'
  const isJacket = isJacketCategoryPath(categoryPath)
  const categoryName = categoryPath.at(-1)?.name || product.category.name
  const sizeVariants = Object.entries(groupedVariants).find(([name]) => name.trim().toLowerCase() === 'size')?.[1] || []
  const hasSelectedSize = sizeVariants.some(variant => variant.inStock && selectedVariants[variant.name] === variant.value)
  const productFaqs = buildProductFaqs(faqs, categoryName, isJacket || sizeVariants.length > 0)

  const wishlistButton = (
    <Button
      variant="outline"
      size="icon"
      className="h-14 w-14 rounded-xl flex-shrink-0 border-2"
      onClick={async () => {
        if (isInWishlist) {
          await removeFromWishlist(product.id, (session?.user as any)?.id)
          logUserActivity('wishlist_changed', { productId: product.id, action: 'removed' })
        } else {
          await addToWishlist({
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0]?.url || '',
            slug: product.slug,
          }, (session?.user as any)?.id)
          logUserActivity('wishlist_changed', { productId: product.id, action: 'added' })
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
    <div className="min-h-screen min-w-0 flex flex-col bg-background [overflow-wrap:anywhere]">
      <Header />

      {/* Product Detail */}
      <main className="min-w-0 w-full flex-1 pb-24 lg:pb-0">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          <ReturnToCollectionLink fallbackHref={categoryHref} fallbackLabel={`Back to ${categoryName}`} />
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
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-6">
            {/* Image Gallery */}
            <div className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-1">
              <motion.div
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                {loadedImageUrl !== galleryImage && <div aria-hidden="true" className="absolute inset-0 bg-muted motion-safe:animate-pulse" />}
                <button type="button" onClick={() => setZoomOpen(true)} className="absolute inset-0" aria-label={`Enlarge image of ${product.name}`}>
                  <Image
                    src={galleryImage}
                    alt={productImageAlt(product.name, overrideImage || product.images?.[selectedImage]?.url || '', overrideImage ? 0 : (product.images?.[selectedImage]?.order ?? selectedImage))}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className={`object-contain ${loadedImageUrl === galleryImage ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setLoadedImageUrl(galleryImage)}
                    onError={() => setLoadedImageUrl(galleryImage)}
                    priority
                  />
                  <span className="absolute bottom-4 right-4 rounded-md bg-background/90 p-2"><ZoomIn className="h-5 w-5" /></span>
                </button>
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
                      type="button"
                      aria-label={`View image ${index + 1}`}
                      aria-pressed={selectedImage === index}
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
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 25vw, 15vw"
                        className="object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
              {zoomOpen && <ProductImageZoom
                src={overrideImage || product.images?.[selectedImage]?.url || '/placeholder.png'}
                alt={productImageAlt(product.name, overrideImage || product.images?.[selectedImage]?.url || '', overrideImage ? 0 : (product.images?.[selectedImage]?.order ?? selectedImage))}
                title={product.name}
                onOpenChange={setZoomOpen}
              />}
            </div>

            {/* Product Info */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              id="purchase-options"
              className="min-w-0 space-y-6 scroll-mt-24 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 lg:border-l lg:pl-10"
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

                <div className="flex flex-wrap items-center gap-4">
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
                    {product.reviewCount ? <a href="#reviews" className="ml-1 text-sm text-muted-foreground underline-offset-4 hover:underline">{product.averageRating?.toFixed(1)} ({product.reviewCount} reviews)</a> : <span className="ml-1 text-sm text-muted-foreground">No reviews yet</span>}
                  </div>
                  <span className={`text-sm ${product.inStock ? 'text-green-600' : 'text-destructive'}`}>
                    {product.inStock ? (product.stockCount ? `${product.stockCount} in stock` : 'In Stock') : 'Out of Stock'}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
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


              {/* Choose options before either purchase action. */}
              {Object.keys(groupedVariants).length > 0 && (
                <div className="space-y-4">
                  {Object.entries(groupedVariants).map(
                    ([variantName, variants]) => (
                      <div key={variantName} role="group" aria-label={variantName}
                        ref={variantName.trim().toLowerCase() === 'size' ? sizeGroupRef : undefined}
                        tabIndex={variantName.trim().toLowerCase() === 'size' ? -1 : undefined}
                        aria-describedby={variantName.trim().toLowerCase() === 'size' && sizeError && !hasSelectedSize ? 'product-size-error' : undefined}
                        className={variantName.trim().toLowerCase() === 'size' && sizeError && !hasSelectedSize ? 'rounded-lg border-2 border-red-600 bg-red-50 p-3 dark:bg-red-950/20' : undefined}>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <label className="text-sm font-medium block">
                            {variantName}
                          </label>
                          {variantName.trim().toLowerCase() === 'size' && (
                            <SizeGuide
                              categorySlug={`${product.category?.slug || ''} ${product.slug}`}
                              sizeValues={variants.map((v) => v.value)}
                              productId={product.id}
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
                                type="button"
                                aria-pressed={isSelected}
                                aria-describedby={variantName.trim().toLowerCase() === 'size' && sizeError && !hasSelectedSize ? 'product-size-error' : undefined}
                                aria-label={`${variantName}: ${variant.value}${isAvailable ? '' : ' (unavailable)'}`}
                                key={variant.id || `${variantName}-${variant.value}-${idx}`}
                                onClick={() => {
                                  if (isAvailable) {
                                    if (variantName.trim().toLowerCase() === 'size') setSizeError(false)
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [variantName]: variant.value,
                                    }))
                                    logUserActivity('product_option_selected', {
                                      productId: product.id,
                                      optionName: variantName,
                                      optionValue: variant.value,
                                    })
                                    if (variant.image) {
                                      setOverrideImage(variant.image)
                                    }
                                  }
                                }}
                                disabled={!isAvailable}
                                className={`min-h-11 min-w-11 max-w-full whitespace-normal px-4 py-2 rounded-lg border-2 font-medium transition-all ${
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
                        {variantName.trim().toLowerCase() === 'size' && sizeError && !hasSelectedSize && (
                          <p id="product-size-error" role="alert" className="mt-3 text-sm font-semibold text-red-700 dark:text-red-400">Please select a size to continue</p>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {!hasSelectedSize && <p className="text-sm text-muted-foreground" role="status">Choose a size before adding this product to your cart.</p>}

              {isJacket && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-sm font-medium">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                        <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_3.5rem] gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.5rem]">
                      <Button
                        size="lg"
                        className="col-span-2 min-h-14 min-w-0 h-auto whitespace-normal px-3 py-3 text-base sm:col-span-1 lg:text-lg"
                        onClick={() => handleAddToCart()}
                        disabled={!product.inStock}
                      >
                        <AnimatePresence mode="wait">
                          {addedToCart ? (
                            <motion.div
                              key="added-jacket"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex min-w-0 flex-wrap items-center justify-center gap-2"
                            >
                              <Check className="h-5 w-5" />
                              Added to Cart!
                            </motion.div>
                          ) : (
                            <motion.div
                              key="add-jacket"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex min-w-0 flex-wrap items-center justify-center gap-2"
                            >
                              <ShoppingCart className="h-5 w-5" />
                              Add to Cart
                              ${(getPrice() * quantity).toFixed(2)}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Button>
                      <Button
                        size="lg"
                        className="min-h-14 min-w-0 h-auto whitespace-normal bg-red-700 px-3 py-3 text-base font-bold text-white shadow-md ring-1 ring-red-900/10 hover:bg-red-800 lg:text-lg"
                        onClick={() => handleBuyNow()}
                        disabled={!product.inStock}
                      >
                        <ShoppingBag className="h-5 w-5" />
                        Buy Now
                      </Button>
                      {wishlistButton}
                    </div>
                  </div>

                  <ProductDeliveryPolicies quantity={quantity} product={product} />

                  <div className="rounded-md border bg-muted/30 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">Want a custom design?</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Open the design studio to add embroidery, artwork, measurements, and jacket options.</p>
                      </div>
                      <Link href={`/customize/${product.slug}`} className="shrink-0">
                        <Button size="lg" className="w-full sm:w-auto" disabled={!product.inStock}>
                          <Palette className="mr-2 h-5 w-5" />
                          Customize Design
                        </Button>
                      </Link>
                    </div>
                  </div>


                </div>
              )}


              <Separator />


              {/* Quantity and Add to Cart */}
              {!isJacket && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
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

                  <div className="grid grid-cols-[minmax(0,1fr)_3.5rem] gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.5rem]">
                    <Button
                      size="lg"
                      className="col-span-2 min-h-14 min-w-0 h-auto whitespace-normal px-3 py-3 text-base sm:col-span-1 lg:text-lg"
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
                            className="flex min-w-0 flex-wrap items-center justify-center gap-2"
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
                            className="flex min-w-0 flex-wrap items-center justify-center gap-2"
                          >
                            <ShoppingCart className="h-5 w-5" />
                            Add to Cart
                            ${(getPrice() * quantity).toFixed(2)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                    <Button
                      size="lg"
                      className="min-h-14 min-w-0 h-auto whitespace-normal bg-red-700 px-3 py-3 text-base font-bold text-white shadow-md ring-1 ring-red-900/10 hover:bg-red-800 lg:text-lg"
                      onClick={() => handleBuyNow()}
                      disabled={!product.inStock}
                    >
                      <ShoppingBag className="h-5 w-5" />
                      Buy Now
                    </Button>
                    {wishlistButton}
                  </div>
                </div>
              )}

              {!isJacket && <ProductDeliveryPolicies quantity={quantity} product={product} />}



            </motion.div>

            <section className="min-w-0 rounded-xl border bg-muted/25 px-4 py-5 sm:px-5 lg:col-start-1 lg:row-start-2" aria-labelledby="product-details-heading">
              <h2 id="product-details-heading" className="text-lg font-semibold">Product details</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Explore {product.name}, including its materials, available options, sizing, and customization details.</p>
              <ProductCopy description={product.description} specificationDetails={product.specificationDetails} careInstructions={product.careInstructions} />
              {(Object.keys(groupedVariants).length > 0 || product.measurementFields?.length || product.embroidery?.available) && (
                <div className="mt-3">
                  <CopySection title="Available sizes & fit" accent="border-l-amber-400">
                <dl className="divide-y text-sm">
                  {Object.entries(groupedVariants).map(([name, variants]) => (
                    <div key={name} className="grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)] gap-3 py-2.5"><dt className="font-medium">{name}</dt><dd className="text-muted-foreground">{variants.map((variant) => variant.value).join(', ')}</dd></div>
                  ))}
                  {!!product.measurementFields?.length && <div className="grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)] gap-3 py-2.5"><dt className="font-medium">Fit</dt><dd className="text-muted-foreground">Made-to-measure available</dd></div>}
                  {product.embroidery?.available && <div className="grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)] gap-3 py-2.5"><dt className="font-medium">Details</dt><dd className="text-muted-foreground">Optional monogram or embroidery</dd></div>}
                </dl>
                  </CopySection>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <Link href="/materials-colors" className="font-medium underline underline-offset-4">Materials & colors</Link>
                <Link href="/patches-embroidery" className="font-medium underline underline-offset-4">Patches & embroidery</Link>
              </div>
            </section>
          </div>

        </div>

        {relatedProducts}

        <section id="reviews" className="store-section store-section--plain scroll-mt-24">
          {Boolean(product.videos?.length) && <section className="section-shell space-y-4" aria-label="Product videos">
            <h2 className="text-2xl font-semibold">Product videos</h2>
            <p className="text-sm text-muted-foreground">See this product in action.</p>
            <div className="flex flex-wrap gap-3">{product.videos?.map((url, index) => <VideoMedia key={`${url}-${index}`} url={url} title={`${product.name} ? video ${index + 1}`} />)}</div>
          </section>}
          <div className="section-shell"><ReviewsSection productId={product.id} onReviewSubmitted={fetchProduct} /></div>
        </section>

        <section className="store-section store-section--soft store-section--accent" aria-labelledby="product-faq-heading">
          <div className="section-shell">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-5">
              <div><h2 id="product-faq-heading" className="text-2xl font-semibold">Questions about {categoryName}</h2><p className="mt-1 text-sm text-muted-foreground">Sizing, options, and ordering information for this style.</p></div>
              <Link href="/faq" className="text-sm font-semibold underline underline-offset-4">View all FAQs</Link>
            </div>
            <Accordion type="single" collapsible className="max-w-4xl">
              {productFaqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                    {faq.answer.map((paragraph, index) => <p key={index}><FaqText text={paragraph} /></p>)}
                    {faq.bullets.length > 0 && <ul className="list-disc pl-5">{faq.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}</ul>}
                    {faq.ordered.length > 0 && <ol className="list-decimal pl-5">{faq.ordered.map((step, index) => <li key={index}>{step}</li>)}</ol>}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <RecentlyViewed excludeProductId={product.id} sectionClassName="bg-background" />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 flex min-w-0 items-center gap-3 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur lg:hidden">
        <span className="min-w-0 flex-1 truncate text-lg font-semibold">${getPrice().toFixed(2)}</span>
        <Button onClick={() => {
          if (!hasSelectedSize) requestSizeSelection()
          else document.getElementById('purchase-options')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }} disabled={!product.inStock}>
          <Ruler className="mr-2 h-4 w-4" />{product.inStock ? 'Choose options' : 'Out of stock'}
        </Button>
      </div>

      <Footer />
    </div>
  )
}
