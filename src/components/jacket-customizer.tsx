'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Check, ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag, ShoppingCart } from 'lucide-react'
import { JacketSizeGuide } from '@/components/jacket-size-guide'
import { JacketDesignCanvas } from '@/components/jacket-design-canvas'
import { getCustomizedViews, hasJacketCustomization, type JacketCustomization } from '@/types/jacket-customization'
import { getCatalogArtworkCategory, isLetterOrNumberArtwork, type ArtworkCategory } from '@/components/jacket-artwork-catalog'

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
const PKR_PER_USD = 277.1
const TEXT_EMBROIDERY_FEE_PKR = 5000
const UPLOADED_ARTWORK_FEE_PKR = 5000
const ARTWORK_FEES_PKR: Partial<Record<ArtworkCategory, number>> = {
  Letters: 1000,
  Numbers: 1000,
  Flags: 3000,
  Badges: 3000,
  Mascots: 3500,
  Symbols: 3500,
  Sports: 3000,
  Animals: 4000,
  Varsity: 2000,
}

function pkrToUsd(amount: number) {
  return Math.round((amount / PKR_PER_USD) * 100) / 100
}

function getCustomizationFee(customization: JacketCustomization) {
  let feePkr = 0
  for (const side of [customization.front, customization.back]) {
    if (!side) continue
    if (side.text?.value.trim()) feePkr += TEXT_EMBROIDERY_FEE_PKR
    for (const artwork of side.artworks || []) {
      if (artwork.source === 'upload') {
        feePkr += UPLOADED_ARTWORK_FEE_PKR
        continue
      }
      const category = getCatalogArtworkCategory(artwork.catalogId)
      if (category) feePkr += ARTWORK_FEES_PKR[category] || 0
      else if (isLetterOrNumberArtwork(artwork.catalogId)) feePkr += ARTWORK_FEES_PKR.Letters || 0
    }
  }
  return pkrToUsd(feePkr)
}

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
}: JacketCustomizerProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [customization, setCustomization] = useState<JacketCustomization>({})
  const [sizingMode, setSizingMode] = useState<'standard' | 'measure'>('standard')
  const [measurements, setMeasurements] = useState<Record<string, string>>({})

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

  type Step = { type: 'option'; name: string } | { type: 'design' } | { type: 'sizing' } | { type: 'review' }
  const steps: Step[] = [
    ...optionSteps.map((name): Step => ({ type: 'option', name })),
    { type: 'design' },
    ...(hasSize || hasMeasurements ? [{ type: 'sizing' } as Step] : []),
    { type: 'review' },
  ]

  const currentStep = steps[stepIndex]
  const customizationFee = hasJacketCustomization(customization) ? getCustomizationFee(customization) : 0
  const totalPrice = basePrice + customizationFee

  useEffect(() => {
    onCustomizationFeeChange?.(customizationFee)
  }, [customizationFee, onCustomizationFeeChange])

  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0))

  const stepLabel = (step: Step) => {
    if (step.type === 'option') return step.name
    if (step.type === 'design') return 'Design'
    if (step.type === 'sizing') return 'Sizing'
    return 'Review'
  }

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
      customization: hasJacketCustomization(customization) ? customization : undefined,
    }
  }

  const handleAddToCart = () => {
    const details = getOrderDetails()
    onAddToCart(details.extraVariants, details.extraFee, details.customization)
  }

  const handleBuyNow = () => {
    const details = getOrderDetails()
    onBuyNow?.(details.extraVariants, details.extraFee, details.customization)
  }

  const isMultiStep = steps.length > 1

  const purchaseControls = (
    <div className="space-y-4">
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

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Button size="lg" className="h-14 text-base sm:text-lg" onClick={handleAddToCart} disabled={!inStock}>
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
                Add to Cart - ${(totalPrice * quantity).toFixed(2)}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
        {onBuyNow && (
          <Button size="lg" className="h-14 bg-red-700 text-base font-bold text-white shadow-md ring-1 ring-red-900/10 hover:bg-red-800 sm:text-lg" onClick={handleBuyNow} disabled={!inStock}>
            <ShoppingBag className="h-5 w-5 mr-2" />
            Buy Now
          </Button>
        )}
        <div className="justify-self-center sm:justify-self-auto">{wishlistButton}</div>
      </div>
      {customizationFee > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Customization added</span>
          <span className="font-semibold">+${customizationFee.toFixed(2)} USD</span>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {purchaseControls}

      {purchaseNotice}

      <Separator />

      {/* Step progress */}
      {isMultiStep && (
        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <button
              key={index}
              type="button"
              onClick={() => index <= stepIndex && setStepIndex(index)}
              disabled={index > stepIndex}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                index === stepIndex
                  ? 'border-primary bg-primary text-primary-foreground'
                  : index < stepIndex
                  ? 'border-primary/40 text-primary bg-primary/5'
                  : 'border-border text-muted-foreground cursor-not-allowed'
              }`}
            >
              {index + 1}. {stepLabel(step)}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {currentStep.type === 'option' && (
            <div>
              <Label className="text-sm font-medium block mb-2">{currentStep.name}</Label>
              <div className="flex flex-wrap gap-2">
                {groupedVariants[currentStep.name].map((variant, idx) => {
                  const isSelected = selectedVariants[currentStep.name] === variant.value
                  return (
                    <button
                      key={variant.id || `${currentStep.name}-${variant.value}-${idx}`}
                      onClick={() => {
                        if (!variant.inStock) return
                        onSelectVariant(currentStep.name, variant.value, variant.image)
                      }}
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
                      {variant.priceAdjust ? ` (${variant.priceAdjust > 0 ? '+' : ''}$${variant.priceAdjust.toFixed(2)})` : ''}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {currentStep.type === 'design' && (
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Live customization</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add embroidered text or artwork and position it on the jacket. Customization pricing updates per item.
                </p>
              </div>
              <JacketDesignCanvas
                images={images}
                maxTextLength={product.embroidery?.maxChars || 24}
                selectedSize={selectedVariants.Size}
                value={customization}
                onChange={setCustomization}
              />
            </div>
          )}

          {currentStep.type === 'sizing' && (
            <div className="space-y-4">
              {hasSize && hasMeasurements && (
                <div className="flex gap-2">
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
                    <Label className="text-sm font-medium">Size</Label>
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
                  <Label className="text-sm font-medium block mb-2">Body Measurements (inches)</Label>
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
          )}

          {currentStep.type === 'review' && (
            <div className="space-y-1.5">
              {optionSteps.map((name) =>
                selectedVariants[name] ? (
                  <div key={name} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-medium">{selectedVariants[name]}</span>
                  </div>
                ) : null
              )}
              {sizingMode === 'standard' && selectedVariants['Size'] && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium">{selectedVariants['Size']}</span>
                </div>
              )}
              {sizingMode === 'measure' &&
                (product.measurementFields || []).map((field) =>
                  measurements[field] ? (
                    <div key={field} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{field}</span>
                      <span className="font-medium">{measurements[field]}in</span>
                    </div>
                  ) : null
                )}
              {getCustomizedViews(customization).map((view) => {
                const side = customization[view]!
                return (
                  <div key={view} className="border-t pt-2 first:border-t-0 first:pt-0">
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{view}</p>
                    {side.text?.value.trim() && <div className="flex justify-between text-sm"><span>Embroidery</span><span className="font-medium">{side.text.value.trim()}</span></div>}
                    {!!side.artworks?.length && <div className="flex justify-between text-sm"><span>Artwork</span><span className="max-w-[60%] text-right font-medium">{side.artworks.length} piece{side.artworks.length === 1 ? '' : 's'}</span></div>}
                  </div>
                )
              })}
              {customizationFee > 0 && (
                <div className="flex justify-between border-t pt-2 text-sm">
                  <span className="text-muted-foreground">Customization fee</span>
                  <span className="font-semibold">${customizationFee.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav (only shown when there's more than one step to move between) */}
      {isMultiStep && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={goBack} disabled={stepIndex === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          {currentStep.type !== 'review' && (
            <Button type="button" size="sm" onClick={goNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}

    </div>
  )
}
