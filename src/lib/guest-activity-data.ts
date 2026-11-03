import 'server-only'
import { ACTIVITY_COLUMNS, type ActivityColumn } from '@/lib/guest-activity-columns'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { buildProductUrl, resolveAncestorChain } from '@/lib/categories'
import GuestActivity from '@/models/GuestActivity'
import { connectDB } from '@/lib/mongodb'
import { guestActivityQuery, type GuestActivityFilters, type GuestActivityListData } from '@/lib/guest-activity-list'

// Callers must authorize before entering this helper. No global cache of
// private activity data; filter options are omitted on ordinary pagination.
export async function readGuestActivity(filters: GuestActivityFilters, includeOptions = true, columns: ActivityColumn[] = ACTIVITY_COLUMNS.map(column => column.id)): Promise<GuestActivityListData> {
  if (!await connectDB()) throw new Error('Database unavailable')
  const query = guestActivityQuery(filters)
  const total = await GuestActivity.countDocuments(query).maxTimeMS(5000)
  const pages = Math.max(1, Math.ceil(total / filters.limit))
  const page = Math.min(filters.page, pages)
  const projection = ['_id', 'guestId', 'action', 'createdAt', ...columns.filter(column => ['details', 'country', 'region', 'city', 'ip', 'userAgent'].includes(column)), ...(columns.includes('device') ? ['userAgent'] : [])].join(' ')
  const activities = await GuestActivity.find(query).select(projection).sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * filters.limit).limit(filters.limit).maxTimeMS(5000).lean()
  // One bounded lookup for the current page, never one query per activity.
  const productIds = [...new Set((columns.includes('details') ? activities : []).map((row: any) => row.details?.productId)
    .filter((id: unknown): id is string => typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id)))]
  const products = productIds.length ? await Product.find({ _id: { $in: productIds } })
    .select('_id name slug categoryId').limit(filters.limit).maxTimeMS(5000).lean() : []
  // Resolve category ancestors once for the whole page, using storefront URL rules.
  const categories = products.some((product: any) => product.categoryId)
    ? await Category.find({}).select('_id slug parentId').maxTimeMS(5000).lean() : []
  const categoryNodes = categories.map((category: any) => ({
    _id: String(category._id), slug: category.slug, parentId: category.parentId ? String(category.parentId) : null,
  }))
  const productLinks = new Map(products.flatMap((product: any) => {
    if (!product.slug) return []
    const categoryPath = product.categoryId ? resolveAncestorChain(categoryNodes, String(product.categoryId)) : []
    // Missing category data should not manufacture a misleading /products link.
    if (product.categoryId && (!categoryPath.length || categoryPath[0].parentId)) return []
    return [[String(product._id), buildProductUrl({ slug: product.slug, categoryPath })] as const]
  }))
  const productMap = new Map(products.map((product: any) => [String(product._id), product]))
  let actions: string[] = [], countries: string[] = []
  if (includeOptions) {
    const values = await Promise.all([
      GuestActivity.distinct('action').maxTimeMS(5000), GuestActivity.distinct('country').maxTimeMS(5000),
    ])
    actions = values[0].filter((value): value is string => typeof value === 'string' && Boolean(value.trim())).sort()
    countries = values[1].filter((value): value is string => typeof value === 'string' && Boolean(value.trim())).sort((a, b) => a.localeCompare(b))
  }
  return { total, page, pages, actions, countries, loadedColumns: [...new Set(['time', 'id', 'guestId', 'action', 'graphs', ...columns, ...(columns.includes('device') ? ['userAgent'] : [])])], activities: activities.map((row: any) => {
    const product = productMap.get(String(row.details?.productId))
    return {
    id: String(row._id), guestId: row.guestId, action: row.action,
    createdAt: new Date(row.createdAt).toISOString(),
    details: !columns.includes('details') || row.details == null ? undefined : {
      ...JSON.parse(JSON.stringify(row.details)),
      ...(product && !row.details.productName ? { productName: product.name } : {}),
      ...(productLinks.has(String(row.details?.productId)) ? { productHref: productLinks.get(String(row.details?.productId)) } : {}),
    },
    ip: columns.includes('ip') ? row.ip : undefined,
    userAgent: columns.includes('userAgent') || columns.includes('device') ? row.userAgent : undefined,
    country: columns.includes('country') ? row.country : undefined,
    region: columns.includes('region') ? row.region : undefined, city: columns.includes('city') ? row.city : undefined,
    }
  }) }
}
