'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, Tag, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function CartDrawer() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    getTotalItems, 
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

  const subtotal = getTotalPrice()
  const total = getDiscountedTotalPrice()
  const discountAmount = appliedPromo ? subtotal - total : 0

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {getTotalItems()}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({getTotalItems()} items)
          </DrawerTitle>
          <DrawerDescription>
            Review your items before checkout
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add some products to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-lg border p-4 bg-card"
                >
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground text-xs">
                      {item.variants.map(v => `${v.name}: ${v.value}`).join(', ')}
                    </p>
                    <p className="font-bold text-primary">
                      ${item.price.toFixed(2)}
                    </p>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
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
                          className="h-7 w-7"
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
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <DrawerFooter className="flex-col gap-4">
          {items.length > 0 && (
            <>
              {/* Promo input or display */}
              <div className="w-full py-1">
                {!appliedPromo ? (
                  <form onSubmit={handleApplyPromo} className="space-y-1.5">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Promo code (e.g. WELCOME15)"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        className="flex-1 h-9 text-xs focus-visible:ring-primary uppercase"
                      />
                      <Button type="submit" size="sm" className="h-9" disabled={isValidating}>
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
                        Code <span className="font-bold">{appliedPromo.code}</span> applied
                        {appliedPromo.discountType === 'percentage' && ` (-${appliedPromo.discountValue}%)`}
                        {appliedPromo.discountType === 'fixed' && ` (-$${appliedPromo.discountValue.toFixed(2)})`}
                        {appliedPromo.freeShipping && ' (Free Shipping)'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemovePromo}
                      className="h-6 w-6 text-emerald-800 hover:bg-emerald-500/20 hover:text-emerald-950 shrink-0"
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
                {appliedPromo && discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({appliedPromo.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {appliedPromo?.freeShipping && (
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

              <Link href="/checkout" className="w-full">
                <Button className="w-full" size="lg">
                  Proceed to Checkout
                </Button>
              </Link>
            </>
          )}
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}