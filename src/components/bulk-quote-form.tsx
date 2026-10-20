'use client'

import { useState, type FormEvent } from 'react'
import { shippingCountryOptions } from '@/config/fulfillment'
import { Button } from '@/components/ui/button'

export function BulkQuoteForm() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/bulk-quote', { method: 'POST', body: new FormData(form) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to send your request.')
      setSent(true)
      form.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send your request. Please try again.')
    } finally { setPending(false) }
  }
  const inputClass = 'mt-2 w-full rounded-md border bg-background px-3 py-2 text-foreground'
  return (
    <form onSubmit={submit} className="mt-6" aria-label="Bulk quote request">
      <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2">
        <legend className="sr-only">Your bulk order details</legend>
        <label>Name<input className={inputClass} name="name" autoComplete="name" maxLength={200} required /></label>
        <label>Email<input className={inputClass} name="email" type="email" autoComplete="email" maxLength={200} required /></label>
        <label>Organization<input className={inputClass} name="organization" autoComplete="organization" maxLength={200} required /></label>
        <label>Quantity<input className={inputClass} name="quantity" type="number" min={10} step={1} required /></label>
        <label>Jacket type<select className={inputClass} name="jacketType" required defaultValue=""><option value="" disabled>Select a style</option>{['Varsity jacket', 'Bomber jacket', 'Leather jacket', 'Other / need advice'].map(type => <option key={type}>{type}</option>)}</select></label>
        <label>Deadline<input className={inputClass} name="deadline" type="date" required /></label>
        <label>Country<select className={inputClass} name="country" autoComplete="country" required defaultValue=""><option value="" disabled>Select delivery country</option>{shippingCountryOptions.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
        <label>Logo upload (optional)<input className={inputClass} name="logo" type="file" accept="image/png,image/jpeg,image/webp" aria-describedby="logo-help" /><span id="logo-help" className="mt-1 block text-sm text-muted-foreground">PNG, JPG, or WebP, up to 5 MB.</span></label>
        <Button type="submit" className="sm:col-span-2">{pending ? 'Sending request…' : 'Request a Free Bulk Quote'}</Button>
      </fieldset>
      {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
      {sent && <p role="status" className="mt-4">Your quote request has been received. Our team will contact you by email to discuss the details.</p>}
    </form>
  )
}
