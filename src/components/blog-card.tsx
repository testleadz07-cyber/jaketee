import Link from 'next/link'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import Image from '@/components/optimized-image'

export interface BlogCardArticle {
  slug: string
  title: string
  excerpt: string
  featuredImage?: string | null
  publishedAt?: string | null
  categories?: Array<{ name: string }>
}

export function BlogCard({ article }: { article: BlogCardArticle }) {
  const published = article.publishedAt ? new Date(article.publishedAt) : null
  const date = published && !Number.isNaN(published.getTime()) ? published : null
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-colors hover:border-primary/50">
      <Link href={`/blog/${article.slug}`} className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary">
        {article.featuredImage ? (
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            <Image src={article.featuredImage} alt="" fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 420px" quality={75} className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none" />
          </div>
        ) : (
          <div className="flex items-center gap-2 border-b bg-muted/40 px-5 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground"><BookOpen aria-hidden="true" className="h-4 w-4" />Jacketee guides</div>
        )}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-primary">{article.categories?.[0]?.name || 'Jacketee Journal'}</span>
            {date && <time dateTime={date.toISOString()}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</time>}
          </div>
          <h3 className="line-clamp-3 text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary sm:text-xl">{article.title}</h3>
          {article.excerpt && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>}
          <div className="mt-auto pt-6"><span className="flex min-h-11 items-center justify-between gap-3 border-t border-border pt-3 text-sm font-semibold">Read the story<span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><ArrowUpRight aria-hidden="true" className="h-4 w-4" /></span></span></div>
        </div>
      </Link>
    </article>
  )
}
