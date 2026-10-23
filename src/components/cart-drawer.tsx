'use client'

import { getJacketTextSummary } from '@/types/jacket-customization'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { useCartStore } from '@/store/cart'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, Tag, X, Loader2 } from 'lucide-react'
import { fulfillmentConfig } from '@/config/fulfillment'
import Image from '@/components/optimized-image'
import Link from 'next/link'
import { getCustomizedViews, getJacketViewLabel } from '@/types/jacket-customization'
import { logUserActivity } from '@/lib/activity'

const subscribeToHydration = () => () => undefined

export function CartDrawer() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    getTotalPrice,
    appliedPromo,
    setAppliedPromo,
    clearAppliedPromo,
    getDiscountedTotalPrice
  } = useCartStore()

  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const { toast } = useToast()
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false)
  const visibleItems = hydrated ? items : []
  const visiblePromo = hydrated ? appliedPromo : null
  const visibleItemCount = visibleItems.reduce((total, item) => total + item.quantity, 0)

  // Coupon self-healing check: if subtotal falls below minOrderValue, remove it.
  useEffect(() => {
    if (appliedPromo && getTotalPrice() < appliedPromo.minOrderValue) {
      const code = appliedPromo.code
      clearAppliedPromo()
      toast({
        title: 'Coupon Removed',
        description: `Minimum order value of $${appliedPromo.minOrderValue.toFixed(2)} is no longer met for: ${code}`,
        variant: 'destructive',
      })
    }
  }, [items, appliedPromo, getTotalPrice, clearAppliedPromo, toast])

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoCodeInput.trim()) return

    setIsValidating(true)
    setValidationError(null)

    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCodeInput,
          subtotal: getTotalPrice(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setAppliedPromo(data)
        setPromoCodeInput('')
        toast({
          title: 'Coupon Applied!',
          description: `Code ${data.code} successfully applied.`,
        })
      } else {
        setValidationError(data.error || 'Failed to validate coupon.')
      }
    } catch {
      setValidationError('Failed to validate coupon code.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemovePromo = () => {
    clearAppliedPromo()
    toast({
      title: 'Coupon Removed',
      description: 'The coupon has been removed.',
    })
  }

  const subtotal = hydrated ? getTotalPrice() : 0
  const total = hydrated ? getDiscountedTotalPrice() : 0
  const discountAmount = visiblePromo ? subtotal - total : 0

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-11 w-11 shrink-0"
          aria-label={`Open shopping cart with ${visibleItemCount} items`}
          onClick={() => logUserActivity('cart_viewed', { itemCount: visibleItemCount, total, currency: 'USD' })}
        >
          <ShoppingBag className="h-5 w-5" />
          {visibleItems.length > 0 && (
            <span className="absolute right-0 top-0 flex h-5 min-w-5 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {visibleItemCount > 99 ? '99+' : visibleItemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90dvh] max-h-[90dvh] min-w-0 w-full max-w-full gap-0 overflow-hidden rounded-t-xl [overflow-wrap:anywhere] [&>button:last-child]:flex [&>button:last-child]:h-11 [&>button:last-child]:w-11 [&>button:last-child]:items-center [&>button:last-child]:justify-center">
        <SheetHeader className="shrink-0 pr-16">
          <SheetTitle className="flex min-w-0 flex-wrap items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({visibleItemCount} items)
          </SheetTitle>
          <SheetDescription>
            Review your items before checkout
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add some products to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-lg border bg-card p-3 sm:grid-cols-[5rem_minmax(0,1fr)] sm:p-4"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted sm:h-20 sm:w-20">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="line-clamp-2 font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground text-xs">
                      {item.variants.map(v => `${v.name}: ${v.value}`).join(', ')}
                    </p>
                    {item.customization && (
                      <div className="text-xs font-medium text-primary">
                        {getCustomizedViews(item.customization).map((view) => (
                          <p key={view}>
                            {getJacketViewLabel(view)}: {getJacketTextSummary(item.customization?.[view])}
                            {item.customization?.[view]?.artworks?.length ? `${getJacketTextSummary(item.customization?.[view]) ? ' + ' : ''}${item.customization[view]?.artworks?.length} artwork piece${item.customization[view]!.artworks!.length === 1 ? '' : 's'}` : ''}
                          </p>
                        ))}
                      </div>
                    )}
                    <p className="font-bold text-primary">
                      ${item.price.toFixed(2)}
                    </p>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-11 w-11"
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() =>
                            updateQuantity(item.id, Math.max(1, item.quantity - 1))
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-11 w-11"
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 text-destructive hover:text-destructive"
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() => {
                          logUserActivity('cart_item_removed', { productId: item.productId, quantity: item.quantity })
                          removeItem(item.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <SheetFooter className="max-h-[45dvh] min-w-0 shrink-0 gap-4 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
          {visibleItems.length > 0 && (
            <>
              {/* Promo input or display */}
              <div className="w-full border-b pb-3 text-xs leading-5 text-muted-foreground">
                <strong className="text-foreground">Production and delivery:</strong> {fulfillmentConfig.individualProduction} {fulfillmentConfig.individualDelivery}
                <span className="mt-1 block">{fulfillmentConfig.singleJacketShipping} {fulfillmentConfig.multipleJacketShipping}</span>
              </div>

              <div className="w-full py-1">
                {!visiblePromo ? (
                  <form onSubmit={handleApplyPromo} className="space-y-1.5">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Promo code (e.g. WELCOME15)"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        className="min-w-0 flex-1 h-11 text-base focus-visible:ring-primary uppercase"
                      />
                      <Button type="submit" size="sm" className="h-11" disabled={isValidating}>
                        {isValidating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Tag className="h-3 w-3 mr-1" />}
                        Apply
                      </Button>
                    </div>
                    {validationError && (
                      <p className="text-[10px] text-destructive font-medium pl-1">{validationError}</p>
                    )}
                  </form>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Tag className="h-3.5 w-3.5 text-emerald-600" />
                      <span>
                        Code <span className="font-bold">{visiblePromo.code}</span> applied
                        {visiblePromo.discountType === 'percentage' && ` (-${visiblePromo.discountValue}%)`}
                        {visiblePromo.discountType === 'fixed' && ` (-$${visiblePromo.discountValue.toFixed(2)})`}
                        {visiblePromo.freeShipping && ' (Free Shipping)'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemovePromo}
                      aria-label="Remove promo code"
                      className="h-11 w-11 text-emerald-800 hover:bg-emerald-500/20 hover:text-emerald-950 shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1.5 text-xs text-muted-foreground w-full">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                {visiblePromo && discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({visiblePromo.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {visiblePromo?.freeShipping && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Shipping Coupon</span>
                    <span>FREE</span>
                  </div>
                )}
                <Separator className="my-1.5" />
                <div className="flex items-center justify-between text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span className="text-primary font-bold text-lg">${total.toFixed(2)}</span>
                </div>
              </div>

              <SheetClose asChild>
                <Button asChild className="min-h-11 w-full" size="lg">
                  <Link href="/checkout" onClick={() => void logUserActivity('begin_checkout', { source: 'cart', itemCount: visibleItemCount, total, currency: 'USD' })}>Proceed to Checkout</Link>
                </Button>
              </SheetClose>
            </>
          )}
          <SheetClose asChild>
            <Button variant="outline" className="min-h-11 w-full">
              Continue Shopping
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
