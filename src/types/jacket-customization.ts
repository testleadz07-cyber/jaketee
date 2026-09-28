export type JacketView = 'front' | 'back'
export type JacketFontStyle = 'varsity' | 'block' | 'classic' | 'script' | 'sans' | 'serif'

export interface JacketTextCustomization {
  value: string
  color: string
  fontStyle: JacketFontStyle
  size: number
  x: number
  y: number
}

export interface JacketArtworkCustomization {
  id: string
  source: 'catalog' | 'upload'
  catalogId?: string
  url?: string
  name: string
  color?: string
  fontStyle?: JacketFontStyle
  widthInches: number
  x: number
  y: number
}

export interface JacketSideCustomization {
  text?: JacketTextCustomization
  artworks?: JacketArtworkCustomization[]
}

export interface JacketCustomization {
  front?: JacketSideCustomization
  back?: JacketSideCustomization
}

export function hasJacketCustomization(customization?: JacketCustomization | null) {
  if (!customization) return false
  return (['front', 'back'] as const).some((view) => {
    const side = customization[view]
    return Boolean(side?.text?.value.trim() || side?.artworks?.length)
  })
}

export function getCustomizedViews(customization?: JacketCustomization | null) {
  if (!customization) return []
  return (['front', 'back'] as const).filter((view) => {
    const side = customization[view]
    return Boolean(side?.text?.value.trim() || side?.artworks?.length)
  })
}
