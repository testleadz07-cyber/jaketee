'use client'

import { apiFetch as fetch } from '@/lib/api-fetch'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDesignHistory } from '@/hooks/use-design-history'
import { designOptionVisible, visibleDesignColors, focusDesignChange } from '@/lib/design-view-controls'
import { DesignHistoryControls } from '@/components/design-history-controls'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CustomizationSection } from '@/components/customization-section'
import { JacketDesignCanvas } from '@/components/jacket-design-canvas'
import { Button } from '@/components/ui/button'
import { HoodieSizeGuide } from '@/components/hoodie-size-guide'
import { JacketSizeGuide } from '@/components/jacket-size-guide'
import { FulfillmentNotice } from '@/components/fulfillment-notice'
import { useCartStore } from '@/store/cart'
import { captureJacketDesignPreviews, getJacketChestWidth } from '@/lib/jacket-design-preview'
import { downloadDesignImages } from '@/lib/download-design-images'
import { getCustomizationFee } from '@/lib/customization-pricing'
import { GARMENT_TEMPLATES, getGarmentColors, getGarmentDefaults, getGarmentTemplateId, getGarmentImages, getGarmentSvg, getGarmentPrice, validateGarmentOptions, type GarmentCategory } from '@/lib/garment-template'
import { JACKET_VIEWS, MAX_JACKET_TEXTS, getJacketViewLabel, type JacketView } from '@/types/jacket-customization'
import { GARMENT_PART_COLORS as partColors } from '@/lib/garment-svg'

const COLOR_SWATCHES = [
  ['Cream', '#f5f1e8'], ['White', '#ffffff'], ['Black', '#18181b'], ['Navy', '#172554'],
  ['Royal blue', '#1d4ed8'], ['Forest', '#14532d'], ['Maroon', '#7f1d1d'], ['Red', '#dc2626'],
  ['Gold', '#d4a017'], ['Grey', '#71717a'], ['Pink', '#f9a8d4'], ['Brown', '#78350f'],
]

