'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Header } from '@/components/header'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useRecentlyViewedStore } from '@/store/recently-viewed'
import { ReviewsSection } from '@/components/reviews-section'
import { Breadcrumbs } from '@/components/breadcrumbs'
// import { FrequentlyBoughtTogether } from '@/components/FrequentlyBoughtTogether'
import { SizeGuide } from '@/components/size-guide'
import { JacketSizeGuide } from '@/components/jacket-size-guide'
import { YouMayAlsoLike } from '@/components/YouMayAlsoLike'
import { RecentlyViewed } from '@/components/RecentlyViewed'
import { Footer } from '@/components/footer'
import { buildCategoryUrl, isJacketCategoryPath } from '@/lib/categories'
import { logUserActivity } from '@/lib/activity'
import { JacketCustomizer } from '@/components/jacket-customizer'
import {
  Star,
  Check,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  RefreshCw,
  Heart,
  ZoomIn,
  Ruler,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export interface ProductDetailData {
  id: string
  name: string
  slug: string
  description: string
  specificationDetails?: string
  careInstructions?: string
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
  averageRating?: number
  reviewCount?: number
  stockCount?: number
}

export interface ProductFaqData {
  id: string
  question: string
  answer: string[]
  bullets: string[]
  ordered: string[]
}

function getDefaultVariants(variants: ProductDetailData['variants']): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const variant of variants || []) {
    if (variant.inStock && defaults[variant.name] === undefined) defaults[variant.name] = variant.value
  }
  return defaults
}

interface ProductDetailViewProps {
  slug: string
  initialProduct: ProductDetailData
  faqs?: ProductFaqData[]
}

