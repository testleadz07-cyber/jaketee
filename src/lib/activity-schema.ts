import { sanitizeGuestForm, isGuestFormAction } from '@/lib/guest-form-schema'

/** Shared browser/server contract. Unknown detail fields are deliberately discarded. */
const customization = ['productId', 'customizationSessionId', 'step', 'activeSeconds'] as const
export const EVENT_FIELDS = {
  page_view: [],
  customization_started: customization,
  customization_step_viewed: [...customization, 'stepIndex'],
  customization_step_completed: customization,
  customization_difficulty: [...customization, 'reason'],
  customization_help_requested: customization,
  customization_help_dismissed: customization,
  customization_completed: [...customization, 'method'],
  customization_abandoned: customization,
  view_product: ['productId'],
  view_category: ['categoryId', 'slug'],
  add_to_cart: ['productId', 'price', 'quantity'],
  begin_checkout: ['productId', 'price', 'quantity', 'itemCount', 'total', 'currency'],
  product_listing_click: ['productId', 'category', 'listingPosition'],
  filter_changed: ['filterName', 'filterValue'],
  sort_changed: ['sortOption', 'category'],
  size_guide_opened: ['productId'],
  product_option_selected: ['productId', 'optionName', 'optionValue'],
  wishlist_changed: ['productId', 'action'],
  cart_viewed: ['itemCount', 'total', 'currency'],
  cart_item_removed: ['productId', 'quantity'],
  search_no_results: ['resultCount'],
  checkout_error: ['checkoutStep', 'errorCode'],
  contact_button_clicked: ['channel'],
  information_opened: ['sectionName'],
  guest_form_draft: [],
  guest_form_submitted: [],
} as const

export type AnalyticsEventName = keyof typeof EVENT_FIELDS
export const MAX_ACTIVITY_BYTES = 8192
const numbers = new Set(['activeSeconds', 'stepIndex', 'price', 'quantity', 'itemCount', 'total', 'listingPosition', 'resultCount'])
const integers = new Set(['activeSeconds', 'stepIndex', 'quantity', 'itemCount', 'listingPosition', 'resultCount'])

export function normalizeActivityPath(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.length > 1024 || /[\\\s\x00-\x1f]/.test(value)) return undefined
  return value.split(/[?#]/)[0] || '/'
}

export type ActivityDetails = Record<string, string | number | boolean | Record<string, string>>
export function parseActivity(value: unknown): { action: AnalyticsEventName; details: ActivityDetails } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid activity')
  const { action, details = {} } = value as Record<string, unknown>
  if (typeof action !== 'string' || !Object.hasOwn(EVENT_FIELDS, action)) throw new Error('Unsupported action')
  if (!details || typeof details !== 'object' || Array.isArray(details)) throw new Error('Invalid details')
  const input = details as Record<string, unknown>
  const result: ActivityDetails = {}
  if (isGuestFormAction(action)) {
    if (typeof input.formSessionId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.formSessionId)) throw new Error('Invalid form session')
    const snapshot = sanitizeGuestForm(input.form, input.fields)
    if (!Object.keys(snapshot.fields).length && action === 'guest_form_submitted') throw new Error('Empty guest form')
    result.form = snapshot.form
    result.formSessionId = input.formSessionId
    if (typeof input.formRevision !== 'number' || !Number.isSafeInteger(input.formRevision) || input.formRevision < 1 || input.formRevision > 1e9) throw new Error('Invalid form revision')
    result.formRevision = input.formRevision
    if (typeof input.consentAt !== 'string' || input.consentAt.length > 40 || !Number.isFinite(Date.parse(input.consentAt))) throw new Error('Invalid form consent reference')
    result.consentAt = input.consentAt
    result.fields = snapshot.fields
    result.truncated = snapshot.truncated || input.truncated === true
  }
  const fields: readonly string[] = EVENT_FIELDS[action as AnalyticsEventName]
  for (const key of ['path', 'source', ...fields]) {
    const item = input[key]
    if (item === undefined || item === null) continue
    if (key === 'path') {
      const path = normalizeActivityPath(item)
      if (!path) throw new Error('Invalid path')
      result.path = path
    } else if (numbers.has(key)) {
      if (typeof item !== 'number' || !Number.isFinite(item) || item < 0 || item > 1e9 || (integers.has(key) && !Number.isInteger(item))) throw new Error(`Invalid ${key}`)
      result[key] = item
    } else {
      if (typeof item !== 'string' || item.length > 200 || /[\x00-\x1f]/.test(item)) throw new Error(`Invalid ${key}`)
      result[key] = item
    }
  }
  if (action === 'page_view' && !result.path) throw new Error('Page path is required')
  if (action === 'wishlist_changed' && result.action !== 'added' && result.action !== 'removed') throw new Error('Invalid wishlist action')
  return { action: action as AnalyticsEventName, details: result }
}
