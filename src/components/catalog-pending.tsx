export function CatalogPending({ active }: { active: boolean }) {
  if (!active) return null
  return <span className="inline-flex items-center">
    <span className="sr-only">Loading products</span><span aria-hidden="true" className="h-3 w-32 rounded bg-muted motion-safe:animate-pulse" />
  </span>
}
