import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/cloudinary'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(`custom-artwork:${getClientIp(request)}`, 10, 60 * 60 * 1000)
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many artwork uploads. Please try again later.' }, { status: 429, headers: rateLimitHeaders(limit) })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type) || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Choose a PNG, JPG, or WebP image under 5 MB.' }, { status: 400, headers: rateLimitHeaders(limit) })
    }
    const result = await uploadImage(file, 'jacketee/customizations', 'image')
    if (!result?.url) {
      return NextResponse.json({ error: 'Artwork uploads are not configured.' }, { status: 503, headers: rateLimitHeaders(limit) })
    }
    return NextResponse.json({ url: result.url }, { headers: rateLimitHeaders(limit) })
  } catch (error) {
    console.error('Customization artwork upload failed:', error)
    return NextResponse.json({ error: 'Artwork upload failed.' }, { status: 500, headers: rateLimitHeaders(limit) })
  }
}
