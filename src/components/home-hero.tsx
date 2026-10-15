import { getImageProps } from 'next/image'
import imageLoader from '@/lib/image-loader'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const homeHeroImage = 'https://res.cloudinary.com/dhdfbl8pc/image/upload/v1788899943/clothaa/exports/patches-embroidery/hero__varsity-jacket-patches-embroidery-hero.jpg'

export function HomeHero() {
  const { props } = getImageProps({
    src: homeHeroImage,
    alt: 'Model wearing a blue varsity jacket with custom patches and embroidery',
    fill: true, priority: true, fetchPriority: 'high', sizes: '100vw',
    loader: imageLoader,
    className: 'object-cover object-center',
  })
  const mobileSrcSet = [320, 480, 640, 750, 828].map((width) =>
    `${imageLoader({ src: homeHeroImage, width })} ${width}w`).join(', ')
  return (
      <section className="relative min-h-[560px] overflow-hidden bg-zinc-950 text-white md:min-h-[680px]">
        <link rel="preload" as="image" media="(max-width: 767px)" imageSrcSet={mobileSrcSet} imageSizes="100vw" fetchPriority="high" />
        <link rel="preload" as="image" media="(min-width: 768px)" imageSrcSet={props.srcSet} imageSizes="100vw" fetchPriority="high" />
        <picture>
          <source media="(max-width: 767px)" srcSet={mobileSrcSet} sizes="100vw" />
          {/* getImageProps preserves Next's fill styles; media preloads match each source. */}
          <img {...props} alt={props.alt} />
        </picture>
        <div className="absolute inset-0 bg-black/60" />
        <div className="container relative mx-auto flex min-h-[560px] items-center px-4 py-16 md:min-h-[680px]">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Custom jackets, patches, and embroidery
            </div>
            <h1 className="text-4xl font-black leading-tight md:text-6xl lg:text-7xl">
              Custom Varsity Jackets, Designed Your Way
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white md:text-xl">
              Shop custom varsity jackets, bomber, wool, satin, leather, patch, and embroidery-ready styles built for teams,
              brands, schools, and everyday wear.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 bg-red-700 px-6 text-base font-bold text-white shadow-lg hover:bg-red-800">
                <Link href="/design/varsity">
                  Start Custom Design
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href="/shop">
                  Shop Jackets
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-12 border border-white/20 bg-white/10 px-6 text-base text-white hover:bg-white/20"
              >
                <Link href="/patches-embroidery">Explore Custom Options</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
  )
}
