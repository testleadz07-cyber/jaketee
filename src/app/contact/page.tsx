'use client'

import { useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Loader2, Mail, MapPin, MessageCircle, Package, Phone, Ruler, Send, Users } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getWhatsAppUrl } from '@/lib/whatsapp'
import { logUserActivity } from '@/lib/activity'
import { shippingCountryOptions } from '@/config/fulfillment'
import { contactLimits, validateContact, type ContactErrors, type ContactValues } from '@/lib/contact-validation'

const emptyForm: ContactValues = { name: '', email: '', subject: '', message: '', country: '' }
const whatsappUrl = getWhatsAppUrl('Hi! I would like some help from the Jacketee team.')
const quickLinks = [
  { title: 'Track an order', text: 'Check the status of an existing order.', href: '/track-order', icon: Package },
  { title: 'Bulk & Teams', text: 'Request a quote for your school, team or brand.', href: '/bulk-orders', icon: Users },
  { title: 'Find your size', text: 'Get measurements and help choosing your fit.', href: '/size-guide', icon: Ruler },
]

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactValues>(emptyForm)
  const [errors, setErrors] = useState<ContactErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [sentTo, setSentTo] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const submissionLock = useRef(false)

  function update(field: keyof ContactValues, value: string) {
    setFormData(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: undefined }))
    setSubmitError('')
  }
  function focusError(fieldErrors: ContactErrors) {
    const field = Object.keys(fieldErrors)[0]
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus())
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submissionLock.current) return
    const result = validateContact(formData)
    setErrors(result.errors)
    setSubmitError('')
    if (Object.keys(result.errors).length) { focusError(result.errors); return }
    submissionLock.current = true
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.values) })
      const data = await response.json().catch(() => null)
      if (!response.ok || data?.success !== true) {
        const fieldErrors: ContactErrors = {}
        for (const field of Object.keys(emptyForm) as (keyof ContactValues)[]) {
          if (typeof data?.errors?.[field] === 'string') fieldErrors[field] = data.errors[field]
        }
        setErrors(fieldErrors)
        focusError(fieldErrors)
        setSubmitError(typeof data?.error === 'string' ? data.error : 'Your message could not be sent. Please try again or contact us by email or WhatsApp.')
        return
      }
      setSentTo(result.values.email)
      setFormData(emptyForm)
    } catch {
      setSubmitError('We could not confirm that your message was sent. Your details are still here. Check your connection, try again, or email info@jacketee.com.')
    } finally {
      submissionLock.current = false
      setIsSubmitting(false)
    }
  }
  const errorProps = (field: keyof ContactValues) => ({ 'aria-invalid': !!errors[field], 'aria-describedby': errors[field] ? `contact-${field}-error` : undefined })
  const fieldError = (field: keyof ContactValues) => errors[field] ? <p id={`contact-${field}-error`} className="mt-2 text-sm text-destructive">{errors[field]}</p> : null

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-5"><Breadcrumbs items={[{ label: 'Contact Us' }]} /></div>
        <section aria-labelledby="contact-title" className="container mx-auto px-4 pb-10 md:pb-12">
          <div className="rounded-2xl border bg-muted/25 p-6 sm:p-10 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Let’s talk jackets</p>
            <h1 id="contact-title" className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Contact the Jacketee team</h1>
            <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Need help with an order, a custom design or the right fit? Send us a message or choose the contact method that works best for you.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Button asChild size="lg"><a href="#send-message">Send a message<ArrowRight className="ml-2 h-4 w-4" /></a></Button>{whatsappUrl && <Button asChild size="lg" variant="outline"><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => logUserActivity('contact_button_clicked', { channel: 'whatsapp' })}><MessageCircle className="mr-2 h-4 w-4" />Chat on WhatsApp</a></Button>}</div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-12 md:pb-16" aria-labelledby="contact-options-title">
          <h2 id="contact-options-title" className="sr-only">Ways to contact us</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <a href="mailto:info@jacketee.com" onClick={() => logUserActivity('contact_button_clicked', { channel: 'email' })} className="rounded-xl border p-5 transition-colors hover:bg-muted/30"><Mail className="h-5 w-5 text-primary" /><h3 className="mt-4 font-semibold">Email us</h3><p className="mt-2 break-all text-sm font-medium">info@jacketee.com</p><p className="mt-2 text-sm leading-6 text-muted-foreground">For order questions, artwork and design enquiries.</p></a>
            <a href="tel:+923187328027" onClick={() => logUserActivity('contact_button_clicked', { channel: 'phone' })} className="rounded-xl border p-5 transition-colors hover:bg-muted/30"><Phone className="h-5 w-5 text-primary" /><h3 className="mt-4 font-semibold">Call us</h3><p className="mt-2 text-sm font-medium">+92 318 7328027</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Prefer to talk? Reach our team by phone.</p></a>
            <div className="rounded-xl border p-5"><MapPin className="h-5 w-5 text-primary" /><h3 className="mt-4 font-semibold">Our location</h3><p className="mt-2 text-sm font-medium">Adalatghar, Sialkot</p><p className="mt-2 text-sm leading-6 text-muted-foreground">You can send a message at any time. Our team will reply as soon as possible.</p></div>
          </div>
        </section>

        <section className="border-y bg-muted/20" aria-labelledby="message-title">
          <div className="container mx-auto grid items-start gap-8 px-4 py-12 md:py-16 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
            <div id="send-message" className="scroll-mt-28 rounded-2xl border bg-card p-5 sm:p-8">
              <h2 id="message-title" className="text-2xl font-bold">Send us a message</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Tell us what you need and we’ll reply by email. All fields are required except delivery country.</p>
              {sentTo ? <div role="status" className="mt-6 rounded-xl border bg-primary/5 p-6"><CheckCircle2 className="h-8 w-8 text-primary" /><h3 className="mt-4 text-lg font-semibold">Thanks. Your message has been sent.</h3><p className="mt-2 break-words text-sm leading-6 text-muted-foreground">We’ll reply to <strong className="font-medium text-foreground">{sentTo}</strong>. Check your inbox and spam folder for our response.</p><Button variant="outline" className="mt-5 min-h-11" onClick={() => setSentTo('')}>Send another message</Button></div> :
                <form ref={formRef} id="contact-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="mt-6 space-y-5" data-mcp-action="contact" data-mcp-description="Send Jacketee a support, custom jacket, or bulk order inquiry">
                  <fieldset disabled={isSubmitting} className="space-y-5 disabled:opacity-70"><legend className="sr-only">Your contact details and enquiry</legend>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div><label htmlFor="contact-name" className="mb-2 block text-sm font-medium">Name</label><Input id="contact-name" name="name" autoComplete="name" required maxLength={contactLimits.name} value={formData.name} onChange={event => update('name', event.target.value)} className="min-h-11" {...errorProps('name')} />{fieldError('name')}</div>
                      <div><label htmlFor="contact-email" className="mb-2 block text-sm font-medium">Email</label><Input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={contactLimits.email} value={formData.email} onChange={event => update('email', event.target.value)} className="min-h-11" {...errorProps('email')} />{fieldError('email')}</div>
                    </div>
                    <div><label htmlFor="contact-subject" className="mb-2 block text-sm font-medium">Subject</label><Input id="contact-subject" name="subject" placeholder="For example: sizing help or a question about my order" required maxLength={contactLimits.subject} value={formData.subject} onChange={event => update('subject', event.target.value)} className="min-h-11" {...errorProps('subject')} />{fieldError('subject')}</div>
                    <div><label htmlFor="contact-country" className="mb-2 block text-sm font-medium">Delivery country <span className="font-normal text-muted-foreground">(optional)</span></label><select id="contact-country" name="country" autoComplete="country" value={formData.country} onChange={event => update('country', event.target.value)} className="min-h-11 w-full rounded-md border bg-background px-3 text-base sm:text-sm" aria-invalid={!!errors.country} aria-describedby={errors.country ? 'contact-country-hint contact-country-error' : 'contact-country-hint'}><option value="">Select if your question is about shipping</option>{shippingCountryOptions.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select><p id="contact-country-hint" className="mt-2 text-xs leading-5 text-muted-foreground">Helps us answer questions about delivery to your destination.</p>{fieldError('country')}</div>
                    <div><label htmlFor="contact-message" className="mb-2 block text-sm font-medium">Message</label><Textarea id="contact-message" name="message" required rows={6} maxLength={contactLimits.message} value={formData.message} onChange={event => update('message', event.target.value)} placeholder="Tell us about your question, design idea or order." className="min-h-40 text-base sm:text-sm" aria-invalid={!!errors.message} aria-describedby={errors.message ? 'contact-message-hint contact-message-error' : 'contact-message-hint'} /><div id="contact-message-hint" className="mt-2 flex flex-wrap justify-between gap-2 text-xs leading-5 text-muted-foreground"><span>For order help, include your order number if you have it.</span><span>{formData.message.length}/{contactLimits.message}</span></div>{fieldError('message')}</div>
                  </fieldset>
                  {submitError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm leading-6 text-destructive">{submitError}</p>}
                  <p className="text-xs leading-5 text-muted-foreground">We use your details to respond to your enquiry. Read our <Link href="/privacy-policy" className="underline underline-offset-4">Privacy Policy</Link>.</p>
                  <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : <><Send className="mr-2 h-4 w-4" />Send message</>}</Button>
                </form>}
            </div>
            <aside className="space-y-6" aria-labelledby="quick-help-title">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">A useful shortcut</p><h2 id="quick-help-title" className="mt-2 text-2xl font-bold">Looking for something specific?</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">These pages may help while you wait. You can always send us a message.</p></div>
              <div className="divide-y rounded-xl border bg-background px-5">{quickLinks.map(({ title, text, href, icon: Icon }) => <Link key={href} href={href} className="flex items-start gap-3 py-5 hover:text-primary"><Icon className="mt-1 h-5 w-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div><ArrowRight className="mt-1 h-4 w-4 shrink-0" /></Link>)}</div>
              <div className="rounded-xl border bg-background p-5"><h3 className="font-semibold">Designing your first jacket?</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Explore materials, artwork placement and the steps from idea to approval.</p><Link href="/how-to-customize" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">Read the customization guide<ArrowRight className="h-4 w-4" /></Link></div>
              <div><h3 className="text-sm font-semibold">More answers</h3><div className="mt-3 flex flex-wrap gap-2">{[['Help center', '/faq'], ['Shipping', '/shipping'], ['Returns', '/returns']].map(([label, href]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-lg border bg-background px-4 text-sm hover:bg-muted">{label}</Link>)}</div></div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
