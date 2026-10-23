'use client'

import Image from '@/components/optimized-image'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export default function ProductImageZoom({ src, alt, title, onOpenChange }: {
  src: string; alt: string; title: string; onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto border-0 bg-background p-4 sm:max-w-5xl">
        <DialogTitle className="min-w-0 pr-8 text-base [overflow-wrap:anywhere]">{title}</DialogTitle>
        <div className="relative h-[65dvh] min-w-0 w-full sm:h-[75dvh]">
          <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
