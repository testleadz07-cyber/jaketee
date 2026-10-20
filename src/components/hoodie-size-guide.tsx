import Link from 'next/link'
import { Ruler } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'

export function HoodieSizeGuide({ fit }: { fit: string }) {
  return <Dialog><DialogTrigger asChild><Button type="button" variant="link" className="min-h-11 px-0"><Ruler className="mr-1 size-4" />Hoodie sizing help</Button></DialogTrigger><DialogContent>
    <DialogHeader><DialogTitle>Choose your fleece hoodie size</DialogTitle><DialogDescription>Your selected fit is {fit.toLowerCase()}. Sizes run from XS to 3XL. Confirm finished hoodie measurements with our team before ordering if you are unsure.</DialogDescription></DialogHeader>
    <ol className="list-decimal space-y-3 pl-5 text-sm leading-6"><li>Lay a hoodie that fits you well on a flat surface without stretching it.</li><li>Measure the chest from armpit to armpit, body length from the shoulder beside the neckline to the hem, and sleeve length from the shoulder seam to the cuff.</li><li>Tell us the measurements, selected size, and whether you prefer regular or relaxed fit. Raglan sleeves use a different seam, so include a photo if you need help measuring.</li></ol>
    <p className="text-xs text-muted-foreground">The jacket size chart is a general reference, not a verified hoodie measurement chart.</p>
    <Link href="/contact" className="inline-flex min-h-11 items-center font-semibold underline">Ask about hoodie measurements</Link>
  </DialogContent></Dialog>
}
