import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Header } from '@/components/header'
import { HomeHero, homeHeroImage } from '@/components/home-hero'
import { getHomeHeroImages } from '@/lib/home-hero-images'
import { getHomeCatalog } from '@/lib/home-catalog'
import { HomeArticles, HomeReviews } from '@/components/home-editorial'
import { CustomDesignSection } from '@/components/custom-design-section'
import Home from './home-client'

export const revalidate = 60

const defaultMetadata: Metadata = withSocialMetadata({
  title: 'Custom Varsity Jackets & Letterman Jackets | Jacketee',
  description: 'Design custom varsity jackets and letterman jackets with chenille patches, embroidery and your team colors. Bulk pricing for schools, teams and brands.',
  alternates: { canonical: 'https://www.jacketee.com/' },
  openGraph: {
    title: 'Custom Varsity Jackets & Letterman Jackets | Jacketee',
    description: 'Design custom varsity jackets and letterman jackets with chenille patches, embroidery and your team colors. Bulk pricing for schools, teams and brands.',
    url: 'https://www.jacketee.com/',
    siteName: 'Jacketee',
    type: 'website',
    images: [{ url: homeHeroImage, width: 1200, height: 630, alt: 'Jacketee custom varsity and letterman jackets' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Varsity Jackets & Letterman Jackets | Jacketee',
    description: 'Design custom varsity jackets and letterman jackets with chenille patches, embroidery and your team colors. Bulk pricing for schools, teams and brands.',
    images: ['https://www.jacketee.com/opengraph-image'],
  },
})

export async function generateMetadata(): Promise<Metadata> {
  const { desktop } = await getHomeHeroImages()
  return withSocialMetadata({
    ...defaultMetadata,
    openGraph: { ...defaultMetadata.openGraph, images: [{ url: desktop.url, width: desktop.width || 1774, height: desktop.height || 887, alt: desktop.alt }] },
    twitter: { ...defaultMetadata.twitter, images: [desktop.url] },
  })
}

export default function Page() {
  return <div className="home-page flex min-h-screen flex-col bg-background">
    <Header home />
    <Suspense fallback={null}><HomeHero /></Suspense>
    <Suspense fallback={null}><HomeContent /></Suspense>
  </div>
}

async function HomeContent() {
  const catalog = await getHomeCatalog()
  return <Home {...catalog}
    customDesign={<Suspense fallback={null}><CustomDesignSection home /></Suspense>}
    reviews={<Suspense fallback={null}><HomeReviews /></Suspense>}
    articles={<Suspense fallback={null}><HomeArticles /></Suspense>}
  />
}
