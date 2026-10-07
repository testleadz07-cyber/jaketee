'use client'

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Check, Loader2, Minus, Plus, ShoppingBag, ShoppingCart } from 'lucide-react'
import { JacketSizeGuide } from '@/components/jacket-size-guide'
import { JacketDesignCanvas } from '@/components/jacket-design-canvas'
import { captureJacketDesignPreviews, getJacketChestWidth } from '@/lib/jacket-design-preview'
import { JACKET_VIEWS, getCustomizedViews, getJacketViewLabel, hasJacketCustomization, type JacketCustomization } from '@/types/jacket-customization'

export interface JacketCustomizerVariant {
  id?: string
  name: string
  value: string
  priceAdjust: number
  inStock: boolean
  image?: string | null
}

export interface JacketCustomizerProduct {
  variants: JacketCustomizerVariant[]
  embroidery?: { available: boolean; fee: number; maxChars: number }
  measurementFields?: string[]
}

const OPTION_GROUP_ORDER = ['Style', 'Material', 'Color', 'Lining']
import { getCustomizationFee } from '@/lib/customization-pricing'

interface JacketCustomizerProps {
  product: JacketCustomizerProduct
  images: Array<{ url: string; alt?: string | null }>
  selectedVariants: Record<string, string>
  onSelectVariant: (groupName: string, value: string, image?: string | null) => void
  basePrice: number
  quantity: number
  onQuantityChange: (quantity: number) => void
  addedToCart: boolean
  inStock: boolean
  onAddToCart: (extraVariants: Array<{ name: string; value: string }>, extraFee: number, customization?: JacketCustomization) => void
  onBuyNow?: (extraVariants: Array<{ name: string; value: string }>, extraFee: number, customization?: JacketCustomization) => void
  purchaseNotice?: ReactNode
  wishlistButton?: ReactNode
  onCustomizationFeeChange?: (fee: number) => void
  onStepChange?: (step: string, index: number) => void
  onDifficulty?: (reason: string) => void
}

