'use client'

import { useState } from 'react'
import { CollectionDesignImage } from '@/components/collection-design-image'

export function MaterialImageGallery({ name, image, texture, alt, textureAlt, hardware = false }: { name: string; image: string; texture: string; alt: string; textureAlt?: string; hardware?: boolean }) {
  const [view, setView] = useState<'main' | 'detail'>('main')
  return <div>
    <div className="relative aspect-[4/3] bg-[#f5f1eb]">
      <CollectionDesignImage key={view} urls={view === 'main' ? [image, texture] : [texture, image]} alt={view === 'main' ? alt : textureAlt || `${name}, alternate texture view`} sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw" className="object-contain p-2" />
    </div>
    <div role="group" aria-label={`${name} image views`} className="grid grid-cols-2 gap-2 border-t bg-card p-2">
      {(['main', 'detail'] as const).map(value => <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)} className={`inline-flex min-h-11 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${view === value ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>{value === 'main' ? hardware ? 'Hardware view' : 'Folded view' : hardware ? 'Alternate angle' : 'Texture detail'}</button>)}
    </div>
  </div>
}
