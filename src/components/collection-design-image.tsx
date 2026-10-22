"use client"

import { useState } from 'react'
import Image from '@/components/optimized-image'

export function CollectionDesignImage({ urls, alt, priority = false, sizes = '(max-width: 639px) 90vw, 384px', className = 'object-contain p-4' }: { urls: string[]; alt: string; priority?: boolean; sizes?: string; className?: string }) {
  const [index, setIndex] = useState(0)
  const src = urls[index]
  if (!src) return <div className="flex h-full items-center justify-center px-5 text-center text-sm text-zinc-600">Ask our team for images of this collection.</div>
  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={className} onError={() => setIndex(value => value + 1)} />
}
