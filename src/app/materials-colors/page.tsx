import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { materialsHeroImage, faqs } from '@/data/materials-colors'
import { MaterialsGuidePage } from '@/components/materials-guide-page'
import { getMaterialSectionImages } from '@/lib/material-section-images'

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/materials-colors`
const defaultMetadata: Metadata = withSocialMetadata({
  title: 'Varsity Jacket Materials: Wool, Leather & Fabrics | Jacketee',
  description:
    'What are varsity jackets made of? Compare wool, leather, faux leather, satin, fleece and twill, then explore color swatches for your custom jacket.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Varsity Jacket Materials: Wool, Leather & Fabrics | Jacketee',
    description:
      'Compare jacket fabrics, finishes, and color swatches for custom varsity jackets, bomber jackets, hoodies, and coach jackets.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
    images: [
      {
        url: materialsHeroImage,
        width: 1200,
        height: 630,
        alt: 'Jacket materials and colors for custom jackets',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Varsity Jacket Materials: Wool, Leather & Fabrics | Jacketee',
    description: 'Compare materials and color swatches before you start a custom jacket order.',
  },
})

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export async function generateMetadata(): Promise<Metadata> {
  const images = await getMaterialSectionImages()
  const hero = images.hero?.url || materialsHeroImage
  return withSocialMetadata({ ...defaultMetadata, openGraph: { ...defaultMetadata.openGraph, images: [{ url: hero, width: 1448, height: 1086, alt: images.hero?.alt || 'Jacket material and color examples' }] }, twitter: { ...defaultMetadata.twitter, images: [hero] } })
}

export default async function MaterialsColorsPage() {
  const images = await getMaterialSectionImages()
  return <MaterialsGuidePage faqJsonLd={faqJsonLd} images={images} />
}
