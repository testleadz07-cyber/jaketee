'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { getWhatsAppUrl } from '@/lib/whatsapp'
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  HelpCircle,
  Truck,
  RotateCcw,
  Mail,
} from 'lucide-react'

const whatsappUrl = getWhatsAppUrl("Hi! I have a question about my order.")

const quickQuestions = [
  {
    question: 'Where is my order?',
    answer:
      "You can track your order from your account's order history, or from the tracking link in your shipping confirmation email.",
  },
  {
    question: 'What is your return policy?',
    answer:
      'Returns are accepted within 30 days of delivery for unworn items with tags attached. Visit our Returns page to start a request.',
  },
  {
    question: 'How long does shipping take?',
    answer:
      'Standard shipping takes 5-7 business days. Express and next day options are available at checkout.',
  },
  {
    question: 'How do I contact a person?',
    answer:
      "Leave a message below and our support team will reply by email, usually within 24 hours. You can also visit our Contact page.",
  },
]

export function SupportChatWidget() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'menu' | 'answer' | 'form'>('menu')
  const [activeAnswer, setActiveAnswer] = useState<{ question: string; answer: string } | null>(
    null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    message: '',
  })

  const resetAndClose = () => {
    setOpen(false)
    setTimeout(() => {
      setView('menu')
      setActiveAnswer(null)
      setSent(false)
    }, 200)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: 'Live chat message',
          message: formData.message,
        }),
      })

      if (res.ok) {
        setSent(true)
        setFormData((prev) => ({ ...prev, message: '' }))
      } else {
        const data = await res.json()
        toast({
          title: 'Failed to send message',
          description: data.error || 'Please try again.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error sending message',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-primary/5 px-4 py-3">
              <div>
                <p className="font-semibold leading-none">Support</p>
                <p className="text-xs text-muted-foreground mt-1">
                  We typically reply within 24 hours
                </p>
              </div>
              <button
                onClick={resetAndClose}
                aria-label="Close"
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {view === 'menu' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Hi there! Pick a topic below, or leave us a message.
                  </p>
                  <div className="space-y-2">
                    {quickQuestions.map((q) => (
                      <button
                        key={q.question}
                        onClick={() => {
                          setActiveAnswer(q)
                          setView('answer')
                        }}
                        className="w-full rounded-lg border bg-background px-3 py-2.5 text-left text-sm hover:border-primary/50 hover:bg-muted transition-colors"
                      >
                        {q.question}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href="/faq"
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                    >
                      <HelpCircle className="h-3.5 w-3.5" /> Full FAQ
                    </Link>
                    <Link
                      href="/shipping"
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                    >
                      <Truck className="h-3.5 w-3.5" /> Shipping
                    </Link>
                    <Link
                      href="/returns"
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Returns
                    </Link>
                    <button
                      onClick={() => setView('form')}
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" /> Message us
                    </button>
                  </div>
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.07c-.24.68-1.4 1.3-1.93 1.38-.49.08-1.1.11-1.78-.11-.41-.13-.94-.3-1.62-.6-2.84-1.23-4.7-4.12-4.84-4.31-.14-.19-1.16-1.54-1.16-2.93 0-1.4.73-2.08 1-2.37.24-.28.55-.35.73-.35h.53c.17 0 .4-.03.62.47.24.55.8 1.94.87 2.08.07.14.11.3.02.49-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.28.36-.23.6-.14.24.09 1.53.72 1.79.85.26.13.44.19.5.3.06.11.06.63-.18 1.31z" />
                      </svg>
                      Chat on WhatsApp
                    </a>
                  )}
                </div>
              )}

              {view === 'answer' && activeAnswer && (
                <div className="space-y-4">
                  <button
                    onClick={() => setView('menu')}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    &larr; Back
                  </button>
                  <div className="rounded-lg bg-muted px-3 py-2 text-sm font-medium">
                    {activeAnswer.question}
                  </div>
                  <div className="rounded-lg bg-primary/5 px-3 py-2.5 text-sm text-muted-foreground">
                    {activeAnswer.answer}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setView('form')}
                  >
                    Still need help? Message us
                  </Button>
                </div>
              )}

              {view === 'form' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setView('menu')}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    &larr; Back
                  </button>
                  {sent ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <Send className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="font-medium">Message sent!</p>
                      <p className="text-sm text-muted-foreground">
                        We'll get back to you at {formData.email}.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <Input
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                        required
                      />
                      <Input
                        type="email"
                        placeholder="Your email"
                        value={formData.email}
                        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                        required
                      />
                      <Textarea
                        placeholder="How can we help?"
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                        required
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" /> Send message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
