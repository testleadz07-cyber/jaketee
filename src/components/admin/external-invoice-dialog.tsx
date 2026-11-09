'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-fetch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { InvoiceCustomerPicker } from '@/components/admin/invoice-record-picker'

export type ExternalInvoice = { _id: string; number: string; revision: number; customerName: string; customerEmail: string; linkedOrderNumber?: string; filename?: string }
type Version = { revision: number; savedAt: string; savedBy: string; reason: string; filename?: string }

export function ExternalInvoiceDialog({ invoice, onClose }: { invoice?: ExternalInvoice; onClose: () => void }) {
  const [name, setName] = useState(invoice?.customerName || '')
  const [email, setEmail] = useState(invoice?.customerEmail || '')
  const [order, setOrder] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!invoice)
  const [history, setHistory] = useState<Version[]>([])
  const [revision, setRevision] = useState(invoice?.revision || 0)
  const [conflict, setConflict] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!invoice) return
    const controller = new AbortController()
    apiFetch(`/api/admin/invoices/${invoice._id}`, { signal: controller.signal }).then(async res => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load history.')
      setHistory(data.history)
      setRevision(data.revision)
    }).catch(err => { if (!controller.signal.aborted) setError(err.message || 'Could not load history.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [invoice])

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!file || saving || loading || conflict) return
    if (file.size > 5 * 1024 * 1024 || file.type !== 'application/pdf') { setError('Choose a PDF up to 5 MB.'); return }
    setSaving(true)
    setError('')
    try {
      const body = new FormData()
      body.set('file', file)
      body.set('reason', reason)
      if (invoice) { body.set('invoiceId', invoice._id); body.set('revision', String(revision)) }
      else { body.set('customerName', name); body.set('customerEmail', email); body.set('linkedOrderNumber', order) }
      const res = await apiFetch('/api/admin/invoices/upload', { method: 'POST', body })
      const data = await res.json()
      if (res.status === 409) setConflict(true)
      if (!res.ok) throw new Error(data.error || 'Could not upload invoice.')
      toast({ title: 'PDF saved', description: 'This invoice is available to admins only.' })
      onClose()
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not upload invoice.') }
    finally { setSaving(false) }
  }

  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose() }}>
    <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto" onInteractOutside={event => event.preventDefault()}>
      <DialogHeader><DialogTitle>{invoice ? 'External Invoice — History & Versions' : 'Upload External Invoice'}</DialogTitle>
        <DialogDescription>Private admin PDF. Uploading does not replace the customer’s order invoice.</DialogDescription></DialogHeader>
      <form onSubmit={save} className="space-y-5">
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {loading && <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading history…</p>}
        {invoice ? <div className="rounded-lg border p-3 text-sm break-words"><p className="font-semibold">{invoice.number}</p><p>{invoice.customerName} · {invoice.customerEmail}</p>{invoice.linkedOrderNumber && <p>Linked order: {invoice.linkedOrderNumber}</p>}</div> : null}
        <fieldset disabled={saving || conflict} className="space-y-4">
          {!invoice && <>
            <InvoiceCustomerPicker onSelect={customer => { setName(customer.name || ''); setEmail(customer.email || '') }} />
            <Label className="grid gap-2">Customer name<Input required maxLength={160} value={name} onChange={event => setName(event.target.value)} /></Label>
            <Label className="grid gap-2">Customer email<Input required type="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} /></Label>
            <Label className="grid gap-2">Link to order number (optional)<Input maxLength={80} value={order} onChange={event => setOrder(event.target.value)} /></Label>
          </>}
          <Label className="grid gap-2">{invoice ? 'Upload new PDF version' : 'Invoice PDF'}<Input required type="file" accept="application/pdf,.pdf" onChange={event => setFile(event.target.files?.[0] || null)} /></Label>
          <p className="text-xs text-muted-foreground">PDF only, up to 5 MB and 200 pages. Each uploaded version is retained.</p>
          <Label className="grid gap-2">Reason / note<Textarea required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></Label>
        </fieldset>
        {!!history.length && <section className="space-y-2"><h3 className="text-sm font-semibold">Revision history</h3><div className="max-h-60 overflow-y-auto divide-y rounded-lg border">
          {history.map(version => <div key={version.revision} className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs">
            <div className="min-w-0 flex-1 break-words"><p className="font-semibold">Revision {version.revision} · {version.filename}</p><p>{version.reason}</p><p className="text-muted-foreground">{new Date(version.savedAt).toLocaleString()} · {version.savedBy}</p></div>
            <Button asChild size="sm" variant="outline"><a href={`/api/admin/invoices/${invoice!._id}?revision=${version.revision}`}>Download</a></Button>
          </div>)}
        </div></section>}
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Close</Button>
          <Button type="submit" disabled={saving || loading || conflict || !file || !reason.trim()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{invoice ? 'Save new version' : 'Upload invoice'}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}
