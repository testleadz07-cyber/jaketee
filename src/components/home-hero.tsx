import { getImageProps } from 'next/image'
import imageLoader from '@/lib/image-loader'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getHomeHeroImages } from '@/lib/home-hero-images'

export { homeHeroImage } from '@/lib/home-hero-images'

export async function HomeHero() {
  const images = await getHomeHeroImages()
  const { props } = getImageProps({
    src: images.desktop.url,
    alt: images.desktop.alt,
    fill: true, priority: true, fetchPriority: 'high', sizes: '100vw',
    loader: imageLoader,
    className: 'object-cover object-top',
  })
  const mobileSrcSet = [320, 480, 640, 750, 828, 1080].map((width) =>
    `${imageLoader({ src: images.mobile.url, width })} ${width}w`).join(', ')
  return (
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        <link rel="preload" as="image" media="(max-width: 767px)" imageSrcSet={mobileSrcSet} imageSizes="100vw" fetchPriority="high" />
        <link rel="preload" as="image" media="(min-width: 768px)" imageSrcSet={props.srcSet} imageSizes="100vw" fetchPriority="high" />
        <picture>
          <source media="(max-width: 767px)" srcSet={mobileSrcSet} sizes="100vw" />
          {/* getImageProps preserves Next's fill styles; media preloads match each source. */}
          <img {...props} alt={props.alt} />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 md:bg-gradient-to-r md:from-black/90 md:via-black/50 md:to-transparent" />
        <div className="section-shell relative flex min-h-[620px] items-end py-10! md:min-h-[600px] md:items-center md:py-16!">
          <div className="max-w-xl md:max-w-[44%] xl:max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Custom varsity jackets by Jacketee</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">Your colors.<br />Your story.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/85">Choose your jacket, add your colors and patches, and make it yours. For you, your team, or your brand.</p>
            <div className="mt-7 grid gap-3 sm:flex">
              <Button asChild size="lg" className="h-12 bg-red-700 px-6 text-base font-semibold text-white hover:bg-red-800">
                <Link href="/design/varsity">Design Your Jacket <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" className="h-12 bg-white px-6 text-base text-zinc-950 hover:bg-zinc-100">
                <Link href="/shop">Shop Jackets</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
  )
}
