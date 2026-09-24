import { permanentRedirect, notFound } from 'next/navigation'
import { resolveSlugPath } from '@/lib/route-resolver'
import { buildCategoryUrl } from '@/lib/categories'

function parsePageParam(page?: string | string[]) {
  const value = Array.isArray(page) ? page[0] : page
  const parsed = Number.parseInt(value || '1', 10)
  return Number.isFinite(parsed) && parsed > 1 ? parsed : 1
}

export default async function LegacyCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const resolution = await resolveSlugPath([slug])

  if (resolution.type === 'redirect') {
    permanentRedirect(resolution.to)
  }
  if (resolution.type === 'category') {
    const page = parsePageParam(query.page)
    const canonicalPath = buildCategoryUrl(resolution.ancestorChain)
    permanentRedirect(page > 1 ? `${canonicalPath}?page=${page}` : canonicalPath)
  }

  notFound()
}
