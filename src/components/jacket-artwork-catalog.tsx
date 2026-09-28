'use client'

import { renderToStaticMarkup } from 'react-dom/server'
import type { IconType } from 'react-icons'
import {
  FaBaseball, FaBasketball, FaBolt, FaCrown, FaDog, FaFire,
  FaFootball, FaGraduationCap, FaHeart, FaMusic, FaPaw,
  FaShieldDog, FaStar, FaTrophy,
} from 'react-icons/fa6'
import type { JacketFontStyle } from '@/types/jacket-customization'

export type ArtworkCategory = 'Animals' | 'Varsity' | 'Sports' | 'Symbols' | 'Letters' | 'Numbers'

export interface CatalogArtwork {
  id: string
  name: string
  category: ArtworkCategory
  icon?: IconType
  character?: string
}

const iconArtwork: CatalogArtwork[] = [
  { id: 'dog', name: 'Dog', category: 'Animals', icon: FaDog },
  { id: 'paw', name: 'Paw print', category: 'Animals', icon: FaPaw },
  { id: 'dog-shield', name: 'Dog shield', category: 'Animals', icon: FaShieldDog },
  { id: 'graduate', name: 'Graduate', category: 'Varsity', icon: FaGraduationCap },
  { id: 'trophy', name: 'Trophy', category: 'Varsity', icon: FaTrophy },
  { id: 'crown', name: 'Crown', category: 'Varsity', icon: FaCrown },
  { id: 'football', name: 'Football', category: 'Sports', icon: FaFootball },
  { id: 'basketball', name: 'Basketball', category: 'Sports', icon: FaBasketball },
  { id: 'baseball', name: 'Baseball', category: 'Sports', icon: FaBaseball },
  { id: 'star', name: 'Star', category: 'Symbols', icon: FaStar },
  { id: 'bolt', name: 'Lightning', category: 'Symbols', icon: FaBolt },
  { id: 'heart', name: 'Heart', category: 'Symbols', icon: FaHeart },
  { id: 'fire', name: 'Flame', category: 'Symbols', icon: FaFire },
  { id: 'music', name: 'Music', category: 'Symbols', icon: FaMusic },
]

const letters: CatalogArtwork[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((character) => ({
  id: `letter-${character}`, name: `Letter ${character}`, category: 'Letters', character,
}))
const numbers: CatalogArtwork[] = '0123456789'.split('').map((character) => ({
  id: `number-${character}`, name: `Number ${character}`, category: 'Numbers', character,
}))

export const artworkCatalog = [...iconArtwork, ...letters, ...numbers]
export const artworkCategories: ArtworkCategory[] = ['Animals', 'Varsity', 'Sports', 'Symbols', 'Letters', 'Numbers']

export function CatalogArtworkPreview({ item, className = 'h-8 w-8' }: { item: CatalogArtwork; className?: string }) {
  if (item.character) {
    return <span className={`${className} flex items-center justify-center font-black leading-none`} style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>{item.character}</span>
  }
  const Icon = item.icon!
  return <Icon className={className} aria-hidden="true" />
}

export const jacketFontStyles: Array<{ value: JacketFontStyle; label: string; family: string }> = [
  { value: 'varsity', label: 'Varsity', family: 'Arial Black, Arial, sans-serif' },
  { value: 'block', label: 'Block', family: 'Impact, Arial Black, sans-serif' },
  { value: 'classic', label: 'Classic', family: 'Georgia, serif' },
  { value: 'script', label: 'Script', family: 'Brush Script MT, Segoe Script, cursive' },
  { value: 'sans', label: 'Modern Sans', family: 'Arial, sans-serif' },
  { value: 'serif', label: 'Traditional Serif', family: 'Times New Roman, serif' },
]

export function getJacketFontFamily(style: JacketFontStyle = 'varsity') {
  return jacketFontStyles.find((font) => font.value === style)?.family || jacketFontStyles[0].family
}

export function isLetterOrNumberArtwork(id?: string) {
  return Boolean(id && (id.startsWith('letter-') || id.startsWith('number-')))
}

export function getCatalogArtworkDataUrl(id: string, color = '#f8fafc', fontStyle: JacketFontStyle = 'varsity') {
  const item = artworkCatalog.find((entry) => entry.id === id)
  if (!item) return null
  const Icon = item.icon
  const markup = item.character
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="73" text-anchor="middle" font-family="${getJacketFontFamily(fontStyle)}" font-size="76" font-weight="900" fill="${color}" stroke="#111827" stroke-width="5" paint-order="stroke">${item.character}</text></svg>`
    : Icon ? renderToStaticMarkup(<Icon color={color} />) : ''
  const normalized = markup.includes('xmlns=') ? markup : markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalized)}`
}
