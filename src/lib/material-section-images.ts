import { cache } from 'react'
import { connectDB } from '@/lib/mongodb'
import SectionImage from '@/models/SectionImage'
import savedImages from '@/data/material-images.json'

export type MaterialSectionImage = { url: string; alt: string }
export type MaterialSectionImages = Record<string, MaterialSectionImage>
const fallback: MaterialSectionImages = Object.fromEntries((savedImages as Array<{ key: string; url: string; alt: string }>).map(image => [image.key, { url: image.url, alt: image.alt }]))

export const getMaterialSectionImages = cache(async (): Promise<MaterialSectionImages> => {
  try {
    if (!await connectDB()) return fallback
    const images = await SectionImage.find({ section: 'materials-colors' }).select('key url alt -_id').lean()
    return { ...fallback, ...Object.fromEntries(images.filter(image => typeof image.url === 'string' && image.url.startsWith('https://res.cloudinary.com/')).map(image => [image.key, { url: image.url, alt: image.alt }])) }
  } catch (error) {
    console.error('Unable to load materials section images', error)
    return fallback
  }
})
