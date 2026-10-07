'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CustomizationSection } from '@/components/customization-section'
import { JacketDesignCanvas } from '@/components/jacket-design-canvas'
import { Button } from '@/components/ui/button'
import { JacketSizeGuide } from '@/components/jacket-size-guide'
import { FulfillmentNotice } from '@/components/fulfillment-notice'
import { useCartStore } from '@/store/cart'
import { captureJacketDesignPreviews, getJacketChestWidth } from '@/lib/jacket-design-preview'
import { getCustomizationFee } from '@/lib/customization-pricing'
import { DEFAULT_VARSITY_OPTIONS, VARSITY_COLORS, VARSITY_OPTIONS, VARSITY_TEMPLATE_ID, getVarsityImages, getVarsitySvg, getVarsityPrice, validateVarsityOptions } from '@/lib/varsity-template'
import { JACKET_VIEWS, type JacketCustomization } from '@/types/jacket-customization'
import { VARSITY_PART_COLORS } from '@/lib/varsity-svg'

const DRAFT_KEY = 'jacketee-varsity-design-v1'
const SLEEVE_OPTION_NAMES = ['Sleeve material', 'Sleeve style', 'Sleeve stripe', 'Sleeve stripe piping', 'Cuff style'] as const
const COLOR_SWATCHES = [
  ['Cream', '#f5f1e8'], ['White', '#ffffff'], ['Black', '#18181b'], ['Navy', '#172554'],
  ['Royal blue', '#1d4ed8'], ['Forest', '#14532d'], ['Maroon', '#7f1d1d'], ['Red', '#dc2626'],
  ['Gold', '#d4a017'], ['Grey', '#71717a'], ['Pink', '#f9a8d4'], ['Brown', '#78350f'],
]

