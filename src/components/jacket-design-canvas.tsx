'use client'

import { PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, Loader2, RotateCcw, Search, Type, X } from 'lucide-react'
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
import { JACKET_VIEWS, getJacketViewLabel, type JacketCustomization, type JacketSideCustomization, type JacketView } from '@/types/jacket-customization'

const CANVAS_SIZE = 720
const TEXT_COLORS = ['#111111', '#ffffff', '#b91c1c', '#d4a017', '#1d4ed8']
const CHEST_WIDTHS: Record<string, number> = {
  XXS: 34, XS: 36, S: 38, M: 42, L: 46, XL: 50,
  '2XL': 54, XXL: 54, '3XL': 58, '4XL': 62, '5XL': 66, '6XL': 70,
}

interface JacketDesignCanvasProps {
  images: { url: string; alt?: string | null }[]
  maxTextLength: number
  selectedSize?: string
  value: JacketCustomization
  onChange: (value: JacketCustomization) => void
  onDifficulty?: (reason: string) => void
}

type DragTarget = 'text' | string

function getViewImageUrl(images: { url: string; alt?: string | null }[], view: JacketView) {
  const viewIndex: Record<JacketView, number> = {
    front: 0,
    back: 1,
    leftSleeve: 2,
    rightSleeve: 3,
  }
  return images[viewIndex[view]]?.url || images[0]?.url
}

