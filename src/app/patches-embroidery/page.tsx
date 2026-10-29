export const dynamic = 'force-dynamic'

import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { getPatchSectionImages } from '@/lib/patch-section-images'
import { heroImage, placementImages, methods, faqs } from '@/data/patch-decoration'
import { PatchDecorationPage } from '@/components/patch-decoration-page'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
const PAGE_URL = `${SITE_URL}/patches-embroidery`
export const revalidate = 3600
const defaultMetadata: Metadata = withSocialMetadata({
  title: 'Chenille Patches for Letterman Jackets | Jacketee',
  description:
    'Compare chenille patches for letterman jackets, varsity jacket embroidery, felt, tackle twill, printing and label options for custom jacket designs.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Varsity Jacket Patches & Embroidery Guide | Jacketee',
    description:
      'Patch placement, patch types, embroidery, and printing methods for custom varsity jackets, bomber jackets, hoodies, and team apparel.',
    url: PAGE_URL,
    siteName: 'Jacketee',
    type: 'website',
    images: [
      {
        url: heroImage,
        width: 1200,
        height: 630,
        alt: 'Varsity jacket patches and embroidery examples',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Varsity Jacket Patches & Embroidery Guide | Jacketee',
    description: 'Compare custom patch, embroidery, and print options before starting your jacket order.',
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
  const images = await getPatchSectionImages()
  return withSocialMetadata({
    ...defaultMetadata,
    openGraph: {
      ...defaultMetadata.openGraph,
      images: [{ url: images.hero?.url || heroImage, width: 1200, height: 630, alt: images.hero?.alt || 'Varsity jacket patches and embroidery examples' }],
    },
    twitter: { ...defaultMetadata.twitter, images: [images.hero?.url || heroImage] },
  })
}

export default async function PatchesEmbroideryPage() {
  const images = await getPatchSectionImages()
  const currentHero = images.hero || { url: heroImage, alt: 'Varsity jacket patches and embroidery examples' }
  const currentPlacements = placementImages.map((image, index) => {
    const replacement = images[index === 0 ? 'placement-front' : 'placement-back']
    return replacement ? { src: replacement.url, alt: replacement.alt } : image
  })
  const currentMethods = methods.map(method => ({
    ...method,
    images: method.images.map((image, index) => {
      const replacement = images[`${method.id}-${index + 1}`]
      return replacement ? { src: replacement.url, alt: replacement.alt } : image
    }),
  }))
  return <PatchDecorationPage hero={currentHero} heroFallback={heroImage} placements={currentPlacements} methods={currentMethods} faqJsonLd={faqJsonLd} />
}
