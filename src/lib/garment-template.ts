import { renderGarmentSvg } from '@/lib/garment-svg'
import { JACKET_VIEWS, type JacketView } from '@/types/jacket-customization'

export const GARMENT_CATEGORIES = ['bomber', 'coach', 'puffer'] as const
export type GarmentCategory = typeof GARMENT_CATEGORIES[number]
export const GARMENT_COLORS = {
  'Body color': '#172554', 'Sleeves color': '#172554', 'Collar color': '#172554',
  'Cuffs color': '#172554', 'Waistband color': '#172554', 'Pockets color': '#172554',
  'Closure color': '#d4d4d8', 'Hood color': '#172554', 'Lining color': '#27272a', 'Stripe color': '#f5f1e8',
}
const common = {
  'Body material': ['Cotton fleece', 'Nylon', 'Satin'],
  'Sleeve material': ['Cotton fleece', 'Nylon', 'Satin'],
  Hood: ['No hood', 'Hooded'], Closure: ['Buttons', 'Zipper'],
  'Pocket style': ['Welt pockets', 'No pockets'],
  Lining: ['Plain', 'Quilted'], Size: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
}
export const GARMENT_TEMPLATES = {
  bomber: { name: 'Bomber jacket', options: { ...common, 'Collar style': ['Ribbed collar', 'Stand collar'], 'Knit style': ['Plain', 'Single stripe', 'Double stripe'], 'Sleeve pocket': ['No sleeve pocket', 'Utility pocket'] } },
  coach: { name: 'Coach jacket', options: { ...common, 'Collar style': ['Point collar', 'Stand collar'], 'Cuff style': ['Elastic cuffs', 'Straight cuffs'], Hem: ['Straight hem', 'Drawcord hem'] } },
  puffer: { name: 'Puffer jacket', options: { ...common, 'Collar style': ['Padded stand collar'], 'Quilting style': ['Horizontal', 'Chevron'], 'Padding weight': ['Lightweight', 'Standard', 'Heavy'], 'Cuff style': ['Elastic cuffs', 'Straight cuffs'] } },
} satisfies Record<GarmentCategory, { name: string; options: Record<string, string[]> }>

export function getGarmentTemplateId(category: GarmentCategory) { return `custom-${category}-v1` }
export function getGarmentCategory(id: string): GarmentCategory | undefined {
  return GARMENT_CATEGORIES.find(category => getGarmentTemplateId(category) === id)
}
export function getGarmentDefaults(category: GarmentCategory): Record<string, string> {
  const options = GARMENT_TEMPLATES[category].options as Record<string, string[]>
  return { ...GARMENT_COLORS, ...Object.fromEntries(Object.entries(options).map(([key, values]) => [key, values[0]])), Size: 'M', Closure: category === 'coach' ? 'Buttons' : 'Zipper' }
}
export function validateGarmentOptions(category: GarmentCategory, value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid jacket options')
  const input = value as Record<string, unknown>
  const defaults = getGarmentDefaults(category)
  const options = GARMENT_TEMPLATES[category].options as Record<string, string[]>
  if (Object.keys(input).some(key => !Object.hasOwn(defaults, key))) throw new Error('Unknown jacket option')
  return Object.fromEntries(Object.keys(defaults).map(key => {
    const entry = input[key]
    if (typeof entry !== 'string' || (Object.hasOwn(GARMENT_COLORS, key) ? !/^#[0-9a-f]{6}$/i.test(entry) : !options[key]?.includes(entry))) throw new Error(`Invalid ${key}`)
    return [key, entry]
  }))
}
export function getGarmentPrice(category: GarmentCategory, value: Record<string, string>) {
  const o = validateGarmentOptions(category, value)
  return 55 + (o['Body material'] !== 'Cotton fleece' || o['Sleeve material'] !== 'Cotton fleece' ? 10 : 0) + (o.Hood === 'Hooded' ? 5 : 0) + (o.Closure === 'Zipper' ? 2 : 0)
}
export function getGarmentSvg(category: GarmentCategory, options: Record<string, string>, view: JacketView) {
  return renderGarmentSvg(category, validateGarmentOptions(category, options), view)
}
export function getGarmentImages(category: GarmentCategory, options: Record<string, string>) {
  return JACKET_VIEWS.map(view => ({ url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(getGarmentSvg(category, options, view))}`, alt: `${GARMENT_TEMPLATES[category].name} ${view}` }))
}
