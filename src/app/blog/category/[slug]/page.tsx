'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
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
import { Newspaper, Calendar, User } from 'lucide-react'
import { notFound } from 'next/navigation'

interface BlogPostSummary {
  id: string
  title: string
  slug: string
  excerpt: string
  featuredImage?: string | null
  categories: Array<{ id: string; name: string; slug: string }>
  author: { name: string }
  publishedAt: string
}

interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
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

export default function BlogCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [category, setCategory] = useState<BlogCategory | null>(null)
  const [categoryLoaded, setCategoryLoaded] = useState(false)
  const [posts, setPosts] = useState<BlogPostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await fetch('/api/admin/blog-categories')
        const data = await res.json()
        const match = Array.isArray(data) ? data.find((c: any) => c.slug === slug) : null
        setCategory(match || null)
      } catch (error) {
        console.error('Error fetching blog category:', error)
        setCategory(null)
      } finally {
        setCategoryLoaded(true)
      }
    }
    fetchCategory()
  }, [slug])

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('category', slug)

      const res = await fetch(`/api/blog?${params.toString()}`)
      const data = await res.json()
      setPosts(Array.isArray(data.posts) ? data.posts : [])
      setPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [page, slug])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > pages) return
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (categoryLoaded && !category) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-background py-16 md:py-20">
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Breadcrumbs
              className="justify-center mb-6"
              items={[{ label: 'Blog', href: '/blog' }, { label: category?.name || '' }]}
            />
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
              <Newspaper className="h-4 w-4" />
              The Luxe Journal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              {category?.name || 'Loading…'}
            </h1>
            {category?.description && (
              <p className="text-lg text-muted-foreground">{category.description}</p>
            )}
          </motion.div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No posts in this category yet</h3>
            <p className="text-muted-foreground">
              Check back later, or browse <Link href="/blog" className="underline">all posts</Link>.
            </p>
          </div>
        ) : (
          <>
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.3 }} className="h-full">
                      <Card className="h-full overflow-hidden border-2 hover:border-primary transition-colors group cursor-pointer pt-0">
                        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                          <Image
                            src={post.featuredImage || '/placeholder.png'}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          {post.categories?.[0] && (
                            <Badge className="absolute top-3 left-3 z-10" variant="secondary">
                              {post.categories[0].name}
                            </Badge>
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
            </motion.div>

            {pages > 1 && (
              <div className="mt-10">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          goToPage(page - 1)
                        }}
                        className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {[...Array(pages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          isActive={page === i + 1}
                          onClick={(e) => {
                            e.preventDefault()
                            goToPage(i + 1)
                          }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          goToPage(page + 1)
                        }}
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
