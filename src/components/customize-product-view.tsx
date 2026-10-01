'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { FulfillmentNotice } from '@/components/fulfillment-notice'
import { JacketSizeGuide } from '@/components/jacket-size-guide'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { buildCategoryUrl, isJacketCategoryPath } from '@/lib/categories'
import { logUserActivity } from '@/lib/activity'
import type { JacketCustomization } from '@/types/jacket-customization'
import type { ProductDetailData } from '@/components/product-detail-view'
import { ArrowLeft, Heart, RefreshCw, Truck } from 'lucide-react'

const JacketCustomizer = dynamic(
  () => import('@/components/jacket-customizer').then((mod) => mod.JacketCustomizer),
  {
    ssr: false,
    loading: () => <CustomizerLoadingPanel />,
  }
)

function CustomizerLoadingPanel() {
  return (
    <div className="space-y-4 rounded-md border bg-card p-4" aria-busy="true">
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="h-14 animate-pulse rounded-md bg-muted" />
          <div className="h-14 animate-pulse rounded-md bg-muted" />
          <div className="mx-auto h-14 w-14 animate-pulse rounded-xl bg-muted sm:mx-0" />
        </div>
      </div>
      <div className="border-t pt-4">
        <div className="mb-3 h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-20 animate-pulse rounded-md bg-muted" />
          <div className="h-20 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
      <div className="border-t pt-4">
        <div className="mb-4 flex gap-2">
          <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-[340px] animate-pulse rounded-lg bg-muted sm:h-[420px]" />
        <p className="mt-4 text-sm text-muted-foreground">Loading design tools...</p>
      </div>
    </div>
  )
}

function getDefaultVariants(variants: ProductDetailData['variants']): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const variant of variants || []) {
    if (variant.inStock && defaults[variant.name] === undefined) defaults[variant.name] = variant.value
  }
  return defaults
}

