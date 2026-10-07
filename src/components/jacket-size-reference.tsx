'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Info, Ruler } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Range = [number, number]
type Unit = 'in' | 'cm'

interface BodyRow {
  size: string
  chest: Range
  waist: Range
  sleeve: Range
  back: number
}

interface JacketRow {
  size: string
  chestFlat: number
  sleeve: number
  shoulder: number
  halfShoulder: number
  back: number
}

const bodyRows: BodyRow[] = [
  { size: 'XXS', chest: [28, 30], waist: [20, 22], sleeve: [28, 29], back: 23 },
  { size: 'XS', chest: [30, 32], waist: [24, 26], sleeve: [30, 31], back: 24 },
  { size: 'S', chest: [34, 36], waist: [28, 30], sleeve: [31, 32], back: 25 },
  { size: 'M', chest: [38, 38], waist: [32, 32], sleeve: [32, 32], back: 26.5 },
  { size: 'M/Tall', chest: [38, 38], waist: [32, 32], sleeve: [33, 34], back: 28 },
  { size: 'L', chest: [40, 42], waist: [34, 36], sleeve: [33, 34], back: 27.5 },
  { size: 'L/Tall', chest: [40, 42], waist: [34, 36], sleeve: [35, 36], back: 29 },
  { size: 'XL', chest: [44, 46], waist: [38, 40], sleeve: [34, 35], back: 28.5 },
  { size: 'XL/Tall', chest: [44, 46], waist: [38, 40], sleeve: [36, 36], back: 30 },
  { size: '2XL', chest: [48, 50], waist: [42, 44], sleeve: [35, 36], back: 29.5 },
  { size: '2XL/Tall', chest: [48, 50], waist: [42, 44], sleeve: [37, 37], back: 31 },
  { size: '3XL', chest: [52, 54], waist: [46, 48], sleeve: [36, 37], back: 30.5 },
  { size: '4XL', chest: [56, 58], waist: [50, 52], sleeve: [37, 38], back: 31.5 },
  { size: '5XL', chest: [60, 62], waist: [54, 56], sleeve: [38, 39], back: 32.5 },
  { size: '6XL', chest: [64, 66], waist: [58, 60], sleeve: [39, 40], back: 33.5 },
]

const jacketRows: JacketRow[] = [
  { size: 'XXS', chestFlat: 18, sleeve: 24, shoulder: 16, halfShoulder: 6, back: 23 },
  { size: 'XS', chestFlat: 20, sleeve: 24.5, shoulder: 17, halfShoulder: 6.25, back: 24 },
  { size: 'S', chestFlat: 22, sleeve: 25, shoulder: 18, halfShoulder: 6.5, back: 25 },
  { size: 'M', chestFlat: 24, sleeve: 25.5, shoulder: 19, halfShoulder: 6.75, back: 26.5 },
  { size: 'M/Tall', chestFlat: 24, sleeve: 27, shoulder: 19, halfShoulder: 6.75, back: 28 },
  { size: 'L', chestFlat: 26, sleeve: 26, shoulder: 20, halfShoulder: 7, back: 27.5 },
  { size: 'L/Tall', chestFlat: 26, sleeve: 27.5, shoulder: 20, halfShoulder: 7, back: 29 },
  { size: 'XL', chestFlat: 28, sleeve: 26.5, shoulder: 21, halfShoulder: 7.25, back: 28.5 },
  { size: 'XL/Tall', chestFlat: 28, sleeve: 28, shoulder: 21, halfShoulder: 7.25, back: 30 },
  { size: '2XL', chestFlat: 30, sleeve: 27, shoulder: 22, halfShoulder: 7.5, back: 29.5 },
  { size: '2XL/Tall', chestFlat: 30, sleeve: 28.5, shoulder: 22, halfShoulder: 7.5, back: 31 },
  { size: '3XL', chestFlat: 32, sleeve: 27.5, shoulder: 23, halfShoulder: 7.75, back: 30.5 },
  { size: '4XL', chestFlat: 34, sleeve: 28, shoulder: 24, halfShoulder: 8, back: 31.5 },
  { size: '5XL', chestFlat: 36, sleeve: 28.5, shoulder: 25, halfShoulder: 8.25, back: 32.5 },
  { size: '6XL', chestFlat: 38, sleeve: 29, shoulder: 26, halfShoulder: 8.5, back: 33.5 },
]

function format(value: number, unit: Unit) {
  const converted = unit === 'cm' ? value * 2.54 : value
  return String(Number(converted.toFixed(2)))
}

function formatRange([min, max]: Range, unit: Unit) {
  return min === max ? format(min, unit) : `${format(min, unit)}-${format(max, unit)}`
}

