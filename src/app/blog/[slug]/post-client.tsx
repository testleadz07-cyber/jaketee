'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowRight, Calendar, User, Eye, Star, Tag } from 'lucide-react'

interface TaggedProduct {
  id: string
  name: string
  slug: string
  href: string
  price: number
  compareAtPrice?: number | null
  compareAtPriceVerified?: boolean
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

export interface BlogPostDetail {
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
  updatedAt: string
  views: number
  taggedProducts: TaggedProduct[]
  relatedPosts: RelatedPost[]
  recommendedShop: { href: string; label: string }
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

export default function BlogPostPage({ post }: { post: BlogPostDetail }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

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
            <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-lg border bg-muted">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Categories */}
          {post.categories?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((category) => (
                <Link key={category.id} href={`/blog/category/${category.slug}`}>
                  <Badge variant="secondary">{category.name}</Badge>
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

          {post.excerpt?.trim() && (
            <section aria-labelledby="blog-summary-heading" className="mb-6 rounded-lg border bg-muted/30 p-5">
              <h2 id="blog-summary-heading" className="mb-2 text-lg font-semibold">Summary</h2>
              <p className="text-base leading-7 text-muted-foreground">{post.excerpt}</p>
            </section>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author?.name || 'Jacketee'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
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
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <section className="mt-10 border-y py-7" aria-labelledby="blog-resources-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase text-muted-foreground">Continue planning</p>
                <h2 id="blog-resources-heading" className="mt-1 text-2xl font-semibold">Jacket guides and support</h2>
              </div>
              <Link href={post.recommendedShop.href} className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">
                Shop {post.recommendedShop.label.toLowerCase()} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['/materials-colors', 'Materials & colors', 'Compare fabrics, finishes, and color choices.'],
                ['/patches-embroidery', 'Patches & embroidery', 'Plan lettering, logos, and artwork placement.'],
                ['/size-guide', 'Size guide', 'Measure carefully before choosing a jacket size.'],
                ['/about', 'About Jacketee', 'Learn about our factory and production approach.'],
                ['/faq', 'Ordering FAQs', 'Review common customization and order questions.'],
                ['/contact', 'Contact our team', 'Ask about a design, product, or order requirement.'],
              ].map(([href, label, description]) => (
                <Link key={href} href={href} className="group min-h-28 bg-background p-4 hover:bg-muted/40">
                  <span className="flex items-center justify-between font-semibold">{label}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
                  <span className="mt-2 block text-sm leading-6 text-muted-foreground">{description}</span>
                </Link>
              ))}
            </div>
          </section>

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
            <section className="store-section store-section--soft store-section--accent mt-12 rounded-lg border">
              <div className="p-5 md:p-7">
              <h2 className="text-2xl font-bold mb-6">Shop This Post</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {post.taggedProducts.map((product) => (
                  <Link key={product.id} href={product.href}>
                    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="h-full">
                      <Card className="h-full overflow-hidden border hover:border-primary/60 transition-colors group cursor-pointer pt-0 shadow-sm">
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          <Image
                            src={product.thumbnail || '/placeholder.png'}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="media-zoom object-cover"
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
                            {product.compareAtPriceVerified && product.compareAtPrice && product.compareAtPrice > product.price && (
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
            </section>
          )}

          {/* Related Posts */}
          {post.relatedPosts?.length > 0 && (
            <section className="store-section store-section--plain mt-12 rounded-lg border">
              <div className="p-5 md:p-7">
              <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {post.relatedPosts.map((related) => (
                  <Link key={related.id} href={`/blog/${related.slug}`}>
                    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="h-full">
                      <Card className="h-full overflow-hidden border hover:border-primary/60 transition-colors group cursor-pointer pt-0 shadow-sm">
                        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                          <Image
                            src={related.featuredImage || '/placeholder.png'}
                            alt={related.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="media-zoom object-cover"
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
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
