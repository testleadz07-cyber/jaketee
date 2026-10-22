"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { BlogCard, type BlogCardArticle } from '@/components/blog-card'
import { FaqText } from '@/components/faq-text'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export interface CollectionSupportData {
  reviewCount: number; averageRating: number;
  reviews: Array<{ id: string; rating: number; title: string; comment: string; userName: string; productName: string; productHref: string }>;
  faqs: Array<{ id: string; question: string; answer: string[]; bullets: string[]; ordered: string[]; href?: string }>;
  articles?: BlogCardArticle[];
}
export function CollectionSupport({ slug, name, initialData }: { slug: string; name: string; initialData?: CollectionSupportData }) {
  const [data, setData] = useState<CollectionSupportData | undefined>(initialData)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/category-insights/${encodeURIComponent(slug)}`, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Collection information unavailable')
      return response.json()
    }).then(next => { if (!controller.signal.aborted) setData(initialData ? { ...initialData, articles: next.articles } : next) }).catch(() => {})
    return () => controller.abort()
  }, [slug, initialData])
  if (!data) return null
  return <>
    {data.reviews.length > 0 && <section className="store-section store-section--plain" aria-labelledby="collection-reviews-title"><div className="section-shell">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-5"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Customer feedback</p><h2 id="collection-reviews-title" className="mt-2 text-2xl font-semibold">{slug === 'all' ? 'What customers say' : `Reviews of ${name}`}</h2></div><p className="flex items-center gap-2 text-sm"><Star aria-hidden="true" className="h-4 w-4 fill-amber-500 text-amber-500" /><strong>{data.averageRating.toFixed(1)} / 5</strong><span className="text-muted-foreground">from {data.reviewCount} approved {data.reviewCount === 1 ? 'review' : 'reviews'}</span></p></div>
      <div className="grid gap-5 pt-6 md:grid-cols-3">{data.reviews.map(review => <blockquote key={review.id} className="flex flex-col rounded-xl border bg-card p-5"><div className="flex gap-1" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} aria-hidden="true" className={`h-4 w-4 ${index < review.rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30'}`} />)}</div>{review.title && <p className="mt-3 font-semibold">{review.title}</p>}<p className="mt-3 line-clamp-5 text-sm leading-6 text-muted-foreground">{review.comment}</p><footer className="mt-auto pt-4 text-sm"><p className="font-medium">{review.userName}</p><Link href={review.productHref} className="mt-2 block underline underline-offset-4">{review.productName}</Link></footer></blockquote>)}</div>
    </div></section>}
    {Boolean(data.articles?.length) && <section className="store-section store-section--soft" aria-labelledby="collection-articles-title"><div className="section-shell"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Helpful reading</p><h2 id="collection-articles-title" className="mt-2 text-2xl font-semibold">{slug === 'all' ? 'Jacket guides & inspiration' : `${name}: guides & inspiration`}</h2></div><Link href="/blog" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Visit the journal</Link></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{data.articles?.map(article => <BlogCard key={article.slug} article={article} />)}</div></div></section>}
    {data.faqs.length > 0 && <section className="store-section store-section--plain" aria-labelledby="collection-faq-title"><div className="section-shell"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Before you order</p><h2 id="collection-faq-title" className="mt-2 text-2xl font-semibold">{slug === 'all' ? 'Shopping questions, answered' : `Questions about ${name}`}</h2></div><Link href="/contact" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Ask our team</Link></div><Accordion type="single" collapsible className="max-w-4xl">{data.faqs.map(faq => <AccordionItem key={faq.id} value={faq.id}><AccordionTrigger className="text-left">{faq.question}</AccordionTrigger><AccordionContent className="space-y-3 text-sm leading-6 text-muted-foreground">{faq.answer.map((text, i) => <p key={i}><FaqText text={text} /></p>)}{faq.bullets.length > 0 && <ul className="list-disc space-y-1 pl-5">{faq.bullets.map((text, i) => <li key={i}><FaqText text={text} /></li>)}</ul>}{faq.ordered.length > 0 && <ol className="list-decimal space-y-1 pl-5">{faq.ordered.map((text, i) => <li key={i}><FaqText text={text} /></li>)}</ol>}{faq.href && <Link href={faq.href} className="inline-flex min-h-11 items-center font-semibold text-foreground underline underline-offset-4">Read more</Link>}</AccordionContent></AccordionItem>)}</Accordion></div></section>}
  </>
}
