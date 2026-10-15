'use client'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
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
        toast({
          title: 'Subscription Successful!',
          description: data.message || 'Thank you for subscribing to our newsletter.',
        })
        setEmail('')
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

  return (
    <form
      onSubmit={handleSubscribe}
      className="flex flex-col gap-2 sm:flex-row"
      data-mcp-action="newsletter_signup"
      data-mcp-description="Subscribe to Jacketee custom jacket updates and offers"
    >
      <Input
        id="footer-newsletter-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 w-full bg-background text-sm"
        required
      />
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full shrink-0 gap-2 px-4 sm:w-auto md:w-11 md:px-0"
        aria-label="Subscribe to newsletter"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span className="md:sr-only">Subscribe</span>
          </>
        )}
      </Button>
    </form>
  )
}
