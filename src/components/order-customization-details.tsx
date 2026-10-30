import { CheckoutDesignPreviews } from '@/components/checkout-design-previews'
import { getCustomizedViews, getJacketTexts, getJacketViewLabel, hasJacketCustomization, type JacketCustomization } from '@/types/jacket-customization'

export function OrderCustomizationDetails({ customization, name }: { customization?: JacketCustomization; name: string }) {
  if (!customization || !hasJacketCustomization(customization)) return null
  const options = customization.varsityOptions || customization.garmentOptions

  return (
    <section aria-label={`${name} customization details`} className="w-full min-w-0 space-y-3 border-t pt-3 text-sm">
      <h5 className="font-semibold">Your customization</h5>
      {options && (
        <dl className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
          {Object.entries(options).map(([key, value]) => (
            <div key={key} className="break-words"><dt className="inline font-medium">{key}: </dt><dd className="inline">{value}</dd></div>
          ))}
        </dl>
      )}
      <CheckoutDesignPreviews customization={customization} name={name} />
      {getCustomizedViews(customization).map(view => {
        const side = customization[view]
        const texts = getJacketTexts(side).filter(text => text.value.trim())
        if (!texts.length && !side?.artworks?.length) return null
        return (
          <div key={view} className="space-y-2 rounded border p-3 text-xs">
            <h6 className="font-semibold">{getJacketViewLabel(view)} design</h6>
            {texts.map(text => (
              <div key={text.id} className="space-y-1 break-words">
                <p className="whitespace-pre-wrap">Text: {text.value}</p>
                <p className="text-muted-foreground">Font: {text.fontStyle} · Color: {text.color} · Size: {text.size} · Layout: {text.layout || 'straight'}</p>
                <p className="text-muted-foreground">Position: {text.x}, {text.y}</p>
              </div>
            ))}
            {side?.artworks?.map(artwork => (
              <div key={artwork.id} className="space-y-1 border-t pt-2 break-words">
                <p className="font-medium">{artwork.name} ({artwork.source === 'upload' ? 'Uploaded artwork' : 'Catalog artwork'})</p>
                <p className="text-muted-foreground">Width: {artwork.widthInches} inches{artwork.color ? ` · Color: ${artwork.color}` : ''}{artwork.fontStyle ? ` · Font: ${artwork.fontStyle}` : ''}</p>
                <p className="text-muted-foreground">Position: {artwork.x}, {artwork.y}</p>
                {artwork.url && (
                  <a href={artwork.url} target="_blank" rel="noopener noreferrer" className="inline-block text-primary hover:underline">
                    <img src={artwork.url} alt={artwork.name} className="h-24 w-24 rounded border bg-background object-contain" />
                    Open original artwork
                  </a>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </section>
  )
}
