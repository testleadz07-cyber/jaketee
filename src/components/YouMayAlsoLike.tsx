'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/product-card'
import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number | null
  images: Array<{ url: string; alt: string }>
  category: {
    name: string;
    slug: string;
  }
  isFeatured: boolean
}

interface YouMayAlsoLikeProps {
  currentProduct: {
    id: string
    _id?: string
  }
}

export function YouMayAlsoLike({ currentProduct }: YouMayAlsoLikeProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const currentProductId = currentProduct.id || currentProduct._id || ''

  useEffect(() => {
    let active = true
    fetch(`/api/products/${currentProductId}/recommendations`)
      .then((res) => res.ok ? res.json() : { youMayAlsoLike: [] })
      .then((data) => {
        if (active) setRecommendations(data.youMayAlsoLike || [])
      })
      .catch((error) => console.error('Error fetching recommendations:', error))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [currentProductId])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-semibold">You may also like</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4" aria-label="Loading recommendations">
          {[0, 1, 2, 3].map((index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-md bg-border/60" />)}
        </div>
      ) : recommendations.length > 0 ? (
        <motion.div layout className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
          {recommendations.slice(0, 4).map((product) => (
            <motion.div key={product.id} initial={false} animate={{ opacity: 1 }}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <p className="text-sm text-muted-foreground">More styles are available in the <Link href="/shop" className="font-medium text-foreground underline underline-offset-4">shop</Link>.</p>
      )}
    </div>
  )
}
