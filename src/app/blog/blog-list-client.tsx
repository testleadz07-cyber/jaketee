'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Newspaper, Filter, Calendar, User } from 'lucide-react'

export interface BlogPostSummary {
  id: string
  title: string
  slug: string
  excerpt: string
  featuredImage?: string | null
  categories: Array<{ id: string; name: string; slug: string }>
  tags?: string[]
  author: { name: string }
  publishedAt: string
  views: number
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

export default function BlogListPage({ posts, categories, page, pages, total }: {
  posts: BlogPostSummary[]
  categories: BlogCategory[]
  page: number
  pages: number
  total: number
}) {

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="store-section store-section--soft store-section--accent">
        <div className="section-shell">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
              <Newspaper className="h-4 w-4" />
              Jacketee Journal
            </div>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Jacketee Journal</h1>
            <p className="text-lg text-muted-foreground">
              Style guides, product stories, and ideas curated by our team.
            </p>
          </div>
        </div>
      </section>

      {/* Category filters */}
      <section className="border-b bg-background/50 backdrop-blur sticky top-[73px] z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground mr-2" />
            <Badge variant="default" className="cursor-default">
              All Posts
            </Badge>
            {categories.map((category) => (
              <Link key={category.id} href={`/blog/category/${category.slug}`}>
                <Badge variant="outline" className="cursor-pointer transition-all hover:scale-105">
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <main className="section-shell flex-1">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No posts found</h3>
            <p className="text-muted-foreground">Try a different category or check back later.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="h-full">
                      <Card className="h-full overflow-hidden border hover:border-primary/60 transition-colors group cursor-pointer pt-0 shadow-sm">
                        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                          <Image
                            src={post.featuredImage || '/placeholder.png'}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="media-zoom object-cover"
                          />
                          {post.categories?.[0] && (
                            <span className="absolute top-3 left-3 z-10">
                              <Badge variant="secondary">{post.categories[0].name}</Badge>
                            </span>
                          )}
                        </div>
                        <CardContent className="p-5">
                          <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {post.author?.name || 'Jacketee'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(post.publishedAt)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {pages > 1 && (
              <div className="mt-10">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={page > 1 ? `/blog?page=${page - 1}` : '/blog'}
                        className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {[...Array(pages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href={i === 0 ? '/blog' : `/blog?page=${i + 1}`}
                          isActive={page === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href={page < pages ? `/blog?page=${page + 1}` : `/blog?page=${pages}`}
                        className={page >= pages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
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
