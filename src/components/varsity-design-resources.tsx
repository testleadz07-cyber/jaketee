import Link from 'next/link'

const faqs = [
  ['Do I need to choose a product first?', 'No. Start your varsity jacket here without choosing a catalog product. To customize an existing product, open its product page and select its customization button.'],
  ['What can I customize?', 'Choose body and sleeve materials, colors, sleeve style, collar, hood, closure, pockets, knit stripes, lining, and size. Both sleeves share one color. Add text and artwork to the front, back, and each sleeve.'],
  ['How much does a custom varsity jacket cost?', 'A cotton fleece base jacket costs $55 USD. A material upgrade adds $10 once per jacket, a hood adds $5, and a zipper adds $2. Text and artwork can add fees shown in your total. Shipping is calculated at checkout.'],
  ['Can I save my design?', 'Save design stores your selections and artwork in this browser on this device. Returning here restores your saved design. Download design creates a JSON file with your configuration and four previews. Importing that file is not currently supported.'],
  ['Can I upload my own logo?', 'Yes. Upload a PNG, JPG, or WebP image under 5 MB, or choose artwork from the library. Position it on the preview and check each view before ordering.'],
  ['How do I choose a size?', 'Open the Size section and check the size guide before selecting your size. Contact our team if you need help with fit or materials. Preview textures are illustrative.'],
]

export function VarsityDesignResources() {
  const schema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) }
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <section className="mt-16 border-t pt-10" aria-labelledby="design-faq-title">
      <h2 id="design-faq-title" className="text-2xl font-bold">Custom varsity jacket FAQs</h2>
      <div className="mt-6 grid items-start gap-4 md:grid-cols-2">{faqs.map(([question, answer]) => <details key={question} className="rounded-lg border p-4"><summary className="cursor-pointer font-semibold">{question}</summary><p className="mt-3 text-sm leading-7 text-muted-foreground">{answer}</p></details>)}</div>
    </section>
    <section className="mb-6 mt-10" aria-labelledby="design-guides-title">
      <h2 id="design-guides-title" className="text-2xl font-bold">Plan your custom jacket</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">{[
        ['/blog/custom-varsity-jacket-design-guide', 'How to design your own varsity jacket', 'Plan your colors, materials, sleeve styles, and artwork placement.'],
        ['/materials-colors', 'Compare materials and colors', 'Explore fabric options before choosing your jacket combination.'],
        ['/patches-embroidery', 'Patches and embroidery', 'Learn about artwork options for names, initials, and logos.'],
      ].map(([href, heading, text]) => <Link key={href} href={href} className="rounded-lg border p-5 transition-colors hover:bg-muted/40"><h3 className="font-semibold underline underline-offset-4">{heading}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></Link>)}</div>
      <p className="mt-5 text-sm text-muted-foreground">Need help? <Link href="/how-to-customize" className="underline">Read the customization guide</Link>, <Link href="/size-guide" className="underline">check sizing</Link>, or <Link href="/contact" className="underline">contact us</Link>. Prefer a catalog style? <Link href="/shop" className="underline">Choose a product to customize</Link>.</p>
      <nav aria-label="Other jacket designers" className="mt-6 flex flex-wrap gap-4">{['bomber', 'coach', 'puffer'].map(category => <Link key={category} href={`/design/${category}`} className="font-medium underline">Design a {category} jacket</Link>)}</nav>
    </section>
  </>
}
