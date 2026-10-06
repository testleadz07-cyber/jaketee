import { JACKET_VIEWS, type JacketCustomization } from '@/types/jacket-customization'

const PKR_PER_USD = 277.1
const TEXT_EMBROIDERY_FEE_PKR = 5000
const UPLOADED_ARTWORK_FEE_PKR = 5000

/**
 * Artwork category type — mirrors the one in jacket-artwork-catalog.tsx but
 * defined here so the pricing module stays server-safe.
 */
export type ArtworkCategory =
  | 'Letters' | 'Numbers' | 'Flags' | 'Badges'
  | 'Mascots' | 'Symbols' | 'Sports' | 'Animals' | 'Varsity'

const ARTWORK_FEES_PKR: Partial<Record<ArtworkCategory, number>> = {
  Letters: 1000,
  Numbers: 1000,
  Flags: 3000,
  Badges: 3000,
  Mascots: 3500,
  Symbols: 3500,
  Sports: 3000,
  Animals: 4000,
  Varsity: 2000,
}

/**
 * Lightweight server-safe map from catalog artwork id → category.
 * This mirrors the data in jacket-artwork-catalog.tsx but avoids importing
 * that 'use client' module (which pulls in react-icons).
 */
const CATALOG_ID_TO_CATEGORY: Record<string, ArtworkCategory> = {
  // Animals
  dog: 'Animals', cat: 'Animals', fish: 'Animals', dove: 'Animals',
  horse: 'Animals', paw: 'Animals', 'dog-shield': 'Animals',
  // Mascots
  'bulldog-mascot': 'Mascots', 'wildcat-mascot': 'Mascots',
  'knight-mascot': 'Mascots', 'runner-mascot': 'Mascots', 'star-face-mascot': 'Mascots',
  // Varsity
  graduate: 'Varsity', trophy: 'Varsity', crown: 'Varsity', book: 'Varsity',
  // Badges
  'class-badge-24': 'Badges', 'senior-badge': 'Badges', 'varsity-badge': 'Badges',
  'champion-badge': 'Badges', 'team-badge': 'Badges', 'year-badge': 'Badges',
  // Sports
  football: 'Sports', basketball: 'Sports', baseball: 'Sports', soccer: 'Sports',
  volleyball: 'Sports', bowling: 'Sports', 'table-tennis': 'Sports', helmet: 'Sports',
  // Symbols
  star: 'Symbols', bolt: 'Symbols', heart: 'Symbols', fire: 'Symbols',
  music: 'Symbols', camera: 'Symbols', anchor: 'Symbols', earth: 'Symbols',
  peace: 'Symbols', skull: 'Symbols', theater: 'Symbols', magic: 'Symbols',
  target: 'Symbols', record: 'Symbols', guitar: 'Symbols', clover: 'Symbols',
}

function isLetterOrNumberArtwork(id?: string) {
  return Boolean(id && (id.startsWith('letter-') || id.startsWith('number-')))
}

function isFlagArtwork(id?: string) {
  return Boolean(id && id.startsWith('flag-'))
}

export function getCatalogArtworkCategory(id?: string): ArtworkCategory | undefined {
  if (!id) return undefined
  if (CATALOG_ID_TO_CATEGORY[id]) return CATALOG_ID_TO_CATEGORY[id]
  if (isLetterOrNumberArtwork(id)) return id.startsWith('letter-') ? 'Letters' : 'Numbers'
  if (isFlagArtwork(id)) return 'Flags'
  return undefined
}

function pkrToUsd(amount: number) {
  return Math.round((amount / PKR_PER_USD) * 100) / 100
}

/**
 * Calculates the customization fee for a jacket order.
 * This is the single source of truth used by both the frontend (for display)
 * and the backend (for authoritative pricing at checkout).
 */
export function getCustomizationFee(customization: JacketCustomization): number {
  let feePkr = 0
  for (const view of JACKET_VIEWS) {
    const side = customization[view]
    if (!side) continue
    if (side.text?.value.trim()) feePkr += TEXT_EMBROIDERY_FEE_PKR
    for (const artwork of side.artworks || []) {
      if (artwork.source === 'upload') {
        feePkr += UPLOADED_ARTWORK_FEE_PKR
        continue
      }
      const category = getCatalogArtworkCategory(artwork.catalogId)
      if (category) feePkr += ARTWORK_FEES_PKR[category] || 0
    }
  }
  return pkrToUsd(feePkr)
}

