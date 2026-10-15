'use client'

import Image, { type ImageProps } from 'next/image'
import imageLoader from '@/lib/image-loader'

export default function OptimizedImage(props: ImageProps) {
  const cloudinary = typeof props.src === 'string' && props.src.startsWith('https://res.cloudinary.com/') && props.src.includes('/image/upload/')
  return <Image {...props} alt={props.alt} loader={props.loader || (cloudinary ? imageLoader : undefined)} />
}
