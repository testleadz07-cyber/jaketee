'use client'

import Image from '@/components/optimized-image'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export default function ProductImageZoom({ src, alt, title, onOpenChange }: {
  src: string; alt: string; title: string; onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border-0 bg-background p-4">
        <DialogTitle className="pr-8 text-base">{title}</DialogTitle>
        <div className="relative h-[75vh] w-full">
          <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
