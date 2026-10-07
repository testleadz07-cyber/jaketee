export const JACKET_VIEWS = ['front', 'back', 'leftSleeve', 'rightSleeve'] as const
export type JacketView = (typeof JACKET_VIEWS)[number]
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
  garmentCategory?: 'bomber' | 'coach' | 'puffer'
  garmentOptions?: Record<string, string>
  varsityOptions?: Record<string, string>
  front?: JacketSideCustomization
  back?: JacketSideCustomization
  leftSleeve?: JacketSideCustomization
  rightSleeve?: JacketSideCustomization
  snapshotUrl?: string
  snapshots?: Partial<Record<JacketView, string>>
}

export function hasJacketCustomization(customization?: JacketCustomization | null) {
  if (!customization) return false
  if (customization.varsityOptions || customization.garmentOptions) return true
  return JACKET_VIEWS.some((view) => {
    const side = customization[view]
    return Boolean(side?.text?.value.trim() || side?.artworks?.length)
  })
}

export function getCustomizedViews(customization?: JacketCustomization | null) {
  if (!customization) return []
  if (customization.varsityOptions || customization.garmentOptions) return [...JACKET_VIEWS]
  return JACKET_VIEWS.filter((view) => {
    const side = customization[view]
    return Boolean(side?.text?.value.trim() || side?.artworks?.length)
  })
}

export function getJacketViewLabel(view: JacketView) {
  if (view === 'leftSleeve') return 'Left sleeve'
  if (view === 'rightSleeve') return 'Right sleeve'
  return view[0].toUpperCase() + view.slice(1)
}
