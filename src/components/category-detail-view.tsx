'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ProductCard } from '@/components/product-card'
import { Badge } from '@/components/ui/badge'
import { resolveAncestorChain, buildCategoryUrl } from '@/lib/categories'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string | null
  _count?: { products: number }
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number | null
  images: Array<{ url: string; alt: string }>
  category: { name: string; slug: string }
  categoryPath?: Array<{ name: string; slug: string }>
  isFeatured: boolean
  inStock: boolean
}

interface CategoryDetailViewProps {
  slug: string
}

export function CategoryDetailView({ slug }: CategoryDetailViewProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isMissing, setIsMissing] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const catRes = await fetch('/api/categories')
        const catData: Category[] = await catRes.json()
        if (cancelled) return
        setCategories(catData)

        const current = catData.find((c) => c.slug === slug)
        if (!current) {
          setIsMissing(true)
          return
        }

        const prodRes = await fetch(`/api/products?category=${slug}`)
        const prodData = await prodRes.json()
        if (cancelled) return
        setProducts(prodData)
      } catch (error) {
        console.error('Error loading category page:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (isMissing) {
    notFound()
  }

  const category = categories.find((c) => c.slug === slug)
  if (!category) return null

  const chainInput = categories.map((c) => ({ ...c, _id: c.id }))
  const ancestorChain = resolveAncestorChain(chainInput, category.id)
  const subcategories = categories.filter((c) => c.parentId === category.id)

  const breadcrumbItems = [
    ...ancestorChain.slice(0, -1).map((ancestor, index) => ({
      label: ancestor.name,
      href: buildCategoryUrl(ancestorChain.slice(0, index + 1)),
    })),
    { label: category.name },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <section className="container mx-auto px-4 py-8 flex-1">
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground max-w-2xl">{category.description}</p>
          )}
        </div>

        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {subcategories.map((sub) => (
              <Link key={sub.id} href={buildCategoryUrl([...ancestorChain, sub])}>
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-sm hover:border-primary cursor-pointer"
                >
                  {sub.name} ({sub._count?.products || 0})
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border rounded-xl border-dashed">
            <p className="text-muted-foreground">No products found in this category yet.</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
