import { NextResponse } from 'next/server'
import { getCollectionSupport, MissingCollection } from '@/lib/collection-support-data'

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const data = await getCollectionSupport(slug, new URL(request.url).searchParams.get('articlesOnly') === '1')
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Collection support unavailable', faqs: [], reviewCount: 0, averageRating: 0, reviews: [], articles: [] }, { status: error instanceof MissingCollection ? 404 : 503 })
  }
}
