import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/cloudinary'
import { boundedText, RequestBodyTooLarge } from '@/lib/request-body'
import { JACKET_VIEWS, type JacketView } from '@/types/jacket-customization'

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  try {
    const body = await boundedText(request, 12 * 1024 * 1024)
    if (Buffer.byteLength(body) > 12 * 1024 * 1024) return NextResponse.json({ error: 'Design previews are too large' }, { status: 413 })
    let data
    try { data = JSON.parse(body) } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
    const batch = data?.snapshots
    const entries = batch ?? [{ view: 'front', imageBase64: data?.imageBase64 }]
    if (!Array.isArray(entries) || !entries.length || entries.length > JACKET_VIEWS.length) {
      return NextResponse.json({ error: 'Invalid design previews' }, { status: 400 })
    }
    const seen = new Set<string>()
    const buffers: Array<{ view: JacketView; buffer: Buffer }> = []
    for (const entry of entries) {
      if (!entry || !JACKET_VIEWS.includes(entry.view) || seen.has(entry.view) || typeof entry.imageBase64 !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(entry.imageBase64)) {
        return NextResponse.json({ error: 'Invalid design preview' }, { status: 400 })
      }
      seen.add(entry.view)
      const buffer = Buffer.from(entry.imageBase64.slice('data:image/png;base64,'.length), 'base64')
      if (buffer.length > 2 * 1024 * 1024) return NextResponse.json({ error: 'Design preview is too large' }, { status: 413 })
      if (!buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return NextResponse.json({ error: 'Invalid PNG preview' }, { status: 400 })
      buffers.push({ view: entry.view, buffer })
    }
    const results = await Promise.all(buffers.map(async ({ view, buffer }) => ({ view, result: await uploadImage(buffer, 'jacketee/custom-designs', 'image') })))
    if (results.some(({ result }) => !result)) return NextResponse.json({ error: 'Design previews could not be saved. Please retry.' }, { status: 503 })
    const snapshots = Object.fromEntries(results.map(({ view, result }) => [view, result!.url]))
    return NextResponse.json(batch ? { snapshots } : { url: snapshots.front })
  } catch (error: any) {
    if (error instanceof RequestBodyTooLarge) return NextResponse.json({ error: 'Design previews are too large' }, { status: 413 })
    console.error('Upload Snapshot API error:', error)
    return NextResponse.json({ error: 'Failed to upload snapshot' }, { status: 500 })
  }
}
