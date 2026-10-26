export function CatalogPending({ active }: { active: boolean }) {
  if (!active) return null
  return <span className="loading-feedback inline-flex items-center gap-2 text-xs text-muted-foreground">
    <span aria-hidden="true" className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-primary/25 border-t-primary motion-reduce:animate-none" />Loading products…
  </span>
}
