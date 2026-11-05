import { JACKET_VIEWS, getJacketTexts, type JacketCustomization, type JacketTextElement, type JacketArtworkCustomization } from '@/types/jacket-customization'

export interface CustomizationChange {
  changeType: 'added' | 'removed' | 'changed'
  view: string
  elementType: 'text' | 'artwork' | 'option'
  elementId: string
  elementName?: string
  field: string
  before: string
  after: string
}

// Small, readable snapshots only: never copy uploaded image URLs or canvas data.
export const changeValue = (value: unknown) => String(value ?? '').replace(/[\x00-\x1f]/g, ' ').slice(0, 200)

export function customizationChanges(previous: JacketCustomization, next: JacketCustomization): CustomizationChange[] {
  const changes: CustomizationChange[] = []
  for (const view of JACKET_VIEWS) {
    for (const elementType of ['text', 'artwork'] as const) {
      const before: (JacketTextElement | JacketArtworkCustomization)[] = elementType === 'text' ? getJacketTexts(previous[view]) : previous[view]?.artworks || []
      const after: (JacketTextElement | JacketArtworkCustomization)[] = elementType === 'text' ? getJacketTexts(next[view]) : next[view]?.artworks || []
      const oldItems = new Map(before.map(item => [item.id, item] as const))
      const newItems = new Map(after.map(item => [item.id, item] as const))
      for (const id of new Set([...oldItems.keys(), ...newItems.keys()])) {
        const oldItem = oldItems.get(id), newItem = newItems.get(id)
        const snapshot = (item: typeof oldItem) => {
          if (!item) return ''
          if ('value' in item) return changeValue(item.value)
          return changeValue(`${item.source === 'upload' ? 'Uploaded artwork: ' : ''}${item.name}`)
        }
        if (!oldItem || !newItem) {
          changes.push({ changeType: newItem ? 'added' : 'removed', view, elementType, elementId: id,
            elementName: snapshot(newItem || oldItem),
            field: elementType, before: snapshot(oldItem), after: snapshot(newItem) })
          continue
        }
        const fields = elementType === 'text' ? ['value', 'color', 'fontStyle', 'layout', 'size', 'x', 'y'] : ['name', 'color', 'fontStyle', 'widthInches', 'x', 'y']
        for (const field of fields) {
          const oldValue = (oldItem as unknown as Record<string, unknown>)[field]
          const newValue = (newItem as unknown as Record<string, unknown>)[field]
          if (oldValue !== newValue) changes.push({ changeType: 'changed', view, elementType, elementId: id,
            elementName: snapshot(newItem),
            field, before: changeValue(oldValue), after: changeValue(newValue) })
        }
      }
    }
  }
  for (const key of ['varsityOptions', 'garmentOptions'] as const) {
    for (const field of new Set([...Object.keys(previous[key] || {}), ...Object.keys(next[key] || {})])) {
      const before = previous[key]?.[field], after = next[key]?.[field]
      if (before !== after) changes.push({ changeType: 'changed', view: 'jacket', elementType: 'option', elementId: field,
        field, before: changeValue(before), after: changeValue(after) })
    }
  }
  return changes
}
