import Link from 'next/link'
import { GARMENT_TEMPLATES, type GarmentCategory } from '@/lib/garment-template'

export function GarmentDesignResources({ category }: { category: GarmentCategory }) {
  const name = GARMENT_TEMPLATES[category].name.toLowerCase()
  const details = category === 'bomber' ? 'Choose a ribbed or stand collar, knit stripes, and an optional utility pocket on the left sleeve.' : category === 'coach' ? 'Choose a point or stand collar, elastic or straight cuffs, and a straight or drawcord hem.' : 'Choose horizontal or chevron quilting, padding weight, and elastic or straight cuffs.'
  const faqs = [
    [`Can I design a ${name} without selecting a product?`, 'Yes. This template designer works without a catalog product. For a specific product, open its product page and use its customization button.'],
    ['What can I customize?', `Choose body and sleeve materials, a shared sleeve color, hood, closure, pockets, lining, and size. ${details} Add text or artwork to the front, back, and both sleeves.`],
    ['What does my custom jacket cost?', 'The cotton fleece base is $55 USD. Other materials add $10 once per jacket, a hood adds $5, and a zipper adds $2. Text and artwork fees appear in the total. Shipping is calculated at checkout. Padding weight and construction options currently have no additional charge.'],
    ['Can I save or download the design?', 'Save design keeps a draft in this browser on this device. Download design exports a JSON file containing the configuration and four previews. Importing that file is not currently supported.'],
    ['Can I upload artwork?', 'Upload a PNG, JPG, or WebP image under 5 MB, or use the artwork library. Review all four views before ordering.'],
    ['How do I choose my size?', 'Open the Size section and use the size guide. Contact us for help with fit or materials. Textures and padding are illustrative previews.'],
  ]
  const schema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) }
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <section className="mt-16 border-t pt-10" aria-labelledby="design-faq-title"><h2 id="design-faq-title" className="text-2xl font-bold">Custom {name} FAQs</h2><div className="mt-6 grid items-start gap-4 md:grid-cols-2">{faqs.map(([question, answer]) => <details key={question} className="rounded-lg border p-4"><summary className="cursor-pointer font-semibold">{question}</summary><p className="mt-3 text-sm leading-7 text-muted-foreground">{answer}</p></details>)}</div></section>
    <section className="my-10" aria-labelledby="design-guide-title"><h2 id="design-guide-title" className="text-2xl font-bold">Plan your custom {name}</h2><p className="mt-4 leading-7 text-muted-foreground">Start with body and sleeve materials, coordinate your colors, and then set the construction details. {details} Add artwork after choosing the garment, and check every view and your size before ordering.</p><div className="mt-5 grid gap-4 sm:grid-cols-3">{[['/blog/custom-jacket-design-guide', 'Custom jacket design guide'], ['/materials-colors', 'Materials and colors'], ['/patches-embroidery', 'Patches and embroidery']].map(([href, label]) => <Link key={href} href={href} className="rounded-lg border p-5 font-semibold underline underline-offset-4 hover:bg-muted">{label}</Link>)}</div><p className="mt-5 text-sm"><Link href="/size-guide" className="underline">Check sizing</Link> · <Link href="/contact" className="underline">Get help</Link> · <Link href="/shop" className="underline">Customize a catalog product</Link></p><nav aria-label="Other jacket designers" className="mt-6 flex flex-wrap gap-4">{['varsity', 'bomber', 'coach', 'puffer'].filter(item => item !== category).map(item => <Link key={item} href={`/design/${item}`} className="font-medium underline">Design a {item} jacket</Link>)}</nav></section>
  </>
}
