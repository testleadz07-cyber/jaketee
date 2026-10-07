import { cache } from 'react'
import { connectDB } from '@/lib/mongodb'
import SectionImage from '@/models/SectionImage'
import savedImages from '@/data/patch-images.json'

const fallbackImages: Record<string, { url: string; alt: string }> = Object.fromEntries(
  (savedImages as Array<{ key: string; url: string; alt: string }>).map(image => [image.key, { url: image.url, alt: image.alt }])
)

export const getPatchSectionImages = cache(async (): Promise<Record<string, { url: string; alt: string }>> => {
  try {
    if (!await connectDB()) return fallbackImages
    const images = await SectionImage.find({ section: 'patches-embroidery' }).select('key url alt -_id').lean()
    return { ...fallbackImages, ...Object.fromEntries(images.map(image => [image.key, { url: image.url, alt: image.alt }])) }
  } catch (error) {
    console.error('Unable to load patch section images', error)
    return fallbackImages
  }
})
