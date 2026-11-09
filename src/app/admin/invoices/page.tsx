'use client'

import { startTransition, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api-fetch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InvoiceEditor } from '@/components/admin/invoice-editor'
import { ExternalInvoiceDialog, type ExternalInvoice } from '@/components/admin/external-invoice-dialog'
import type { InvoiceOrderData } from '@/lib/invoice-pdf'
import { FileText, Loader2, Plus, Search, Upload } from 'lucide-react'

type Item = ExternalInvoice & { kind: 'generated' | 'external'; savedAt: string; savedBy: string; data?: { total: number } }
function blankInvoice(): InvoiceOrderData {
  return { orderNumber: '', createdAt: new Date().toISOString(), userName: '', userEmail: '',
    items: [{ name: '', price: 0, quantity: 1, variants: [] }], subtotal: 0, shipping: 0, tax: 0, discountAmount: 0, promoCode: '', total: 0,
    paymentMethod: 'other', shippingAddress: { name: '', street: '', city: '', state: '', zip: '', country: '', phone: '' } }
}

export default function AdminInvoicesPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [reload, setReload] = useState(0)
  const [editor, setEditor] = useState<{ item?: Item; draft?: InvoiceOrderData } | null>(null)
  const [upload, setUpload] = useState<{ item?: Item } | null>(null)
  useEffect(() => { const timer = setTimeout(() => { setQuery(search); setPage(1) }, 300); return () => clearTimeout(timer) }, [search])
  useEffect(() => {
    const controller = new AbortController()
    startTransition(() => { setLoading(true); setError('') })
    const params = new URLSearchParams({ page: String(page), search: query, kind })
    apiFetch(`/api/admin/invoices?${params}`, { signal: controller.signal }).then(async res => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load invoices.')
      if (page > data.pages) { setPage(data.pages); return }
      setItems(data.items); setTotal(data.total); setPages(data.pages)
    }).catch(err => { if (!controller.signal.aborted) setError(err.message || 'Could not load invoices.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [page, query, kind, reload])
  const close = useCallback(() => { setEditor(null); setUpload(null); setReload(value => value + 1) }, [])

  return <main className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-bold">Invoices</h1><p className="mt-1 text-sm text-muted-foreground">Private admin invoices and external PDFs. These are not shown to customers.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setUpload({})}><Upload className="mr-2 h-4 w-4" />Upload PDF</Button>
        <Button onClick={() => setEditor({ draft: blankInvoice() })}><Plus className="mr-2 h-4 w-4" />Create Invoice</Button></div>
    </div>
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-48"><Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" aria-label="Search invoices" placeholder="Search invoice, customer, filename, or order…" value={search} onChange={event => setSearch(event.target.value)} /></div>
      <select aria-label="Invoice type" className="h-10 rounded-md border bg-background px-3 text-sm" value={kind} onChange={event => { setKind(event.target.value); setPage(1) }}><option value="all">All types</option><option value="generated">Custom invoices</option><option value="external">External PDFs</option></select>
    </div>
    {error ? <div role="alert" className="rounded-lg bg-destructive/10 p-4 text-sm"><p>{error}</p><Button className="mt-2" size="sm" variant="outline" onClick={() => setReload(value => value + 1)}>Retry</Button></div> : loading ? <div className="flex items-center justify-center gap-2 py-12"><Loader2 className="h-5 w-5 animate-spin" />Loading invoices…</div> : <>
      <p className="text-sm text-muted-foreground">{total} invoice{total === 1 ? '' : 's'}</p>
      {!items.length && <Card><CardContent className="py-12 text-center"><FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p>No invoices found.</p><p className="text-sm text-muted-foreground">Create a custom invoice or upload an external PDF to get started.</p></CardContent></Card>}
      <div className="space-y-3">{items.map(item => <Card key={item._id}><CardContent className="flex flex-col items-stretch sm:flex-row sm:items-center sm:justify-between gap-4 p-5">
        <div className="flex-1 min-w-0 space-y-1 break-words"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold break-all">{item.number}</h2><Badge variant="secondary">{item.kind === 'external' ? 'External PDF' : 'Custom invoice'}</Badge><Badge variant="outline">Admin only</Badge></div>
          <p className="text-sm">{item.customerName} · {item.customerEmail}</p>{item.filename && <p className="text-xs text-muted-foreground">{item.filename}</p>}
          {item.linkedOrderNumber && <p className="text-xs">Linked order: <Link className="underline" href={`/admin/orders?search=${encodeURIComponent(item.linkedOrderNumber)}`}>{item.linkedOrderNumber}</Link></p>}
          <p className="text-xs text-muted-foreground">Revision {item.revision} · {new Date(item.savedAt).toLocaleString()} · {item.savedBy}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{item.data && <span className="mr-2 font-semibold">${item.data.total.toFixed(2)}</span>}
          <Button asChild size="sm" variant="outline"><a href={`/api/admin/invoices/${item._id}?revision=${item.revision}`}>Download</a></Button>
          <Button size="sm" variant="outline" onClick={() => item.kind === 'external' ? setUpload({ item }) : setEditor({ item })}>{item.kind === 'external' ? 'History / Upload version' : 'Edit / History'}</Button>
        </div>
      </CardContent></Card>)}</div>
      <div className="flex items-center justify-between gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</Button><span className="text-sm">Page {page} of {pages}</span><Button variant="outline" disabled={page >= pages} onClick={() => setPage(value => value + 1)}>Next</Button></div>
    </>}
    {editor && <InvoiceEditor mode="standalone" invoiceId={editor.item?._id} orderNumber={editor.item?.number || ''} initialDraft={editor.draft} onClose={close} />}
    {upload && <ExternalInvoiceDialog invoice={upload.item} onClose={close} />}
  </main>
}
