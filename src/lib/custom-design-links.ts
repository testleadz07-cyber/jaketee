export interface CustomDesignLink { href: string; label: string; title: string; imageKey?: string; interactive: boolean }
const links: Record<string, CustomDesignLink> = {
  'varsity-jackets': { href: '/design/varsity', label: 'Design a varsity jacket', title: 'Design your own varsity jacket', imageKey: 'varsity', interactive: true },
  'bomber-jackets': { href: '/design/bomber', label: 'Design a bomber jacket', title: 'Design your own bomber jacket', imageKey: 'bomber', interactive: true },
  'puffer-jackets': { href: '/design/puffer', label: 'Design a puffer jacket', title: 'Design your own puffer jacket', imageKey: 'puffer', interactive: true },
  'coach-jackets': { href: '/design/coach', label: 'Design a coach jacket', title: 'Design your own coach jacket', interactive: true },
  'fleece-hoodies': { href: '/design/hoodie', label: 'Design a fleece hoodie', title: 'Design your own fleece hoodie', interactive: true },
  'denim-jackets': { href: '/custom-denim-jackets', label: 'Explore custom denim jackets', title: 'Make your denim jacket personal', interactive: false },
  'patches-embroidery': { href: '/contact', label: 'Discuss your artwork', title: 'Bring your patches & embroidery to life', interactive: false },
}
export function getCustomDesignLink(categorySlugs: string[]): CustomDesignLink {
  for (const slug of categorySlugs) if (links[slug]) return links[slug]
  return { href: '/contact', label: 'Ask about customization', title: 'Make the details yours', interactive: false }
}
