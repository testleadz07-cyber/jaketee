'use client'

import { useEffect, useId, useState } from 'react'
import { Check } from 'lucide-react'
import { CollectionDesignImage } from '@/components/collection-design-image'
import { WhatsAppButton } from '@/components/whatsapp-help'
import type { Material, Swatch } from '@/data/materials-colors'

export type MaterialWithSwatches = Material & { swatches: Swatch[] }

export function MaterialColorExplorer({ materials }: { materials: MaterialWithSwatches[] }) {
  const id = useId()
  const [materialId, setMaterialId] = useState(materials[0].id)
  const [colorName, setColorName] = useState(materials[0].swatches[0]?.name || '')
  useEffect(() => {
    const syncMaterial = () => {
      const next = materials.find(item => window.location.hash === `#colors-${item.id}`)
      if (next) { setMaterialId(next.id); setColorName(next.swatches[0]?.name || '') }
    }
    syncMaterial()
    window.addEventListener('hashchange', syncMaterial)
    return () => window.removeEventListener('hashchange', syncMaterial)
  }, [materials])
  const material = materials.find(item => item.id === materialId) || materials[0]
  const selected = material.swatches.find(color => color.name === colorName) || material.swatches[0]
  return (
    <div className="mt-6">
      {materials.map(item => <span key={item.id} id={`colors-${item.id}`} className="block scroll-mt-24" aria-hidden="true" />)}
      <div className="grid items-start gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-8">
      <div className="rounded-2xl border bg-card p-5 sm:p-6">
        <label htmlFor={`${id}-material`} className="text-sm font-semibold">Choose a material or finish</label>
        <select id={`${id}-material`} value={material.id} onChange={event => { const next = materials.find(item => item.id === event.target.value)!; setMaterialId(next.id); setColorName(next.swatches[0]?.name || '') }} className="mt-2 min-h-12 w-full rounded-lg border bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <optgroup label="Jacket fabrics & leathers">{materials.filter(item => item.id !== 'snaps-zips').map(item => <option key={item.id} value={item.id}>{item.name} · {item.swatches.length} reference colors</option>)}</optgroup>
          <optgroup label="Fastenings">{materials.filter(item => item.id === 'snaps-zips').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>
        </select>
        <div className="mt-5 overflow-hidden rounded-xl border"><div className="h-32 border-b sm:h-40" style={{ backgroundColor: selected?.hex }} aria-hidden="true" /><div className="flex items-center gap-3 bg-background p-4"><div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-white"><CollectionDesignImage key={material.id} urls={[material.texture, material.image]} alt={`${material.name} texture reference`} sizes="56px" className="object-cover" /></div><div aria-live="polite" aria-atomic="true"><p className="text-sm font-semibold">{selected?.name || 'Ask about colors'}</p><p className="mt-1 text-xs text-muted-foreground">{material.name} · reference color</p></div></div></div>
        <p className="mt-4 text-xs leading-6 text-muted-foreground">The color block and texture photo are separate references. Screen settings, lighting and material finish affect appearance. Confirm your chosen material and color before production.</p>
        <div className="mt-5"><WhatsAppButton message={`I’m comparing ${material.name} in ${selected?.name || 'a custom color'} for a jacket. Please help me confirm material, color availability and matching.`} /></div>
      </div>
      <div className="min-w-0 rounded-2xl border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-lg font-semibold">{material.name} colors</h3><p className="text-xs text-muted-foreground">{material.swatches.length} reference {material.id === 'snaps-zips' ? 'finishes' : 'shades'}</p></div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Select a swatch to see its name. Availability is confirmed for your selected jacket.</p>
        <div role="group" aria-label={`${material.name} reference colors`} className="mt-5 grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-6 xl:grid-cols-8">
          {material.swatches.map(color => <button key={color.name} type="button" aria-pressed={selected?.name === color.name} onClick={() => setColorName(color.name)} className="group flex min-h-20 min-w-0 flex-col items-center gap-2 rounded-lg px-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><span className={`relative block h-11 w-11 rounded-full border border-black/20 shadow-sm ${selected?.name === color.name ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'group-hover:ring-2 group-hover:ring-border group-hover:ring-offset-2'}`} style={{ backgroundColor: color.hex }}>{selected?.name === color.name && <span className="absolute -right-1 -top-1 rounded-full bg-primary p-0.5 text-primary-foreground"><Check aria-hidden="true" className="h-3 w-3" /></span>}</span><span className="text-center text-[11px] font-medium leading-4">{color.name}</span></button>)}
        </div>
      </div>
      </div>
    </div>
  )
}

export function MaterialComparison({ materials }: { materials: MaterialWithSwatches[] }) {
  const fabrics = materials.filter(material => material.id !== 'snaps-zips')
  const [selected, setSelected] = useState(['melton-wool', 'cowhide-leather'])
  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Choose up to 3 materials. Remove a selection to compare another.</p><button type="button" onClick={() => setSelected([])} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Clear comparison</button></div>
      <div role="group" aria-label="Materials to compare" className="mt-3 flex flex-wrap gap-2">{fabrics.map(material => { const active = selected.includes(material.id); return <button key={material.id} type="button" aria-pressed={active} disabled={!active && selected.length === 3} onClick={() => setSelected(values => active ? values.filter(value => value !== material.id) : [...values, material.id])} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary'}`}>{active && <Check aria-hidden="true" className="h-3 w-3" />}{material.name}</button> })}</div>
      <p className="mt-4 text-xs text-muted-foreground" role="status">{selected.length} of 3 materials selected</p>
      {selected.length === 0 ? <p className="mt-4 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Choose materials above to compare their climate guidance, feel and reference color ranges.</p> : <div className="mt-4 grid gap-4 md:grid-cols-3">{selected.map(key => { const material = fabrics.find(item => item.id === key)!; return <article key={key} className="overflow-hidden rounded-xl border bg-card"><h3 className="border-b bg-muted/30 px-5 py-4 font-semibold">{material.name}</h3><dl className="divide-y px-5 text-sm"><div className="py-4"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Climate guide</dt><dd className="mt-2">{material.climate}</dd></div><div className="py-4"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Character</dt><dd className="mt-2">{material.features.join(' · ')}</dd></div><div className="py-4"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reference colors</dt><dd className="mt-2">{material.swatches.length} shades; availability to confirm</dd></div><div className="py-4"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Material notes</dt><dd className="mt-2 leading-6 text-muted-foreground">{material.text}</dd></div></dl><a href={`#${material.id}`} className="mx-5 mb-4 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Explore this material</a></article> })}</div>}
      <p className="mt-4 text-xs leading-6 text-muted-foreground">Climate and feature descriptions are general guides, not performance ratings. Jacket weight, lining, construction and layering affect comfort.</p>
    </div>
  )
}
