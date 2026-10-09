'use client'

import { SizeGuide } from '@/components/size-guide'

export function JacketSizeGuide({ sizes = [], productId }: { sizes?: string[]; productId?: string }) {
  return <SizeGuide categorySlug="jackets" sizeValues={sizes} productId={productId} />
}
