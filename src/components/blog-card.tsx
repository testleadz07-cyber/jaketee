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
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-colors hover:border-primary/50 sm:rounded-2xl">
      <Link href={`/blog/${article.slug}`} className="grid h-full min-w-0 grid-cols-[6rem_minmax(0,1fr)] items-center gap-3 p-3 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary sm:flex sm:flex-col sm:items-stretch sm:gap-0 sm:p-0">
        {article.featuredImage ? (
          <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-muted sm:aspect-[16/10] sm:h-auto sm:w-full sm:rounded-none">
            <Image src={article.featuredImage} alt="" fill sizes="(max-width: 639px) 96px, (max-width: 1023px) 50vw, 420px" quality={75} className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none" />
          </div>
        ) : (
          <div className="flex h-24 w-24 items-center justify-center gap-2 rounded-lg bg-muted/40 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:h-auto sm:w-full sm:justify-start sm:rounded-none sm:border-b sm:px-5 sm:py-4"><BookOpen aria-hidden="true" className="h-6 w-6 shrink-0 sm:h-4 sm:w-4" /><span className="hidden sm:inline">Jacketee guides</span></div>
        )}
        <div className="flex min-w-0 flex-1 flex-col sm:p-6">
          <div className="mb-1.5 flex min-w-0 flex-col gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:mb-3 sm:flex-row sm:flex-wrap sm:items-center sm:text-xs">
            <span className="truncate font-semibold uppercase tracking-wider text-primary sm:whitespace-normal sm:[overflow-wrap:anywhere]">{article.categories?.[0]?.name || 'Jacketee Journal'}</span>
            {date && <time dateTime={date.toISOString()}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</time>}
          </div>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight transition-colors [overflow-wrap:anywhere] group-hover:text-primary sm:line-clamp-3 sm:text-xl">{article.title}</h3>
          {article.excerpt && <p className="mt-3 hidden text-sm leading-6 text-muted-foreground sm:line-clamp-2">{article.excerpt}</p>}
          <div className="mt-auto hidden pt-6 sm:block"><span className="flex min-h-11 items-center justify-between gap-3 border-t border-border pt-3 text-sm font-semibold">Read the story<span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><ArrowUpRight aria-hidden="true" className="h-4 w-4" /></span></span></div>
        </div>
      </Link>
    </article>
  )
}
