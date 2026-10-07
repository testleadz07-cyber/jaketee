import type { ReactNode, Ref } from 'react'
import { ChevronDown } from 'lucide-react'

export function CustomizationSection({ title, children, detailsRef, collapsible = true }: {
  title: string
  children: ReactNode
  detailsRef?: Ref<HTMLDetailsElement>
  collapsible?: boolean
}) {
  if (!collapsible) return <>{children}</>

  return <details ref={detailsRef} className="group rounded-lg border">
    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-lg p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
    </summary>
    <div className="space-y-4 px-4 pb-4">{children}</div>
  </details>
}
