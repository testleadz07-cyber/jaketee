'use client'

import { useState } from 'react'
import { internationalSizing, formatInternationalRange, type SizeFit, type InternationalSizeRow } from '@/lib/international-sizing'
import type { Unit } from '@/lib/jacket-sizing'

export function InternationalSizeChart({ unit }: { unit: Unit }) {
  const [fit, setFit] = useState<SizeFit>('male')
  const reference = internationalSizing[fit]
  const rows: InternationalSizeRow[] = reference.rows
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Male or female size reference">
      {(['male', 'female'] as const).map(value => <button key={value} type="button" aria-pressed={fit === value} onClick={() => setFit(value)} className={`min-h-11 rounded-md border px-4 text-sm font-medium ${fit === value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{value === 'male' ? 'Male (Men)' : 'Female (Women)'}</button>)}
    </div>
    <p className="text-sm leading-6 text-muted-foreground">US, UK and European conversions with body measurements for jacket and vest sizing. These {reference.source} references are not Jacketee product specifications. Size labels and European systems vary by brand; compare measurements and confirm your chosen style with our team.</p>
    <div className="max-w-full overflow-x-auto" role="region" aria-label={`${fit === 'male' ? 'Male' : 'Female'} international size chart`} tabIndex={0}>
      <table className="w-full text-left text-sm">
        <caption className="pb-2 text-left font-semibold">{fit === 'male' ? 'Men' : 'Women'} — regional reference sizes and body measurements ({unit})</caption>
        <thead><tr>{['Size', 'US', 'UK', reference.europeanLabel, fit === 'male' ? 'Chest' : 'Bust / Chest', 'Waist', ...(fit === 'female' ? ['Hips'] : [])].map(label => <th key={label} scope="col" className="whitespace-nowrap border-b px-3 py-3">{label}</th>)}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.size} className="border-b"><th scope="row" className="px-3 py-3">{row.size}</th>{[row.us, row.uk, row.eu, formatInternationalRange(row.chestCm, unit), formatInternationalRange(row.waistCm, unit), ...(row.hipCm ? [formatInternationalRange(row.hipCm, unit)] : [])].map((value, index) => <td key={index} className="whitespace-nowrap px-3 py-3">{value}</td>)}</tr>)}</tbody>
      </table>
    </div>
    <p className="text-xs leading-5 text-muted-foreground">Reference: <a href={reference.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{reference.source} official size guide</a>. Checked 10 October 2026. 2XL is shown as XXL in the source. These are body circumferences, not flat garment widths. For longer jackets and vests, check the hip measurement too.</p>
  </div>
}
