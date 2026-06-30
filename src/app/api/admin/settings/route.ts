import { NextResponse } from 'next/server'
import StoreSettings from '@/models/StoreSettings'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'

// Helper to ensure DB is connected
async function ensureDB() {
  if ((await import('mongoose')).default.connection.readyState === 0) {
    await connectDB()
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await ensureDB()
    let settings = await StoreSettings.findOne()
    if (!settings) {
      settings = await StoreSettings.create({})
    }
    return NextResponse.json({ lowStockThreshold: settings.lowStockThreshold })
  } catch (error) {
    console.error('GET /api/admin/settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await ensureDB()
    const { lowStockThreshold } = await request.json()
    const parsed = Number(lowStockThreshold)
    if (isNaN(parsed) || parsed < 0) {
      return NextResponse.json({ error: 'Invalid lowStockThreshold' }, { status: 400 })
    }
    let settings = await StoreSettings.findOne()
    if (!settings) {
      settings = await StoreSettings.create({ lowStockThreshold: parsed })
    } else {
      settings.lowStockThreshold = parsed
      await settings.save()
    }
    return NextResponse.json({ lowStockThreshold: settings.lowStockThreshold })
  } catch (error) {
    console.error('PUT /api/admin/settings error:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
