import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, FileCheck2, Palette, PencilRuler, Users } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ProductCard } from '@/components/product-card'
import { connectDB } from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { buildProductUrl, resolveAncestorChain, resolveDescendantIds } from '@/lib/categories'
import { getStaticCategories, getStaticProducts } from '@/lib/static-data'
import { getCustomLandingConfig } from '@/data/custom-jacket-landings'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'

async function getProducts(categorySlug: string) {
  try {
    const db = await connectDB()
    if (db) {
      const rawCategories = await Category.find({}).lean()
      const categories = rawCategories.map((category: any) => ({
        _id: String(category._id),
        name: category.name,
        slug: category.slug,
        parentId: category.parentId ? String(category.parentId) : null,
      }))
      const category = categories.find((item) => item.slug === categorySlug)
      if (!category) return []
      const ids = resolveDescendantIds(categories, category._id)
      const products = await Product.find({ categoryId: { $in: ids }, inStock: true, isDraft: { $ne: true }, status: 'active' })
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(8)
        .lean()
      return products.map((product: any) => {
        const categoryPath = resolveAncestorChain(categories, String(product.categoryId)).map((item) => ({ name: item.name, slug: item.slug }))
        return {
          id: String(product._id), name: product.name, slug: product.slug, description: product.description || '',
          price: Number(product.price), compareAtPrice: product.compareAtPrice == null ? null : Number(product.compareAtPrice),
          compareAtPriceVerified: Boolean(product.compareAtPriceVerified), isFeatured: Boolean(product.isFeatured),
          images: (product.images || []).map((image: any) => ({ url: image.url, alt: image.alt || product.name })),
          category: categoryPath.at(-1), categoryPath,
        }
      })
    }
  } catch (error) {
    console.error(`Custom landing product fetch failed for ${categorySlug}:`, error)
  }

  const categories = getStaticCategories()
  const category = categories.find((item) => item.slug === categorySlug)
  if (!category) return []
  const ids = new Set(resolveDescendantIds(categories.map((item) => ({ _id: item.id, parentId: item.parentId })), category.id))
  return getStaticProducts().filter((product) => ids.has(product.categoryId) && product.inStock).slice(0, 8)
}

