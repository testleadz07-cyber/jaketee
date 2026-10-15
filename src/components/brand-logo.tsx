import Image from '@/components/optimized-image'
import { cn } from '@/lib/utils'

export function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/logo.webp"
      alt="Jacketee"
      width={420}
      height={140}
      priority={priority}
      className={cn('h-12 w-36 rounded-sm bg-white p-1 object-contain', className)}
    />
  )
}
