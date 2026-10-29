import 'server-only'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getWorkerRequestScope } from './worker-request-scope'
import { invalidateCloudflarePublicTags } from './cloudflare-public-cache'

/** Expire public homepage data after a successful mutation; no private data cached. */
export async function invalidateHomeCache(kind: 'catalog' | 'articles' | 'reviews' | 'images' | 'faqs' = 'catalog') {
  const tags = kind === 'catalog' ? ['homepage', 'homepage-articles', 'homepage-reviews', 'public-products', 'public-catalog', 'public-categories', 'public-support', 'public-blog']
    : kind === 'articles' ? ['homepage-articles', 'public-blog', 'public-support']
    : kind === 'reviews' ? ['homepage-reviews', 'public-support', 'public-products']
    : kind === 'faqs' ? ['public-faq-page', 'public-support']
    : ['homepage-images', 'public-material-images', 'public-patch-images']
  try {
    if (getWorkerRequestScope()) {
      await invalidateCloudflarePublicTags(tags)
      return
    }
    for (const tag of tags) revalidateTag(tag, { expire: 0 })
    revalidatePath('/')
    if (kind === 'catalog') revalidatePath('/bulk-orders', 'layout')
    if (kind === 'faqs') revalidatePath('/faq')
    if (kind === 'faqs' || kind === 'articles') revalidatePath('/size-guide')
    if (kind === 'images') {
      for (const path of ['/materials-colors', '/patches-embroidery', '/how-to-customize']) revalidatePath(path)
    }
  } catch {
    // Cache availability must not turn an already saved mutation into a failure.
    console.error('Homepage cache invalidation unavailable; timed refresh remains enabled')
  }
}
