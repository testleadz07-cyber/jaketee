import { JACKET_VIEWS, type JacketView } from '@/types/jacket-customization'

export function visibleDesignColors(images: { url: string }[], view: JacketView, parts: Record<string, string>) {
  const url = images[JACKET_VIEWS.indexOf(view)]?.url || ''
  const colors = new Set<string>()
  if (!url.startsWith('data:image/svg+xml')) return colors
  try {
    const svg = decodeURIComponent(url.slice(url.indexOf(',') + 1))
    for (const match of svg.matchAll(/\bid="([^"]+)"/g)) if (parts[match[1]]) colors.add(parts[match[1]])
  } catch { /* Generated preview may be unavailable while restoring a design. */ }
  if (colors.has('Right sleeve color')) colors.add('Left sleeve color')
  if (colors.has('Left sleeve color')) colors.add('Sleeves color')
  if (colors.has('Sleeve stripe color')) colors.add('Sleeve piping color')
  return colors
}

export function designOptionVisible(name: string, view: JacketView) {
  if (name === 'Size') return true
  if (view === 'front') return true
  if (view === 'back') return !/Pocket|Closure|Lining|Drawstrings/i.test(name)
  if (name === 'Sleeve pocket') return view === 'leftSleeve'
  return /Sleeve|Cuff|Knit|Fleece weight|Padding weight/i.test(name)
}

export function focusDesignChange(option?: string) {
  requestAnimationFrame(() => {
    if (option) {
      const legend = [...document.querySelectorAll('legend')].find(node => node.textContent?.trim() === option)
      const details = legend?.closest('details')
      if (details) details.open = true
    }
    const preview = document.querySelector<HTMLElement>('[data-design-preview]')
    preview?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    preview?.focus({ preventScroll: true })
  })
}
