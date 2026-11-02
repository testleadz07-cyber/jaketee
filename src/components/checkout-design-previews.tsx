import { JACKET_VIEWS, getJacketViewLabel, hasJacketCustomization, type JacketCustomization } from '@/types/jacket-customization'

export function CheckoutDesignPreviews({ customization, name }: { customization?: JacketCustomization; name: string }) {
  if (!hasJacketCustomization(customization)) return null

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold">Review your design</p>
      <div className="grid grid-cols-2 gap-2">
        {JACKET_VIEWS.map(view => {
          const url = customization?.snapshots?.[view]
          return (
            <div key={view} className="min-w-0 rounded border bg-background p-2 text-xs">
              <p className="mb-1 font-medium">{getJacketViewLabel(view)}</p>
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="block text-primary hover:underline">
                  <img src={url} alt={`${name} customized ${getJacketViewLabel(view)} preview`} className="h-32 w-full object-contain" />
                  <span>Open preview</span>
                </a>
              ) : <p className="text-muted-foreground">No preview saved for this view.</p>}
            </div>
          )
        })}
      </div>
      {customization?.snapshotUrl && !Object.values(customization.snapshots || {}).some(Boolean) && (
        <a href={customization.snapshotUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline">
          <img src={customization.snapshotUrl} alt={`${name} customized design snapshot`} className="h-40 w-full object-contain" />
          Open saved design snapshot
        </a>
      )}
    </div>
  )
}
