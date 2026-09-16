'use client'

import Link from 'next/link'
import { Ruler } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function JacketSizeGuide({ sizes = [] }: { sizes?: string[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="link" size="sm" className="h-auto px-0 text-sm font-semibold underline-offset-4">
          <Ruler className="mr-1.5 h-4 w-4" />Size guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Find your jacket fit</DialogTitle></DialogHeader>
        {sizes.length > 0 && <p className="text-sm text-muted-foreground">Available sizes: {sizes.join(', ')}.</p>}
        <p className="text-sm text-muted-foreground">Compare these measurements with a jacket you already own. Size labels vary by style, so ask us for garment measurements before ordering if you are unsure.</p>
        <dl className="grid gap-3 border-y py-4 text-sm">
          <div><dt className="font-semibold">Chest</dt><dd className="text-muted-foreground">Measure around the fullest part, keeping the tape level.</dd></div>
          <div><dt className="font-semibold">Shoulders</dt><dd className="text-muted-foreground">Measure across the back from shoulder point to shoulder point.</dd></div>
          <div><dt className="font-semibold">Sleeve</dt><dd className="text-muted-foreground">Measure from the shoulder point to the wrist.</dd></div>
          <div><dt className="font-semibold">Length</dt><dd className="text-muted-foreground">Measure from the base of the collar to the hem.</dd></div>
        </dl>
        <p className="text-sm">Need measurements for this style? <Link href="/contact" className="font-semibold underline underline-offset-4">Ask our team</Link>.</p>
      </DialogContent>
    </Dialog>
  )
}
