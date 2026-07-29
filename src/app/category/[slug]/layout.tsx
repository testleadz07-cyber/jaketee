import { permanentRedirect, notFound } from 'next/navigation'
import { resolveSlugPath } from '@/lib/route-resolver'
import { buildCategoryUrl } from '@/lib/categories'

// Legacy URL - categories now live at their nested root-level path (e.g.
// /varsity-jackets or /varsity-jackets/wool-leather). Redirect (308) to the
// canonical URL so old links keep working without splitting SEO signal.
export default async function LegacyCategoryLayout({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const resolution = await resolveSlugPath([slug])

  if (resolution.type === 'redirect') {
    permanentRedirect(resolution.to)
  }
  if (resolution.type === 'category') {
    permanentRedirect(buildCategoryUrl(resolution.ancestorChain))
  }

  notFound()
}
