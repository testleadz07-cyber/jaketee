import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Faq from '@/models/Faq'

async function isAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') return null
  return session
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function splitLines(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean)
  if (typeof value !== 'string') return []
  return value
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean)
}

function normalizeDisplayPages(value: unknown) {
  return splitLines(value).map((page) => {
    const trimmed = page.trim()
    if (!trimmed) return ''
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }).filter(Boolean)
}

function mapFaq(faq: any) {
  return {
    id: String(faq._id),
    question: faq.question,
    answer: faq.answer || [],
    category: faq.category,
    bullets: faq.bullets || [],
    ordered: faq.ordered || [],
    image: faq.image || { src: '', alt: '' },
    order: faq.order ?? 0,
    displayPages: faq.displayPages || [],
    createdAt: faq.createdAt,
    updatedAt: faq.updatedAt,
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await isAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
    const search = searchParams.get('search')?.trim()
    const category = searchParams.get('category')?.trim()
    const displayPage = searchParams.get('displayPage')?.trim()

    const query: Record<string, any> = {}
    if (search) {
      const escaped = escapeRegex(search)
      query.$or = [
        { question: { $regex: escaped, $options: 'i' } },
        { answer: { $regex: escaped, $options: 'i' } },
        { bullets: { $regex: escaped, $options: 'i' } },
        { ordered: { $regex: escaped, $options: 'i' } },
        { category: { $regex: escaped, $options: 'i' } },
        { displayPages: { $regex: escaped, $options: 'i' } },
      ]
    }
    if (category && category !== 'all') query.category = category
    if (displayPage && displayPage !== 'all') query.displayPages = displayPage

    const total = await Faq.countDocuments(query)
    const faqs = await Faq.find(query)
      .sort({ category: 1, order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const [categories, displayPages] = await Promise.all([
      Faq.distinct('category'),
      Faq.distinct('displayPages'),
    ])

    return NextResponse.json({
      faqs: faqs.map(mapFaq),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      categories: categories.filter(Boolean).sort(),
      displayPages: displayPages.filter(Boolean).sort(),
    })
  } catch (error) {
    console.error('Admin FAQs fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await isAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const body = await request.json()
    const question = typeof body.question === 'string' ? body.question.trim() : ''
    const category = typeof body.category === 'string' ? body.category.trim() : ''
    const answer = splitLines(body.answer)

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }
    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }
    if (answer.length === 0) {
      return NextResponse.json({ error: 'At least one answer paragraph is required' }, { status: 400 })
    }

    const existing = await Faq.findOne({ question })
    if (existing) {
      return NextResponse.json({ error: 'An FAQ with this question already exists' }, { status: 409 })
    }

    const faq = await Faq.create({
      question,
      answer,
      category,
      bullets: splitLines(body.bullets),
      ordered: splitLines(body.ordered),
      image: {
        src: typeof body.image?.src === 'string' ? body.image.src.trim() : '',
        alt: typeof body.image?.alt === 'string' ? body.image.alt.trim() : '',
      },
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
      displayPages: normalizeDisplayPages(body.displayPages),
    })

    return NextResponse.json(mapFaq(faq), { status: 201 })
  } catch (error) {
    console.error('Admin FAQ create error:', error)
    return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await isAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const body = await request.json()
    const id = typeof body.id === 'string' ? body.id : ''
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid FAQ id' }, { status: 400 })
    }

    const question = typeof body.question === 'string' ? body.question.trim() : ''
    const category = typeof body.category === 'string' ? body.category.trim() : ''
    const answer = splitLines(body.answer)

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }
    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }
    if (answer.length === 0) {
      return NextResponse.json({ error: 'At least one answer paragraph is required' }, { status: 400 })
    }

    const existing = await Faq.findOne({ question, _id: { $ne: id } })
    if (existing) {
      return NextResponse.json({ error: 'Another FAQ already uses this question' }, { status: 409 })
    }

    const faq = await Faq.findByIdAndUpdate(
      id,
      {
        question,
        answer,
        category,
        bullets: splitLines(body.bullets),
        ordered: splitLines(body.ordered),
        image: {
          src: typeof body.image?.src === 'string' ? body.image.src.trim() : '',
          alt: typeof body.image?.alt === 'string' ? body.image.alt.trim() : '',
        },
        order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
        displayPages: normalizeDisplayPages(body.displayPages),
      },
      { returnDocument: 'after', runValidators: true }
    )

    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 })
    }

    return NextResponse.json(mapFaq(faq))
  } catch (error) {
    console.error('Admin FAQ update error:', error)
    return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await isAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || ''
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid FAQ id' }, { status: 400 })
    }

    const faq = await Faq.findByIdAndDelete(id)
    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin FAQ delete error:', error)
    return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 })
  }
}
