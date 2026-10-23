'use client'

import { useId, useState, type FormEvent } from 'react'
import { shippingCountryOptions } from '@/config/fulfillment'
import { Button } from '@/components/ui/button'

export function BulkQuoteForm({ program = '' }: { program?: string }) {
  const id = useId()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [filename, setFilename] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setPending(true)
    setError('')
    setFieldErrors({})
    try {
      const response = await fetch('/api/bulk-quote', { method: 'POST', body: new FormData(form) })
      const result = await response.json()
      if (!response.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors)
          const first = form.elements.namedItem(Object.keys(result.fieldErrors)[0])
          if (first instanceof HTMLElement) requestAnimationFrame(() => first.focus())
        }
        throw new Error(result.error || 'Unable to send your request.')
      }
      setSent(true)
      form.reset()
      setFilename('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send your request. Please try again.')
    } finally { setPending(false) }
  }
  const inputClass = 'mt-2 min-h-12 w-full rounded-lg border bg-background px-3 py-2 text-base font-normal text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-invalid:border-red-500'
  const invalidProps = (field: string) => ({ 'aria-invalid': Boolean(fieldErrors[field]), 'aria-describedby': fieldErrors[field] ? `${id}-${field}` : undefined })
  const errorText = (field: string) => fieldErrors[field] ? <span id={`${id}-${field}`} className="mt-1 block text-sm text-red-600">{fieldErrors[field]}</span> : null
  if (sent) return <div role="status" className="mt-6 rounded-xl border border-primary/25 bg-primary/5 p-6"><h4 className="text-lg font-semibold">Your request is with the team.</h4><p className="mt-2 text-sm leading-7 text-muted-foreground">We’ll contact you by email to discuss your jacket details, quote and schedule. No production begins without approval.</p><Button type="button" variant="outline" className="mt-5 min-h-11" onClick={() => setSent(false)}>Send another request</Button></div>
  return (
    <form onSubmit={submit} className="mt-6 space-y-6" aria-label="Bulk quote request" aria-busy={pending}>
      <fieldset disabled={pending}>
        <legend className="mb-4 text-sm font-semibold">1. Your contact details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Name *<input className={inputClass} name="name" autoComplete="name" maxLength={200} required {...invalidProps('name')} />{errorText('name')}</label>
          <label className="text-sm font-medium">Email *<input className={inputClass} name="email" type="email" autoComplete="email" maxLength={200} required {...invalidProps('email')} />{errorText('email')}</label>
          <label className="text-sm font-medium sm:col-span-2">Team, organization or brand *<input className={inputClass} name="organization" autoComplete="organization" maxLength={200} required {...invalidProps('organization')} />{errorText('organization')}</label>
        </div>
      </fieldset>
      <fieldset disabled={pending} className="border-t pt-5">
        <legend className="pr-3 text-sm font-semibold">2. Your order details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">Order program (optional)<select className={inputClass} name="program" defaultValue={program} {...invalidProps('program')}><option value="">Select a program or ask for advice</option>{['Schools & Teams', 'Corporate', 'Private Label', 'Senior Class', 'Sorority & Fraternity', 'Cheer Teams'].map(label => <option key={label}>{label}</option>)}</select>{errorText('program')}</label>
          <label className="text-sm font-medium">Estimated quantity *<input className={inputClass} name="quantity" type="number" inputMode="numeric" min={10} step={1} required {...invalidProps('quantity')} />{errorText('quantity')}<span className="mt-1 block text-xs font-normal text-muted-foreground">10 or more jackets; confirm final sizes later.</span></label>
          <label className="text-sm font-medium">Jacket style *<select className={inputClass} name="jacketType" required defaultValue="" {...invalidProps('jacketType')}><option value="" disabled>Select a style</option>{['Varsity jacket', 'Bomber jacket', 'Coach jacket', 'Puffer jacket', 'Denim jacket', 'Leather jacket', 'Fleece hoodie', 'Not sure / need advice'].map(type => <option key={type}>{type}</option>)}</select>{errorText('jacketType')}</label>
          <label className="text-sm font-medium">Delivery country *<select className={inputClass} name="country" autoComplete="country" required defaultValue="" {...invalidProps('country')}><option value="" disabled>Select a country</option>{shippingCountryOptions.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select>{errorText('country')}</label>
          <label className="text-sm font-medium">Target arrival date (optional)<input className={inputClass} name="deadline" type="date" {...invalidProps('deadline')} />{errorText('deadline')}<span className="mt-1 block text-xs font-normal text-muted-foreground">Not sure yet? Leave this blank.</span></label>
          <label className="text-sm font-medium sm:col-span-2">Logo or artwork (optional)<input className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm`} name="logo" type="file" accept="image/png,image/jpeg,image/webp" aria-describedby={`${id}-logo-help${fieldErrors.logo ? ` ${id}-logo` : ''}`} aria-invalid={Boolean(fieldErrors.logo)} onChange={event => { const file = event.target.files?.[0]; event.target.setCustomValidity(file && (file.size > 5 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) ? 'Choose a PNG, JPG or WebP file up to 5 MB.' : ''); setFilename(file?.name || '') }} /><span id={`${id}-logo-help`} className="mt-1 block text-xs font-normal text-muted-foreground">PNG, JPG or WebP, up to 5 MB. {filename ? `Selected: ${filename}` : 'No finished artwork needed to start.'}</span>{errorText('logo')}</label>
          <label className="text-sm font-medium sm:col-span-2">Project notes (optional)<textarea className={`${inputClass} min-h-28`} name="notes" rows={4} maxLength={4000} placeholder="Colors, names, numbers, patch placements, sample or packaging needs…" {...invalidProps('notes')} />{errorText('notes')}</label>
        </div>
      </fieldset>
      {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
      <Button type="submit" disabled={pending} className="min-h-12 w-full">{pending ? 'Sending request…' : 'Request a Free Bulk Quote'}</Button>
      <p className="text-xs leading-5 text-muted-foreground">We’ll use your details to respond to this inquiry. Your delivery date is a request, subject to confirmation.</p>
    </form>
  )
}
