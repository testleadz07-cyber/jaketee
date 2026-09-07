import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { connectDB } from '../src/lib/mongodb'
import Faq from '../src/models/Faq'

interface SourceFaq {
  _id?: string
  question: string
  answer: string[]
  category: string
  bullets?: string[]
  ordered?: string[]
  image?: { src: string; alt: string }
  order?: number
  displayPages?: string[]
}

function stripBranding(text: string) {
  return text.replace(/Jacketee/g, 'Jacketee').replace(/jacketee/g, 'Jacketee')
}

async function main() {
  const dataPath = path.join(__dirname, 'data', 'faq-import.json')
  if (!fs.existsSync(dataPath)) {
    console.error(`Missing ${dataPath}`)
    process.exit(1)
  }

  const faqs: SourceFaq[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  console.log(`Loaded ${faqs.length} FAQs from ${dataPath}`)

  const db = await connectDB()
  if (!db) {
    console.error('Could not connect to the database.')
    process.exit(1)
  }

  let created = 0
  let updated = 0

  for (const f of faqs) {
    // Source image paths point at Jacketee's own CDN (relative paths that won't
    // resolve on our domain), so drop them rather than ship broken images.
    const isUsableImage = !!f.image?.src && /^https?:\/\//.test(f.image.src)

    const result = await Faq.findOneAndUpdate(
      { question: stripBranding(f.question) },
      {
        $set: {
          question: stripBranding(f.question),
          answer: (f.answer || []).map(stripBranding),
          category: f.category,
          bullets: (f.bullets || []).map(stripBranding),
          ordered: (f.ordered || []).map(stripBranding),
          image: isUsableImage ? f.image : { src: '', alt: '' },
          order: f.order ?? 0,
          displayPages: f.displayPages || [],
        },
      },
      { upsert: true, new: true, rawResult: true }
    )

    if (result.lastErrorObject?.updatedExisting) {
      updated++
    } else {
      created++
    }
  }

  console.log(`\nDone. Created: ${created}, Updated: ${updated}`)
  process.exit(0)
}

main().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
