'use client'

import Image from '@/components/optimized-image'
import { BlogCard } from '@/components/blog-card'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Badge } from '@/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Newspaper } from 'lucide-react'

export interface BlogPostSummary {
  id: string
  title: string
  slug: string
  excerpt: string
  featuredImage?: string | null
  categories: Array<{ id: string; name: string; slug: string }>
  author: { name: string }
  publishedAt: string
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
}


export default function BlogCategoryPage({ category, posts, page, pages, total }: {
  category: BlogCategory
  posts: BlogPostSummary[]
  page: number
  pages: number
  total: number
}) {

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <section className="relative overflow-hidden border-b bg-foreground py-16 text-background md:py-20">
        {category.image && (
          <>
            <Image
              src={category.image}
              alt={`${category.name} articles`}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Breadcrumbs
              className="justify-center mb-6"
              items={[{ label: 'Blog', href: '/blog' }, { label: category?.name || '' }]}
            />
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              <Newspaper className="h-4 w-4" />
              Jacketee Journal
            </div>
            <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
              {category?.name || 'Loading…'}
            </h1>
            {category?.description && (
              <p className="text-lg text-white/85">{category.description}</p>
            )}
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No posts in this category yet</h3>
            <p className="text-muted-foreground">
              Check back later, or browse <Link href="/blog" className="underline">all posts</Link>.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => <BlogCard key={post.id} article={post} />)}
            </div>

            {pages > 1 && (
              <div className="mt-10">
                <Pagination>
                  <PaginationContent>
                    {page > 1 && <PaginationItem>
                      <PaginationPrevious
                        href={page === 2 ? `/blog/category/${category.slug}` : `/blog/category/${category.slug}?page=${page - 1}`}
                      />
                    </PaginationItem>}
                    {[...Array(pages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href={i === 0 ? `/blog/category/${category.slug}` : `/blog/category/${category.slug}?page=${i + 1}`}
                          isActive={page === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    {page < pages && <PaginationItem>
                      <PaginationNext
                        href={page < pages ? `/blog/category/${category.slug}?page=${page + 1}` : `/blog/category/${category.slug}?page=${pages}`}
                      />
                    </PaginationItem>}
                  </PaginationContent>
                </Pagination>
                <p className="text-center text-sm text-muted-foreground mt-3">
                  Showing page {page} of {pages} ({total} posts)
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
