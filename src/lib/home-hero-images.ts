import { cache } from 'react'
import { connectDB } from '@/lib/mongodb'
import SectionImage from '@/models/SectionImage'
import savedImages from '@/data/home-hero-images.json'

export type HeroImage = { url: string; alt: string; width?: number; height?: number }
const saved = Object.fromEntries((savedImages as Array<HeroImage & { key: string }>).map(image => [image.key, image]))
if (!saved.desktop) throw new Error('The current homepage desktop hero image is required')
export const homeHeroImage = saved.desktop.url
export const homeHeroAlt = saved.desktop.alt
const fallback = { desktop: saved.desktop, mobile: saved.mobile || saved.desktop }

export const getHomeHeroImages = cache(async (): Promise<{ desktop: HeroImage; mobile: HeroImage }> => {
  try {
    if (!await connectDB()) return fallback
    const images = await SectionImage.find({ section: 'home-hero', key: { $in: ['desktop', 'mobile'] } }).select('key url alt width height -_id').lean()
    return { ...fallback, ...Object.fromEntries(images.filter(image => ['desktop', 'mobile'].includes(image.key) && typeof image.url === 'string' && image.url.startsWith('https://res.cloudinary.com/') && !image.url.includes('/clothaa/exports/')).map(image => [image.key, { url: image.url, alt: image.alt, width: image.width, height: image.height }])) }
  } catch (error) {
    console.error('Unable to load homepage hero images', error)
    return fallback
  }
})
