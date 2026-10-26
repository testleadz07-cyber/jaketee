'use client'

import { PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, Loader2, RotateCcw, Search, Type, X } from 'lucide-react'
import { CustomizationSection } from '@/components/customization-section'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import {
  artworkCatalog, artworkCategories, CatalogArtworkPreview, getCatalogArtworkDataUrl,
  getJacketFontFamily, isLetterOrNumberArtwork, jacketFontStyles,
  type ArtworkCategory, type CatalogArtwork,
} from '@/components/jacket-artwork-catalog'
import { JACKET_VIEWS, getJacketTexts, getJacketTextSummary, MAX_JACKET_TEXTS, getJacketViewLabel, type JacketCustomization, type JacketSideCustomization, type JacketView } from '@/types/jacket-customization'

import { CANVAS_SIZE, drawJacketDesign, getJacketChestWidth } from '@/lib/jacket-design-preview'
import { TEXT_LAYOUT_CHOICES } from '@/lib/jacket-text-layout'
const TEXT_COLORS = ['#111111', '#ffffff', '#b91c1c', '#d4a017', '#1d4ed8']

interface JacketDesignCanvasProps {
  activeView?: JacketView
  onViewChange?: (view: JacketView) => void
  historyMessage?: string
  images: { url: string; alt?: string | null }[]
  maxTextLength: number
  selectedSize?: string
  value: JacketCustomization
  onChange: (value: JacketCustomization) => void
  onDifficulty?: (reason: string) => void
  leftContentTop?: React.ReactNode
  leftContentBottom?: React.ReactNode
  historyControls?: React.ReactNode
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
  frontPlacement?: 'pullover-hoodie' | 'full-zip-hoodie'
  onPartSelect?: (partId: string) => void
}

type DragTarget = { kind: 'text' | 'artwork'; id: string }

function getViewImageUrl(images: { url: string; alt?: string | null }[], view: JacketView) {
  const viewIndex: Record<JacketView, number> = {
    front: 0,
    back: 1,
    leftSleeve: 2,
    rightSleeve: 3,
  }
  return images[viewIndex[view]]?.url || images[0]?.url
}

