'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const pathname = usePathname()
  const { toast } = useToast()

  useEffect(() => {
    // Avoid showing on checkout, confirmation, or admin panels
    const isExcludedRoute = 
      pathname.startsWith('/admin') || 
      pathname.startsWith('/checkout') || 
      pathname.startsWith('/order-confirmation') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/register')

    if (isExcludedRoute) return

    // Check if shown in this session
    const hasBeenShown = sessionStorage.getItem('jacketee_newsletter_shown')
    if (hasBeenShown) return

    // Trigger popup after 5 seconds delay
    const timer = setTimeout(() => {
      setIsOpen(true)
      sessionStorage.setItem('jacketee_newsletter_shown', 'true')
    }, 5000)

    return () => clearTimeout(timer)
  }, [pathname])

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setIsSuccess(true)
        toast({
          title: 'Welcome onboard!',
          description: data.message || 'Successfully subscribed to our newsletter.',
        })
        // Close after a brief delay so they see the success animation
        setTimeout(() => {
          setIsOpen(false)
        }, 2500)
      } else {
        toast({
          title: 'Subscription Failed',
          description: data.error || 'Something went wrong.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to communicate with server.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Modal Card content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-muted-foreground/10 bg-card p-8 shadow-2xl md:p-10"
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-center"
              >
                {/* Header icon */}
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Mail className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight flex items-center justify-center gap-1.5">
                    Unlock 15% Off
                    <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Subscribe to the Jacketee newsletter and receive a 15% discount code for your first purchase.
                  </p>
                </div>

                <form onSubmit={handleSubscribe} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-center h-12 rounded-xl focus-visible:ring-primary border-muted"
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full h-12 text-sm font-semibold rounded-xl"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      'Claim My Discount'
                    )}
                  </Button>
                </form>

                <p className="text-[10px] text-muted-foreground leading-normal">
                  By signing up, you agree to receive promotional updates. You can unsubscribe at any time.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-6 text-center space-y-4"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">You're On The List!</h3>
                  <p className="text-sm text-muted-foreground">
                    Use code <span className="font-extrabold text-primary select-all">WELCOME15</span> for 15% off at checkout.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-4">We've also sent the code to your email.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
