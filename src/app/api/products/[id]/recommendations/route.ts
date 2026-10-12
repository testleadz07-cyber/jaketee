import { NextRequest, NextResponse } from 'next/server'
import { getProductRecommendations } from '@/lib/product-recommendations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const recommendations = await getProductRecommendations(id)
  if (!recommendations) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  return NextResponse.json(recommendations)
}
