'use client'

import { motion } from 'framer-motion'
import { History } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { productGridClassName } from '@/lib/product-grid'
import { useRecentlyViewedStore } from '@/store/recently-viewed'

interface RecentlyViewedProps {
  excludeProductId?: string
  limit?: number
  sectionClassName?: string
}

export function RecentlyViewed({ excludeProductId, limit = 4, sectionClassName }: RecentlyViewedProps) {
  const items = useRecentlyViewedStore((state) => state.items)

  const products = items
    .filter((item) => item.id !== excludeProductId)
    .slice(0, limit)

  if (products.length === 0) return null

  const content = (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h3 className="text-2xl font-bold tracking-tight md:text-3xl">Recently Viewed</h3>
      </div>

      <motion.div
        layout
        className={productGridClassName}
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            className="h-full min-w-0"
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

  if (!sectionClassName) return content

  return (
    <section className={sectionClassName}>
      <div className="section-shell">{content}</div>
    </section>
  )
}
