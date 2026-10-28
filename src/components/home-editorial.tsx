import Link from 'next/link'
import Image from '@/components/optimized-image'
import { ArrowRight, Star } from 'lucide-react'
import { BlogCard } from '@/components/blog-card'
import { getHomeArticles, getHomeReviews } from '@/lib/home-editorial'

export async function HomeReviews() {
  let reviewHighlights: Awaited<ReturnType<typeof getHomeReviews>>
  try { reviewHighlights = await getHomeReviews() } catch { return null }
  return <>        {reviewHighlights.length > 0 && (
          <section className="store-section store-section--contrast">
            <div className="section-shell">
              <h2 className="text-2xl font-bold md:text-3xl">From Jacketee customers</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                Read approved reviews from people who ordered Jacketee products.
              </p>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {reviewHighlights.map((review) => (
                  <Link key={review.id} href={review.productHref} className="group block border-t border-white/25 pt-5">
                    {review.image && (
                      <div className="relative mb-5 aspect-[4/3] overflow-hidden bg-muted">
                        <Image src={review.image} alt={`Customer photo of ${review.productName}`} fill sizes="(max-width: 768px) 100vw, 33vw" quality={70} className="object-cover" />
                      </div>
                    )}
                    <div className="flex gap-0.5 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
                    </div>
                    <p className="mt-3 line-clamp-4 text-sm leading-6">{review.comment}</p>
                    <p className="mt-4 text-sm font-semibold">{review.name}</p>
                    <p className="mt-1 text-xs text-white/65 group-hover:underline">{review.productName}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}</>
}

export async function HomeArticles() {
  let articles: Awaited<ReturnType<typeof getHomeArticles>>
  try { articles = await getHomeArticles() } catch { return null }
  return <>        {articles.length > 0 && (
          <section className="store-section store-section--plain">
            <div className="section-shell">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase text-primary">Jacketee Journal</p>
                  <h2 className="mt-2 text-2xl font-bold md:text-3xl">The stories behind your next jacket</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Fresh ideas, practical guides, and the details that make a jacket yours.
                  </p>
                </div>
                <Link href="/blog" className="inline-flex items-center text-sm font-semibold hover:underline">
                  View all articles <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map(article => <BlogCard key={article.id} article={article} />)}
              </div>
            </div>
          </section>
        )}</>
}
