import type { JacketView } from '@/types/jacket-customization'
import { renderVarsitySvg } from '@/lib/varsity-svg'

export const VARSITY_TEMPLATE_ID = 'custom-varsity-v1'
export const VARSITY_OPTIONS = {
  'Body material': ['Wool', 'Cotton fleece', 'Satin'],
  'Sleeve material': ['Leather', 'Wool', 'Cotton fleece', 'Satin'],
  Hood: ['No hood', 'Hooded'],
  Closure: ['Buttons', 'Zipper'],
  'Sleeve style': ['Set-in', 'Raglan'],
  'Sleeve stripe': ['No stripe', 'Add stripe'],
  'Sleeve stripe piping': ['No piping', 'Add piping'],
  'Cuff style': ['Ribbed', 'Plain fabric'],
  'Collar style': ['Classic rib', 'Stand collar'],
  'Knit style': ['Plain', 'Single stripe', 'Double stripe'],
  'Pocket style': ['Slanted', 'Straight welt', 'No pockets'],
  Lining: ['Plain', 'Quilted'],
  Size: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
} as const
export const VARSITY_COLORS = {
  'Body color': '#172554', 'Left sleeve color': '#f5f1e8', 'Right sleeve color': '#f5f1e8',
  'Collar color': '#172554', 'Cuffs color': '#172554', 'Waistband color': '#172554',
  'Pockets color': '#f5f1e8', 'Closure color': '#d4d4d8', 'Hood color': '#172554', 'Stripe color': '#f5f1e8',
  'Lining color': '#27272a', 'Hood lining color': '#f5f1e8',
  'Sleeve stripe color': '#172554', 'Sleeve piping color': '#f5f1e8',
}
const EXTENDED_DEFAULTS: Record<string, string> = {
  'Sleeve style': 'Set-in', 'Collar style': 'Classic rib', 'Knit style': 'Double stripe',
  'Pocket style': 'Slanted', Lining: 'Plain', 'Lining color': '#27272a', 'Hood lining color': '#f5f1e8',
  'Sleeve stripe': 'No stripe', 'Sleeve stripe piping': 'No piping', 'Cuff style': 'Ribbed',
  'Sleeve stripe color': '#172554', 'Sleeve piping color': '#f5f1e8',
}
export const DEFAULT_VARSITY_OPTIONS: Record<string, string> = {
  ...VARSITY_COLORS, ...EXTENDED_DEFAULTS, 'Body material': 'Wool', 'Sleeve material': 'Leather', Hood: 'No hood', Closure: 'Buttons', Size: 'M',
}

export function getVarsityPrice(options: Record<string, string>) {
  const o = validateVarsityOptions(options)
  return 55 + (o['Body material'] !== 'Cotton fleece' || o['Sleeve material'] !== 'Cotton fleece' ? 10 : 0)
    + (o.Hood === 'Hooded' ? 5 : 0) + (o.Closure === 'Zipper' ? 2 : 0)
}

export function validateVarsityOptions(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid varsity options')
  const input = value as Record<string, unknown>
  if (Object.keys(input).some(key => !Object.hasOwn(DEFAULT_VARSITY_OPTIONS, key))) throw new Error('Invalid varsity options')
  const result: Record<string, string> = {}
  for (const key of Object.keys(DEFAULT_VARSITY_OPTIONS)) {
    // Previously saved designs acquire the new construction defaults without losing colors or artwork.
    const entry = input[key] ?? EXTENDED_DEFAULTS[key]
    if (typeof entry !== 'string') throw new Error(`Missing ${key}`)
    if (key in VARSITY_COLORS) {
      if (!/^#[0-9a-f]{6}$/i.test(entry)) throw new Error(`Invalid ${key}`)
    } else if (!(VARSITY_OPTIONS[key as keyof typeof VARSITY_OPTIONS] as readonly string[]).includes(entry)) {
      throw new Error(`Invalid ${key}`)
    }
    result[key] = entry
  }
  return result
}

export function getVarsitySvg(options: Record<string, string>, view: JacketView): string {
  return renderVarsitySvg(validateVarsityOptions(options), view)
}

export function getVarsityImages(options: Record<string, string>) {
  return (['front', 'back', 'leftSleeve', 'rightSleeve'] as const).map(view => ({
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(getVarsitySvg(options, view))}`, alt: `Varsity jacket ${view}`,
  }))
}
