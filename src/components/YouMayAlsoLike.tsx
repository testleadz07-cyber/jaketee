'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/product-card'
import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

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
    fetchRecommendations()
  }, [currentProductId])

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`/api/products/${currentProductId}/recommendations`)
      if (res.ok) {
        const data = await res.json()
        setRecommendations(data.youMayAlsoLike || [])
      }
    } catch (error) {
      console.error('Error fetching recommendations carousel:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || recommendations.length === 0) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        <h3 className="text-xl font-bold tracking-tight">You May Also Like</h3>
      </div>

      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {recommendations.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