export function CustomizeProductView({ product }: { product: ProductDetailData }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [selectedImage, setSelectedImage] = useState(0)
  const [overrideImage, setOverrideImage] = useState<string | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => getDefaultVariants(product.variants))
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [customizationFee, setCustomizationFee] = useState(0)

  const addItem = useCartStore((state) => state.addItem)
  const setDirectOrderItem = useCartStore((state) => state.setDirectOrderItem)
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id))
  const addToWishlist = useWishlistStore((state) => state.addItem)
  const removeFromWishlist = useWishlistStore((state) => state.removeItem)

  const categoryPath = product.categoryPath && product.categoryPath.length > 0 ? product.categoryPath : [product.category]
  const categoryHref = categoryPath.length > 0 ? buildCategoryUrl(categoryPath) : '/'
  const isJacket = isJacketCategoryPath(categoryPath)

  useEffect(() => {
    logUserActivity('view_product', { source: 'customize_page', productId: product.id, name: product.name })
  }, [product.id, product.name])

  useEffect(() => {
    void import('@/components/jacket-customizer')
  }, [])

  const getSelectedVariantPriceAdjust = () => {
    return Object.entries(selectedVariants).reduce((total, [name, value]) =>
      total + (product.variants.find((variant) => variant.name === name && variant.value === value)?.priceAdjust || 0), 0)
  }

  const getSelectedVariantCombination = () => {
    if (Object.keys(selectedVariants).length === 0) return null
    return Object.entries(selectedVariants).map(([name, value]) => ({ name, value }))
  }

  const getPrice = () => product.price + getSelectedVariantPriceAdjust()

  const buildOrderItem = (
    extraVariants: Array<{ name: string; value: string }> = [],
    extraFee: number = 0,
    customization?: JacketCustomization
  ) => {
    const variantCombination = getSelectedVariantCombination()
    const combined = [...(variantCombination || []), ...extraVariants]
    const variants = combined.length > 0 ? combined : [{ name: 'Standard', value: 'Default' }]
    return {
      productId: product.id,
      name: product.name,
      price: getPrice() + extraFee,
      image: product.images?.[0]?.url || '/placeholder.png',
      variants,
      customization,
    }
  }

  const handleAddToCart = (
    extraVariants: Array<{ name: string; value: string }> = [],
    extraFee: number = 0,
    customization?: JacketCustomization
  ) => {
    const item = buildOrderItem(extraVariants, extraFee, customization)
    addItem({ ...item, quantity })
    logUserActivity('add_to_cart', {
      source: 'customize_page',
      productId: product.id,
      name: product.name,
      price: item.price,
      quantity,
      variants: item.variants,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleBuyNow = (
    extraVariants: Array<{ name: string; value: string }> = [],
    extraFee: number = 0,
    customization?: JacketCustomization
  ) => {
    const item = buildOrderItem(extraVariants, extraFee, customization)
    setDirectOrderItem({ ...item, quantity: 1 })
    logUserActivity('begin_checkout', {
      source: 'customize_buy_now',
      productId: product.id,
      name: product.name,
      price: item.price,
      quantity: 1,
      variants: item.variants,
    })
    router.push('/checkout?mode=buy-now')
  }

  const handleSelectVariant = (groupName: string, value: string, image?: string | null) => {
    setSelectedVariants((prev) => ({ ...prev, [groupName]: value }))
    if (image) setOverrideImage(image)
  }

  const sizeVariants = product.variants.filter((variant) => variant.name.toLowerCase() === 'size')

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
      <Heart className={`h-6 w-6 transition-all duration-300 ${isInWishlist ? 'fill-rose-500 text-rose-500 scale-110' : 'text-muted-foreground'}`} />
    </Button>
  )

  if (!isJacket) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="mx-auto max-w-2xl rounded-md border bg-muted/30 p-6">
            <h1 className="text-2xl font-semibold">Customization is not available for this product.</h1>
            <p className="mt-2 text-muted-foreground">Choose a jacket product with customization options to start a design.</p>
            <Link href={categoryHref} className="mt-5 inline-flex">
              <Button>Back to category</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          <Breadcrumbs
            items={[
              ...categoryPath.map((ancestor, index) => ({
                label: ancestor.name,
                href: buildCategoryUrl(categoryPath.slice(0, index + 1)),
              })),
              { label: product.name, href: `/${[...categoryPath.map((item) => item.slug), product.slug].join('/')}` },
              { label: 'Customize' },
            ]}
            className="mb-6"
          />

          <Link href={`/${[...categoryPath.map((item) => item.slug), product.slug].join('/')}`} className="mb-5 inline-flex items-center text-sm font-medium underline underline-offset-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to product details
          </Link>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
            <aside className="space-y-4 lg:sticky lg:top-24">
              <div className="relative h-[320px] overflow-hidden rounded-lg bg-muted sm:aspect-square sm:h-auto">
                <Image
                  src={overrideImage || product.images?.[selectedImage]?.url || '/placeholder.png'}
                  alt={product.images?.[selectedImage]?.alt || product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-contain"
                  priority
                />
              </div>
              {(product.images?.length || 0) > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id || `image-${index}`}
                      type="button"
                      onClick={() => {
                        setSelectedImage(index)
                        setOverrideImage(null)
                      }}
                      className={`relative h-20 w-20 flex-none overflow-hidden rounded-lg border-2 transition-all sm:aspect-square sm:h-auto sm:w-auto ${selectedImage === index ? 'border-primary scale-105' : 'border-border hover:border-primary/50'}`}
                    >
                      <Image src={image.url} alt={image.alt || `${product.name} ${index + 1}`} fill sizes="120px" className="object-contain" />
                    </button>
                  ))}
                </div>
              )}
              <div className="rounded-md border bg-muted/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={categoryHref} className="text-sm text-muted-foreground hover:text-primary">{product.category.name}</Link>
                    <h1 className="mt-1 text-xl font-bold sm:text-2xl">{product.name}</h1>
                  </div>
                  <Badge variant={product.inStock ? 'secondary' : 'destructive'}>{product.inStock ? 'In Stock' : 'Out of Stock'}</Badge>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-2xl font-bold text-primary sm:text-3xl">${(getPrice() + customizationFee).toFixed(2)}</p>
                  {customizationFee > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Jacket ${getPrice().toFixed(2)} + customization ${customizationFee.toFixed(2)}
                    </p>
                  )}
                </div>
                {sizeVariants.length > 0 && (
                  <div className="mt-4">
                    <JacketSizeGuide sizes={sizeVariants.map((variant) => variant.value)} />
                  </div>
                )}
              </div>
            </aside>

            <section className="space-y-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Custom design studio</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Customize your jacket</h2>
                <p className="mt-2 text-muted-foreground">Choose options, add artwork or embroidery, review your design, then add it to cart or buy now.</p>
              </div>

              <div className="grid gap-3 rounded-md border bg-muted/30 p-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['1', 'Choose options', 'Select style, material, color, lining, and size.'],
                  ['2', 'Add design', 'Place text, letters, flags, badges, symbols, or uploads.'],
                  ['3', 'Adjust artwork', 'Drag items on the preview and set each patch size.'],
                  ['4', 'Review & order', 'Confirm the design, then add to cart or buy now.'],
                ].map(([step, title, text]) => (
                  <div key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{step}</span>
                    <span>
                      <strong className="block text-foreground">{title}</strong>
                      <span className="text-xs leading-5 text-muted-foreground">{text}</span>
                    </span>
                  </div>
                ))}
              </div>

              <JacketCustomizer
                product={product}
                images={product.images}
                selectedVariants={selectedVariants}
                onSelectVariant={handleSelectVariant}
                basePrice={getPrice()}
                quantity={quantity}
                onQuantityChange={setQuantity}
                addedToCart={addedToCart}
                inStock={product.inStock}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onCustomizationFeeChange={setCustomizationFee}
                purchaseNotice={
                  <>
                    <FulfillmentNotice compact />
                    <div className="grid gap-3 border-t pt-5 text-sm sm:grid-cols-2">
                      <Link href="/shipping" className="interactive-lift flex items-start gap-3 rounded-md border bg-muted/30 p-3 hover:bg-muted">
                        <Truck className="mt-0.5 h-5 w-5 shrink-0" />
                        <span><strong className="block">Shipping</strong><span className="text-muted-foreground">$30 for one jacket; two or more require a quote.</span></span>
                      </Link>
                      <Link href="/returns" className="interactive-lift flex items-start gap-3 rounded-md border bg-muted/30 p-3 hover:bg-muted">
                        <RefreshCw className="mt-0.5 h-5 w-5 shrink-0" />
                        <span><strong className="block">Returns</strong><span className="text-muted-foreground">See eligibility and custom-item exclusions.</span></span>
                      </Link>
                    </div>
                  </>
                }
                wishlistButton={wishlistButton}
              />
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
