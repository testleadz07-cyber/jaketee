import type { ImageLoaderProps } from 'next/image'

// Cloudinary negotiates AVIF/WebP from the browser's Accept header.
// Replace existing transformations with a single responsive delivery transform.
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  const match = src.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/)
  if (match) {
    const parts = match[2].split('/')
    let index = 0
    while (index < parts.length - 1 && !/^v\d+$/.test(parts[index]) &&
      /^(?:(?:a|ar|b|bo|c|co|d|dl|dn|dpr|e|f|fl|g|h|if|l|o|q|r|t|u|w|x|y|z)_|\$)/.test(parts[index])) index++
    parts.splice(0, index, `f_auto,q_auto,c_limit,w_${width}`)
    return match[1] + parts.join('/')
  }
  if (src.startsWith('data:') || src.startsWith('blob:') || /\.svg(?:\?|$)/i.test(src)) return src
  // Keep Next's optimizer for local images and other configured remote hosts.
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`
}
