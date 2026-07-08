'use client'

import { motion } from 'framer-motion'
import { History } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { useRecentlyViewedStore } from '@/store/recently-viewed'

interface RecentlyViewedProps {
  excludeProductId?: string
  limit?: number
}

export function RecentlyViewed({ excludeProductId, limit = 4 }: RecentlyViewedProps) {
  const items = useRecentlyViewedStore((state) => state.items)

  const products = items
    .filter((item) => item.id !== excludeProductId)
    .slice(0, limit)

  if (products.length === 0) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-bold tracking-tight">Recently Viewed</h3>
      </div>

      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {products.map((product, index) => (
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