export function JacketDesignCanvas({ activeView, onViewChange, historyMessage, images, maxTextLength, selectedSize, value, onChange, onDifficulty, leftContentTop, leftContentBottom, onPartSelect, historyControls, onInteractionStart, onInteractionEnd, frontPlacement }: JacketDesignCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const dragTarget = useRef<DragTarget | null>(null)
  const [localView, setLocalView] = useState<JacketView>('front')
  const view = activeView ?? localView
  const setView = (next: JacketView) => { setLocalView(next); onViewChange?.(next) }
  const [category, setCategory] = useState<ArtworkCategory>('Animals')
  const [query, setQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [background, setBackground] = useState<HTMLImageElement | null>(null)
  const [artworkImages, setArtworkImages] = useState<Map<string, HTMLImageElement>>(new Map())
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null)
  const imageUrl = getViewImageUrl(images, view)
  const partPaths = useMemo(() => {
    if (typeof window === 'undefined' || !onPartSelect || !imageUrl?.startsWith('data:image/svg+xml')) return []
    const document = new DOMParser().parseFromString(decodeURIComponent(imageUrl.slice(imageUrl.indexOf(',') + 1)), 'image/svg+xml')
    const jacketGroup = document.querySelector('[data-jacket-scale-x]')
    const transform = new DOMMatrix([Number(jacketGroup?.getAttribute('data-jacket-scale-x') || 1), 0, 0, 1, Number(jacketGroup?.getAttribute('data-jacket-offset-x') || 0), 0])
    return Array.from(document.querySelectorAll('g[id]')).map(group => ({
      id: group.id, paths: Array.from(group.querySelectorAll('path[d]')).map(path => {
        const transformed = new Path2D()
        transformed.addPath(new Path2D(path.getAttribute('d') || ''), transform)
        return transformed
      }),
    })).reverse()
  }, [imageUrl, onPartSelect])
  const { toast } = useToast()

  const side: JacketSideCustomization = value[view] || {}
  const texts = getJacketTexts(side)
  const selectedText = texts.find(text => text.id === selectedTextId) || texts[0]
  const chestWidth = getJacketChestWidth(selectedSize)
  const selectedArtwork = side.artworks?.find((artwork) => artwork.id === selectedArtworkId)
  const artworkSourceKey = (side.artworks || []).map((artwork) => `${artwork.id}:${artwork.source}:${artwork.catalogId || artwork.url}:${artwork.color}:${artwork.fontStyle || ''}`).join('|')
  const visibleArtwork = useMemo(() => artworkCatalog.filter((item) =>
    item.category === category && (!query || item.name.toLowerCase().includes(query.toLowerCase()))
  ), [category, query])

  const updateSide = (updates: Partial<JacketSideCustomization>) => {
    const nextSide = { ...side, ...updates }
    const hasContent = Boolean(getJacketTexts(nextSide).length || nextSide.artworks?.length)
    onChange({ ...value, [view]: hasContent ? nextSide : undefined })
  }

  useEffect(() => {
    let cancelled = false
    if (!imageUrl) {
      queueMicrotask(() => setBackground(null))
      return
    }
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => { if (!cancelled) setBackground(image) }
    image.onerror = () => { if (!cancelled) setBackground(null) }
    image.src = imageUrl
    return () => { cancelled = true }
  }, [imageUrl])

  useEffect(() => {
    let cancelled = false
    const loadImages = async () => {
      const entries = await Promise.all((side.artworks || []).map((artwork) => new Promise<[string, HTMLImageElement] | null>((resolve) => {
        const source = artwork.source === 'catalog' ? getCatalogArtworkDataUrl(artwork.catalogId || '', artwork.color, artwork.fontStyle) : artwork.url
        if (!source) return resolve(null)
        const image = new window.Image()
        if (source.startsWith('https://')) image.crossOrigin = 'anonymous'
        image.onload = () => resolve([artwork.id, image])
        image.onerror = () => resolve(null)
        image.src = source
      })))
      if (!cancelled) setArtworkImages(new Map(entries.filter((entry): entry is [string, HTMLImageElement] => Boolean(entry))))
    }
    loadImages()
    return () => { cancelled = true }
  // Placement changes do not alter this source key, so assets stay cached while dragging.
  }, [artworkSourceKey])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    drawJacketDesign(canvas, background, side, artworkImages, chestWidth, selectedArtworkId, selectedArtwork ? null : selectedText?.id)
  }, [artworkImages, background, chestWidth, selectedArtworkId, side, selectedText?.id])

  const newText = () => ({ id: crypto.randomUUID(), value: '', color: '#ffffff', fontStyle: 'varsity' as const, layout: 'straight' as const, size: 42, x: view === 'front' && frontPlacement === 'full-zip-hoodie' ? .6 : .5, y: view === 'front' && frontPlacement ? .44 : .38 })
  const updateText = (updates: Partial<NonNullable<JacketSideCustomization['text']>>, id = selectedText?.id) => {
    const target = texts.find(text => text.id === id)
    if (!target && texts.length >= MAX_JACKET_TEXTS) return
    const next = { ...newText(), ...target, ...updates, id: target?.id || crypto.randomUUID() }
    updateSide({ text: undefined, texts: target ? texts.map(text => text.id === target.id ? next : text) : [...texts, next] })
    setSelectedTextId(next.id)
    setSelectedArtworkId(null)
  }
  const addText = (duplicate = false) => {
    if (texts.length >= MAX_JACKET_TEXTS) return
    if (!duplicate && selectedText && !selectedText.value.trim()) { document.getElementById('design-text')?.focus(); return }
    const base = duplicate && selectedText ? { ...selectedText } : newText()
    const next = { ...base, id: crypto.randomUUID(), x: Math.min(.88, base.x + (duplicate ? .04 : 0)), y: Math.min(.85, base.y + (duplicate ? .06 : Math.min(texts.length, 4) * .07)) }
    updateSide({ text: undefined, texts: [...texts, next] }); setSelectedTextId(next.id); setSelectedArtworkId(null)
    requestAnimationFrame(() => document.getElementById('design-text')?.focus())
  }
  const removeText = () => {
    if (!selectedText) return
    updateSide({ text: undefined, texts: texts.filter(text => text.id !== selectedText.id) }); setSelectedTextId(null)
  }

  const selectArtwork = (item: CatalogArtwork) => {
    if ((side.artworks?.length || 0) >= 12) return toast({ title: 'Artwork limit reached', description: 'You can add up to 12 artwork pieces on each side.', variant: 'destructive' })
    const id = crypto.randomUUID()
    updateSide({ artworks: [...(side.artworks || []), { id, source: 'catalog', catalogId: item.id, name: item.name, color: item.color || '#1e40af', fontStyle: item.character ? (item.fontStyle || 'varsity') : undefined, widthInches: 2.5, x: view === 'front' && frontPlacement === 'full-zip-hoodie' ? .6 : .5, y: view === 'front' && frontPlacement ? .44 : .55 }] })
    setSelectedArtworkId(id)
  }

  const removeArtwork = (artworkId: string) => {
    updateSide({ artworks: side.artworks?.filter((artwork) => artwork.id !== artworkId) })
    if (selectedArtworkId === artworkId) setSelectedArtworkId(null)
  }

  const removeSelectedArtwork = () => {
    if (selectedArtwork) removeArtwork(selectedArtwork.id)
  }

  const pointerPosition = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(0.08, Math.min(0.92, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0.08, Math.min(0.92, (event.clientY - rect.top) / rect.height)),
    }
  }

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const position = pointerPosition(event)
    let textDistance = Infinity
    let hitTextId: string | null = null
    for (const text of [...texts].reverse()) {
      if (!text.value.trim()) continue
      const context = event.currentTarget.getContext('2d')
      if (context) {
        const size = text.size * 42 / chestWidth
        context.save()
        context.font = `600 ${size}px ${getJacketFontFamily(text.fontStyle)}`
        const measured = context.measureText(text.value).width
        context.restore()
        const vertical = text.layout === 'vertical'
        const curved = text.layout === 'curve-up' || text.layout === 'curve-down'
        const width = vertical ? size : Math.min(420, measured + (curved ? size : 0))
        const height = vertical ? Math.min(350, Array.from(text.value).length * size * 1.15) : size + (curved ? Math.min(80, measured * .2) : 0)
        const dx = Math.abs(position.x - text.x) * CANVAS_SIZE
        const dy = Math.abs(position.y - text.y) * CANVAS_SIZE
        if (dx <= width / 2 + 12 && dy <= height / 2 + 12) { textDistance = Math.min(.17, Math.hypot(position.x - text.x, position.y - text.y)); hitTextId = text.id; break }
      }
    }
    const closestArtwork = [...(side.artworks || [])].reverse().map((artwork) => ({ artwork, distance: Math.hypot(position.x - artwork.x, position.y - artwork.y) })).sort((a, b) => a.distance - b.distance)[0]
    dragTarget.current = textDistance <= (closestArtwork?.distance ?? Infinity) && textDistance < 0.18 ? { kind: 'text', id: hitTextId! } : closestArtwork?.distance < 0.22 ? { kind: 'artwork', id: closestArtwork.artwork.id } : null
    if (dragTarget.current?.kind === 'artwork') setSelectedArtworkId(dragTarget.current.id)
    if (dragTarget.current?.kind === 'text') { setSelectedTextId(dragTarget.current.id); setSelectedArtworkId(null) }
    if (dragTarget.current) { onInteractionStart?.(); event.currentTarget.setPointerCapture(event.pointerId) }
    else if (onPartSelect) {
      const context = event.currentTarget.getContext('2d')
      const x = position.x * CANVAS_SIZE
      const y = position.y * CANVAS_SIZE
      const part = context && partPaths.find(part => part.paths.some(path => context.isPointInPath(path, x, y)))
      if (part) onPartSelect(part.id)
    }
  }

  const finishInteraction = () => {
    if (dragTarget.current) { dragTarget.current = null; onInteractionEnd?.() }
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const position = pointerPosition(event)
    if (dragTarget.current?.kind === 'text') updateText(position, dragTarget.current.id)
    if (dragTarget.current?.kind === 'artwork') {
      updateSide({ artworks: (side.artworks || []).map((artwork) => artwork.id === dragTarget.current?.id ? { ...artwork, ...position } : artwork) })
    }
  }

  const handleArtworkUpload = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      onDifficulty?.('invalid_artwork_upload')
      toast({ title: 'Invalid artwork', description: 'Choose a PNG, JPG, or WebP image under 5 MB.', variant: 'destructive' })
      return
    }
    setIsUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch('/api/customizations/artwork', { method: 'POST', body: form })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Artwork upload failed')
      if ((side.artworks?.length || 0) >= 12) throw new Error('You can add up to 12 artwork pieces on each side.')
      const id = crypto.randomUUID()
      updateSide({ artworks: [...(side.artworks || []), { id, source: 'upload', url: result.url, name: file.name.slice(0, 80), widthInches: 2.5, x: view === 'front' && frontPlacement === 'full-zip-hoodie' ? .6 : .5, y: view === 'front' && frontPlacement ? .44 : .55 }] })
      setSelectedArtworkId(id)
    } catch (error) {
      onDifficulty?.('artwork_upload_failed')
      toast({ title: 'Could not add artwork', description: error instanceof Error ? error.message : 'Try again shortly.', variant: 'destructive' })
    } finally {
      setIsUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div data-customization-step="design" className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start xl:gap-10">
      {/* Left side: Customization Options */}
      <div className="order-2 min-w-0 space-y-6 lg:order-1 lg:space-y-8">
        {leftContentTop && <div>{leftContentTop}</div>}
        <CustomizationSection title="6. Text & artwork" collapsible={Boolean(onPartSelect)}>

        <div className="space-y-6">
          <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Text on {getJacketViewLabel(view).toLowerCase()}</h3><Button type="button" variant="outline" disabled={texts.length >= MAX_JACKET_TEXTS} onClick={() => addText()}>Add text</Button></div>
          <p className="text-xs text-muted-foreground">Add up to {MAX_JACKET_TEXTS} independent texts per view. Select an entry to edit it, or click its text on the preview. Each non-empty text adds an embroidery charge to your total.</p>
          {!!texts.length && <div className="flex flex-wrap gap-2" role="group" aria-label="Text elements">{texts.map((text, index) => <button key={text.id} type="button" aria-label={`Select text ${index + 1}: ${text.value || 'New text'}`} aria-pressed={selectedText?.id === text.id} onClick={() => { setSelectedTextId(text.id); setSelectedArtworkId(null) }} className={`min-h-11 max-w-full truncate rounded-md border px-3 py-2 text-sm ${selectedText?.id === text.id ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}>{index + 1}. {text.value || 'New text'}</button>)}</div>}
          {selectedText && <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled={texts.length >= MAX_JACKET_TEXTS || !selectedText.value.trim()} onClick={() => addText(true)}>Duplicate text</Button><Button type="button" size="sm" variant="outline" onClick={removeText}>Remove text</Button></div>}
          <Label htmlFor="design-text" className="flex items-center gap-2"><Type className="h-4 w-4" /> {getJacketViewLabel(view)} embroidered text</Label>
          <Input onFocus={onInteractionStart} onBlur={onInteractionEnd} id="design-text" value={selectedText?.value || ''} maxLength={maxTextLength} placeholder="Name, initials, or team" onChange={(event) => updateText({ value: event.target.value })} />
          <p className="text-xs text-muted-foreground">{selectedText?.value.length || 0}/{maxTextLength} characters for this text.</p>
          {!selectedText?.value && <p className="text-xs text-muted-foreground">Enter your text to choose its layout, font, color, and size.</p>}
          {!!selectedText && <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="space-y-2 sm:col-span-2">
              <legend className="text-sm font-semibold">Text layout</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{TEXT_LAYOUT_CHOICES.map(choice => <button key={choice.value} type="button" aria-pressed={(selectedText?.layout || 'straight') === choice.value} onClick={() => updateText({ layout: choice.value })} className={`min-h-11 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${(selectedText?.layout || 'straight') === choice.value ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>{choice.label}</button>)}</div>
              <p className="text-xs text-muted-foreground">{TEXT_LAYOUT_CHOICES.find(choice => choice.value === (selectedText?.layout || 'straight'))?.example} Drag the text on the jacket to move it. Longer text is fitted to the preview.</p>
            </fieldset>
            <div className="space-y-2"><Label className="text-xs">Thread color</Label><div className="flex flex-wrap items-center gap-2">
              {TEXT_COLORS.map((color) => <button key={color} type="button" title={color} aria-label={`Use ${color} thread`} onClick={() => updateText({ color })} className={`h-8 w-8 rounded-full border-2 ${selectedText?.color === color ? 'ring-2 ring-primary ring-offset-2' : ''}`} style={{ backgroundColor: color }} />)}
              <input type="color" onFocus={onInteractionStart} onBlur={onInteractionEnd} value={selectedText.color} onChange={(event) => updateText({ color: event.target.value })} className="h-8 w-10 cursor-pointer rounded border bg-background p-0.5" aria-label="Custom thread color" />
            </div></div>
            <div className="space-y-2"><Label htmlFor="text-font" className="text-xs">Font style</Label><select id="text-font" value={selectedText.fontStyle} onChange={(event) => updateText({ fontStyle: event.target.value as NonNullable<JacketSideCustomization['text']>['fontStyle'] })} className="h-11 min-w-0 w-full rounded-md border bg-background px-3 text-base sm:h-9 sm:text-sm">
              {jacketFontStyles.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
            </select></div>
            <div className="space-y-2"><Label className="text-xs">Text size</Label><Slider onPointerDown={onInteractionStart} onPointerUp={onInteractionEnd} onPointerCancel={onInteractionEnd} onKeyDown={onInteractionStart} onKeyUp={onInteractionEnd} onBlur={onInteractionEnd} onValueCommit={onInteractionEnd} min={24} max={72} step={2} value={[selectedText?.size || 42]} onValueChange={([size]) => updateText({ size })} /></div>
          </div>}
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><Label className="flex items-center gap-2"><ImagePlus className="h-4 w-4" /> Artwork library</Label>
            {selectedArtwork && <Button type="button" size="sm" variant="ghost" title="Remove selected artwork" onClick={removeSelectedArtwork}><X className="mr-2 h-4 w-4" /> Remove</Button>}
          </div>
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search artwork" className="pl-9" /></div>
          <div className="flex min-w-0 max-w-full gap-1 overflow-x-auto overscroll-x-contain pb-1">
            {artworkCategories.map((item) => <Button key={item} type="button" size="sm" variant={category === item ? 'secondary' : 'ghost'} onClick={() => setCategory(item)} className="h-11 flex-none sm:h-8">{item}</Button>)}
          </div>
          <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:max-h-56 sm:grid-cols-6 lg:grid-cols-4">
            {visibleArtwork.map((item) => <button key={item.id} type="button" title={`Add ${item.name}`} aria-label={`Add ${item.name}`} onClick={() => selectArtwork(item)} className="flex aspect-square min-h-20 items-center justify-center rounded-md border bg-background p-2 transition-colors hover:border-primary sm:min-h-0"><CatalogArtworkPreview item={item} className="h-10 w-10 sm:h-8 sm:w-8" /></button>)}
          </div>
          <input ref={fileRef} type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleArtworkUpload(event.target.files?.[0])} />
          <Button type="button" variant="outline" className="w-full" disabled={isUploading} onClick={() => fileRef.current?.click()}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />} Upload your own artwork
          </Button>
          {!!side.artworks?.length && <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between text-xs"><Label>Artwork on {getJacketViewLabel(view)}</Label><span>{side.artworks.length}/12</span></div>
            <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-1">
              {side.artworks.map((artwork, index) => (
                <div key={artwork.id} className={`flex w-40 shrink-0 items-center gap-1 rounded-md border px-2 py-2 text-xs sm:w-32 sm:py-1.5 ${selectedArtworkId === artwork.id ? 'border-primary bg-primary/5' : ''}`}>
                  <button type="button" onClick={() => setSelectedArtworkId(artwork.id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate">{index + 1}. {artwork.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      removeArtwork(artwork.id)
                    }}
                    className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:p-1"
                    aria-label={`Remove ${artwork.name}`}
                    title={`Remove ${artwork.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {selectedArtwork && <div className="space-y-4 border-t pt-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="break-words text-sm font-medium">Selected: {selectedArtwork.name}</p>
                  <p className="text-xs text-muted-foreground">Remove it to choose a different flag, letter, symbol, or uploaded artwork.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={removeSelectedArtwork}>
                  <X className="mr-2 h-4 w-4" />
                  Remove selected
                </Button>
              </div>
              <div className="space-y-2"><div className="flex justify-between text-xs"><Label>Selected patch width</Label><span>{selectedArtwork.widthInches.toFixed(1)} in</span></div>
                <Slider onPointerDown={onInteractionStart} onPointerUp={onInteractionEnd} onPointerCancel={onInteractionEnd} onKeyDown={onInteractionStart} onKeyUp={onInteractionEnd} onBlur={onInteractionEnd} onValueCommit={onInteractionEnd} min={2} max={6} step={0.5} value={[Math.min(selectedArtwork.widthInches, 6)]} onValueChange={([widthInches]) => updateSide({ artworks: side.artworks?.map((artwork) => artwork.id === selectedArtwork.id ? { ...artwork, widthInches } : artwork) })} aria-label="Selected artwork width" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="artwork-color" className="text-xs">Artwork color</Label><div className="flex items-center gap-2">
                  <input id="artwork-color" type="color" onFocus={onInteractionStart} onBlur={onInteractionEnd} value={selectedArtwork.color || '#ffffff'} onChange={(event) => updateSide({ artworks: side.artworks?.map((artwork) => artwork.id === selectedArtwork.id ? { ...artwork, color: event.target.value } : artwork) })} className="h-9 w-12 cursor-pointer rounded border bg-background p-0.5" />
                  <span className="text-xs uppercase text-muted-foreground">{selectedArtwork.color || 'Original'}</span>
                </div></div>
                {isLetterOrNumberArtwork(selectedArtwork.catalogId) && <div className="space-y-2"><Label htmlFor="artwork-font" className="text-xs">Letter / number font</Label><select id="artwork-font" value={selectedArtwork.fontStyle || 'varsity'} onChange={(event) => updateSide({ artworks: side.artworks?.map((artwork) => artwork.id === selectedArtwork.id ? { ...artwork, fontStyle: event.target.value as NonNullable<JacketSideCustomization['text']>['fontStyle'] } : artwork) })} className="h-11 min-w-0 w-full rounded-md border bg-background px-3 text-base sm:h-9 sm:text-sm">
                  {jacketFontStyles.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
                </select></div>}
              </div>
            </div>}
          </div>}
        </div>
        </div>

        </CustomizationSection>
        {leftContentBottom && <div>{leftContentBottom}</div>}
      </div>

      {/* Right side: Canvas & Controls */}
      <div className="order-1 min-w-0 space-y-4 lg:order-2 lg:sticky lg:top-4">
        {historyControls}
        {historyMessage && <p role="status" className="rounded-lg border bg-muted p-3 text-sm">{historyMessage}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid w-full min-w-0 grid-cols-2 gap-1 rounded-md border p-1 sm:grid-cols-4" aria-label="Jacket view">
            {JACKET_VIEWS.map((item) => (
              <Button key={item} type="button" size="sm" variant={view === item ? 'default' : 'ghost'} onClick={() => { setView(item); setSelectedArtworkId(null); setSelectedTextId(null) }} className="relative h-11 min-w-0 px-2 sm:h-9">
                {getJacketViewLabel(item)}
                {(getJacketTextSummary(value[item]) || value[item]?.artworks?.length) && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              </Button>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => { updateSide({ text: undefined, texts: [], artworks: undefined }); setSelectedArtworkId(null); setSelectedTextId(null) }} disabled={!texts.length && !side.artworks?.length}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset {getJacketViewLabel(view)}
          </Button>
        </div>

        {frontPlacement && view === 'front' && <p className="text-xs text-muted-foreground">{frontPlacement === 'full-zip-hoodie' ? 'Keep artwork clear of the center zipper and split pocket openings. Switching styles does not move existing artwork.' : 'Place chest artwork above the kangaroo pocket and clear of the drawstrings.'}</p>}
        {onPartSelect && <p className="text-xs text-muted-foreground">Click a jacket part to select its color. Drag artwork to position it.</p>}
        {onPartSelect && (selectedArtwork || selectedText?.value) && <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Place {selectedArtwork ? 'selected artwork' : 'text'}:</span>
          {(view === 'front' ? (frontPlacement ? (frontPlacement === 'full-zip-hoodie' ? [['Left chest', .6, .44], ['Right chest', .4, .44]] : [['Left chest', .6, .44], ['Right chest', .4, .44], ['Above pocket', .5, .44]]) : [['Left chest', .59, .39], ['Right chest', .41, .39], ['Center', .5, .46]]) : (frontPlacement && view === 'back' ? [['Below hood', .5, .43], ['Center', .5, .53], ['Lower', .5, .67]] : [['Upper', .5, .35], ['Center', .5, .48], ['Lower', .5, .65]])).map(([label, x, y]) => <Button key={label} type="button" size="sm" variant="outline" onClick={() => {
            const position = { x: Number(x), y: Number(y) }
            if (selectedArtwork) updateSide({ artworks: side.artworks?.map(art => art.id === selectedArtwork.id ? { ...art, ...position } : art) })
            else updateText(position)
          }}>{label}</Button>)}
        </div>}

        <div className="relative w-full min-w-0 overflow-hidden rounded-md border bg-muted" style={{ aspectRatio: '1 / 1' }}>
          <canvas id="jacket-design-canvas-element" data-design-preview tabIndex={-1} ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="absolute inset-0 block h-full w-full touch-none cursor-move focus-visible:outline-2 focus-visible:outline-primary"
            onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
            onPointerUp={finishInteraction} onPointerCancel={finishInteraction} onLostPointerCapture={finishInteraction}
            aria-label={`Live ${getJacketViewLabel(view)} jacket customization preview. Drag text or artwork to reposition it.`} />
        </div>
        <p className="text-xs text-muted-foreground">Previewing size {selectedSize || 'M'}. Patch dimensions are saved in inches and scale proportionally for the selected jacket size.</p>
      </div>
    </div>
  )
}
