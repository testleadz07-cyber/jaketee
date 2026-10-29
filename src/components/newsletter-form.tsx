'use client'

import { apiFetch as fetch } from '@/lib/api-fetch'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useTurnstile } from '@/components/turnstile-challenge'
import { useGuestFormActivity } from '@/hooks/use-guest-form-activity'

export function NewsletterForm() {
  const verification = useTurnstile('newsletter')
  const [email, setEmail] = useState('')
  const formActivity = useGuestFormActivity('newsletter', { email })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    try {
      const turnstileToken = await verification.getToken()
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken }),
      })

      const data = await res.json()

      if (res.ok) {
        await formActivity.submitted({ email })
        toast({
          title: data.emailStatus === 'failed' ? 'Subscription saved — email unavailable' : 'Subscription saved',
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
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to communicate with server.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubscribe}
      {...formActivity.bindings}
      className="flex flex-col gap-2"
      data-mcp-action="newsletter_signup"
      data-mcp-description="Subscribe to Jacketee custom jacket updates and offers"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
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
        disabled={isSubmitting}
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
      </div>
      {verification.widget}
      {formActivity.notice}
    </form>
  )
}
