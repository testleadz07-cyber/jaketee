'use client'

import { getCatalogArtworkDataUrl, getJacketFontFamily } from '@/components/jacket-artwork-catalog'
import { drawJacketTextLayout } from '@/lib/jacket-text-layout'
import { getCustomizedViews, getJacketTexts, type JacketCustomization, type JacketSideCustomization, type JacketView } from '@/types/jacket-customization'

export const CANVAS_SIZE = 720
const CHEST_WIDTHS: Record<string, number> = {
  XXS: 34, XS: 36, S: 38, M: 42, L: 46, XL: 50,
  '2XL': 54, XXL: 54, '3XL': 58, '4XL': 62, '5XL': 66, '6XL': 70,
}

export function getJacketChestWidth(selectedSize?: string) {
  return CHEST_WIDTHS[(selectedSize || 'M').toUpperCase()] || CHEST_WIDTHS.M
}

export function drawJacketDesign(canvas: HTMLCanvasElement, background: HTMLImageElement | null, side: JacketSideCustomization, artworkImages: Map<string, HTMLImageElement>, chestWidth: number, selectedArtworkId: string | null = null, selectedTextId: string | null = null) {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Your browser could not create the design preview.')
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
  for (const text of getJacketTexts(side).filter(text => text.value.trim())) {
    const sizeFactor = 42 / chestWidth
    const fontSize = text.size * sizeFactor
    context.save()
    context.font = `600 ${fontSize}px ${getJacketFontFamily(text.fontStyle)}`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.lineWidth = Math.max(2, fontSize / 18)
    context.strokeStyle = text.color === '#ffffff' ? '#111111' : '#ffffff'
    context.fillStyle = text.color
    drawJacketTextLayout(context, text.value, text.layout, fontSize, text.x * CANVAS_SIZE, text.y * CANVAS_SIZE)
    if (text.id === selectedTextId) {
      const vertical = text.layout === 'vertical'
      const curved = text.layout === 'curve-up' || text.layout === 'curve-down'
      const measured = context.measureText(text.value).width
      const width = vertical ? fontSize : Math.min(420, measured + (curved ? fontSize : 0))
      const height = vertical ? Math.min(350, Array.from(text.value).length * fontSize * 1.15) : fontSize + (curved ? Math.min(80, measured * .2) : 0)
      context.strokeStyle = '#2563eb'; context.lineWidth = 2; context.setLineDash([6, 5])
      context.strokeRect(text.x * CANVAS_SIZE - width / 2 - 6, text.y * CANVAS_SIZE - height / 2 - 6, width + 12, height + 12)
    }
    context.restore()
  }
}

function loadPreviewImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const timer = setTimeout(() => reject(new Error('A design image took too long to load. Please retry.')), 15000)
    image.crossOrigin = 'anonymous'
    image.onload = () => { clearTimeout(timer); resolve(image) }
    image.onerror = () => { clearTimeout(timer); reject(new Error('A design image could not load. Please retry.')) }
    image.src = source
  })
}

export async function captureJacketDesignPreviews(customization: JacketCustomization, images: Array<{ url: string }>, chestWidth: number) {
  await document.fonts.ready
  const viewIndex: Record<JacketView, number> = { front: 0, back: 1, leftSleeve: 2, rightSleeve: 3 }
  return Promise.all(getCustomizedViews(customization).map(async (view) => {
    const side = customization[view] || {}
    const backgroundUrl = images[viewIndex[view]]?.url || images[0]?.url
    if (!backgroundUrl) throw new Error('The product image is missing. Please reload and retry.')
    const [background, entries] = await Promise.all([
      loadPreviewImage(backgroundUrl),
      Promise.all((side.artworks || []).map(async (artwork): Promise<[string, HTMLImageElement]> => {
        const url = artwork.source === 'catalog' ? getCatalogArtworkDataUrl(artwork.catalogId || '', artwork.color, artwork.fontStyle) : artwork.url
        if (!url) throw new Error('An artwork image is missing. Please check your design and retry.')
        return [artwork.id, await loadPreviewImage(url)]
      })),
    ])
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
    drawJacketDesign(canvas, background, side, new Map(entries), chestWidth)
    return { view, imageBase64: canvas.toDataURL('image/png') }
  }))
}
