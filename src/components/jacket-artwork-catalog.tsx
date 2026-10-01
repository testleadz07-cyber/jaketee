'use client'

import { renderToStaticMarkup } from 'react-dom/server'
import type { IconType } from 'react-icons'
import {
  FaAnchor, FaBaseball, FaBasketball, FaBolt, FaBookOpen, FaBowlingBall, FaBullseye,
  FaCamera, FaCat, FaChessKnight, FaCircleDot, FaClover, FaCrown, FaDog, FaDove,
  FaEarthAmericas, FaFaceGrinStars, FaFire, FaFish, FaFootball, FaFutbol,
  FaGraduationCap, FaGuitar, FaHeart, FaHelmetSafety, FaHorse, FaMasksTheater,
  FaMusic, FaPaw, FaPeace, FaPersonRunning, FaShieldDog, FaSkull, FaStar,
  FaTableTennisPaddleBall, FaTrophy, FaVolleyball, FaWandMagicSparkles,
} from 'react-icons/fa6'
import type { JacketFontStyle } from '@/types/jacket-customization'

export type ArtworkCategory = 'Letters' | 'Numbers' | 'Badges' | 'Symbols' | 'Flags' | 'Mascots' | 'Animals' | 'Sports' | 'Varsity'

export interface CatalogArtwork {
  id: string
  name: string
  category: ArtworkCategory
  icon?: IconType
  character?: string
  fontStyle?: JacketFontStyle
  color?: string
  svgMarkup?: string
}

