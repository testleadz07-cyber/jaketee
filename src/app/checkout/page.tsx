'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cart'
import { useToast } from '@/hooks/use-toast'
import { ShoppingBag, CreditCard, Truck, ClipboardList, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'

declare global {
  interface Window {
    paypal?: any
  }
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const { items, getTotalPrice, clearCart } = useCartStore()

  // Checkout Steps: 1 = Shipping, 2 = Review, 3 = Payment
  const [step, setStep] = useState(1)

  // Shipping Form States
  const [shippingName, setShippingName] = useState('')
  const [shippingEmail, setShippingEmail] = useState('')
  const [shippingPhone, setShippingPhone] = useState('')
  const [shippingStreet, setShippingStreet] = useState('')
  const [shippingCity, setShippingCity] = useState('')
  const [shippingState, setShippingState] = useState('')
  const [shippingZip, setShippingZip] = useState('')
  const [shippingCountry, setShippingCountry] = useState('United States')

  // Payment states
  const [paypalClientId, setPaypalClientId] = useState('')
  const [isPaypalLoading, setIsPaypalLoading] = useState(true)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const paypalButtonRendered = useRef(false)

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/')
    }
  }, [items, router])

  // Fetch PayPal Config and User Profile on mount
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setShippingName(session.user.name || '')
      setShippingEmail(session.user.email || '')
      fetchUserProfile()
      fetchPaypalConfig()
    } else if (status === 'unauthenticated') {
      fetchPaypalConfig()
    }
  }, [status, session])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/users/profile')
      if (res.ok) {
        const user = await res.json()
        if (user.phone) setShippingPhone(user.phone)
        
        // Find default or first address
        if (user.addresses && user.addresses.length > 0) {
          const defaultAddress = user.addresses.find((a: any) => a.isDefault) || user.addresses[0]
          setShippingName(defaultAddress.name || user.name)
          setShippingStreet(defaultAddress.street || '')
          setShippingCity(defaultAddress.city || '')
          setShippingState(defaultAddress.state || '')
          setShippingZip(defaultAddress.zip || '')
          setShippingCountry(defaultAddress.country || 'United States')
          if (defaultAddress.phone) setShippingPhone(defaultAddress.phone)
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchPaypalConfig = async () => {
    try {
      const res = await fetch('/api/payments/config')
      if (res.ok) {
        const data = await res.json()
        setPaypalClientId(data.clientId)
      }
    } catch (error) {
      console.error('Error fetching PayPal config:', error)
    } finally {
      setIsPaypalLoading(false)
    }
  }

  // Load PayPal SDK Script dynamically on Step 3
  useEffect(() => {
    if (step === 3 && paypalClientId && paypalClientId !== 'your_paypal_client_id' && !window.paypal) {
      const script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`
      script.async = true
      script.onload = () => {
        renderPaypalButtons()
      }
      script.onerror = () => {
        console.error('PayPal SDK load failed.')
        setIsPaypalLoading(false)
      }
      document.body.appendChild(script)
    } else if (step === 3 && window.paypal) {
      renderPaypalButtons()
    }
  }, [step, paypalClientId])

  const renderPaypalButtons = () => {
    if (paypalButtonRendered.current) return
    
    if (window.paypal && document.getElementById('paypal-button-container')) {
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
        },
        createOrder: async () => {
          try {
            const res = await fetch('/api/payments/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount: getTotalPrice() }),
            })
            const data = await res.json()
            return data.id
          } catch (error) {
            console.error('Error creating PayPal order:', error)
          }
        },
        onApprove: async (data: any) => {
          setIsSubmittingOrder(true)
          try {
            const res = await fetch('/api/payments/capture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID }),
            })
            
            const captureData = await res.json()
            
            if (captureData.status === 'COMPLETED') {
              handleOrderSubmit(captureData.id)
            } else {
              toast({
                title: 'Payment Failed',
                description: 'Failed to capture PayPal payment. Please try again.',
                variant: 'destructive',
              })
              setIsSubmittingOrder(false)
            }
          } catch (error) {
            console.error('Error capturing PayPal payment:', error)
            setIsSubmittingOrder(false)
          }
        },
        onError: (err: any) => {
          console.error('PayPal Button Error:', err)
          toast({
            title: 'Payment Error',
            description: 'An error occurred during the transaction. Please try again.',
            variant: 'destructive',
          })
        }
      }).render('#paypal-button-container')
      
      paypalButtonRendered.current = true
    }
  }

  const handleOrderSubmit = async (paymentId: string) => {
    setIsSubmittingOrder(true)
    
    const orderData = {
      userId: session?.user ? (session.user as any).id : null,
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        variants: item.variants
      })),
      subtotal: getTotalPrice(),
      shipping: 0,
      tax: 0,
      total: getTotalPrice(),
      shippingAddress: {
        name: shippingName,
        street: shippingStreet,
        city: shippingCity,
        state: shippingState,
        zip: shippingZip,
        country: shippingCountry,
        phone: shippingPhone
      },
      paymentId
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (res.ok) {
        const order = await res.json()
        clearCart()
        router.push(`/order-confirmation?id=${order._id}`)
      } else {
        const errData = await res.json()
        toast({
          title: 'Error Creating Order',
          description: errData.error || 'Failed to submit your order. Please contact support.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error Submitting Order',
        description: 'An error occurred. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (!shippingName || !shippingStreet || !shippingCity || !shippingState || !shippingZip) {
        toast({
          title: 'Missing Fields',
          description: 'Please fill in all shipping details.',
          variant: 'destructive'
        })
        return
      }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handlePrevStep = () => {
    setStep(prev => Math.max(1, prev - 1))
    // Reset paypal rendered state if moving back from payment
    if (step === 3) {
      paypalButtonRendered.current = false
    }
  }

  const isPaypalPlaceholder = !paypalClientId || paypalClientId === 'your_paypal_client_id'

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header showBack backHref="/" />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <Breadcrumbs items={[{ label: 'Checkout' }]} className="mb-6" />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Checkout Form Progress */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-2 bg-card p-4 rounded-xl mb-4">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  1
                </div>
                <span className="text-xs font-semibold hidden sm:inline">Shipping</span>
              </div>
              <div className="flex-1 h-0.5 bg-muted mx-2" />
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  2
                </div>
                <span className="text-xs font-semibold hidden sm:inline">Review</span>
              </div>
              <div className="flex-1 h-0.5 bg-muted mx-2" />
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  3
                </div>
                <span className="text-xs font-semibold hidden sm:inline">Payment</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Shipping Form */}
              {step === 1 && (
                <motion.div
                  key="shipping-step"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        Shipping Information
                      </CardTitle>
                      <CardDescription>Enter the delivery address for your order</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="shippingName">Recipient Name</Label>
                          <Input
                            id="shippingName"
                            placeholder="John Doe"
                            value={shippingName}
                            onChange={e => setShippingName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shippingPhone">Phone Number</Label>
                          <Input
                            id="shippingPhone"
                            placeholder="+1 (555) 123-4567"
                            value={shippingPhone}
                            onChange={e => setShippingPhone(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shippingStreet">Street Address</Label>
                        <Input
                          id="shippingStreet"
                          placeholder="123 Fashion St, Apt 4B"
                          value={shippingStreet}
                          onChange={e => setShippingStreet(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="shippingCity">City</Label>
                          <Input
                            id="shippingCity"
                            placeholder="New York"
                            value={shippingCity}
                            onChange={e => setShippingCity(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shippingState">State</Label>
                          <Input
                            id="shippingState"
                            placeholder="NY"
                            value={shippingState}
                            onChange={e => setShippingState(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shippingZip">ZIP Code</Label>
                          <Input
                            id="shippingZip"
                            placeholder="10001"
                            value={shippingZip}
                            onChange={e => setShippingZip(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shippingCountry">Country</Label>
                        <Input
                          id="shippingCountry"
                          placeholder="United States"
                          value={shippingCountry}
                          onChange={e => setShippingCountry(e.target.value)}
                          required
                        />
                      </div>

                      <Button className="w-full mt-4" onClick={handleNextStep}>
                        Review Order details
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 2: Order Review */}
              {step === 2 && (
                <motion.div
                  key="review-step"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-primary" />
                        Review Items
                      </CardTitle>
                      <CardDescription>Confirm the items in your order</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex gap-4 items-center bg-muted/10 p-3 rounded-lg border">
                            <div className="relative h-16 w-16 overflow-hidden rounded bg-muted flex-shrink-0">
                              <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.variants.map((v) => `${v.name}: ${v.value}`).join(', ')}
                              </p>
                              <p className="text-xs font-medium mt-1">
                                Qty: {item.quantity} • ${item.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right font-bold text-sm text-primary">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div className="p-4 rounded-lg bg-muted/30 border space-y-1 text-sm">
                        <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Shipping to:</p>
                        <p className="font-semibold">{shippingName}</p>
                        <p className="text-muted-foreground">{shippingStreet}</p>
                        <p className="text-muted-foreground">{shippingCity}, {shippingState} {shippingZip}</p>
                        <p className="text-muted-foreground">{shippingCountry}</p>
                      </div>

                      <div className="flex gap-4">
                        <Button variant="outline" className="flex-1" onClick={handlePrevStep}>
                          Back
                        </Button>
                        <Button className="flex-1" onClick={handleNextStep}>
                          Proceed to Payment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <motion.div
                  key="payment-step"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <Card className="border-2">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                          Payment Options
                        </CardTitle>
                        {isPaypalPlaceholder && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                            Demo Mode
                          </Badge>
                        )}
                      </div>
                      <CardDescription>Choose how you'd like to pay</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {isSubmittingOrder ? (
                        <div className="flex flex-col justify-center items-center py-12">
                          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                          <p className="text-muted-foreground font-semibold">Processing transaction...</p>
                          <p className="text-xs text-muted-foreground mt-2">Please do not close this window</p>
                        </div>
                      ) : (
                        <>
                          {/* PayPal Container */}
                          {!isPaypalPlaceholder ? (
                            <div className="space-y-4">
                              {isPaypalLoading && (
                                <div className="flex justify-center items-center py-6">
                                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                                  <span className="text-sm text-muted-foreground">Loading PayPal payment gateway...</span>
                                </div>
                              )}
                              <div id="paypal-button-container" className="w-full min-h-[150px]" />
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 text-amber-800 border border-amber-500/20">
                                <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs space-y-1">
                                  <p className="font-bold">PayPal Gateway Not Configured</p>
                                  <p className="text-muted-foreground">
                                    The PayPal integration is currently in local Demo Mode. Press "Pay Now" below to complete order simulation.
                                  </p>
                                </div>
                              </div>
                              <Button
                                className="w-full h-14 text-lg font-bold bg-amber-500 hover:bg-amber-600 text-amber-950 border border-amber-600 shadow-md"
                                onClick={() => handleOrderSubmit(`demo-payment-${Date.now()}`)}
                                disabled={isSubmittingOrder}
                              >
                                <CheckCircle2 className="h-5 w-5 mr-2" />
                                Pay Now (Demo Mode Simulation)
                              </Button>
                            </div>
                          )}

                          <Separator />

                          <Button variant="ghost" className="w-full" onClick={handlePrevStep} disabled={isSubmittingOrder}>
                            Back to Review
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart Sidebar Summary */}
          <div className="lg:col-span-1">
            <Card className="border-2 sticky top-24 bg-card/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Tax</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-baseline font-bold text-xl pt-2">
                  <span>Total</span>
                  <span className="text-primary">${getTotalPrice().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>

      <footer className="border-t bg-background mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2024 Luxe Store. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
