'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-fetch'
import { invoicePaymentMethods } from '@/lib/invoice-data'
import type { InvoiceOrderData } from '@/lib/invoice-pdf'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { InvoiceCustomerPicker, InvoiceProductPicker } from '@/components/admin/invoice-record-picker'

type History = { revision: number; savedAt: string; savedBy: string; reason: string }
type InvoiceResponse = { data: InvoiceOrderData; revision: number; history: History[]; linkedOrderNumber?: string }

export function InvoiceEditor({ orderId, orderNumber, onClose, mode = 'order', invoiceId, initialDraft }: {
  orderId?: string; orderNumber: string; onClose: () => void; mode?: 'order' | 'standalone'; invoiceId?: string; initialDraft?: InvoiceOrderData
}) {
  const creating = mode === 'standalone' && !invoiceId
  const [loaded, setLoaded] = useState<InvoiceResponse | null>(initialDraft ? { data: initialDraft, revision: 0, history: [] } : null)
  const [draft, setDraft] = useState<InvoiceOrderData | null>(initialDraft || null)
  const [linkedOrderNumber, setLinkedOrderNumber] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!initialDraft)
  const [saving, setSaving] = useState(false)
  const [conflict, setConflict] = useState(false)
  const { toast } = useToast()
  const endpoint = mode === 'standalone' ? `/api/admin/invoices${invoiceId ? `/${invoiceId}` : ''}` : `/api/admin/orders/${orderId}/invoice`

  useEffect(() => {
    if (creating) return
    const controller = new AbortController()
    async function load() {
      try {
        const res = await apiFetch(endpoint, { signal: controller.signal })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not load invoice.')
        setLoaded(data)
        setDraft(data.data)
        setLinkedOrderNumber(data.linkedOrderNumber || '')
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not load invoice.')
      } finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [endpoint, creating])

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!loaded || !draft || saving || conflict) return
    setError('')
    setSaving(true)
    try {
      const res = await apiFetch(endpoint, { method: creating ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: loaded.revision, data: draft, reason, linkedOrderNumber }) })
      const result = await res.json()
      if (res.status === 409) setConflict(true)
      if (!res.ok) throw new Error(result.error || 'Could not save invoice.')
      toast({ title: 'Invoice saved', description: mode === 'standalone' ? 'This invoice is available to admins only.' : `Revision ${result.revision} is now available on all invoice downloads.` })
      onClose()
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save invoice.') }
    finally { setSaving(false) }
  }

  const field = (label: string, value: string, onChange: (value: string) => void, options: { required?: boolean; type?: string; max?: number } = {}) => (
    <Label className="grid gap-2 text-xs">{label}<Input type={options.type || 'text'} value={value} onChange={event => onChange(event.target.value)} required={options.required !== false} maxLength={options.max || 160} /></Label>
  )
  const amount = (label: string, value: number, onChange: (value: number) => void, quantity = false) => (
    <Label className="grid gap-2 text-xs">{label}<Input type="number" min={quantity ? 1 : 0} max={quantity ? 10000 : 1000000} step={quantity ? 1 : '0.01'} required value={Number.isFinite(value) ? value : ''} onChange={event => onChange(event.target.valueAsNumber)} /></Label>
  )
  const subtotal = draft?.items.reduce((sum, item) => sum + Math.round(item.price * item.quantity * 100) / 100, 0) || 0
  const total = draft ? subtotal + draft.shipping + draft.tax - (draft.discountAmount || 0) : 0

  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose() }}>
    <DialogContent className="sm:max-w-3xl max-h-[90dvh] overflow-y-auto" onEscapeKeyDown={event => { if (saving) event.preventDefault() }} onInteractOutside={event => event.preventDefault()}>
      <DialogHeader>
        <DialogTitle>{creating ? 'Create Admin Invoice' : `Edit Invoice — ${orderNumber}`}</DialogTitle>
        <DialogDescription>{mode === 'standalone' ? 'Private admin invoice. It is not shown to customers and does not change an order or payment.' : 'Update invoice details only. The order and payment transaction stay unchanged. Customers will download the latest saved revision.'}</DialogDescription>
      </DialogHeader>
      {loading ? <div className="flex items-center justify-center gap-2 py-10"><Loader2 className="h-5 w-5 animate-spin" /> Loading invoice…</div> : <form onSubmit={save} className="space-y-6">
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {draft && loaded && <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">{creating ? 'Invoice number assigned on save' : loaded.revision ? `Current revision: ${loaded.revision}` : 'Original invoice'}</span>
            {!creating && <Button asChild size="sm" variant="outline"><a href={`${endpoint}?revision=${loaded.revision}`}>Download saved invoice</a></Button>}
          </div>
          <fieldset disabled={saving || conflict} className="space-y-6 min-w-0">
            {mode === 'standalone' && (creating ? field('Link to order number (optional)', linkedOrderNumber, setLinkedOrderNumber, { required: false, max: 80 }) : linkedOrderNumber && <p className="text-sm">Linked order: {linkedOrderNumber}</p>)}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Billing details</h3>
              <InvoiceCustomerPicker onSelect={customer => {
                const address = customer.addresses?.find(value => value.isDefault) || customer.addresses?.[0]
                setDraft({ ...draft, userName: customer.name || '', userEmail: customer.email || '', shippingAddress: {
                  name: address?.name || customer.name || '', street: address?.street || '', city: address?.city || '',
                  state: address?.state || '', zip: address?.zip || '', country: address?.country || '',
                  phone: address?.phone || customer.phone || '',
                } })
              }} />
              <p className="text-xs text-muted-foreground">Select a customer to fill billing and default address details, or enter them manually below. All fields remain editable.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {field('Billing name', draft.userName, userName => setDraft({ ...draft, userName }))}
              {field('Billing email', draft.userEmail, userEmail => setDraft({ ...draft, userEmail }), { type: 'email', max: 254 })}
            </div>
            </section>
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Invoice address (Shipped To)</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {(['name', 'street', 'city', 'state', 'zip', 'country', 'phone'] as const).map(key => <div key={key}>
                  {field(({ name: 'Recipient name', street: 'Street', city: 'City', state: 'State / region', zip: 'Postal code', country: 'Country', phone: 'Phone' })[key], draft.shippingAddress[key] || '', value => setDraft({ ...draft, shippingAddress: { ...draft.shippingAddress, [key]: value } }), { required: key !== 'state' && key !== 'phone', max: key === 'street' ? 240 : key === 'zip' ? 40 : key === 'phone' ? 60 : 100 })}
                </div>)}
              </div>
            </section>
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Invoice items</h3>
              {draft.items.map((item, index) => {
                const update = (changes: Partial<typeof item>) => setDraft({ ...draft, items: draft.items.map((value, i) => i === index ? { ...value, ...changes } : value) })
                return <div key={index} className="space-y-3 rounded-lg border p-3">
                  <InvoiceProductPicker onSelect={product => update({ name: product.name, price: product.price, variants: [] })} />
                  <div className="flex items-end gap-2"><div className="flex-1">{field('Product name', item.name, name => update({ name }), { max: 300 })}</div>
                    <Button type="button" variant="ghost" size="icon" disabled={draft.items.length === 1} aria-label={`Remove item ${index + 1}`} onClick={() => setDraft({ ...draft, items: draft.items.filter((_, i) => i !== index) })}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">{amount('Quantity', item.quantity, quantity => update({ quantity }), true)}{amount('Unit price (USD)', item.price, price => update({ price }))}</div>
                  {(item.variants || []).map((variant, vi) => <div key={vi} className="flex items-end gap-2">
                    <div className="flex-1 min-w-0">{field('Option', variant.name, name => update({ variants: item.variants!.map((v, i) => i === vi ? { ...v, name } : v) }), { max: 60 })}</div>
                    <div className="flex-1 min-w-0">{field('Value', variant.value, value => update({ variants: item.variants!.map((v, i) => i === vi ? { ...v, value } : v) }), { max: 100 })}</div>
                    <Button type="button" size="icon" variant="ghost" aria-label={`Remove option ${vi + 1} from item ${index + 1}`} onClick={() => update({ variants: item.variants!.filter((_, i) => i !== vi) })}><Trash2 className="h-4 w-4" /></Button>
                  </div>)}
                  <Button type="button" size="sm" variant="ghost" disabled={(item.variants?.length || 0) >= 12} onClick={() => update({ variants: [...(item.variants || []), { name: '', value: '' }] })}>Add option</Button>
                  <p className="text-xs text-muted-foreground">Choose a catalog product or enter a custom name and price. Add any selected size or colour as an option.</p>
                </div>
              })}
              <Button type="button" size="sm" variant="outline" disabled={draft.items.length >= 100} onClick={() => setDraft({ ...draft, items: [...draft.items, { name: '', price: 0, quantity: 1, variants: [] }] })}><Plus className="mr-2 h-4 w-4" /> Add invoice item</Button>
            </section>
            <div className="grid gap-4 sm:grid-cols-2">
              <Label className="grid gap-2 text-xs">Payment method<select className="h-10 rounded-md border bg-background px-3 text-sm" value={draft.paymentMethod || 'other'} onChange={event => setDraft({ ...draft, paymentMethod: event.target.value })}>
                {invoicePaymentMethods.map(value => <option key={value} value={value}>{({ paypal: 'PayPal', stripe: 'Stripe', cash: 'Cash', bank_transfer: 'Bank Transfer', other: 'Other' })[value]}</option>)}
              </select></Label>
              {field('Promo code (optional)', draft.promoCode || '', promoCode => setDraft({ ...draft, promoCode }), { required: false, max: 40 })}
              {amount('Shipping (USD)', draft.shipping, shipping => setDraft({ ...draft, shipping }))}
              {amount('Tax (USD)', draft.tax, tax => setDraft({ ...draft, tax }))}
              {amount('Discount (USD)', draft.discountAmount ?? 0, discountAmount => setDraft({ ...draft, discountAmount }))}
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <p className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></p>
              <p className="flex justify-between font-semibold"><span>Invoice total</span><span>${Number.isFinite(total) ? total.toFixed(2) : '—'}</span></p>
              <p className="text-xs text-muted-foreground">Amounts are calculated automatically. Saving does not charge or refund the customer.</p>
            </div>
            <Label className="grid gap-2 text-xs">{creating ? 'Invoice note / reason' : 'Reason for revision'}<Textarea required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} placeholder={creating ? 'For example: custom invoice for a phone enquiry' : 'For example: corrected billing name'} /></Label>
          </fieldset>
          {!!loaded.history.length && <section className="space-y-2"><h3 className="text-sm font-semibold">Revision history</h3>
            <div className="max-h-48 overflow-y-auto divide-y rounded-lg border">{loaded.history.map(entry => <div key={entry.revision} className="flex flex-wrap justify-between items-center gap-2 p-3 text-xs">
              <div className="min-w-0 flex-1 break-words"><p className="font-semibold">{entry.revision ? `Revision ${entry.revision}` : 'Original (before first edit)'}</p><p>{entry.reason}</p><p className="text-muted-foreground">{new Date(entry.savedAt).toLocaleString()} · {entry.savedBy}</p></div>
              <Button asChild variant="outline" size="sm"><a href={`${endpoint}?revision=${entry.revision}`}>Download</a></Button>
            </div>)}</div>
          </section>}
        </>}
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!draft || saving || conflict || !reason.trim()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{creating ? 'Create invoice' : 'Save invoice revision'}</Button>
        </DialogFooter>
      </form>}
    </DialogContent>
  </Dialog>
}
