'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { CollectionDesignImage } from '@/components/collection-design-image'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

export function PatchPlacementGuide({ images, placements }: {
  images: Array<{ src: string; alt: string }>
  placements: string[][]
}) {
  const [view, setView] = useState<'front' | 'back'>('front')
  const [unit, setUnit] = useState<'in' | 'cm'>('in')
  const image = images[view === 'front' ? 0 : 1]
  const rows = placements.filter(([name]) => view === 'back' ? /back/i.test(name) : !/back/i.test(name))
  const width = (value: string) => `${unit === 'cm' ? Number((parseFloat(value) * 2.54).toFixed(1)) : parseFloat(value)} ${unit}`
  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
      <div>
        <div className="mb-3 flex gap-2" role="group" aria-label="Jacket view">
          {(['front', 'back'] as const).map(side => <button key={side} type="button" aria-pressed={view === side} onClick={() => setView(side)} className={`min-h-11 flex-1 rounded-lg border px-4 text-sm font-semibold ${view === side ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>{side === 'front' ? 'Front & sleeves' : 'Back'}</button>)}
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-white">
          <CollectionDesignImage key={view} urls={image ? [image.src] : []} alt={image?.alt || `${view} jacket placement diagram`} sizes="(min-width: 1024px) 42vw, 100vw" className="object-contain p-3 sm:p-5" />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Placement illustration. Actual artwork size and position are reviewed against your selected jacket.</p>
      </div>
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{view === 'front' ? 'Front & sleeve' : 'Back'} reference sizes</h3><div role="group" aria-label="Measurement units" className="inline-flex rounded-lg border p-1">{(['in', 'cm'] as const).map(value => <button key={value} type="button" aria-pressed={unit === value} onClick={() => setUnit(value)} className={`min-h-11 min-w-12 rounded-md px-3 text-sm font-semibold ${unit === value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{value}</button>)}</div></div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">These are reference maximum widths for a medium jacket, not guaranteed limits for every style. Garment size, seams, fabric and artwork can change the usable area.</p>
        <Collapsible className="group mt-4 border-t">
          <CollapsibleTrigger className="w-full text-left flex min-h-12 cursor-pointer items-center justify-between gap-3 text-sm font-semibold">View {rows.length} placement sizes<ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" /></CollapsibleTrigger><CollapsibleContent forceMount className="data-[state=closed]:hidden">
          <dl className="divide-y md:hidden">{rows.map(([name, maxWidth, use]) => <div key={name} className="py-3"><dt className="flex justify-between gap-3 text-sm font-semibold"><span>{name}</span><span className="shrink-0">{width(maxWidth)} max</span></dt><dd className="mt-1 text-sm leading-6 text-muted-foreground">{use}</dd></div>)}</dl>
          <table className="hidden w-full table-fixed text-left text-sm md:table"><caption className="sr-only">{view} decoration placement reference widths in {unit}</caption><thead className="border-y bg-muted/40"><tr><th scope="col" className="w-[28%] px-2 py-3">Placement</th><th scope="col" className="w-[22%] px-2 py-3">Max width</th><th scope="col" className="px-2 py-3">Common uses</th></tr></thead><tbody>{rows.map(([name, maxWidth, use]) => <tr key={name} className="border-b align-top"><th scope="row" className="px-2 py-3 font-medium">{name}</th><td className="px-2 py-3">{width(maxWidth)}</td><td className="px-2 py-3 text-muted-foreground">{use}</td></tr>)}</tbody></table>
        </CollapsibleContent></Collapsible>
        <Link href="/size-guide" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Check your jacket measurements</Link>
      </div>
    </div>
  )
}
