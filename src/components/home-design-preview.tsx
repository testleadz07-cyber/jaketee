"use client"

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Palette, Scissors, Eye, Ruler } from 'lucide-react'
import Image from '@/components/optimized-image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

const styles = [
  { key: 'varsity', name: 'Varsity', note: 'A classic, made personal.', description: 'Make the classic letterman yours with your colors, lettering, and patches.' },
  { key: 'bomber', name: 'Bomber', note: 'Everyday style. Your signature.', description: 'Put your signature on a bomber with your colors, name, and logo artwork.' },
  { key: 'puffer', name: 'Puffer', note: 'Stand out in every layer.', description: 'Personalize your puffer with custom colors, embroidery, and your own details.' },
]
const steps = [
  { icon: Palette, title: 'Pick your colors', text: 'Find your combination.' },
  { icon: Scissors, title: 'Add your details', text: 'Names, logos, and patches.' },
  { icon: Eye, title: 'Preview your jacket', text: 'Check your look and size.' },
]

export function HomeDesignPreview({ images }: { images: Record<string, { url: string; alt: string }> }) {
  const [style, setStyle] = useState('varsity')
  const selected = styles.find(item => item.key === style) || styles[0]

  return (
    <section className="store-section store-section--soft" aria-labelledby="custom-design-heading">
      <div className="section-shell">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-9">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your idea. Your signature.</p>
            <h2 id="custom-design-heading" className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">Design your own jacket</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">Start with a silhouette. Make every detail yours.</p>
        </div>

        <Tabs value={style} onValueChange={setStyle} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 xl:gap-16">
          <div className="min-w-0 overflow-hidden rounded-2xl border bg-[#e9e5dd]">
            <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3 sm:px-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#625c52]">The {selected.name} edit</span>
              <span className="rounded-full bg-white/75 px-3 py-1 text-xs text-[#625c52]">Design inspiration</span>
            </div>
            {styles.map(item => (
              <TabsContent key={item.key} value={item.key} className="mt-0">
                <div className="relative aspect-square sm:aspect-[5/4] lg:aspect-square">
                  <Image src={images[item.key].url} alt={images[item.key].alt} fill sizes="(max-width: 1023px) 95vw, 650px" className="object-contain p-4 sm:p-7" />
                </div>
              </TabsContent>
            ))}
            <p className="border-t border-black/10 px-4 py-3 text-center text-xs leading-5 text-[#625c52]">An example of what you can create. Customize in the designer.</p>
          </div>

          <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:justify-center">
            <div className="order-first">
            <p className="mb-3 text-sm font-semibold">Choose your starting style</p>
            <TabsList aria-label="Choose a jacket style" className="grid h-auto w-full grid-cols-3 gap-2 bg-transparent p-0 sm:gap-3">
              {styles.map(item => (
                <TabsTrigger key={item.key} value={item.key} className="group relative flex h-auto min-w-0 flex-col gap-2 whitespace-normal rounded-xl border border-border bg-card px-2 py-3 text-foreground shadow-none data-[state=active]:border-primary data-[state=active]:ring-1 data-[state=active]:ring-primary">
                  <span className="relative block aspect-square w-full max-w-20 overflow-hidden rounded-lg bg-[#eeebe5]">
                    <Image src={images[item.key].url} alt="" fill sizes="80px" className="object-contain p-1" />
                  </span>
                  <span className="text-sm font-semibold">{item.name}</span>
                  {style === item.key && <Check aria-hidden="true" className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-primary p-0.5 text-primary-foreground" />}
                </TabsTrigger>
              ))}
            </TabsList>
            </div>

            <div className="order-1 min-h-24 lg:mt-5" aria-live="polite" aria-atomic="true">
              <h3 className="text-xl font-semibold sm:text-2xl">{selected.note}</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{selected.description}</p>
            </div>

            <Button asChild size="lg" className="order-2 min-h-12 w-full lg:mt-4 bg-primary text-base text-primary-foreground hover:bg-primary/90"><Link href={`/design/${style}`}>Design your {selected.name.toLowerCase()} <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" /></Link></Button>
            <Link href="/size-guide" className="order-3 inline-flex min-h-11 lg:mt-2 items-center justify-center gap-2 text-sm text-muted-foreground underline underline-offset-4"><Ruler aria-hidden="true" className="h-4 w-4" />Need help finding your size?</Link>

            <div className="order-4 border-t pt-5 lg:mt-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Then, make it yours</p>
              <ol className="grid grid-cols-3 gap-3">
                {steps.map(({ icon: Icon, title, text }) => <li key={title}><Icon aria-hidden="true" className="mb-2 h-5 w-5 text-primary" /><p className="text-xs font-semibold leading-5 sm:text-sm">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></li>)}
              </ol>
            </div>
          </div>
        </Tabs>
      </div>
    </section>
  )
}
