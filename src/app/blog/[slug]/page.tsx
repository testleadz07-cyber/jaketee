'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import DOMPurify from 'isomorphic-dompurify'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingBag, Calendar, User, Eye, Star, Tag } from 'lucide-react'

interface TaggedProduct {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number | null
  thumbnail: string | null
  averageRating?: number
}

interface RelatedPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featuredImage?: string | null
  publishedAt: string
}

interface BlogPostDetail {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage?: string | null
  categories: Array<{ id: string; name: string; slug: string }>
  tags: string[]
  author: { name: string }
  publishedAt: string
  views: number
  taggedProducts: TaggedProduct[]
  relatedPosts: RelatedPost[]
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

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string

  const [post, setPost] = useState<BlogPostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundFlag, setNotFoundFlag] = useState(false)

  useEffect(() => {
    fetchPost()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const fetchPost = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/blog/${slug}`)
      if (!res.ok) {
        setNotFoundFlag(true)
        setPost(null)
        return
      }
      const data = await res.json()
      setPost(data)
    } catch (error) {
      console.error('Error fetching blog post:', error)
      setNotFoundFlag(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    )
  }

  if (notFoundFlag || !post) {
    notFound()
  }

  const sanitizedContent = DOMPurify.sanitize(post.content)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showBack backHref="/blog" />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Breadcrumbs
            items={[
              { label: 'Blog', href: '/blog' },
              { label: post.title },
            ]}
            className="mb-6"
          />

          {/* Hero image */}
          {post.featuredImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted mb-8"
            >
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover"
                priority
              />
            </motion.div>
          )}

          {/* Categories */}
          {post.categories?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((category) => (
                <Link key={category.id} href={`/blog?category=${category.slug}`}>
                  <Badge variant="secondary">{category.name}</Badge>
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author?.name || 'Luxe Store'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {post.views} views
            </span>
          </div>

          <Separator className="mb-8" />

          {/* Content */}
          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-8 pt-8 border-t">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Shop This Post */}
          {post.taggedProducts?.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h2 className="text-2xl font-bold mb-6">Shop This Post</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {post.taggedProducts.map((product) => (
                  <Link key={product.id} href={`/product/${product.slug}`}>
                    <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.3 }} className="h-full">
                      <Card className="h-full overflow-hidden border-2 hover:border-primary transition-colors group cursor-pointer pt-0">
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          <Image
                            src={product.thumbnail || '/placeholder.png'}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          {!!product.averageRating && (
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                              <span className="text-xs text-muted-foreground">
                                {product.averageRating.toFixed(1)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-primary">
                              ${product.price.toFixed(2)}
                            </span>
                            {product.compareAtPrice && (
                              <span className="text-sm text-muted-foreground line-through">
                                ${product.compareAtPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Posts */}
          {post.relatedPosts?.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {post.relatedPosts.map((related) => (
                  <Link key={related.id} href={`/blog/${related.slug}`}>
                    <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.3 }} className="h-full">
                      <Card className="h-full overflow-hidden border-2 hover:border-primary transition-colors group cursor-pointer pt-0">
                        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                          <Image
                            src={related.featuredImage || '/placeholder.png'}
                            alt={related.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                            {related.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {related.excerpt}
                          </p>
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(related.publishedAt)}
                          </span>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