function flagSvg(stripes: string[], direction: 'horizontal' | 'vertical' = 'horizontal', emblem = '') {
  const stripeMarkup = stripes.map((color, index) => {
    if (direction === 'vertical') {
      const width = 120 / stripes.length
      return `<rect x="${index * width}" y="0" width="${width}" height="80" fill="${color}"/>`
    }
    const height = 80 / stripes.length
    return `<rect x="0" y="${index * height}" width="120" height="${height}" fill="${color}"/>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><rect width="120" height="80" rx="4" fill="#fff"/><g clip-path="url(#clip)">${stripeMarkup}${emblem}</g><rect width="120" height="80" rx="4" fill="none" stroke="#cbd5e1" stroke-width="2"/><defs><clipPath id="clip"><rect width="120" height="80" rx="4"/></clipPath></defs></svg>`
}

function badgeSvg(label: string, fill = '#64748b', accent = '#f8fafc') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path d="M60 8 98 24v31c0 28-15 46-38 57-23-11-38-29-38-57V24L60 8Z" fill="${fill}" stroke="#111827" stroke-width="5"/><path d="M60 20 87 31v25c0 19-9 32-27 42-18-10-27-23-27-42V31l27-11Z" fill="none" stroke="${accent}" stroke-width="4"/><text x="60" y="66" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="24" fill="${accent}" font-weight="900">${label}</text></svg>`
}

const iconArtwork: CatalogArtwork[] = [
  { id: 'dog', name: 'Dog', category: 'Animals', icon: FaDog, color: '#8b5e34' },
  { id: 'cat', name: 'Cat', category: 'Animals', icon: FaCat, color: '#6b7280' },
  { id: 'fish', name: 'Fish', category: 'Animals', icon: FaFish, color: '#0ea5e9' },
  { id: 'dove', name: 'Dove', category: 'Animals', icon: FaDove, color: '#94a3b8' },
  { id: 'horse', name: 'Horse', category: 'Animals', icon: FaHorse, color: '#92400e' },
  { id: 'paw', name: 'Paw print', category: 'Animals', icon: FaPaw, color: '#111827' },
  { id: 'dog-shield', name: 'Dog shield', category: 'Animals', icon: FaShieldDog, color: '#374151' },
  { id: 'bulldog-mascot', name: 'Bulldog mascot', category: 'Mascots', icon: FaDog, color: '#6b7280' },
  { id: 'wildcat-mascot', name: 'Wildcat mascot', category: 'Mascots', icon: FaCat, color: '#f97316' },
  { id: 'knight-mascot', name: 'Knight mascot', category: 'Mascots', icon: FaChessKnight, color: '#64748b' },
  { id: 'runner-mascot', name: 'Runner mascot', category: 'Mascots', icon: FaPersonRunning, color: '#2563eb' },
  { id: 'star-face-mascot', name: 'Star mascot', category: 'Mascots', icon: FaFaceGrinStars, color: '#eab308' },
  { id: 'graduate', name: 'Graduate', category: 'Varsity', icon: FaGraduationCap, color: '#1e40af' },
  { id: 'trophy', name: 'Trophy', category: 'Varsity', icon: FaTrophy, color: '#d97706' },
  { id: 'crown', name: 'Crown', category: 'Varsity', icon: FaCrown, color: '#ca8a04' },
  { id: 'book', name: 'Class book', category: 'Varsity', icon: FaBookOpen, color: '#7c3aed' },
  { id: 'class-badge-24', name: 'Class badge 24', category: 'Badges', svgMarkup: badgeSvg('24', '#64748b') },
  { id: 'senior-badge', name: 'Seniors badge', category: 'Badges', svgMarkup: badgeSvg('SR', '#475569') },
  { id: 'varsity-badge', name: 'Varsity badge', category: 'Badges', svgMarkup: badgeSvg('V', '#1e40af') },
  { id: 'champion-badge', name: 'Champion badge', category: 'Badges', svgMarkup: badgeSvg('1', '#b91c1c') },
  { id: 'team-badge', name: 'Team badge', category: 'Badges', svgMarkup: badgeSvg('TM', '#0f766e') },
  { id: 'year-badge', name: 'Year badge', category: 'Badges', svgMarkup: badgeSvg('YR', '#7c3aed') },
  { id: 'football', name: 'Football', category: 'Sports', icon: FaFootball, color: '#92400e' },
  { id: 'basketball', name: 'Basketball', category: 'Sports', icon: FaBasketball, color: '#ea580c' },
  { id: 'baseball', name: 'Baseball', category: 'Sports', icon: FaBaseball, color: '#dc2626' },
  { id: 'soccer', name: 'Soccer', category: 'Sports', icon: FaFutbol, color: '#111827' },
  { id: 'volleyball', name: 'Volleyball', category: 'Sports', icon: FaVolleyball, color: '#2563eb' },
  { id: 'bowling', name: 'Bowling', category: 'Sports', icon: FaBowlingBall, color: '#111827' },
  { id: 'table-tennis', name: 'Table tennis', category: 'Sports', icon: FaTableTennisPaddleBall, color: '#16a34a' },
  { id: 'helmet', name: 'Helmet', category: 'Sports', icon: FaHelmetSafety, color: '#111827' },
  { id: 'star', name: 'Star', category: 'Symbols', icon: FaStar, color: '#facc15' },
  { id: 'bolt', name: 'Lightning', category: 'Symbols', icon: FaBolt, color: '#f59e0b' },
  { id: 'heart', name: 'Heart', category: 'Symbols', icon: FaHeart, color: '#dc2626' },
  { id: 'fire', name: 'Flame', category: 'Symbols', icon: FaFire, color: '#f97316' },
  { id: 'music', name: 'Music', category: 'Symbols', icon: FaMusic, color: '#7c3aed' },
  { id: 'camera', name: 'Camera', category: 'Symbols', icon: FaCamera, color: '#64748b' },
  { id: 'anchor', name: 'Anchor', category: 'Symbols', icon: FaAnchor, color: '#0f766e' },
  { id: 'earth', name: 'Earth', category: 'Symbols', icon: FaEarthAmericas, color: '#16a34a' },
  { id: 'peace', name: 'Peace', category: 'Symbols', icon: FaPeace, color: '#eab308' },
  { id: 'skull', name: 'Skull', category: 'Symbols', icon: FaSkull, color: '#111827' },
  { id: 'theater', name: 'Theater', category: 'Symbols', icon: FaMasksTheater, color: '#be123c' },
  { id: 'magic', name: 'Magic', category: 'Symbols', icon: FaWandMagicSparkles, color: '#9333ea' },
  { id: 'target', name: 'Target', category: 'Symbols', icon: FaBullseye, color: '#dc2626' },
  { id: 'record', name: 'Record', category: 'Symbols', icon: FaCircleDot, color: '#111827' },
  { id: 'guitar', name: 'Guitar', category: 'Symbols', icon: FaGuitar, color: '#b45309' },
  { id: 'clover', name: 'Clover', category: 'Symbols', icon: FaClover, color: '#16a34a' },
]

const letterStyles: Array<{ suffix: string; fontStyle: JacketFontStyle; label: string }> = [
  { suffix: 'varsity', fontStyle: 'varsity', label: 'Varsity' },
  { suffix: 'script', fontStyle: 'script', label: 'Script' },
  { suffix: 'classic', fontStyle: 'classic', label: 'Classic' },
]
const letters: CatalogArtwork[] = letterStyles.flatMap((style) =>
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((character) => ({
    id: `letter-${style.suffix}-${character}`,
    name: `${style.label} letter ${character}`,
    category: 'Letters' as const,
    character,
    fontStyle: style.fontStyle,
    color: style.fontStyle === 'script' ? '#7c3aed' : style.fontStyle === 'classic' ? '#475569' : '#1e40af',
  }))
)
const numbers: CatalogArtwork[] = '0123456789'.split('').map((character) => ({
  id: `number-${character}`, name: `Number ${character}`, category: 'Numbers', character, color: '#1e40af',
}))

const flags: CatalogArtwork[] = [
  ['us', 'United States', flagSvg(['#b91c1c', '#ffffff', '#b91c1c', '#ffffff', '#b91c1c', '#ffffff', '#b91c1c', '#ffffff', '#b91c1c', '#ffffff', '#b91c1c', '#ffffff', '#b91c1c'], 'horizontal', '<rect width="52" height="43" fill="#1d4ed8"/><g fill="#fff"><circle cx="8" cy="8" r="1.5"/><circle cx="18" cy="8" r="1.5"/><circle cx="28" cy="8" r="1.5"/><circle cx="38" cy="8" r="1.5"/><circle cx="13" cy="18" r="1.5"/><circle cx="23" cy="18" r="1.5"/><circle cx="33" cy="18" r="1.5"/><circle cx="43" cy="18" r="1.5"/><circle cx="8" cy="28" r="1.5"/><circle cx="18" cy="28" r="1.5"/><circle cx="28" cy="28" r="1.5"/><circle cx="38" cy="28" r="1.5"/></g>')],
  ['ca', 'Canada', flagSvg(['#dc2626', '#ffffff', '#dc2626'], 'vertical', '<path d="M60 24 65 39l14-5-8 12 13 6-15 2 4 14-13-8-13 8 4-14-15-2 13-6-8-12 14 5 5-15Z" fill="#dc2626"/>')],
  ['fr', 'France', flagSvg(['#1d4ed8', '#ffffff', '#dc2626'], 'vertical')],
  ['gb', 'United Kingdom', flagSvg(['#1e3a8a'], 'horizontal', '<path d="M0 0 120 80M120 0 0 80" stroke="#fff" stroke-width="16"/><path d="M0 0 120 80M120 0 0 80" stroke="#dc2626" stroke-width="7"/><path d="M60 0v80M0 40h120" stroke="#fff" stroke-width="22"/><path d="M60 0v80M0 40h120" stroke="#dc2626" stroke-width="12"/>')],
  ['de', 'Germany', flagSvg(['#111827', '#dc2626', '#facc15'])],
  ['au', 'Australia', flagSvg(['#1d4ed8'], 'horizontal', '<circle cx="84" cy="40" r="8" fill="#fff"/><circle cx="100" cy="22" r="4" fill="#fff"/><circle cx="102" cy="58" r="4" fill="#fff"/>')],
  ['jp', 'Japan', flagSvg(['#ffffff'], 'horizontal', '<circle cx="60" cy="40" r="20" fill="#dc2626"/>')],
  ['kr', 'South Korea', flagSvg(['#ffffff'], 'horizontal', '<circle cx="60" cy="40" r="18" fill="#dc2626"/><path d="M60 22a18 18 0 0 1 0 36 9 9 0 0 0 0-18 9 9 0 0 1 0-18Z" fill="#2563eb"/>')],
  ['no', 'Norway', flagSvg(['#dc2626'], 'horizontal', '<path d="M36 0v80M0 40h120" stroke="#fff" stroke-width="18"/><path d="M36 0v80M0 40h120" stroke="#1e3a8a" stroke-width="10"/>')],
  ['it', 'Italy', flagSvg(['#16a34a', '#ffffff', '#dc2626'], 'vertical')],
  ['ie', 'Ireland', flagSvg(['#16a34a', '#ffffff', '#f97316'], 'vertical')],
  ['pk', 'Pakistan', flagSvg(['#ffffff', '#047857'], 'vertical', '<circle cx="72" cy="40" r="18" fill="#fff"/><circle cx="79" cy="36" r="18" fill="#047857"/><path d="M89 23 93 33l10-1-8 6 4 10-9-6-8 6 3-10-8-6 10 1 2-10Z" fill="#fff"/>')],
  ['in', 'India', flagSvg(['#f97316', '#ffffff', '#16a34a'], 'horizontal', '<circle cx="60" cy="40" r="9" fill="none" stroke="#1d4ed8" stroke-width="2"/><circle cx="60" cy="40" r="2" fill="#1d4ed8"/>')],
  ['se', 'Sweden', flagSvg(['#2563eb'], 'horizontal', '<path d="M36 0v80M0 40h120" stroke="#facc15" stroke-width="12"/>')],
  ['tr', 'Turkey', flagSvg(['#dc2626'], 'horizontal', '<circle cx="52" cy="40" r="18" fill="#fff"/><circle cx="58" cy="40" r="14" fill="#dc2626"/><path d="M76 29 79 37l8-1-7 5 3 8-7-5-7 5 3-8-7-5 8 1 3-8Z" fill="#fff"/>')],
  ['sa', 'Saudi Arabia', flagSvg(['#047857'], 'horizontal', '<text x="60" y="43" text-anchor="middle" font-family="Arial Black, Arial" font-size="12" fill="#fff">SA</text><rect x="36" y="54" width="48" height="4" fill="#fff"/>')],
  ['ae', 'United Arab Emirates', flagSvg(['#16a34a', '#ffffff', '#111827'], 'horizontal', '<rect width="30" height="80" fill="#dc2626"/>')],
  ['nl', 'Netherlands', flagSvg(['#dc2626', '#ffffff', '#2563eb'])],
  ['es', 'Spain', flagSvg(['#dc2626', '#facc15', '#dc2626'])],
  ['pt', 'Portugal', flagSvg(['#16a34a', '#dc2626'], 'vertical', '<circle cx="48" cy="40" r="10" fill="#facc15"/>')],
  ['br', 'Brazil', flagSvg(['#16a34a'], 'horizontal', '<path d="M60 16 98 40 60 64 22 40Z" fill="#facc15"/><circle cx="60" cy="40" r="16" fill="#1d4ed8"/>')],
  ['mx', 'Mexico', flagSvg(['#16a34a', '#ffffff', '#dc2626'], 'vertical', '<circle cx="60" cy="40" r="7" fill="#a16207"/>')],
  ['cn', 'China', flagSvg(['#dc2626'], 'horizontal', '<path d="M24 14 29 28l14 0-11 8 5 14-13-9-12 9 5-14-12-8 15 0 4-14Z" fill="#facc15"/>')],
  ['bd', 'Bangladesh', flagSvg(['#047857'], 'horizontal', '<circle cx="54" cy="40" r="18" fill="#dc2626"/>')],
  ['ng', 'Nigeria', flagSvg(['#16a34a', '#ffffff', '#16a34a'], 'vertical')],
  ['za', 'South Africa', flagSvg(['#dc2626', '#ffffff', '#2563eb'], 'horizontal', '<path d="M0 0 58 40 0 80Z" fill="#111827"/><path d="M0 10 44 40 0 70Z" fill="#facc15"/><path d="M0 20 32 40 0 60Z" fill="#16a34a"/>')],
  ['dk', 'Denmark', flagSvg(['#dc2626'], 'horizontal', '<path d="M38 0v80M0 40h120" stroke="#fff" stroke-width="10"/>')],
  ['ch', 'Switzerland', flagSvg(['#dc2626'], 'horizontal', '<path d="M52 20h16v18h18v16H68v18H52V54H34V38h18z" fill="#fff"/>')],
  ['fi', 'Finland', flagSvg(['#ffffff'], 'horizontal', '<path d="M38 0v80M0 40h120" stroke="#2563eb" stroke-width="14"/>')],
  ['gr', 'Greece', flagSvg(['#2563eb', '#ffffff', '#2563eb', '#ffffff', '#2563eb', '#ffffff', '#2563eb', '#ffffff', '#2563eb'], 'horizontal', '<rect width="44" height="44" fill="#2563eb"/><path d="M22 0v44M0 22h44" stroke="#fff" stroke-width="8"/>')],
  ['pl', 'Poland', flagSvg(['#ffffff', '#dc2626'])],
  ['ua', 'Ukraine', flagSvg(['#2563eb', '#facc15'])],
  ['id', 'Indonesia', flagSvg(['#dc2626', '#ffffff'])],
  ['th', 'Thailand', flagSvg(['#dc2626', '#ffffff', '#1e3a8a', '#ffffff', '#dc2626'])],
  ['ph', 'Philippines', flagSvg(['#2563eb', '#dc2626'], 'horizontal', '<path d="M0 0 52 40 0 80Z" fill="#fff"/><circle cx="18" cy="40" r="6" fill="#facc15"/>')],
  ['my', 'Malaysia', flagSvg(['#dc2626', '#ffffff', '#dc2626', '#ffffff', '#dc2626', '#ffffff', '#dc2626', '#ffffff'], 'horizontal', '<rect width="54" height="44" fill="#1e3a8a"/><circle cx="25" cy="22" r="12" fill="#facc15"/><circle cx="30" cy="22" r="12" fill="#1e3a8a"/><path d="M42 10 45 18l8-1-7 5 3 8-7-5-7 5 3-8-7-5 8 1 3-8Z" fill="#facc15"/>')],
  ['sg', 'Singapore', flagSvg(['#dc2626', '#ffffff'], 'horizontal', '<circle cx="26" cy="22" r="10" fill="#fff"/><circle cx="30" cy="22" r="10" fill="#dc2626"/><path d="M44 11 46 16l5-1-4 3 2 5-5-3-5 3 2-5-4-3 5 1 2-5Z" fill="#fff"/>')],
  ['nz', 'New Zealand', flagSvg(['#1d4ed8'], 'horizontal', '<circle cx="84" cy="28" r="5" fill="#dc2626" stroke="#fff" stroke-width="2"/><circle cx="98" cy="42" r="5" fill="#dc2626" stroke="#fff" stroke-width="2"/><circle cx="78" cy="56" r="5" fill="#dc2626" stroke="#fff" stroke-width="2"/>')],
  ['ar', 'Argentina', flagSvg(['#60a5fa', '#ffffff', '#60a5fa'], 'horizontal', '<circle cx="60" cy="40" r="8" fill="#facc15"/>')],
  ['cl', 'Chile', flagSvg(['#ffffff', '#dc2626'], 'horizontal', '<rect width="44" height="40" fill="#2563eb"/><path d="M22 10 25 18h8l-7 5 3 8-7-5-7 5 3-8-7-5h8l3-8Z" fill="#fff"/>')],
  ['co', 'Colombia', flagSvg(['#facc15', '#2563eb', '#dc2626'])],
  ['pe', 'Peru', flagSvg(['#dc2626', '#ffffff', '#dc2626'], 'vertical')],
  ['eg', 'Egypt', flagSvg(['#dc2626', '#ffffff', '#111827'], 'horizontal', '<circle cx="60" cy="40" r="6" fill="#d97706"/>')],
  ['ma', 'Morocco', flagSvg(['#dc2626'], 'horizontal', '<path d="M60 24 65 37h14l-11 8 4 13-12-8-12 8 4-13-11-8h14z" fill="none" stroke="#16a34a" stroke-width="4"/>')],
  ['ke', 'Kenya', flagSvg(['#111827', '#dc2626', '#16a34a'], 'horizontal', '<path d="M60 18c12 10 12 34 0 44-12-10-12-34 0-44Z" fill="#fff" stroke="#111827" stroke-width="3"/><path d="M42 16 78 64M78 16 42 64" stroke="#fff" stroke-width="4"/>')],
  ['gh', 'Ghana', flagSvg(['#dc2626', '#facc15', '#16a34a'], 'horizontal', '<path d="M60 29 64 38h10l-8 6 3 10-9-6-9 6 3-10-8-6h10z" fill="#111827"/>')],
  ['et', 'Ethiopia', flagSvg(['#16a34a', '#facc15', '#dc2626'], 'horizontal', '<circle cx="60" cy="40" r="13" fill="#2563eb"/><path d="M60 29 63 37h8l-7 5 3 8-7-5-7 5 3-8-7-5h8z" fill="#facc15"/>')],
].map(([code, name, svgMarkup]) => ({ id: `flag-${code}`, name: `${name} flag`, category: 'Flags' as const, svgMarkup }))

export const artworkCatalog = [...letters, ...numbers, ...iconArtwork, ...flags]
export const artworkCategories: ArtworkCategory[] = ['Letters', 'Numbers', 'Badges', 'Symbols', 'Flags', 'Mascots', 'Animals', 'Sports', 'Varsity']

export function CatalogArtworkPreview({ item, className = 'h-8 w-8' }: { item: CatalogArtwork; className?: string }) {
  if (item.svgMarkup) {
    return <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(item.svgMarkup)}`} alt="" className={`${className} object-contain`} />
  }
  if (item.character) {
    return <span className={`${className} flex items-center justify-center font-black leading-none`} style={{ color: item.color || '#1e40af', fontFamily: getJacketFontFamily(item.fontStyle || 'varsity') }}>{item.character}</span>
  }
  const Icon = item.icon!
  return <Icon className={className} color={item.color || '#1e40af'} aria-hidden="true" />
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

export function getCatalogArtworkCategory(id?: string) {
  return artworkCatalog.find((entry) => entry.id === id)?.category
}

export function getCatalogArtworkDataUrl(id: string, color = '#f8fafc', fontStyle: JacketFontStyle = 'varsity') {
  const item = artworkCatalog.find((entry) => entry.id === id)
  if (!item) return null
  const Icon = item.icon
  const fontFamily = getJacketFontFamily(item.fontStyle || fontStyle)
  const markup = item.character
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="73" text-anchor="middle" font-family="${fontFamily}" font-size="76" font-weight="900" fill="${color}" stroke="#111827" stroke-width="5" paint-order="stroke">${item.character}</text></svg>`
    : item.svgMarkup ? item.svgMarkup
    : Icon ? renderToStaticMarkup(<Icon color={color} />) : ''
  const normalized = markup.includes('xmlns=') ? markup : markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalized)}`
}
