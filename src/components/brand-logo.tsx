import Image from 'next/image'
import { cn } from '@/lib/utils'

export function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/logo.png"
      alt="Jacketee"
      width={180}
      height={60}
      priority={priority}
      className={cn('h-12 w-36 rounded-sm bg-white p-1 object-contain', className)}
    />
  )
}