export function JacketDesignCanvas({ images, maxTextLength, selectedSize, value, onChange, onDifficulty }: JacketDesignCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const dragTarget = useRef<DragTarget | null>(null)
  const [view, setView] = useState<JacketView>('front')
  const [category, setCategory] = useState<ArtworkCategory>('Animals')
  const [query, setQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [background, setBackground] = useState<HTMLImageElement | null>(null)
  const [artworkImages, setArtworkImages] = useState<Map<string, HTMLImageElement>>(new Map())
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null)
  const { toast } = useToast()

  const side: JacketSideCustomization = value[view] || {}
  const imageUrl = getViewImageUrl(images, view)
  const chestWidth = CHEST_WIDTHS[(selectedSize || 'M').toUpperCase()] || CHEST_WIDTHS.M
  const selectedArtwork = side.artworks?.find((artwork) => artwork.id === selectedArtworkId)
  const artworkSourceKey = (side.artworks || []).map((artwork) => `${artwork.id}:${artwork.source}:${artwork.catalogId || artwork.url}:${artwork.color}:${artwork.fontStyle || ''}`).join('|')
  const visibleArtwork = useMemo(() => artworkCatalog.filter((item) =>
    item.category === category && (!query || item.name.toLowerCase().includes(query.toLowerCase()))
  ), [category, query])

  const updateSide = (updates: Partial<JacketSideCustomization>) => {
    const nextSide = { ...side, ...updates }
    const hasContent = Boolean(nextSide.text?.value.trim() || nextSide.artworks?.length)
    onChange({ ...value, [view]: hasContent ? nextSide : undefined })
  }

  useEffect(() => {
    if (!imageUrl) {
      queueMicrotask(() => setBackground(null))
      return
    }
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => setBackground(image)
    image.onerror = () => setBackground(null)
    image.src = imageUrl
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
    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    context.fillStyle = '#f4f4f5'
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    if (background) {
      const ratio = Math.min(CANVAS_SIZE / background.width, CANVAS_SIZE / background.height)
      const width = background.width * ratio
      const height = background.height * ratio
      context.drawImage(background, (CANVAS_SIZE - width) / 2, (CANVAS_SIZE - height) / 2, width, height)
    }
    for (const artwork of side.artworks || []) {
      const image = artworkImages.get(artwork.id)
      if (!image) continue
      const maxDimension = Math.max(48, (artwork.widthInches / chestWidth) * CANVAS_SIZE * 1.7)
      const ratio = Math.min(maxDimension / image.width, maxDimension / image.height)
      const width = image.width * ratio
      const height = image.height * ratio
      const left = artwork.x * CANVAS_SIZE - width / 2
      const top = artwork.y * CANVAS_SIZE - height / 2
      if (artwork.source === 'upload' && artwork.color) {
        const tinted = document.createElement('canvas')
        tinted.width = Math.max(1, Math.ceil(width))
        tinted.height = Math.max(1, Math.ceil(height))
        const tintContext = tinted.getContext('2d')
        if (tintContext) {
          tintContext.drawImage(image, 0, 0, tinted.width, tinted.height)
          tintContext.globalCompositeOperation = 'source-in'
          tintContext.fillStyle = artwork.color
          tintContext.fillRect(0, 0, tinted.width, tinted.height)
          context.drawImage(tinted, left, top, width, height)
        }
      } else {
        context.drawImage(image, left, top, width, height)
      }
      if (artwork.id === selectedArtworkId) {
        context.save()
        context.strokeStyle = '#2563eb'
        context.lineWidth = 4
        context.setLineDash([10, 7])
        context.strokeRect(left - 6, top - 6, width + 12, height + 12)
        context.restore()
      }
    }
    if (side.text?.value) {
      const sizeFactor = 42 / chestWidth
      const fontSize = side.text.size * sizeFactor
      context.save()
      context.font = `600 ${fontSize}px ${getJacketFontFamily(side.text.fontStyle)}`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.lineWidth = Math.max(2, fontSize / 18)
      context.strokeStyle = side.text.color === '#ffffff' ? '#111111' : '#ffffff'
      context.strokeText(side.text.value, side.text.x * CANVAS_SIZE, side.text.y * CANVAS_SIZE)
      context.fillStyle = side.text.color
      context.fillText(side.text.value, side.text.x * CANVAS_SIZE, side.text.y * CANVAS_SIZE)
      context.restore()
    }
  }, [artworkImages, background, chestWidth, selectedArtworkId, side])

  const updateText = (updates: Partial<NonNullable<JacketSideCustomization['text']>>) => {
    updateSide({ text: { value: '', color: '#ffffff', fontStyle: 'varsity', size: 42, x: 0.5, y: 0.38, ...side.text, ...updates } })
  }

  const selectArtwork = (item: CatalogArtwork) => {
    if ((side.artworks?.length || 0) >= 12) return toast({ title: 'Artwork limit reached', description: 'You can add up to 12 artwork pieces on each side.', variant: 'destructive' })
    const id = crypto.randomUUID()
    updateSide({ artworks: [...(side.artworks || []), { id, source: 'catalog', catalogId: item.id, name: item.name, color: item.color || '#1e40af', fontStyle: item.character ? (item.fontStyle || 'varsity') : undefined, widthInches: 2.5, x: 0.5, y: 0.55 }] })
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
    const textDistance = side.text?.value ? Math.hypot(position.x - side.text.x, position.y - side.text.y) : Infinity
    const closestArtwork = [...(side.artworks || [])].reverse().map((artwork) => ({ artwork, distance: Math.hypot(position.x - artwork.x, position.y - artwork.y) })).sort((a, b) => a.distance - b.distance)[0]
    dragTarget.current = textDistance <= (closestArtwork?.distance ?? Infinity) && textDistance < 0.18 ? 'text' : closestArtwork?.distance < 0.22 ? closestArtwork.artwork.id : null
    if (dragTarget.current && dragTarget.current !== 'text') setSelectedArtworkId(dragTarget.current)
    if (dragTarget.current) event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const position = pointerPosition(event)
    if (dragTarget.current === 'text' && side.text) updateText(position)
    if (dragTarget.current && dragTarget.current !== 'text') {
      updateSide({ artworks: (side.artworks || []).map((artwork) => artwork.id === dragTarget.current ? { ...artwork, ...position } : artwork) })
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
      updateSide({ artworks: [...(side.artworks || []), { id, source: 'upload', url: result.url, name: file.name.slice(0, 80), widthInches: 2.5, x: 0.5, y: 0.55 }] })
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border p-1" aria-label="Jacket view">
          {JACKET_VIEWS.map((item) => (
            <Button key={item} type="button" size="sm" variant={view === item ? 'default' : 'ghost'} onClick={() => { setView(item); setSelectedArtworkId(null) }} className="relative">
              {getJacketViewLabel(item)}
              {(value[item]?.text?.value || value[item]?.artworks?.length) && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            </Button>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => { updateSide({ text: undefined, artworks: undefined }); setSelectedArtworkId(null) }} disabled={!side.text?.value && !side.artworks?.length}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reset {getJacketViewLabel(view)}
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border bg-muted" style={{ aspectRatio: '1 / 1' }}>
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="h-full w-full touch-none cursor-move"
          onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
          onPointerUp={() => { dragTarget.current = null }} onPointerCancel={() => { dragTarget.current = null }}
          aria-label={`Live ${getJacketViewLabel(view)} jacket customization preview. Drag text or artwork to reposition it.`} />
      </div>
      <p className="text-xs text-muted-foreground">Previewing size {selectedSize || 'M'}. Patch dimensions are saved in inches and scale proportionally for the selected jacket size.</p>

      <div className="space-y-3 border-t pt-4">
        <Label htmlFor="design-text" className="flex items-center gap-2"><Type className="h-4 w-4" /> {getJacketViewLabel(view)} embroidered text</Label>
        <Input id="design-text" value={side.text?.value || ''} maxLength={maxTextLength} placeholder="Name, initials, or team" onChange={(event) => updateText({ value: event.target.value })} />
        {!!side.text?.value && <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label className="text-xs">Thread color</Label><div className="flex flex-wrap items-center gap-2">
            {TEXT_COLORS.map((color) => <button key={color} type="button" title={color} aria-label={`Use ${color} thread`} onClick={() => updateText({ color })} className={`h-8 w-8 rounded-full border-2 ${side.text?.color === color ? 'ring-2 ring-primary ring-offset-2' : ''}`} style={{ backgroundColor: color }} />)}
            <input type="color" value={side.text.color} onChange={(event) => updateText({ color: event.target.value })} className="h-8 w-10 cursor-pointer rounded border bg-background p-0.5" aria-label="Custom thread color" />
          </div></div>
          <div className="space-y-2"><Label htmlFor="text-font" className="text-xs">Font style</Label><select id="text-font" value={side.text.fontStyle} onChange={(event) => updateText({ fontStyle: event.target.value as NonNullable<JacketSideCustomization['text']>['fontStyle'] })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
            {jacketFontStyles.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
          </select></div>
          <div className="space-y-2"><Label className="text-xs">Text size</Label><Slider min={24} max={72} step={2} value={[side.text?.size || 42]} onValueChange={([size]) => updateText({ size })} /></div>
        </div>}
      </div>

      <div className="space-y-3 border-t pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><Label className="flex items-center gap-2"><ImagePlus className="h-4 w-4" /> Artwork library</Label>
          {selectedArtwork && <Button type="button" size="sm" variant="ghost" title="Remove selected artwork" onClick={removeSelectedArtwork}><X className="mr-2 h-4 w-4" /> Remove</Button>}
        </div>
        <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search artwork" className="pl-9" /></div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {artworkCategories.map((item) => <Button key={item} type="button" size="sm" variant={category === item ? 'secondary' : 'ghost'} onClick={() => setCategory(item)} className="flex-none">{item}</Button>)}
        </div>
        <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:max-h-56 sm:grid-cols-6">
          {visibleArtwork.map((item) => <button key={item.id} type="button" title={`Add ${item.name}`} aria-label={`Add ${item.name}`} onClick={() => selectArtwork(item)} className="flex aspect-square min-h-20 items-center justify-center rounded-md border bg-background p-2 transition-colors hover:border-primary sm:min-h-0"><CatalogArtworkPreview item={item} className="h-10 w-10 sm:h-8 sm:w-8" /></button>)}
        </div>
        <input ref={fileRef} type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleArtworkUpload(event.target.files?.[0])} />
        <Button type="button" variant="outline" className="w-full" disabled={isUploading} onClick={() => fileRef.current?.click()}>
          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />} Upload your own artwork
        </Button>
        {!!side.artworks?.length && <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between text-xs"><Label>Artwork on {getJacketViewLabel(view)}</Label><span>{side.artworks.length}/12</span></div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {side.artworks.map((artwork, index) => (
              <div key={artwork.id} className={`flex min-w-40 items-center gap-1 rounded-md border px-2 py-2 text-xs sm:min-w-32 sm:py-1.5 ${selectedArtworkId === artwork.id ? 'border-primary bg-primary/5' : ''}`}>
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
                <p className="text-sm font-medium">Selected: {selectedArtwork.name}</p>
                <p className="text-xs text-muted-foreground">Remove it to choose a different flag, letter, symbol, or uploaded artwork.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={removeSelectedArtwork}>
                <X className="mr-2 h-4 w-4" />
                Remove selected
              </Button>
            </div>
            <div className="space-y-2"><div className="flex justify-between text-xs"><Label>Selected patch width</Label><span>{selectedArtwork.widthInches.toFixed(1)} in</span></div>
              <Slider min={2} max={6} step={0.5} value={[Math.min(selectedArtwork.widthInches, 6)]} onValueChange={([widthInches]) => updateSide({ artworks: side.artworks?.map((artwork) => artwork.id === selectedArtwork.id ? { ...artwork, widthInches } : artwork) })} aria-label="Selected artwork width" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="artwork-color" className="text-xs">Artwork color</Label><div className="flex items-center gap-2">
                <input id="artwork-color" type="color" value={selectedArtwork.color || '#ffffff'} onChange={(event) => updateSide({ artworks: side.artworks?.map((artwork) => artwork.id === selectedArtwork.id ? { ...artwork, color: event.target.value } : artwork) })} className="h-9 w-12 cursor-pointer rounded border bg-background p-0.5" />
                <span className="text-xs uppercase text-muted-foreground">{selectedArtwork.color || 'Original'}</span>
              </div></div>
              {isLetterOrNumberArtwork(selectedArtwork.catalogId) && <div className="space-y-2"><Label htmlFor="artwork-font" className="text-xs">Letter / number font</Label><select id="artwork-font" value={selectedArtwork.fontStyle || 'varsity'} onChange={(event) => updateSide({ artworks: side.artworks?.map((artwork) => artwork.id === selectedArtwork.id ? { ...artwork, fontStyle: event.target.value as NonNullable<JacketSideCustomization['text']>['fontStyle'] } : artwork) })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {jacketFontStyles.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
              </select></div>}
            </div>
          </div>}
        </div>}
      </div>
    </div>
  )
}