export function JacketCustomizer({
  product,
  images,
  selectedVariants,
  onSelectVariant,
  basePrice,
  quantity,
  onQuantityChange,
  addedToCart,
  inStock,
  onAddToCart,
  onBuyNow,
  purchaseNotice,
  wishlistButton,
  onCustomizationFeeChange,
  onStepChange,
  onDifficulty,
}: JacketCustomizerProps) {

  const [customization, setCustomization] = useState<JacketCustomization>({})
  const [sizingMode, setSizingMode] = useState<'standard' | 'measure'>('standard')
  const [measurements, setMeasurements] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const processingRef = useRef(false)
  const [captureError, setCaptureError] = useState<string | null>(null)

  const groupedVariants = useMemo(() => {
    const groups: Record<string, JacketCustomizerVariant[]> = {}
    for (const variant of product.variants || []) {
      if (!groups[variant.name]) groups[variant.name] = []
      const isDuplicate = groups[variant.name].some((v) => v.value === variant.value)
      if (!isDuplicate) groups[variant.name].push(variant)
    }
    return groups
  }, [product.variants])

  const hasSize = !!groupedVariants['Size']?.length
  const hasMeasurements = !!product.measurementFields?.length
  const embroideryAvailable = !!product.embroidery?.available

  const optionSteps = OPTION_GROUP_ORDER.filter((name) => groupedVariants[name]?.length)

  const customizationFee = hasJacketCustomization(customization) ? getCustomizationFee(customization) : 0
  const totalPrice = basePrice + customizationFee

  useEffect(() => {
    onCustomizationFeeChange?.(customizationFee)
  }, [customizationFee, onCustomizationFeeChange])



  const getOrderDetails = () => {
    const extraVariants: Array<{ name: string; value: string }> = []
    if (sizingMode === 'measure') {
      for (const field of product.measurementFields || []) {
        const value = measurements[field]
        if (value) extraVariants.push({ name: `Measurement: ${field}`, value: `${value}in` })
      }
    }
    return {
      extraVariants,
      extraFee: customizationFee,
      customization: hasJacketCustomization(customization) ? structuredClone(customization) : undefined,
    }
  }

  const attachSnapshots = async (design: JacketCustomization): Promise<JacketCustomization> => {
    const snapshots = await captureJacketDesignPreviews(design, images, getJacketChestWidth(selectedVariants.Size))
    const res = await fetch('/api/upload-snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshots }),
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) throw new Error('Your design previews could not be saved. Please retry.')
    const data = await res.json()
    if (!data.snapshots || snapshots.some(({ view }) => typeof data.snapshots[view] !== 'string' || !data.snapshots[view].startsWith('https://'))) {
      throw new Error('Some design previews are missing. Please retry.')
    }
    return { ...design, snapshots: data.snapshots, snapshotUrl: data.snapshots[snapshots[0].view] }
  }

  const handlePurchase = async (buyNow: boolean) => {
    if (processingRef.current) return
    processingRef.current = true
    setIsProcessing(true)
    setCaptureError(null)
    try {
      const details = getOrderDetails()
      if (details.customization) details.customization = await attachSnapshots(details.customization)
      if (buyNow) onBuyNow?.(details.extraVariants, details.extraFee, details.customization)
      else onAddToCart(details.extraVariants, details.extraFee, details.customization)
    } catch (error) {
      setCaptureError(error instanceof Error && error.name !== 'TimeoutError' && error.name !== 'SecurityError' ? error.message : 'Your design previews could not be saved. Please retry.')
    } finally {
      processingRef.current = false
      setIsProcessing(false)
    }
  }

  const handleAddToCart = () => handlePurchase(false)
  const handleBuyNow = () => handlePurchase(true)

  const purchaseControls = (
    <div className="space-y-4">
      {captureError && <p role="alert" className="text-sm text-destructive">{captureError} Your design is still here. Select Add to Cart or Buy Now to try again.</p>}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium">Quantity:</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
          <Button variant="outline" size="icon" onClick={() => onQuantityChange(quantity + 1)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Button size="lg" className="min-h-14 h-auto min-w-0 w-full whitespace-normal px-3 py-3 text-base" onClick={handleAddToCart} disabled={!inStock || isProcessing}>
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
            ) : isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving Design...
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
                Add to Cart - ${(totalPrice * quantity).toFixed(2)}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
        {onBuyNow && (
          <Button size="lg" className="h-14 min-w-0 w-full bg-red-700 text-base font-bold text-white shadow-md ring-1 ring-red-900/10 hover:bg-red-800" onClick={handleBuyNow} disabled={!inStock || isProcessing}>
            {isProcessing ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <ShoppingBag className="h-5 w-5 mr-2" />}
            {isProcessing ? 'Saving...' : 'Buy Now'}
          </Button>
        )}
        <div className="col-span-full justify-self-center">{wishlistButton}</div>
      </div>
      {customizationFee > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Customization added</span>
          <span className="font-semibold">+${customizationFee.toFixed(2)} USD</span>
        </div>
      )}
    </div>
  )

  const optionBlocks = optionSteps.map((name) => (
    <div key={name} className="rounded-lg border bg-muted/10 p-4">
      <Label className="text-sm font-medium block mb-2">{name}</Label>
      <div className="flex flex-wrap gap-2">
        {groupedVariants[name].map((variant, idx) => {
          const isSelected = selectedVariants[name] === variant.value
          return (
            <button
              key={variant.id || `${name}-${variant.value}-${idx}`}
              onClick={() => {
                if (!variant.inStock) return
                onSelectVariant(name, variant.value, variant.image)
              }}
              disabled={!variant.inStock}
              className={`min-h-11 max-w-full break-words px-3 py-2 rounded-lg border-2 font-medium transition-all ${
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : variant.inStock
                  ? 'border-border hover:border-primary/50 bg-background'
                  : 'border-border bg-muted opacity-50 cursor-not-allowed'
              }`}
            >
              {variant.value}
              {variant.priceAdjust ? ` (${variant.priceAdjust > 0 ? '+' : ''}$${variant.priceAdjust.toFixed(2)})` : ''}
            </button>
          )
        })}
      </div>
    </div>
  ))

  const sizingBlock = (hasSize || hasMeasurements) && (
    <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
      <Label className="text-sm font-medium block mb-2">Sizing</Label>
      {hasSize && hasMeasurements && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={sizingMode === 'standard' ? 'default' : 'outline'}
            onClick={() => setSizingMode('standard')}
          >
            Standard Size
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sizingMode === 'measure' ? 'default' : 'outline'}
            onClick={() => setSizingMode('measure')}
          >
            Made-to-Measure
          </Button>
        </div>
      )}

      {(!hasMeasurements || sizingMode === 'standard') && hasSize && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <Label className="text-sm font-medium text-muted-foreground">Select Size</Label>
            <JacketSizeGuide sizes={groupedVariants['Size'].map((variant) => variant.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {groupedVariants['Size'].map((variant, idx) => {
              const isSelected = selectedVariants['Size'] === variant.value
              return (
                <button
                  key={variant.id || `Size-${variant.value}-${idx}`}
                  onClick={() => variant.inStock && onSelectVariant('Size', variant.value, variant.image)}
                  disabled={!variant.inStock}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : variant.inStock
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
      )}

      {hasMeasurements && (!hasSize || sizingMode === 'measure') && (
        <div>
          <Label className="text-sm font-medium block mb-2 text-muted-foreground">Body Measurements (inches)</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {product.measurementFields!.map((field) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{field}</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={measurements[field] || ''}
                  onChange={(e) => setMeasurements({ ...measurements, [field]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const reviewBlock = (
    <div className="rounded-lg border bg-muted/10 p-4 space-y-1.5">
      <Label className="text-sm font-medium block mb-2">Order Summary</Label>
      {optionSteps.map((name) =>
        selectedVariants[name] ? (
          <div key={name} className="flex justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{name}</span>
            <span className="min-w-0 max-w-[65%] break-words text-right font-medium">{selectedVariants[name]}</span>
          </div>
        ) : null
      )}
      {sizingMode === 'standard' && selectedVariants['Size'] && (
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Size</span>
          <span className="min-w-0 max-w-[65%] break-words text-right font-medium">{selectedVariants['Size']}</span>
        </div>
      )}
      {sizingMode === 'measure' &&
        (product.measurementFields || []).map((field) =>
          measurements[field] ? (
            <div key={field} className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{field}</span>
              <span className="min-w-0 max-w-[65%] break-words text-right font-medium">{measurements[field]}in</span>
            </div>
          ) : null
        )}
      {getCustomizedViews(customization).map((view) => {
        const side = customization[view] || {}
        return (
          <div key={view} className="border-t pt-2 first:border-t-0 first:pt-0 mt-2">
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{getJacketViewLabel(view)}</p>
            {side.text?.value.trim() && <div className="flex justify-between gap-3 text-sm"><span>Embroidery</span><span className="min-w-0 break-words text-right font-medium">{side.text.value.trim()}</span></div>}
            {!!side.artworks?.length && <div className="flex justify-between gap-3 text-sm"><span>Artwork</span><span className="max-w-[60%] text-right font-medium">{side.artworks.length} piece{side.artworks.length === 1 ? '' : 's'}</span></div>}
          </div>
        )
      })}
      {customizationFee > 0 && (
        <div className="flex justify-between border-t pt-2 mt-2 text-sm">
          <span className="text-muted-foreground">Customization fee</span>
          <span className="font-semibold">${customizationFee.toFixed(2)}</span>
        </div>
      )}
    </div>
  )

  return (
    <div className="w-full min-w-0" inert={isProcessing} aria-busy={isProcessing}>
      <JacketDesignCanvas
        images={images}
        maxTextLength={product.embroidery?.maxChars || 24}
        selectedSize={selectedVariants.Size}
        value={customization}
        onChange={setCustomization}
        onDifficulty={onDifficulty}
        leftContentTop={<div className="space-y-6">{optionBlocks}</div>}
        leftContentBottom={
          <div className="space-y-6 mt-6 pt-6 border-t">
            {sizingBlock}
            {reviewBlock}
            <Separator />
            {purchaseControls}
            {purchaseNotice}
          </div>
        }
      />
    </div>
  )
}
