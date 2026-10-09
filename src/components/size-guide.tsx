'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ruler } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { GarmentSizeChart } from '@/components/garment-size-chart'
import { measurementGuides, type Unit } from '@/lib/jacket-sizing'
import { logUserActivity } from '@/lib/activity'

export function SizeGuide({ categorySlug, sizeValues = [], trigger, productId }: {
  categorySlug?: string; sizeValues?: string[]; trigger?: React.ReactNode; productId?: string
}) {
  const [unit, setUnit] = useState<Unit>('in')
  const defaultTab = /\bvests?\b/i.test(categorySlug?.replace(/-/g, ' ') || '') ? 'vest' : 'jacket'
  return <Dialog onOpenChange={open => { if (open) logUserActivity('size_guide_opened', { productId: productId || null }) }}>
    <DialogTrigger asChild>{trigger || <Button type="button" variant="link" className="min-h-11 px-0 text-sm font-semibold"><Ruler className="mr-1.5 size-4" />Size Guide</Button>}</DialogTrigger>
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle className="flex items-center gap-2"><Ruler className="size-5" />Jacket &amp; Vest Size Guide</DialogTitle>
        <DialogDescription>Compare male and female US, UK and European references, plus body and garment measurements from our full size-guide page.</DialogDescription>
      </DialogHeader>
      {sizeValues.length > 0 && <p className="text-sm text-muted-foreground">Product sizes: {sizeValues.join(', ')}.</p>}
      <div role="group" aria-label="Measurement units" className="flex justify-end gap-1">
        {(['in', 'cm'] as const).map(value => <button key={value} type="button" aria-pressed={unit === value} onClick={() => setUnit(value)} className={`min-h-11 rounded-md border px-3 text-sm ${unit === value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{value === 'in' ? 'Inches' : 'Centimeters'}</button>)}
      </div>
      <Tabs defaultValue={defaultTab}>
        <TabsList className="grid h-auto w-full grid-cols-3"><TabsTrigger value="jacket" className="min-h-11">Jackets</TabsTrigger><TabsTrigger value="vest" className="min-h-11">Vests</TabsTrigger><TabsTrigger value="measure" className="min-h-11 whitespace-normal text-center">How to Measure</TabsTrigger></TabsList>
        <TabsContent value="jacket" className="mt-4"><GarmentSizeChart kind="jacket" unit={unit} /></TabsContent>
        <TabsContent value="vest" className="mt-4"><GarmentSizeChart kind="vest" unit={unit} /></TabsContent>
        <TabsContent value="measure" className="mt-4 space-y-4 text-sm">
          <p className="leading-6 text-muted-foreground">For the female reference, measure bust around the fullest point with the tape level. If a jacket or vest covers your hips, measure around the fullest part of your hips too, without pulling the tape tight.</p>
          <p className="leading-6 text-muted-foreground">For jackets and vests, measure your chest and waist over light clothing with a soft tape. For garment measurements, close a well-fitting jacket or vest and lay it flat without stretching. Sleeve measurements apply to jackets only.</p>
          {measurementGuides.map(guide => <div key={guide.id}><h3 className="font-semibold">{guide.title}</h3><ol className="mt-1 list-decimal space-y-1 pl-5 leading-6 text-muted-foreground">{guide.steps.map(step => <li key={step}>{step}</li>)}</ol></div>)}
          <div><h3 className="font-semibold">Vest measurements</h3><p className="mt-1 leading-6 text-muted-foreground">Measure body chest and waist as above. Compare a closed, flat vest from armpit to armpit and from the base of the collar down the center back to the hem. Vests have no sleeve measurement; ask our team for your style’s finished dimensions.</p></div>
        </TabsContent>
      </Tabs>
      <Link href="/size-guide" className="inline-flex min-h-11 w-fit items-center text-sm font-semibold underline underline-offset-4">View full jacket and vest size guide</Link>
    </DialogContent>
  </Dialog>
}
