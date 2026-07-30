'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import { RecentlyViewed } from '@/components/RecentlyViewed'
import { Footer } from '@/components/footer'
import { Search, Sparkles, ShoppingBag, Filter, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { buildCategoryUrl } from '@/lib/categories'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number | null
  images: Array<{ url: string; alt: string }>
  category: {
    name: string
    slug: string
  }
  isFeatured: boolean
  inStock: boolean
}

interface Category {
  id: string
  name: string
  slug: string
  parentId?: string | null
  _count: {
    products: number
  }
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (typeof window === 'undefined') return 'all'
    return new URLSearchParams(window.location.search).get('category') || 'all'
  })
  const [sortBy, setSortBy] = useState('featured')
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null)
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null)
  const categoryContainerRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!openCategoryId) return
    const handleClickOutside = (e: MouseEvent) => {
      const container = categoryContainerRefs.current[openCategoryId]
      if (container && !container.contains(e.target as Node)) {
        setOpenCategoryId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openCategoryId])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [searchQuery, selectedCategory, sortBy])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)

      if (sortBy === 'price-asc') {
        params.append('sort', 'price')
        params.append('order', 'asc')
      } else if (sortBy === 'price-desc') {
        params.append('sort', 'price')
        params.append('order', 'desc')
      } else if (sortBy === 'name') {
        params.append('sort', 'name')
        params.append('order', 'asc')
      }

      const res = await fetch(`/api/products?${params.toString()}`)
      let data = await res.json()

      if (sortBy === 'featured') {
        data = [...data].sort((a: Product, b: Product) => {
          if (a.isFeatured && !b.isFeatured) return -1
          if (!a.isFeatured && b.isFeatured) return 1
          return 0
        })
      }

      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-background py-16 md:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.8, 0.5, 0.8],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="h-4 w-4" />
              New Collection Available
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Discover Premium Products
            </h1>

            <p className="text-xl text-muted-foreground mb-8">
              Curated selection of the finest electronics, fashion, home goods,
              and more. Quality meets elegance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b bg-background/50 backdrop-blur sticky top-[73px] z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground mr-2" />
              <Badge
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => setSelectedCategory('all')}
              >
                All Products
              </Badge>
              {categories.filter((category) => !category.parentId).map((category) => {
                const subcategories = categories.filter((c) => c.parentId === category.id)
                const isOpen = hoveredCategoryId === category.id || openCategoryId === category.id
                return (
                  <div
                    key={category.id}
                    ref={(el) => { categoryContainerRefs.current[category.id] = el }}
                    className="relative"
                    onMouseEnter={() => setHoveredCategoryId(category.id)}
                    onMouseLeave={() => setHoveredCategoryId(null)}
                  >
                    <div className="flex items-center">
                      <Badge
                        variant={
                          selectedCategory === category.slug ? 'default' : 'outline'
                        }
                        className="cursor-pointer transition-all hover:scale-105"
                        onClick={() => setSelectedCategory(category.slug)}
                      >
                        {category.name} ({category._count.products})
                      </Badge>

                      {subcategories.length > 0 && (
                        <button
                          type="button"
                          aria-label={`Show ${category.name} subcategories`}
                          aria-expanded={isOpen}
                          className="ml-0.5 rounded-full p-1 hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenCategoryId((prev) => (prev === category.id ? null : category.id))
                          }}
                        >
                          <ChevronDown
                            className={`h-3 w-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>

                    {subcategories.length > 0 && isOpen && (
                      <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border bg-popover p-1 shadow-md">
                        {subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            href={buildCategoryUrl([
                              { slug: category.slug },
                              { slug: sub.slug },
                            ])}
                            className="block rounded-md px-3 py-2 text-sm hover:bg-muted whitespace-nowrap"
                            onClick={() => setOpenCategoryId(null)}
                          >
                            {sub.name} ({sub._count.products})
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <div className="container mx-auto px-4 pb-12">
        <RecentlyViewed limit={8} />
      </div>

      <Footer />
    </div>
  )
}