export function ProductDetailView({ slug, initialProduct, faqs = [] }: ProductDetailViewProps) {
  const { data: session } = useSession()

  const [product, setProduct] = useState<ProductDetailData>(initialProduct)
  const [selectedImage, setSelectedImage] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [overrideImage, setOverrideImage] = useState<string | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => getDefaultVariants(initialProduct.variants))
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product?.id || ''))
  const addToWishlist = useWishlistStore((state) => state.addItem)
  const removeFromWishlist = useWishlistStore((state) => state.removeItem)
  const addItem = useCartStore((state) => state.addItem)
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
      images: (product.images || []).map((img) => ({
        url: img.url,
        alt: img.alt || '',
      })),
      category: product.category,
      isFeatured: product.isFeatured,
    })
    logUserActivity('view_product', { productId: product.id, name: product.name })
  }, [product?.id])

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
    if (!product.compareAtPrice) return null
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

  const groupedVariants = groupVariants(product.variants)
  const discount = getDiscount()
  const categoryPath = product.categoryPath && product.categoryPath.length > 0
    ? product.categoryPath
    : product.category
      ? [product.category]
      : []
  const categoryHref = categoryPath.length > 0 ? buildCategoryUrl(categoryPath) : '/'
  const isJacket = isJacketCategoryPath(categoryPath)
  const categoryName = categoryPath.at(-1)?.name || product.category.name
  const sizeVariants = Object.entries(groupedVariants).find(([name]) => name.toLowerCase() === 'size')?.[1] || []
  const fallbackFaqs: ProductFaqData[] = [
    ...(isJacket || sizeVariants.length > 0 ? [{
      id: 'fit',
      question: `How do I choose the right size for ${categoryName}?`,
      answer: ['Use the size guide beside the price to measure your chest, shoulders, sleeves, and jacket length. For measurements of this exact style, contact our team before ordering.'],
      bullets: [], ordered: [],
    }] : []),
    {
      id: 'options',
      question: `What options are available for this ${categoryName.toLowerCase()} style?`,
      answer: ['Available selections, when offered, are shown in the product details and purchase controls above. Contact our team if you need an option that is not listed.'],
      bullets: [], ordered: [],
    },
    {
      id: 'delivery',
      question: 'Where can I check shipping and return eligibility?',
      answer: ['See the shipping and returns links beside the purchase controls for current delivery details and exclusions for personalized items.'],
      bullets: [], ordered: [],
    },
  ]
  const productFaqs = [...faqs, ...fallbackFaqs.filter((fallback) =>
    !faqs.some((faq) => faq.question.toLowerCase() === fallback.question.toLowerCase())
  )].slice(0, 4)

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
      <Header />

      {/* Product Detail */}
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="container mx-auto px-4 py-6 lg:py-8">
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
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-10">
            {/* Image Gallery */}
            <div className="space-y-4">
              <motion.div
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                <button type="button" onClick={() => setZoomOpen(true)} className="absolute inset-0" aria-label={`Enlarge image of ${product.name}`}>
                  <Image
                    src={overrideImage || (product.images?.[selectedImage]?.url || '/placeholder.png')}
                    alt={product.images?.[selectedImage]?.alt || product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain"
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
                        className="object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
              <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
                <DialogContent className="max-w-5xl border-0 bg-background p-4">
                  <DialogTitle className="pr-8 text-base">{product.name}</DialogTitle>
                  <div className="relative h-[75vh] w-full">
                    <Image src={overrideImage || (product.images?.[selectedImage]?.url || '/placeholder.png')} alt={product.images?.[selectedImage]?.alt || product.name} fill sizes="100vw" className="object-contain" />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Product Info */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              id="purchase-options"
              className="space-y-6 scroll-mt-24 lg:border-l lg:pl-10"
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
                <div className="pt-2">
                  {isJacket ? <JacketSizeGuide sizes={sizeVariants.map((variant) => variant.value)} /> : sizeVariants.length > 0 ? <SizeGuide categorySlug={product.category?.slug} sizeValues={sizeVariants.map((variant) => variant.value)} /> : null}
                </div>
              </div>

              <section className="border-y bg-muted/35 px-4 py-5 sm:px-5" aria-labelledby="product-details-heading">
                <h2 id="product-details-heading" className="text-lg font-semibold">Product details</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{product.description}</p>
                {product.specificationDetails && <details className="mt-4 border-t pt-3 text-sm"><summary className="cursor-pointer font-semibold">Specifications</summary><p className="mt-3 whitespace-pre-line leading-6 text-muted-foreground">{product.specificationDetails}</p></details>}
                {product.careInstructions && <details className="mt-3 border-t pt-3 text-sm"><summary className="cursor-pointer font-semibold">Care instructions</summary><p className="mt-3 whitespace-pre-line leading-6 text-muted-foreground">{product.careInstructions}</p></details>}
                {(Object.keys(groupedVariants).length > 0 || product.measurementFields?.length || product.embroidery?.available) && (
                  <dl className="mt-4 divide-y border-t text-sm">
                    {Object.entries(groupedVariants).map(([name, variants]) => (
                      <div key={name} className="grid grid-cols-[5.5rem_1fr] gap-3 py-2.5"><dt className="font-medium">{name}</dt><dd className="text-muted-foreground">{variants.map((variant) => variant.value).join(', ')}</dd></div>
                    ))}
                    {!!product.measurementFields?.length && <div className="grid grid-cols-[5.5rem_1fr] gap-3 py-2.5"><dt className="font-medium">Fit</dt><dd className="text-muted-foreground">Made-to-measure available</dd></div>}
                    {product.embroidery?.available && <div className="grid grid-cols-[5.5rem_1fr] gap-3 py-2.5"><dt className="font-medium">Details</dt><dd className="text-muted-foreground">Optional monogram or embroidery</dd></div>}
                  </dl>
                )}
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  <Link href="/materials-colors" className="font-medium underline underline-offset-4">Materials & colors</Link>
                  <Link href="/patches-embroidery" className="font-medium underline underline-offset-4">Patches & embroidery</Link>
                </div>
              </section>

              {isJacket && (
                <div>
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
                </div>
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

              <div className="grid gap-3 border-t pt-5 text-sm sm:grid-cols-2">
                <Link href="/shipping" className="flex items-start gap-3 rounded-md bg-muted/40 p-3 hover:bg-muted">
                  <Truck className="mt-0.5 h-5 w-5 shrink-0" />
                  <span><strong className="block">Shipping</strong><span className="text-muted-foreground">Free standard shipping over $50. View delivery details.</span></span>
                </Link>
                <Link href="/returns" className="flex items-start gap-3 rounded-md bg-muted/40 p-3 hover:bg-muted">
                  <RefreshCw className="mt-0.5 h-5 w-5 shrink-0" />
                  <span><strong className="block">Returns</strong><span className="text-muted-foreground">See eligibility and custom-item exclusions.</span></span>
                </Link>
              </div>
            </motion.div>
          </div>

        </div>

        <section className="border-y bg-muted/35 py-12 lg:py-14">
          <div className="container mx-auto px-4"><YouMayAlsoLike currentProduct={product} /></div>
        </section>

        <section id="reviews" className="scroll-mt-24 border-b py-12 lg:py-14">
          <div className="container mx-auto px-4"><ReviewsSection productId={product.id} onReviewSubmitted={fetchProduct} /></div>
        </section>

        <section className="border-b bg-muted/35 py-12 lg:py-14" aria-labelledby="product-faq-heading">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-5">
              <div><h2 id="product-faq-heading" className="text-2xl font-semibold">Questions about {categoryName}</h2><p className="mt-1 text-sm text-muted-foreground">Sizing, options, and ordering information for this style.</p></div>
              <Link href="/faq" className="text-sm font-semibold underline underline-offset-4">View all FAQs</Link>
            </div>
            <Accordion type="single" collapsible className="max-w-4xl">
              {productFaqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                    {faq.answer.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
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

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur lg:hidden">
        <span className="min-w-0 flex-1 truncate text-lg font-semibold">${getPrice().toFixed(2)}</span>
        <Button onClick={() => document.getElementById('purchase-options')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} disabled={!product.inStock}>
          <Ruler className="mr-2 h-4 w-4" />{product.inStock ? 'Choose options' : 'Out of stock'}
        </Button>
      </div>

      <Footer />
    </div>
  )
}
