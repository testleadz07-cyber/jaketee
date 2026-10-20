export const JACKET_VIEWS = ['front', 'back', 'leftSleeve', 'rightSleeve'] as const
export type JacketView = (typeof JACKET_VIEWS)[number]
export type JacketFontStyle = 'varsity' | 'block' | 'classic' | 'script' | 'sans' | 'serif'
export const JACKET_TEXT_LAYOUTS = ['straight', 'curve-up', 'curve-down', 'vertical'] as const
export type JacketTextLayout = typeof JACKET_TEXT_LAYOUTS[number]

export interface JacketTextCustomization {
  value: string
  color: string
  fontStyle: JacketFontStyle
  layout?: JacketTextLayout
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
  texts?: JacketTextElement[]
  artworks?: JacketArtworkCustomization[]
}

export interface JacketTextElement extends JacketTextCustomization { id: string }
export const MAX_JACKET_TEXTS = 12

// A defined list takes precedence, including an empty list after removing legacy text.
export function getJacketTexts(side?: JacketSideCustomization | null): JacketTextElement[] {
  if (side?.texts) return side.texts
  return side?.text?.value ? [{ ...side.text, id: 'legacy-text' }] : []
}

export function getJacketTextSummary(side?: JacketSideCustomization | null) {
  return getJacketTexts(side).map(text => text.value.trim()).filter(Boolean).join(', ')
}

export interface JacketCustomization {
  garmentCategory?: 'bomber' | 'coach' | 'puffer' | 'hoodie'
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
    return Boolean(getJacketTextSummary(side) || side?.artworks?.length)
  })
}

export function getCustomizedViews(customization?: JacketCustomization | null) {
  if (!customization) return []
  if (customization.varsityOptions || customization.garmentOptions) return [...JACKET_VIEWS]
  return JACKET_VIEWS.filter((view) => {
    const side = customization[view]
    return Boolean(getJacketTextSummary(side) || side?.artworks?.length)
  })
}

export function getJacketViewLabel(view: JacketView) {
  if (view === 'leftSleeve') return 'Left sleeve'
  if (view === 'rightSleeve') return 'Right sleeve'
  return view[0].toUpperCase() + view.slice(1)
}
