import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/cloudinary'
import { boundedFormData, RequestBodyTooLarge } from '@/lib/request-body'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })

  try {
    const formData = await boundedFormData(request, 6 * 1024 * 1024)
    const file = formData.get('file')
    if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type) || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Choose a PNG, JPG, or WebP image under 5 MB.' }, { status: 400 })
    }
    const result = await uploadImage(file, 'jacketee/customizations', 'image')
    if (!result?.url) {
      return NextResponse.json({ error: 'Artwork uploads are not configured.' }, { status: 503 })
    }
    return NextResponse.json({ url: result.url })
  } catch (error) {
    if (error instanceof RequestBodyTooLarge) return NextResponse.json({ error: 'Artwork upload is too large' }, { status: 413 })
    console.error('Customization artwork upload failed:', error)
    return NextResponse.json({ error: 'Artwork upload failed.' }, { status: 500 })
  }
}
