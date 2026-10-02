import { getStoredConsent } from '@/lib/cookie-consent'

export type AnalyticsEventName =
  | 'customization_started'
  | 'customization_step_viewed'
  | 'customization_step_completed'
  | 'customization_difficulty'
  | 'customization_help_requested'
  | 'customization_help_dismissed'
  | 'customization_completed'
  | 'customization_abandoned'
  | 'view_product'
  | 'view_category'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'product_listing_click'
  | 'filter_changed'
  | 'sort_changed'
  | 'size_guide_opened'
  | 'product_option_selected'
  | 'wishlist_changed'
  | 'cart_viewed'
  | 'cart_item_removed'
  | 'search_no_results'
  | 'checkout_error'
  | 'contact_button_clicked'
  | 'information_opened'

function hasAnalyticsConsent() {
  return Boolean(getStoredConsent()?.analytics)
}

/**
 * Log optional activity only after analytics consent. Best-effort - never throws.
 * Keep details to predefined product, category, option, total, and status values.
 */
export async function logUserActivity(action: AnalyticsEventName, details?: Record<string, any>) {
  if (!hasAnalyticsConsent()) return false

  try {
    const res = await fetch('/api/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-analytics-consent': 'granted',
      },
      body: JSON.stringify({ action, details }),
    })
    return res.ok
  } catch {
    return false
  }
}