function convertEntry(value: string, from: Unit, to: Unit) {
  if (!value || from === to) return value
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value
  const converted = from === 'in' ? numeric * 2.54 : numeric / 2.54
  // Keep measurement precision so switching units cannot move a chart boundary.
  return String(Number(converted.toPrecision(15)))
}

function estimateSize(chestIn: number, waistIn: number) {
  // Allow only floating-point conversion noise at the chart boundaries.
  const tolerance = 1e-10
  if (!Number.isFinite(chestIn) || !Number.isFinite(waistIn)
    || chestIn < bodyRows[0].chest[0] - tolerance
    || waistIn < bodyRows[0].waist[0] - tolerance) return null

  return bodyRows.find((row) => !row.size.includes('Tall')
    && chestIn <= row.chest[1] + tolerance
    && waistIn <= row.waist[1] + tolerance) ?? null
}

function UnitToggle({ unit, onChange, label }: { unit: Unit; onChange: (unit: Unit) => void; label: string }) {
  return (
    <div className="inline-flex w-fit shrink-0 border p-1" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange('in')} aria-pressed={unit === 'in'} className={`min-h-9 px-3 text-sm font-medium ${unit === 'in' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>Inches</button>
      <button type="button" onClick={() => onChange('cm')} aria-pressed={unit === 'cm'} className={`min-h-9 px-3 text-sm font-medium ${unit === 'cm' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>Centimeters</button>
    </div>
  )
}

const measurementGuides = [
  {
    id: 'measure-chest', title: 'Body chest', image: 'body-chest',
    alt: 'A level measuring tape wrapped around the fullest part of the chest, just below the armpits.',
    steps: ['Stand naturally in a light, close-fitting top.', 'Wrap a soft tape around the fullest part of your chest, just below your armpits.', 'Keep the tape level and snug without squeezing. Breathe normally and record the measurement.'],
  },
  {
    id: 'measure-waist', title: 'Natural waist', image: 'body-waist',
    alt: 'A measuring tape wrapped around the natural waist above the trouser waistband.',
    steps: ['Find your natural waist between your lower ribs and the top of your hips.', 'Wrap the tape around this point, keeping it level. Your trouser waistband may sit lower.', 'Relax your stomach and record the measurement without pulling the tape tight.'],
  },
  {
    id: 'measure-sleeve', title: 'Jacket sleeve', image: 'jacket-sleeve',
    alt: 'A jacket laid flat with a measuring tape from the shoulder seam to the end of the cuff.',
    steps: ['Lay a jacket that fits you well on a flat surface and smooth the sleeve.', 'Measure from the shoulder seam to the very end of the cuff, including the ribbing.', 'Compare with the finished jacket chart. Confirm the separate body-chart sleeve measuring points with our team.'],
  },
  {
    id: 'measure-shoulders', title: 'Across shoulder', image: 'jacket-shoulders',
    alt: 'The back of a flat jacket with a tape across the upper back between the shoulder seams.',
    steps: ['Lay your jacket flat with its back facing up.', 'Measure straight across the upper back from one shoulder seam to the other.', 'Keep the jacket relaxed and compare with the across-shoulder column in the jacket chart.'],
  },
  {
    id: 'measure-back', title: 'Back length', image: 'jacket-back',
    alt: 'The back of a flat jacket with a vertical tape from the base of the collar to the bottom of the waistband.',
    steps: ['Lay your jacket flat with its back facing up.', 'Measure down the center back from the base of the collar to the bottom of the waistband.', 'Include the waistband, exclude the collar, and compare with the finished jacket chart.'],
  },
]

function MeasurementIllustration({ image, alt, compact = false }: { image: string; alt: string; compact?: boolean }) {
  return (
    <div className={`relative mx-auto aspect-square w-full overflow-hidden rounded-lg bg-white ${compact ? 'max-w-32' : 'max-w-80'}`}>
      <Image src={`/images/size-guide/${image}.webp`} alt={alt} fill
        sizes={compact ? '128px' : '(max-width: 639px) min(80vw, 320px), 224px'} className="object-contain p-3" />
    </div>
  )
}

export function JacketSizeReference() {
  const [unit, setUnit] = useState<Unit>('in')
  const [chest, setChest] = useState('')
  const [waist, setWaist] = useState('')
  const changeUnit = (nextUnit: Unit) => {
    if (nextUnit === unit) return
    setChest((value) => convertEntry(value, unit, nextUnit))
    setWaist((value) => convertEntry(value, unit, nextUnit))
    setUnit(nextUnit)
  }
  const chestIn = Number(chest) / (unit === 'cm' ? 2.54 : 1)
  const waistIn = Number(waist) / (unit === 'cm' ? 2.54 : 1)
  const hasMeasurements = Number.isFinite(chestIn) && Number.isFinite(waistIn) && chestIn > 0 && waistIn > 0
  const suggested = hasMeasurements ? estimateSize(chestIn, waistIn) : null

  return (
    <>
      <section id="find-your-fit" className="scroll-mt-20 border-b py-9 md:py-14" aria-labelledby="size-estimate-heading">
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[minmax(0,1fr)_minmax(270px,0.8fr)] lg:gap-14">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Start with your measurements</p>
            <h2 id="size-estimate-heading" className="mt-2 text-2xl font-semibold">Estimate a reference size</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">A soft tape measure is more reliable than height and weight alone. Enter your body chest and waist measurements for a starting point.</p>
            <div className="mt-6"><UnitToggle unit={unit} onChange={changeUnit} label="Estimate measurement units" /></div>
            <div className="mt-5 grid max-w-lg gap-4 sm:grid-cols-2">
              <div><Label htmlFor="body-chest">Chest ({unit})</Label><Input id="body-chest" type="number" min="1" step="any" inputMode="decimal" value={chest} onChange={(event) => setChest(event.target.value)} placeholder={unit === 'in' ? 'e.g. 38' : 'e.g. 97'} className="mt-2" /></div>
              <div><Label htmlFor="body-waist">Waist ({unit})</Label><Input id="body-waist" type="number" min="1" step="any" inputMode="decimal" value={waist} onChange={(event) => setWaist(event.target.value)} placeholder={unit === 'in' ? 'e.g. 32' : 'e.g. 81'} className="mt-2" /></div>
            </div>
            <div className="mt-5 grid max-w-lg grid-cols-2 gap-4">
              {measurementGuides.slice(0, 2).map((guide) => (
                <Link key={guide.id} href={`#${guide.id}`} className="rounded-lg border p-3 text-center text-sm font-medium hover:border-primary focus-visible:outline-2 focus-visible:outline-ring">
                  <MeasurementIllustration image={guide.image} alt={guide.alt} compact />
                  <span className="mt-2 block underline underline-offset-4">How to measure {guide.image === 'body-chest' ? 'chest' : 'waist'}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="border-t pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0" aria-live="polite">
            <Ruler className="h-6 w-6" />
            <h3 className="mt-3 text-lg font-semibold">Your starting point</h3>
            <p className="mt-3 text-3xl font-bold">{!hasMeasurements ? 'Measure first' : suggested?.size || 'Ask us to check'}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{!hasMeasurements ? 'Enter your chest and waist to see a reference size.' : suggested ? 'This is an estimate from the reference body chart below, not a guaranteed Jacketee fit.' : 'Your measurements are outside this reference chart. Contact us for help.'}</p>
            <Link href="/contact" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">Confirm a product's fit <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section id="body-size-chart" className="scroll-mt-20 border-b border-t-4 border-t-zinc-900 bg-muted/30 py-10 dark:border-t-zinc-100 md:py-14" aria-labelledby="body-chart-heading">
        <div className="container mx-auto min-w-0 px-4">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
            <div><p className="text-xs font-semibold uppercase text-muted-foreground">Body measurements</p><h2 id="body-chart-heading" className="mt-2 text-2xl font-semibold">Reference body size chart</h2></div>
            <UnitToggle unit={unit} onChange={changeUnit} label="Body chart measurement units" />
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">Chest and waist are measured around your body. Sleeve and back length are separate reference lengths; ask our team to confirm their measuring points before using them. The supplied chart is a planning reference and has not been verified against every Jacketee product.</p>
          <p className="mt-3 text-sm"><Link href="#measure-chest" className="font-medium underline underline-offset-4">See illustrated body measurement steps</Link></p>
          <div className="mt-5 grid max-w-2xl grid-cols-2 gap-4">
            {measurementGuides.slice(0, 2).map((guide) => (
              <figure key={guide.id} className="min-w-0 rounded-lg border bg-background p-3">
                <MeasurementIllustration image={guide.image} alt={guide.alt} compact />
                <figcaption className="mt-2 text-center text-sm font-medium">{guide.title}</figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground sm:hidden">Swipe the chart sideways to see every measurement.</p>
          <div className="mt-5 max-w-full overflow-x-auto border-y" role="region" aria-label="Body size chart" tabIndex={0}>
            <table className="w-full min-w-[580px] text-left text-sm">
              <thead className="bg-background"><tr><th scope="col" className="sticky left-0 z-10 border-r bg-background px-3 py-3">Size</th><th scope="col" className="px-3 py-3">Chest</th><th scope="col" className="px-3 py-3">Waist</th><th scope="col" className="px-3 py-3">Sleeve</th><th scope="col" className="px-3 py-3">Back length</th></tr></thead>
              <tbody className="divide-y">{bodyRows.map((row) => <tr key={row.size} className="odd:bg-background/60"><th scope="row" className="sticky left-0 z-10 border-r bg-background px-3 py-3 font-semibold">{row.size}</th><td className="px-3 py-3">{formatRange(row.chest, unit)}</td><td className="px-3 py-3">{formatRange(row.waist, unit)}</td><td className="px-3 py-3">{formatRange(row.sleeve, unit)}</td><td className="px-3 py-3">{format(row.back, unit)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="jacket-size-chart" className="scroll-mt-20 border-b border-t-4 border-t-zinc-900 py-10 dark:border-t-zinc-100 md:py-14" aria-labelledby="jacket-chart-heading">
        <div className="container mx-auto min-w-0 px-4">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
            <div><p className="text-xs font-semibold uppercase text-muted-foreground">Finished garment</p><h2 id="jacket-chart-heading" className="mt-2 text-2xl font-semibold">Reference jacket size chart</h2></div>
            <UnitToggle unit={unit} onChange={changeUnit} label="Jacket chart measurement units" />
          </div>
          <div className="mt-5 grid min-w-0 items-center gap-5 sm:grid-cols-[minmax(0,224px)_minmax(0,1fr)]">
            <MeasurementIllustration image="jacket-overview" alt="A jacket laid flat with arrows showing chest width, shoulder width, sleeve length, and collar-base-to-hem length." />
            <div className="min-w-0">
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">Close a jacket you already own and lay it flat without stretching. Chest is measured straight across from armpit to armpit; double this width for the garment's full circumference. These finished-garment values are reference measurements, not product-specific Jacketee specifications.</p>
              <Link href="#measure-sleeve" className="mt-3 inline-flex text-sm font-medium underline underline-offset-4">See illustrated jacket measurement steps</Link>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground sm:hidden">Swipe the chart sideways to see every measurement.</p>
          <div className="mt-5 max-w-full overflow-x-auto border-y" role="region" aria-label="Jacket size chart" tabIndex={0}>
            <table className="w-full min-w-[690px] text-left text-sm">
              <thead className="bg-muted/30"><tr><th scope="col" className="sticky left-0 z-10 border-r bg-background px-3 py-3">Size</th><th scope="col" className="px-3 py-3">Chest, flat</th><th scope="col" className="px-3 py-3">Sleeve</th><th scope="col" className="px-3 py-3">Across shoulder</th><th scope="col" className="px-3 py-3">Half shoulder</th><th scope="col" className="px-3 py-3">Back length</th></tr></thead>
              <tbody className="divide-y">{jacketRows.map((row) => <tr key={row.size} className="odd:bg-muted/20"><th scope="row" className="sticky left-0 z-10 border-r bg-background px-3 py-3 font-semibold">{row.size}</th><td className="px-3 py-3">{format(row.chestFlat, unit)}</td><td className="px-3 py-3">{format(row.sleeve, unit)}</td><td className="px-3 py-3">{format(row.shoulder, unit)}</td><td className="px-3 py-3">{format(row.halfShoulder, unit)}</td><td className="px-3 py-3">{format(row.back, unit)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="how-to-measure" className="scroll-mt-20 border-b border-t-4 border-t-zinc-900 bg-zinc-100 py-10 dark:border-t-zinc-100 dark:bg-zinc-900 md:py-14" aria-labelledby="how-to-measure-heading">
        <div className="container mx-auto min-w-0 px-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Fit checklist</p>
          <h2 id="how-to-measure-heading" className="mt-2 text-2xl font-semibold">How to measure</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Use a soft tape for your body and a jacket you like for garment measurements. Record every measurement in the same unit.</p>
          <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-2">
            {measurementGuides.map((guide, index) => (
              <article key={guide.id} id={guide.id} aria-labelledby={`${guide.id}-heading`} className="grid min-w-0 scroll-mt-24 items-center gap-5 rounded-xl border bg-background p-4 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)] sm:p-5">
                <MeasurementIllustration image={guide.image} alt={guide.alt} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{index < 2 ? 'Body measurement' : 'Finished jacket'}</p>
                  <h3 id={`${guide.id}-heading`} className="mt-2 text-lg font-semibold">{String(index + 1).padStart(2, '0')} · {guide.title}</h3>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                    {guide.steps.map((step) => <li key={step} className="pl-1">{step}</li>)}
                  </ol>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-lg border p-4 text-sm leading-6 text-muted-foreground">
            <Info className="mt-1 h-4 w-4 shrink-0" />
            <div className="min-w-0 space-y-2">
              <p><strong className="text-foreground">Half shoulder:</strong> This is a separate reference measurement, not half of the across-shoulder value. <Link href="/contact" className="underline underline-offset-4">Ask our team</Link> for its measuring points for your chosen jacket.</p>
              <p>Tall entries appear only where listed in the reference chart. Availability and actual dimensions vary by product.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
