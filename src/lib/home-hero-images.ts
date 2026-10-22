import { cache } from 'react'
import { connectDB } from '@/lib/mongodb'
import SectionImage from '@/models/SectionImage'
import savedImages from '@/data/home-hero-images.json'

export type HeroImage = { url: string; alt: string; width?: number; height?: number }
export const legacyHomeHeroImage = 'https://res.cloudinary.com/dhdfbl8pc/image/upload/v1788899943/clothaa/exports/patches-embroidery/hero__varsity-jacket-patches-embroidery-hero.jpg'
const saved = Object.fromEntries((savedImages as Array<HeroImage & { key: string }>).map(image => [image.key, image]))
export const homeHeroImage = saved.desktop?.url || legacyHomeHeroImage
const legacy = { url: legacyHomeHeroImage, alt: 'Model wearing a blue varsity jacket with patches and embroidery', width: 1600, height: 800 }
const fallback = { desktop: saved.desktop || legacy, mobile: saved.mobile || saved.desktop || legacy }

export const getHomeHeroImages = cache(async (): Promise<{ desktop: HeroImage; mobile: HeroImage }> => {
  try {
    if (!await connectDB()) return fallback
    const images = await SectionImage.find({ section: 'home-hero', key: { $in: ['desktop', 'mobile'] } }).select('key url alt width height -_id').lean()
    return { ...fallback, ...Object.fromEntries(images.filter(image => ['desktop', 'mobile'].includes(image.key) && typeof image.url === 'string' && image.url.startsWith('https://res.cloudinary.com/')).map(image => [image.key, { url: image.url, alt: image.alt, width: image.width, height: image.height }])) }
  } catch (error) {
    console.error('Unable to load homepage hero images', error)
    return fallback
  }
})