export function GarmentDesigner({ category, children }: { category: GarmentCategory; children?: React.ReactNode }) {
  const template = GARMENT_TEMPLATES[category]
  const optionChoices = template.options as Record<string, string[]>
  const templateId = getGarmentTemplateId(category)
  const DRAFT_KEY = `jacketee-${category}-design-v1`
  const name = template.name
  const isHoodie = category === 'hoodie'
  const colorChoices = getGarmentColors(category)

  const router = useRouter()
  const history = useDesignHistory(() => getGarmentDefaults(category))
  const { options, design, setOptions, setDesign, restore } = history
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [requestedColor, setSelectedColor] = useState('Body color')
  const [activeView, setActiveView] = useState<JacketView>('front')
  const colorControlsRef = useRef<HTMLDetailsElement>(null)
  const lock = useRef(false)
  const addItem = useCartStore(state => state.addItem)
  const setDirectOrderItem = useCartStore(state => state.setDirectOrderItem)
  const images = useMemo(() => getGarmentImages(category, options), [category, options])
  const visibleColors = useMemo(() => visibleDesignColors(images, activeView, partColors), [images, activeView])
  const normalizeColor = (name: string) => /^(Left|Right) sleeve color$/.test(name) ? 'Sleeves color' : name
  const selectedColor = visibleColors.has(requestedColor) ? normalizeColor(requestedColor) : normalizeColor([...visibleColors][0] || 'Body color')
  const sleeveView = activeView === 'leftSleeve' || activeView === 'rightSleeve'
  const navigateHistory = (direction: 'undo' | 'redo') => {
    const change = history[direction]()
    if (!change) return
    setActiveView(change.view)
    if (change.option?.endsWith('color')) setSelectedColor(change.option)
    setMessage((direction === 'undo' ? 'Undo: ' : 'Redo: ') + change.label + '. Showing ' + getJacketViewLabel(change.view).toLowerCase() + '.')
    setError('')
    focusDesignChange(change.option)
  }
  const collarPreview = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(getGarmentSvg(category, options, 'front').replace('viewBox="0 0 720 720"', 'viewBox="258 52 204 176"'))}`, [category, options])
  const configuration = useMemo(() => ({ ...design, garmentOptions: options, garmentCategory: category }), [category, design, options])
  const garmentPrice = getGarmentPrice(category, options)
  const artworkFee = getCustomizationFee(design)
  const total = Number((garmentPrice + artworkFee).toFixed(2))

  useEffect(() => {
    try {
      const draft = localStorage.getItem(`jacketee-${category}-design-v1`)
      if (!draft) return
      const saved = JSON.parse(draft)
      const restored = validateGarmentOptions(category, saved.options)
      if (!saved.design || typeof saved.design !== 'object' || Array.isArray(saved.design)) return
      for (const view of JACKET_VIEWS) {
        const side = saved.design[view]
        if (side && (typeof side !== 'object' || (side.artworks && !Array.isArray(side.artworks)) || (side.texts && (!Array.isArray(side.texts) || side.texts.length > MAX_JACKET_TEXTS || side.texts.some((text: { id?: unknown; value?: unknown }) => !text || typeof text.id !== 'string' || typeof text.value !== 'string'))) || (side.text && typeof side.text.value !== 'string'))) return
      }
      queueMicrotask(() => {
        restore(restored, saved.design)
        setMessage('Your saved jacket design has been restored.')
      })
    } catch { /* A stale draft should not prevent starting a new jacket. */ }
    // Each category page mounts its own designer and restores only its own draft.
  }, [category, restore])

  const changeOption = (name: string, value: string) => {
    setOptions(current => {
      const next = { ...current, [name]: value }
      if (isHoodie && name === 'Closure' && next['Pocket style'] !== 'No pockets') next['Pocket style'] = value === 'Full-zip' ? 'Split pockets' : 'Kangaroo pocket'
      return next
    })
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
      downloadDesignImages(previews, `Custom ${name}`)
      setMessage('Download started: ZIP with four PNG images of your current design.')
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
        productId: templateId, name: `Custom ${name}`, price: total,
        image: data.snapshots.front, quantity: 1, customization,
        variants: Object.entries(options).map(([name, value]) => ({ name, value })),
      }
      if (buyNow) {
        setDirectOrderItem(item)
        router.push('/checkout?mode=buy-now')
      } else {
        addItem(item)
        setMessage(isHoodie ? 'Your fleece hoodie has been added to the cart.' : 'Your jacket has been added to the cart.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your design could not be saved. Please retry.')
    } finally { lock.current = false; setBusy(false) }
  }

  const getColor = (name: string) => options[name]
  const colorControl = (name: string) => <div key={name} className={`flex items-center justify-between gap-2 rounded-lg border p-3 text-sm ${selectedColor === name ? 'border-primary bg-primary/5' : ''}`}>
    <button type="button" aria-pressed={selectedColor === name} onClick={() => { setSelectedColor(name); colorControlsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }} className="min-h-9 flex-1 text-left">{name}</button>
    <input type="color" aria-label={name} value={getColor(name)} onFocus={history.beginInteraction} onBlur={history.endInteraction} onChange={event => changeOption(name, event.target.value)} className="h-9 w-10 shrink-0 cursor-pointer rounded border" />
  </div>

  const optionControl = (name: keyof typeof optionChoices) => {
    if (!designOptionVisible(name, activeView)) return null
    return <fieldset key={name}>
    <legend className="mb-2 font-semibold">{name}</legend>
    {name === 'Size' && <div className="mb-3">{isHoodie ? <HoodieSizeGuide fit={options.Fit} /> : <JacketSizeGuide sizes={[...optionChoices.Size]} />}</div>}
    {name === 'Fleece weight' && <p className="mb-2 text-xs text-muted-foreground">Choose your preferred fleece weight. Texture is illustrative; contact us to confirm exact fabric specifications.</p>}
    {name === 'Fit' && <p className="mb-2 text-xs text-muted-foreground">Relaxed adds room through the body and sleeves. Check the size guide and contact us for hoodie measurements.</p>}
    {name === 'Lining' && <p className="mb-2 text-xs text-muted-foreground">The interior fabric is visible at the neckline. The chosen lining is saved with your order.</p>}
    {name === 'Cuff style' && <p className="mb-2 text-xs text-muted-foreground">Elastic cuffs show a gathered seam. Straight cuffs have a clean finish.</p>}
    {name === 'Padding weight' && <p className="mb-2 text-xs text-muted-foreground">The preview illustrates panel spacing for your chosen padding weight. All weights currently use the same price.</p>}
    <div className="flex flex-wrap gap-2">{optionChoices[name].filter(value => !isHoodie || name !== 'Pocket style' || value === 'No pockets' || value === (options.Closure === 'Full-zip' ? 'Split pockets' : 'Kangaroo pocket')).map(value => <button type="button" key={value} aria-pressed={options[name] === value} onClick={() => changeOption(name, value)} className={`min-h-11 rounded-lg border px-3 py-2 text-sm ${options[name] === value ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary'}`}>{value}</button>)}</div>
  </fieldset>
  }

  const controls = (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Options for {getJacketViewLabel(activeView).toLowerCase()}. Hidden settings stay saved when you switch views.</p>
      <CustomizationSection title="Materials">
        {isHoodie ? <><p className="text-sm text-muted-foreground">Cotton fleece body and sleeves, with ribbed cuffs and waistband.</p>{optionControl('Fleece weight')}</> : <>{optionControl('Body material')}{optionControl('Sleeve material')}</>}
      </CustomizationSection>
      <CustomizationSection title="Construction">
        {isHoodie ? <>{optionControl('Closure')}{optionControl('Fit')}{optionControl('Sleeve style')}</> : Object.keys(optionChoices).filter(key => !['Body material', 'Sleeve material', 'Collar style', 'Hood', 'Closure', 'Pocket style', 'Lining', 'Size'].includes(key)).map(optionControl)}
      </CustomizationSection>
      {!sleeveView && <CustomizationSection title={isHoodie ? "Hood & drawstrings" : "Collar & hood"}>
        <img src={collarPreview} alt="Current neckline close-up" className="mx-auto h-48 w-full rounded-lg bg-muted object-contain" />
        {isHoodie ? <><p className="text-sm text-muted-foreground">An attached hood is included with both hoodie styles.</p>{optionControl('Hood lining')}{optionControl('Drawstrings')}</> : <>{optionControl('Collar style')}{optionControl('Hood')}</>}
      </CustomizationSection>}
      {activeView === 'front' && <CustomizationSection title="Finishing">
        {isHoodie ? <>{optionControl('Pocket style')}<p className="text-xs text-muted-foreground">Full-zip hoodies use split pockets; pullovers use a kangaroo pocket.</p></> : (['Closure', 'Pocket style', 'Lining'] as const).map(optionControl)}
      </CustomizationSection>}
      <CustomizationSection detailsRef={colorControlsRef} title="Colors">
        <p className="mt-1 text-sm text-muted-foreground">One sleeve color applies to both sleeves.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {Object.keys(colorChoices).filter(name => visibleColors.has(name) &&
            (name !== 'Waistband color' || (category === 'bomber' || isHoodie)) &&
            (name !== 'Stripe color' || category === 'bomber') &&
            (!name.startsWith('Hood') || isHoodie || options.Hood === 'Hooded') &&
            (name !== 'Stripe color' || options['Knit style'] !== 'Plain') &&
            (name !== 'Drawstrings color' || options.Drawstrings === 'With drawstrings') &&
            (name !== 'Closure color' || !isHoodie || options.Closure === 'Full-zip') &&
            (name !== 'Pockets color' || options['Pocket style'] !== 'No pockets' || options['Sleeve pocket'] === 'Utility pocket')
          ).map(colorControl)}
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
      <CustomizationSection title="Size">
        {optionControl('Size')}
      </CustomizationSection>
      <section aria-labelledby="jacket-summary-title" className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b bg-muted/30 p-5 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your custom design</p>
          <h2 id="jacket-summary-title" className="mt-1 text-xl font-semibold">{name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Size {options.Size} / {options['Body material']} body / {options['Sleeve material']} sleeves</p>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{isHoodie ? 'Base hoodie (hood included)' : 'Base jacket'}</dt><dd className="font-medium tabular-nums">$55.00</dd></div>
            {!isHoodie && (options['Body material'] !== 'Cotton fleece' || options['Sleeve material'] !== 'Cotton fleece') && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Material upgrade</dt><dd className="font-medium tabular-nums">$10.00</dd></div>}
            {!isHoodie && options.Hood === 'Hooded' && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Hood</dt><dd className="font-medium tabular-nums">$5.00</dd></div>}
            {(options.Closure === 'Zipper' || (isHoodie && options.Closure === 'Full-zip')) && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{isHoodie ? 'Full-zip upgrade' : 'Zipper'}</dt><dd className="font-medium tabular-nums">$2.00</dd></div>}
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
      <p className="text-sm text-muted-foreground">Design your own / {name}</p>
      <h1 className="mt-2 text-3xl font-bold">Design your {name.toLowerCase()}</h1>
      <p className="mb-6 mt-2 text-muted-foreground">Choose colors, materials, and construction, then add text or artwork to all four views.</p>
      {error && <p role="alert" className="mb-4 rounded-lg border border-destructive p-3 text-destructive">{error}</p>}
      {busy && <p role="status" className="mb-4">Saving your four design previews…</p>}
      <div inert={busy} aria-busy={busy}>
        <JacketDesignCanvas activeView={activeView} onViewChange={setActiveView} historyMessage={message}
          historyControls={<DesignHistoryControls canUndo={history.canUndo} canRedo={history.canRedo}
            onUndo={() => navigateHistory('undo')}
            onRedo={() => navigateHistory('redo')}
            onReset={() => { history.reset(); setSelectedColor('Body color'); setMessage('Design reset to defaults. You can undo this change.'); setError('') }} />}
          onInteractionStart={history.beginInteraction} onInteractionEnd={history.endInteraction}
          frontPlacement={isHoodie ? (options.Closure === 'Full-zip' ? 'full-zip-hoodie' : 'pullover-hoodie') : undefined}
          images={images} maxTextLength={24} selectedSize={options.Size} value={configuration}
          onPartSelect={id => { const name = partColors[id]; if (name) { if (colorControlsRef.current) colorControlsRef.current.open = true; setSelectedColor(name); colorControlsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) } }}
          onChange={value => { const { garmentOptions: _options, garmentCategory: _category, snapshots: _snapshots, snapshotUrl: _snapshot, ...artwork } = value; setDesign(artwork); setMessage('') }}
          leftContentTop={controls} leftContentBottom={review} />
      </div>
      {children}
    </main>
    <Footer />
  </div>
}
