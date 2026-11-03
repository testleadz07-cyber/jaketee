'use client'

import { SizeGuide } from '@/components/size-guide'

export function JacketSizeGuide({ sizes = [], productId, productName }: { sizes?: string[]; productId?: string; productName?: string }) {
  return <SizeGuide categorySlug="jackets" sizeValues={sizes} productId={productId} productName={productName} />
}
