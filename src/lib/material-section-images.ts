import { cache } from 'react'
import { connection } from 'next/server'
import { publicRead } from '@/lib/public-cache'
import { connectDB } from '@/lib/mongodb'
import SectionImage from '@/models/SectionImage'
import savedImages from '@/data/material-images.json'

export type MaterialSectionImage = { url: string; alt: string }
export type MaterialSectionImages = Record<string, MaterialSectionImage>
const fallback: MaterialSectionImages = Object.fromEntries((savedImages as Array<{ key: string; url: string; alt: string }>).map(image => [image.key, { url: image.url, alt: image.alt }]))

export const getMaterialSectionImages = cache(async (): Promise<MaterialSectionImages> => {
  try {
    return await publicRead('material-section-images', fallback, 3600, ['public-material-images'], async () => {
      if (!await connectDB()) throw new Error('Material images unavailable')
      const images = await SectionImage.find({ section: 'materials-colors' }).select('key url alt -_id').lean()
      return { ...fallback, ...Object.fromEntries(images.filter(image => typeof image.url === 'string' && image.url.startsWith('https://res.cloudinary.com/')).map(image => [image.key, { url: image.url, alt: image.alt }])) }
    })
  } catch (error) {
    await connection()
    console.error('Unable to load materials section images', error)
    return fallback
  }
})