export async function CustomJacketLandingPage({ pageKey }: { pageKey: string }) {
  const config = getCustomLandingConfig(pageKey)
  const products = await getProducts(config.categorySlug)
  const startingPrice = products.length ? Math.min(...products.map((product) => product.price)) : null
  const heroImage = products[0]?.images?.[0]?.url
  const canonical = `${SITE_URL}${config.path}`
  const itemList = products.map((product, index) => ({
    '@type': 'ListItem', position: index + 1, name: product.name,
    url: `${SITE_URL}${buildProductUrl(product)}`,
  }))
  const schemas = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: config.keyword, item: canonical },
    ] },
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: config.keyword, description: config.description, url: canonical, mainEntity: { '@type': 'ItemList', numberOfItems: itemList.length, itemListElement: itemList } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: config.faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {schemas.map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />)}
        <section className="relative flex min-h-[520px] items-end overflow-hidden bg-zinc-950 text-white md:min-h-[610px]">
          {heroImage && <Image src={heroImage} alt={products[0]?.images?.[0]?.alt || `${config.keyword} featured jacket`} fill priority sizes="100vw" className="object-cover" />}
          <div className="absolute inset-0 bg-black/60" />
          <div className="container relative mx-auto px-4 pb-14 pt-24 md:pb-20">
            <Breadcrumbs items={[{ label: config.keyword }]} className="mb-7 text-white/80" />
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold md:text-6xl">{config.keyword}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/90 md:text-lg">{config.intro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/design/varsity" className="inline-flex h-11 items-center gap-2 bg-red-700 px-5 text-sm font-semibold text-white hover:bg-red-800">Design a Varsity Jacket <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/bulk-orders" className="inline-flex h-11 items-center border border-white/60 px-5 text-sm font-semibold text-white hover:bg-white hover:text-zinc-950">Get a Bulk Quote</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b py-12 md:py-16" aria-labelledby={`${pageKey}-products`}>
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-sm font-semibold uppercase text-muted-foreground">Choose a starting style</p><h2 id={`${pageKey}-products`} className="mt-2 text-2xl font-bold md:text-3xl">Current {config.keyword.toLowerCase()}</h2></div>
              <Link href={config.categoryHref} className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">View the full collection <ArrowRight className="h-4 w-4" /></Link>
            </div>
            {products.length > 0 ? <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="mt-8 text-muted-foreground">Contact Jacketee to discuss the current styles available for this project.</p>}
          </div>
        </section>

        <section className="border-b bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold md:text-3xl">How customization works</h2>
            <div className="mt-8 grid gap-8 border-t pt-8 md:grid-cols-3">
              {[
                [Palette, 'Choose your style and colors', 'Select a starting jacket, material, fit, and color direction that suits how it will be worn.'],
                [PencilRuler, 'Add your artwork', 'Share logos, names, numbers, patches, embroidery, or print details with the intended placements.'],
                [FileCheck2, 'Approve your free mockup', 'Review the design, spelling, colors, scale, and placement. Production begins after approval.'],
              ].map(([Icon, title, text]) => { const StepIcon = Icon as typeof Palette; return <div key={String(title)}><StepIcon className="h-6 w-6" /><h3 className="mt-4 text-lg font-semibold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{String(text)}</p></div> })}
            </div>
          </div>
        </section>

        <section className="border-b py-12 md:py-16">
          <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div><p className="text-sm font-semibold uppercase text-muted-foreground">Materials and decoration</p><h2 className="mt-2 text-2xl font-bold md:text-3xl">Customization options</h2><p className="mt-4 leading-7 text-muted-foreground">{config.optionsIntro}</p><Link href="/patches-embroidery" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">Compare patches and embroidery <ArrowRight className="h-4 w-4" /></Link></div>
            <div className="grid gap-7 sm:grid-cols-2">
              {config.options.map((option) => <div key={option.title} className="border-l-2 pl-5"><h3 className="font-semibold">{option.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{option.text}</p></div>)}
            </div>
          </div>
        </section>

        <section className="border-b bg-zinc-950 py-12 text-white md:py-16">
          <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div><Users className="h-7 w-7" /><h2 className="mt-4 text-2xl font-bold md:text-3xl">Made for individuals and groups</h2><p className="mt-4 leading-7 text-white/70">{config.audienceIntro}</p></div>
            <div className="grid gap-px bg-white/20 sm:grid-cols-3">
              {[['Schools & teams', '/bulk-orders/schools'], ['Companies & events', '/bulk-orders/corporate'], ['Brands & resellers', '/bulk-orders/private-label']].map(([label, href]) => <Link key={href} href={href} className="flex min-h-24 items-center justify-between bg-zinc-950 px-5 text-sm font-semibold hover:bg-zinc-900">{label}<ArrowRight className="h-4 w-4" /></Link>)}
            </div>
          </div>
        </section>

        <section className="border-b py-12 md:py-16">
          <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div><p className="text-sm font-semibold uppercase text-muted-foreground">Price and planning</p><h2 className="mt-2 text-2xl font-bold md:text-3xl">A clear starting point</h2><div className="mt-6 space-y-4 border-t pt-6 text-sm"><p><strong className="block">Starting price</strong><span className="text-muted-foreground">{startingPrice == null ? 'Confirmed from the selected jacket' : `From $${startingPrice.toFixed(2)} based on current products`}</span></p><p><strong className="block">Minimum order</strong><span className="text-muted-foreground">No minimum. Individual and bulk orders are welcome.</span></p><p><strong className="block">Production timing</strong><span className="text-muted-foreground">Confirmed for your approved design, quantity, and destination.</span></p></div></div>
            <div><h2 className="text-2xl font-bold md:text-3xl">{config.guideTitle}</h2><div className="mt-5 space-y-5 leading-7 text-muted-foreground">{config.guide.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="mt-7 flex flex-wrap gap-4"><Link href="/size-guide" className="font-semibold underline underline-offset-4">Check the size guide</Link><Link href="/contact" className="font-semibold underline underline-offset-4">Discuss your design</Link></div></div>
          </div>
        </section>

        <section className="border-b bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4"><h2 className="text-2xl font-bold md:text-3xl">Questions about {config.keyword.toLowerCase()}</h2><div className="mt-7 divide-y border-y">{config.faqs.map((faq) => <details key={faq.question} className="group py-5"><summary className="cursor-pointer list-none font-semibold">{faq.question}</summary><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{faq.answer}</p></details>)}</div></div>
        </section>

        <section className="border-b py-12 md:py-16">
          <div className="container mx-auto px-4"><h2 className="text-2xl font-bold md:text-3xl">Related design guides</h2><div className="mt-7 grid gap-6 border-t pt-7 md:grid-cols-3">{config.guides.map((guide) => <Link key={guide.slug} href={`/blog/${guide.slug}`} className="group border-b pb-5"><span className="text-lg font-semibold group-hover:underline">{guide.title}</span><span className="mt-4 flex items-center gap-1 text-sm font-semibold">Read guide <ArrowRight className="h-4 w-4" /></span></Link>)}</div></div>
        </section>

        <section className="bg-red-800 py-12 text-white md:py-16"><div className="container mx-auto flex flex-col gap-6 px-4 md:flex-row md:items-end md:justify-between"><div><CheckCircle2 className="h-7 w-7" /><h2 className="mt-4 text-2xl font-bold md:text-3xl">Ready to plan your {config.keyword.toLowerCase()}?</h2><p className="mt-3 max-w-2xl text-white/80">Choose a starting jacket or send the team your artwork, quantity, sizes, and destination for a project-specific quote and free mockup.</p></div><Link href="/contact" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-red-900 hover:bg-white/90">Start your project <ArrowRight className="h-4 w-4" /></Link></div></section>
      </main>
      <Footer />
    </div>
  )
}
