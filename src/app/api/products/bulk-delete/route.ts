import { requireAdminApi } from '@/lib/require-admin'
import { invalidateHomeCache } from '@/lib/home-cache'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi()
    if (auth.response) return auth.response

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Product IDs are required' }, { status: 400 })
    }

    const result = await Product.deleteMany({ _id: { $in: ids } })
    await invalidateHomeCache('catalog')

    return NextResponse.json({
      message: 'Products deleted successfully',
      deletedCount: result.deletedCount,
    })
  } catch (error: any) {
    console.error('Bulk delete API error:', error)
    return NextResponse.json({ error: 'Failed to delete products' }, { status: 500 })
  }
}
