'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  getStoredConsent,
  saveConsent,
  acceptAllConsent,
  rejectNonEssentialConsent,
  hasConsentDecision,
  OPEN_COOKIE_PREFERENCES_EVENT,
} from '@/lib/cookie-consent'

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [prefs, setPrefs] = useState({ functional: false, analytics: false, marketing: false })

  useEffect(() => {
    if (!hasConsentDecision()) {
      setVisible(true)
    } else {
      const stored = getStoredConsent()
      if (stored) {
        setPrefs({
          functional: stored.functional,
          analytics: stored.analytics,
          marketing: stored.marketing,
        })
      }
    }

    const handleOpenPreferences = () => {
      const stored = getStoredConsent()
      if (stored) {
        setPrefs({
          functional: stored.functional,
          analytics: stored.analytics,
          marketing: stored.marketing,
        })
      }
      setCustomizeOpen(true)
    }

    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handleOpenPreferences)
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handleOpenPreferences)
  }, [])

  const handleAcceptAll = useCallback(() => {
    acceptAllConsent()
    setVisible(false)
    setCustomizeOpen(false)
  }, [])

  const handleRejectNonEssential = useCallback(() => {
    rejectNonEssentialConsent()
    setVisible(false)
    setCustomizeOpen(false)
  }, [])

  const handleSavePreferences = useCallback(() => {
    saveConsent(prefs)
    setVisible(false)
    setCustomizeOpen(false)
  }, [prefs])

  return (
    <>
      {visible && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-500"
        >
          <div className="mx-auto max-w-4xl rounded-xl border-2 bg-card text-card-foreground shadow-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-2.5 rounded-full bg-primary/10 shrink-0 hidden sm:block">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1.5">
                <p className="text-sm font-semibold flex items-center gap-2 sm:hidden">
                  <Cookie className="h-4 w-4 text-primary" /> We value your privacy
                </p>
                <p className="text-sm font-semibold hidden sm:block">We value your privacy</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use cookies to keep the site working, remember your preferences, and (with your consent)
                  analyze traffic and support marketing. Read our{' '}
                  <Link href="/cookie-policy" className="text-primary hover:underline">
                    Cookie Policy
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  to learn more.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
                <Button variant="outline" size="sm" onClick={handleRejectNonEssential} className="flex-1 sm:flex-none">
                  Reject Non-Essential
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCustomizeOpen(true)} className="flex-1 sm:flex-none">
                  Customize
                </Button>
                <Button size="sm" onClick={handleAcceptAll} className="flex-1 sm:flex-none">
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Choose which categories of cookies we can use. You can change this anytime from the footer link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5 pr-4">
                <Label className="text-sm font-medium">Strictly Necessary</Label>
                <p className="text-xs text-muted-foreground">
                  Required for sign-in, cart, and checkout to function. Always on.
                </p>
              </div>
              <Switch checked disabled />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5 pr-4">
                <Label className="text-sm font-medium">Functional</Label>
                <p className="text-xs text-muted-foreground">
                  Remembers preferences like recently viewed items and wishlist.
                </p>
              </div>
              <Switch
                checked={prefs.functional}
                onCheckedChange={(checked) => setPrefs((p) => ({ ...p, functional: checked }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5 pr-4">
                <Label className="text-sm font-medium">Analytics</Label>
                <p className="text-xs text-muted-foreground">
                  Helps us understand site usage so we can improve the experience.
                </p>
              </div>
              <Switch
                checked={prefs.analytics}
                onCheckedChange={(checked) => setPrefs((p) => ({ ...p, analytics: checked }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5 pr-4">
                <Label className="text-sm font-medium">Marketing</Label>
                <p className="text-xs text-muted-foreground">
                  Used to show relevant ads and measure campaign performance.
                </p>
              </div>
              <Switch
                checked={prefs.marketing}
                onCheckedChange={(checked) => setPrefs((p) => ({ ...p, marketing: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleRejectNonEssential} className="w-full sm:w-auto">
              Reject Non-Essential
            </Button>
            <Button variant="outline" onClick={handleSavePreferences} className="w-full sm:w-auto">
              Save Preferences
            </Button>
            <Button onClick={handleAcceptAll} className="w-full sm:w-auto">
              Accept All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
