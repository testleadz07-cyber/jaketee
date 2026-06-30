import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { uploadImage } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    // Admins can upload anywhere (product images etc). Signed-in customers may
    // also upload media for their own review submissions.
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mediaType = (formData.get('type') as string | null) || 'image'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (mediaType === 'video') {
      if (!file.type.startsWith('video/')) {
        return NextResponse.json({ error: 'Only video files are allowed' }, { status: 400 })
      }
      if (file.size > 25 * 1024 * 1024) {
        return NextResponse.json({ error: 'Video size exceeds maximum limit of 25MB' }, { status: 400 })
      }
    } else {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image size exceeds maximum limit of 5MB' }, { status: 400 })
      }
    }

    const result = await uploadImage(file, 'luxestore', mediaType === 'video' ? 'video' : 'image')
    if (!result) {
      return NextResponse.json(
        { error: 'Upload not configured. Add Cloudinary env vars.' },
        { status: 503 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
