import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { uploadImage } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size exceeds maximum limit of 5MB' }, { status: 400 })
    }

    const result = await uploadImage(file)
    if (!result) {
      return NextResponse.json(
        { error: 'Image upload not configured. Add Cloudinary env vars.' },
        { status: 503 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
