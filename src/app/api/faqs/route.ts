import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Faq from '@/models/Faq'

export async function GET() {
  try {
    const db = await connectDB()
    if (!db) {
      return NextResponse.json([])
    }

    const faqs = await Faq.find().sort({ category: 1, order: 1 }).lean()
    const data = faqs.map((f: any) => ({
      id: String(f._id),
      question: f.question,
      answer: f.answer,
      category: f.category,
      bullets: f.bullets || [],
      ordered: f.ordered || [],
      image: f.image,
      order: f.order,
      displayPages: f.displayPages || [],
    }))
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return NextResponse.json([])
  }
}
