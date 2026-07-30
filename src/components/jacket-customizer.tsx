'use client'

import { ReactNode, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Check, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart } from 'lucide-react'

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

interface JacketCustomizerProps {
  product: JacketCustomizerProduct
  selectedVariants: Record<string, string>
  onSelectVariant: (groupName: string, value: string, image?: string | null) => void
  basePrice: number
  quantity: number
  onQuantityChange: (quantity: number) => void
  addedToCart: boolean
  inStock: boolean
  onAddToCart: (extraVariants: Array<{ name: string; value: string }>, extraFee: number) => void
  wishlistButton?: ReactNode
}

export function JacketCustomizer({
  product,
  selectedVariants,
  onSelectVariant,
  basePrice,
  quantity,
  onQuantityChange,
  addedToCart,
  inStock,
  onAddToCart,
  wishlistButton,
}: JacketCustomizerProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [monogramText, setMonogramText] = useState('')
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

  type Step = { type: 'option'; name: string } | { type: 'monogram' } | { type: 'sizing' } | { type: 'review' }
  const steps: Step[] = [
    ...optionSteps.map((name): Step => ({ type: 'option', name })),
    ...(embroideryAvailable ? [{ type: 'monogram' } as Step] : []),
    ...(hasSize || hasMeasurements ? [{ type: 'sizing' } as Step] : []),
    { type: 'review' },
  ]

  const currentStep = steps[stepIndex]
  const monogramFee = monogramText.trim() && embroideryAvailable ? product.embroidery!.fee : 0
  const totalPrice = basePrice + monogramFee

  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0))

  const stepLabel = (step: Step) => {
    if (step.type === 'option') return step.name
    if (step.type === 'monogram') return 'Monogram'
    if (step.type === 'sizing') return 'Sizing'
    return 'Review'
  }

  const handleAddToCart = () => {
    const extraVariants: Array<{ name: string; value: string }> = []
    if (monogramText.trim()) {
      extraVariants.push({ name: 'Monogram', value: monogramText.trim() })
    }
    if (sizingMode === 'measure') {
      for (const field of product.measurementFields || []) {
        const value = measurements[field]
        if (value) extraVariants.push({ name: `Measurement: ${field}`, value: `${value}in` })
      }
    }
    onAddToCart(extraVariants, monogramFee)
  }

  const isMultiStep = steps.length > 1

  return (
    <div className="space-y-4">
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

          {currentStep.type === 'monogram' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium block">
                Monogram / Embroidery (optional{product.embroidery?.fee ? ` — +$${product.embroidery.fee.toFixed(2)}` : ''})
              </Label>
              <Input
                placeholder="e.g. J.D."
                value={monogramText}
                maxLength={product.embroidery?.maxChars || 20}
                onChange={(e) => setMonogramText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {monogramText.length}/{product.embroidery?.maxChars || 20} characters
              </p>
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
                  <Label className="text-sm font-medium block mb-2">Size</Label>
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
                  <div className="grid grid-cols-2 gap-3">
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
              {monogramText.trim() && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monogram</span>
                  <span className="font-medium">{monogramText.trim()}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav (only shown when there's more than one step to move between) */}
      {isMultiStep && (
        <div className="flex items-center justify-between pt-2">
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

      <Separator />

      {/* Quantity and Add to Cart - always visible, on every step */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
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

        <div className="flex gap-4">
          <Button size="lg" className="flex-1 h-14 text-lg" onClick={handleAddToCart} disabled={!inStock}>
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
          {wishlistButton}
        </div>
      </div>
    </div>
  )
}
