'use client'

import { Button } from '@/components/ui/button'
import { openCookiePreferences } from '@/lib/cookie-consent'

export function CookiePreferencesButton() {
  return <Button onClick={openCookiePreferences} className="min-h-11">Manage cookie preferences</Button>
}
