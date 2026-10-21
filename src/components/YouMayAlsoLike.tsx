import { ProductCard } from '@/components/product-card'
import { productGridClassName } from '@/lib/product-grid'
import { Sparkles } from 'lucide-react'
import type { ComponentProps } from 'react'

type RelatedProduct = ComponentProps<typeof ProductCard>['product']

export function YouMayAlsoLike({ products }: { products: RelatedProduct[] }) {
  if (products.length === 0) return null

  return (
    <section className="store-section store-section--soft store-section--accent" aria-labelledby="related-products-heading">
      <div className="section-shell space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 id="related-products-heading" className="text-2xl font-semibold">You may also like</h2>
        </div>
        <div className={productGridClassName}>
          {products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  )
}
