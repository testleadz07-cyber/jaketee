'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api-fetch'
import { normalizeActivityPath } from '@/lib/activity-schema'
import { ActivityDevice } from '@/components/admin/activity-device'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Globe, Loader2 } from 'lucide-react'

type Row = { id: string; action: string; details: Record<string, unknown>; createdAt: string; country: string; region?: string; city?: string; ip?: string; userAgent?: string }
type ActivityPage = { activities: Row[]; total: number; page: number; pages: number; limit: number }
export const activityLabel = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
function valueText(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.map(valueText).join(', ')
  if (typeof value === 'object') return Object.entries(value).map(([key, item]) => `${activityLabel(key)}: ${valueText(item)}`).join('; ')
  return String(value)
}
function DetailValue({ value }: { value: unknown }) {
  const text = valueText(value)
  if (!/^#(?:[a-f0-9]{3}|[a-f0-9]{6}|[a-f0-9]{8})$/i.test(text)) return <>{text}</>
  const hex = (text.length === 4 ? `#${text.slice(1).split('').map(char => char + char).join('')}` : text).toLowerCase()
  const names: Record<string, string> = { '#000000': 'Black', '#ffffff': 'White', '#ff0000': 'Red', '#00ff00': 'Lime', '#0000ff': 'Blue', '#ffff00': 'Yellow', '#ffa500': 'Orange', '#800080': 'Purple', '#ffc0cb': 'Pink', '#808080': 'Grey', '#008000': 'Green', '#000080': 'Navy', '#ffd700': 'Gold' }
  return <span className="inline-flex items-center gap-1.5 align-middle" title={text}><span aria-hidden="true" className="inline-block h-3.5 w-3.5 shrink-0 rounded-sm border border-border" style={{ backgroundColor: hex }} />{names[hex] || 'Custom color'}</span>
}
function Details({ row }: { row: Row }) {
  const details = row.details || {}
  return <dl className="space-y-2 text-xs [overflow-wrap:anywhere]">{Object.entries(details).filter(([key]) => key !== 'productHref').map(([key, value]) => {
    const href = key === 'path' ? normalizeActivityPath(value) : key === 'productName' || key === 'name' ? normalizeActivityPath(details.productHref) : undefined
    return <div key={key} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3"><dt className="text-muted-foreground">{key === 'activeSeconds' ? 'Active time' : activityLabel(key)}</dt><dd>{href ? <Link href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{valueText(value)}</Link> : <DetailValue value={value} />}{key === 'activeSeconds' ? ' seconds' : ''}</dd></div>
  })}{!Object.keys(details).length && <p>No additional details recorded.</p>}</dl>
}
function ActivitySummary({ row }: { row: Row }) {
  const details = row.details || {}
  const title = details.productName || details.name || details.path || details.productId
  const href = normalizeActivityPath(details.productHref) || normalizeActivityPath(details.path)
  const context = [details.view, details.elementName || details.elementType, details.field || details.step].filter(Boolean).map(value => activityLabel(String(value))).join(' · ')
  const hasChange = details.before !== undefined || details.after !== undefined
  return <div className="w-64 space-y-0.5 text-xs leading-5 sm:w-80">
    {Boolean(title) && (href ? <Link href={href} target="_blank" rel="noopener noreferrer" title={valueText(title)} className="block truncate font-medium text-primary underline underline-offset-2">{valueText(title)}</Link> : <p className="truncate font-medium" title={valueText(title)}>{valueText(title)}</p>)}
    {(context || hasChange) && <div className="flex items-center gap-1 overflow-hidden text-muted-foreground"><span className="truncate" title={context}>{context}</span>{hasChange && <span className="inline-flex shrink-0 items-center gap-1"><span className="max-w-20 truncate"><DetailValue value={details.before} /></span>→<span className="max-w-20 truncate"><DetailValue value={details.after} /></span></span>}</div>}
    <Dialog><DialogTrigger asChild><button type="button" className="text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View details<span className="sr-only"> for {activityLabel(row.action)} at {new Date(row.createdAt).toLocaleString()}</span></button></DialogTrigger><DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{activityLabel(row.action)}</DialogTitle><DialogDescription>{new Date(row.createdAt).toLocaleString()}</DialogDescription></DialogHeader><Details row={row} /></DialogContent></Dialog>
  </div>
}
export function UserActivityHistory({ userId }: { userId: string }) {
  const [requestedPage, setRequestedPage] = useState(1)
  const [data, setData] = useState<ActivityPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        const response = await apiFetch(`/api/admin/users/${userId}/activities?page=${requestedPage}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Unable to load activity history. Please try again.')
        const result: ActivityPage = await response.json()
        if (!controller.signal.aborted) setData(result)
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Unable to load activity history.')
      } finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [userId, requestedPage, retry])
  return <Card className="border-2">
    <CardHeader><CardTitle className="flex items-center gap-1.5"><Globe className="h-4 w-4" /> Activity History</CardTitle><CardDescription>Actions performed by this user, newest first.{data ? ` Total: ${data.total} activities.` : ''}</CardDescription></CardHeader>
    <CardContent className="p-0" aria-busy={loading}>
      {loading ? <div role="status" className="flex items-center justify-center gap-2 py-8 text-sm"><Loader2 className="h-5 w-5 animate-spin" /> Loading activity…</div> : error ? <div role="alert" className="space-y-2 p-6 text-sm"><p>{error}</p><Button variant="outline" onClick={() => setRetry(value => value + 1)}>Retry</Button></div> : !data?.activities.length ? <p className="px-6 pb-6 text-sm text-muted-foreground">No recorded activity yet.</p> : <Table>
        <TableHeader><TableRow>{['Time', 'Action', 'Details', 'Country', 'State / Region', 'City', 'Device', 'IP Address'].map(label => <TableHead key={label} className="whitespace-nowrap">{label}</TableHead>)}</TableRow></TableHeader>
        <TableBody className="[&_td]:py-2 [&_td]:align-top">{data.activities.map(row => <TableRow key={row.id}>
          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</TableCell>
          <TableCell><Badge variant="secondary" className="whitespace-nowrap">{activityLabel(row.action)}</Badge></TableCell>
          <TableCell><ActivitySummary row={row} /></TableCell>
          <TableCell className="text-xs">{row.country}</TableCell><TableCell className="text-xs">{row.region || '—'}</TableCell><TableCell className="text-xs">{row.city || '—'}</TableCell>
          <TableCell><ActivityDevice userAgent={row.userAgent} /></TableCell><TableCell className="whitespace-nowrap font-mono text-xs">{row.ip || '—'}</TableCell>
        </TableRow>)}</TableBody>
      </Table>}
      {data && data.total > 0 && <nav aria-label="Activity history pagination" className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-xs">
        <span aria-live="polite">Showing {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)} of {data.total} · Page {data.page} of {data.pages}</span>
        <div className="flex gap-2"><Button size="sm" variant="outline" disabled={loading || data.page <= 1} onClick={() => setRequestedPage(data.page - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={loading || data.page >= data.pages} onClick={() => setRequestedPage(data.page + 1)}>Next</Button></div>
      </nav>}
    </CardContent>
  </Card>
}