export function VarsityDesigner({ children }: { children?: React.ReactNode }) {
  const router = useRouter()
  const [options, setOptions] = useState({ ...DEFAULT_VARSITY_OPTIONS })
  const [design, setDesign] = useState<JacketCustomization>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedColor, setSelectedColor] = useState('Body color')
  const colorControlsRef = useRef<HTMLDetailsElement>(null)
  const lock = useRef(false)
  const addItem = useCartStore(state => state.addItem)
  const setDirectOrderItem = useCartStore(state => state.setDirectOrderItem)
  const images = useMemo(() => getVarsityImages(options), [options])
  const collarPreview = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(getVarsitySvg(options, 'front').replace('viewBox="0 0 720 720"', 'viewBox="258 52 204 176"'))}`, [options])
  const configuration = useMemo(() => ({ ...design, varsityOptions: options }), [design, options])
  const garmentPrice = getVarsityPrice(options)
  const artworkFee = getCustomizationFee(design)
  const total = Number((garmentPrice + artworkFee).toFixed(2))

  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (!draft) return
      const saved = JSON.parse(draft)
      const restored = validateVarsityOptions(saved.options)
      restored['Right sleeve color'] = restored['Left sleeve color']
      if (!saved.design || typeof saved.design !== 'object' || Array.isArray(saved.design)) return
      for (const view of JACKET_VIEWS) {
        const side = saved.design[view]
        if (side && (typeof side !== 'object' || (side.artworks && !Array.isArray(side.artworks)) || (side.text && typeof side.text.value !== 'string'))) return
      }
      queueMicrotask(() => {
        setOptions(restored)
        setDesign(saved.design)
        setMessage('Your saved varsity design has been restored.')
      })
    } catch { /* A stale draft should not prevent starting a new jacket. */ }
  }, [])

  const changeOption = (name: string, value: string) => {
    setOptions(current => name === 'Sleeves color'
      ? { ...current, 'Left sleeve color': value, 'Right sleeve color': value }
      : { ...current, [name]: value })
    setMessage('')
    setError('')
  }

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ options, design }))
      setMessage('Design saved on this device.')
      setError('')
    } catch { setError('Your browser could not save this design. Download it to keep a copy.') }
  }

  const download = async () => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const previews = await captureJacketDesignPreviews(configuration, images, getJacketChestWidth(options.Size))
      const blob = new Blob([JSON.stringify({ template: VARSITY_TEMPLATE_ID, options, design, previews }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'my-varsity-design.json'
      link.click()
      URL.revokeObjectURL(url)
      setMessage('Design and all four previews downloaded.')
    } catch { setError('The design could not be downloaded. Please retry.') }
    finally { lock.current = false; setBusy(false) }
  }

  const purchase = async (buyNow: boolean) => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const previews = await captureJacketDesignPreviews(configuration, images, getJacketChestWidth(options.Size))
      const response = await fetch('/api/upload-snapshot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshots: previews }), signal: AbortSignal.timeout(60000),
      })
      if (!response.ok) throw new Error('Your design previews could not be saved. Please retry.')
      const data = await response.json()
      if (JACKET_VIEWS.some(view => typeof data.snapshots?.[view] !== 'string' || !data.snapshots[view].startsWith('https://'))) {
        throw new Error('Some design previews are missing. Please retry.')
      }
      const customization = { ...configuration, snapshots: data.snapshots, snapshotUrl: data.snapshots.front }
      const item = {
        productId: VARSITY_TEMPLATE_ID, name: 'Custom Varsity Jacket', price: total,
        image: data.snapshots.front, quantity: 1, customization,
        variants: Object.entries(options).map(([name, value]) => ({ name, value })),
      }
      if (buyNow) {
        setDirectOrderItem(item)
        router.push('/checkout?mode=buy-now')
      } else {
        addItem(item)
        setMessage('Your varsity jacket has been added to the cart.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your design could not be saved. Please retry.')
    } finally { lock.current = false; setBusy(false) }
  }

  const getColor = (name: string) => options[name === 'Sleeves color' ? 'Left sleeve color' : name]
  const colorControl = (name: string) => <div key={name} className={`flex items-center justify-between gap-2 rounded-lg border p-3 text-sm ${selectedColor === name ? 'border-primary bg-primary/5' : ''}`}>
    <button type="button" aria-pressed={selectedColor === name} onClick={() => { setSelectedColor(name); colorControlsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }} className="min-h-9 flex-1 text-left">{name}</button>
    <input type="color" aria-label={name} value={getColor(name)} onChange={event => changeOption(name, event.target.value)} className="h-9 w-10 shrink-0 cursor-pointer rounded border" />
  </div>

  const optionControl = (name: keyof typeof VARSITY_OPTIONS) => <fieldset key={name}>
    <legend className="mb-2 font-semibold">{name}</legend>
    {name === 'Size' && <div className="mb-3"><JacketSizeGuide sizes={[...VARSITY_OPTIONS.Size]} /></div>}
    {name === 'Lining' && <p className="mb-2 text-xs text-muted-foreground">The interior fabric is visible at the neckline. The chosen lining is saved with your order.</p>}
    {name === 'Sleeve style' && <p className="mb-2 text-xs text-muted-foreground">Set-in sleeves join at the shoulder. Raglan sleeves extend to the neckline.</p>}
    {name === 'Cuff style' && <p className="mb-2 text-xs text-muted-foreground">Ribbed cuffs use your knit stripe style. Plain fabric cuffs use the sleeve material without knit stripes.</p>}
    <div className="flex flex-wrap gap-2">{VARSITY_OPTIONS[name].map(value => <button type="button" key={value} aria-pressed={options[name] === value} onClick={() => changeOption(name, value)} className={`min-h-11 rounded-lg border px-3 py-2 text-sm ${options[name] === value ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary'}`}>{value}</button>)}</div>
  </fieldset>

  const controls = (
    <div className="space-y-6">
      <CustomizationSection title="1. Materials">
        {optionControl('Body material')}
        {optionControl('Sleeve material')}
      </CustomizationSection>
      <CustomizationSection title="2. Sleeves">
        <p className="text-sm text-muted-foreground">Choose construction, stripes, and cuffs. Left and right refer to the wearer’s sides.</p>
        {SLEEVE_OPTION_NAMES.filter(name => name !== 'Sleeve material' && (name !== 'Sleeve stripe piping' || options['Sleeve stripe'] === 'Add stripe')).map(optionControl)}
      </CustomizationSection>
      <CustomizationSection title="3. Collar & hood">
        <img src={collarPreview} alt={`${options['Collar style']} neckline close-up${options.Hood === 'Hooded' ? ' with hood' : ''}`} className="mx-auto h-48 w-full rounded-lg bg-muted object-contain" />
        <fieldset>
          <legend className="mb-2 font-semibold">Collar style</legend>
          <div className="grid grid-cols-2 gap-2">{VARSITY_OPTIONS['Collar style'].map(style => <button key={style} type="button" aria-label={style} aria-pressed={options['Collar style'] === style} onClick={() => changeOption('Collar style', style)} className={`rounded-lg border p-3 text-left ${options['Collar style'] === style ? 'border-primary bg-primary/5' : 'hover:border-primary'}`}>
            <span className="block text-sm font-semibold">{style}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{style === 'Classic rib' ? 'Rounded rib collar with a V-shaped front opening.' : 'Taller upright collar around the neckline.'}</span>
          </button>)}</div>
        </fieldset>
        {optionControl('Hood')}
        <p className="text-xs text-muted-foreground">Collar stripes follow your knit style. {options.Hood === 'Hooded' ? 'The hood covers part of the collar; its edges remain visible at the front.' : 'Select Hooded to preview the collar with a hood.'}</p>
      </CustomizationSection>
      <CustomizationSection title="4. Finishing">
        {(['Closure', 'Pocket style', 'Knit style', 'Lining'] as const).map(optionControl)}
      </CustomizationSection>
      <CustomizationSection detailsRef={colorControlsRef} title="5. Colors">
        <p className="mt-1 text-sm text-muted-foreground">One sleeve color applies to both sleeves.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {Object.keys(VARSITY_COLORS).filter(name =>
            name !== 'Right sleeve color' &&
            (!name.startsWith('Hood') || options.Hood === 'Hooded') &&
            (name !== 'Stripe color' || options['Knit style'] !== 'Plain') &&
            (name !== 'Pockets color' || options['Pocket style'] !== 'No pockets') &&
            (name !== 'Sleeve stripe color' || options['Sleeve stripe'] === 'Add stripe') &&
            (name !== 'Sleeve piping color' || (options['Sleeve stripe'] === 'Add stripe' && options['Sleeve stripe piping'] === 'Add piping'))
          ).map(name => colorControl(name === 'Left sleeve color' ? 'Sleeves color' : name))}
        </div>
        <fieldset className="mt-4 rounded-lg border p-3">
          <legend className="px-1 text-sm font-medium">{selectedColor}</legend>
          <div className="flex flex-wrap gap-2">{COLOR_SWATCHES.map(([label, color]) => <button key={color} type="button" title={label} aria-label={`Set ${selectedColor.toLowerCase()} to ${label}`} aria-pressed={getColor(selectedColor).toLowerCase() === color}
            onClick={() => changeOption(selectedColor, color)} className={`h-9 w-9 rounded-full border-2 ${getColor(selectedColor).toLowerCase() === color ? 'ring-2 ring-primary ring-offset-2' : 'border-black/15'}`} style={{ backgroundColor: color }} />)}</div>
          <p className="mt-3 text-xs text-muted-foreground">Choose a swatch or use the color picker for any custom color.</p>
        </fieldset>
      </CustomizationSection>
    </div>
  )

  const review = (
    <div className="mt-6 space-y-4 border-t pt-6">
      <CustomizationSection title="7. Size">
        {optionControl('Size')}
      </CustomizationSection>
      <section aria-labelledby="jacket-summary-title" className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b bg-muted/30 p-5 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your custom design</p>
          <h2 id="jacket-summary-title" className="mt-1 text-xl font-semibold">Varsity jacket</h2>
          <p className="mt-2 text-sm text-muted-foreground">Size {options.Size} ? {options['Body material']} body ? {options['Sleeve material']} sleeves</p>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Base jacket</dt><dd className="font-medium tabular-nums">$55.00</dd></div>
            {(options['Body material'] !== 'Cotton fleece' || options['Sleeve material'] !== 'Cotton fleece') && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Material upgrade</dt><dd className="font-medium tabular-nums">$10.00</dd></div>}
            {options.Hood === 'Hooded' && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Hood</dt><dd className="font-medium tabular-nums">$5.00</dd></div>}
            {options.Closure === 'Zipper' && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Zipper</dt><dd className="font-medium tabular-nums">$2.00</dd></div>}
            {artworkFee > 0 && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Artwork & embroidery</dt><dd className="font-medium tabular-nums">${artworkFee.toFixed(2)}</dd></div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><dt className="font-semibold">Total <span className="text-xs font-normal text-muted-foreground">USD</span></dt><dd className="text-3xl font-bold tracking-tight tabular-nums">${total.toFixed(2)}</dd></div>
          </dl>
          <p className="text-xs text-muted-foreground">Shipping is calculated at checkout.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button className="h-12 border border-zinc-900 bg-zinc-900 text-base font-semibold text-white shadow-sm hover:bg-zinc-800 hover:text-white" onClick={() => purchase(false)}>Add to cart</Button>
            <Button className="h-12 border border-blue-700 bg-blue-700 text-base font-semibold text-white shadow-sm hover:bg-blue-800 hover:text-white" onClick={() => purchase(true)}>Buy now</Button>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t pt-4">
            <Button className="h-auto min-h-11 whitespace-normal border-zinc-400 bg-zinc-100 font-semibold text-zinc-900 shadow-sm hover:border-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:border-zinc-400 dark:bg-zinc-100 dark:hover:bg-zinc-200" variant="outline" onClick={saveDraft}>Save design</Button>
            <Button className="h-auto min-h-11 whitespace-normal border-zinc-400 bg-zinc-100 font-semibold text-zinc-900 shadow-sm hover:border-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:border-zinc-400 dark:bg-zinc-100 dark:hover:bg-zinc-200" variant="outline" onClick={download}>Download design</Button>
          </div>
        </div>
        <div className="border-t bg-muted/20 p-5 sm:p-6"><FulfillmentNotice compact /></div>
      </section>
    </div>
  )

  return <div className="flex min-h-screen flex-col bg-background">
    <Header />
    <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 lg:px-8">
      <p className="text-sm text-muted-foreground">Design your own / Varsity jacket</p>
      <h1 className="mt-2 text-3xl font-bold">Design your varsity jacket</h1>
      <p className="mb-6 mt-2 text-muted-foreground">Choose your jacket colors and materials, then add text or artwork to the front, back, and each sleeve.</p>
      {message && <p role="status" className="mb-4 rounded-lg border bg-muted p-3">{message}</p>}
      {error && <p role="alert" className="mb-4 rounded-lg border border-destructive p-3 text-destructive">{error}</p>}
      {busy && <p role="status" className="mb-4">Saving your four design previews…</p>}
      <div inert={busy} aria-busy={busy}>
        <JacketDesignCanvas images={images} maxTextLength={24} selectedSize={options.Size} value={configuration}
          onPartSelect={id => { const name = VARSITY_PART_COLORS[id]; if (name) { if (colorControlsRef.current) colorControlsRef.current.open = true; setSelectedColor(name === 'Left sleeve color' || name === 'Right sleeve color' ? 'Sleeves color' : name); colorControlsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) } }}
          onChange={value => { const { varsityOptions: _options, snapshots: _snapshots, snapshotUrl: _snapshot, ...artwork } = value; setDesign(artwork); setMessage('') }}
          leftContentTop={controls} leftContentBottom={review} />
      </div>
      {children}
    </main>
    <Footer />
  </div>
}
