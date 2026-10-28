import { cache } from 'react'
import { connection } from 'next/server'
import { publicRead } from '@/lib/public-cache'
import { connectDB } from '@/lib/mongodb'
import SectionImage from '@/models/SectionImage'
import savedImages from '@/data/patch-images.json'

const fallbackImages: Record<string, { url: string; alt: string }> = Object.fromEntries(
  (savedImages as Array<{ key: string; url: string; alt: string }>).map(image => [image.key, { url: image.url, alt: image.alt }])
)

export const getPatchSectionImages = cache(async (): Promise<Record<string, { url: string; alt: string }>> => {
  try {
    return await publicRead('patch-section-images', fallbackImages, 3600, ['public-patch-images'], async () => {
      if (!await connectDB()) throw new Error('Patch images unavailable')
      const images = await SectionImage.find({ section: 'patches-embroidery' }).select('key url alt -_id').lean()
      return { ...fallbackImages, ...Object.fromEntries(images.map(image => [image.key, { url: image.url, alt: image.alt }])) }
    })
  } catch (error) {
    await connection()
    console.error('Unable to load patch section images', error)
    return fallbackImages
  }
})
