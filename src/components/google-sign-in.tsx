'use client'

import { apiFetch as fetch } from '@/lib/api-fetch'

import { useEffect, useState } from 'react'
import { getProviders, signIn } from 'next-auth/react'
import localFont from 'next/font/local'
import { useGoogleAuthAvailability } from '@/components/google-auth-availability'

const googleSans = localFont({ src: '../../public/fonts/google-sans-medium-latin.woff2', weight: '500', display: 'swap' })

export const googleAuthErrors: Record<string, string> = {
  GoogleLinkRequired: 'This email already has an account. Sign in with your password, then connect Google from your profile.',
  GoogleAccountConflict: 'This Google account cannot be connected to the current account. Use the same email as your profile.',
  GoogleAccountDisabled: 'This account is disabled. Please contact support.',
  GoogleEmailUnverified: 'Please use a Google account with a verified email address.',
  GoogleUnavailable: 'Google sign-in is temporarily unavailable. Please try again.',
}

export function GoogleSignIn({ callbackUrl = '/auth/complete', disabled = false, linking = false }: { callbackUrl?: string; disabled?: boolean; linking?: boolean }) {
  const initialAvailability = useGoogleAuthAvailability()
  const [discoveredAvailability, setDiscoveredAvailability] = useState(false)
  const enabled = initialAvailability ?? discoveredAvailability
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [linked, setLinked] = useState(false)
  useEffect(() => {
    if (!linking) return
    let active = true
    fetch('/api/users/profile').then(async response => {
      if (response.ok) {
        const profile = await response.json()
        if (active) setLinked(Boolean(profile.googleId))
      }
    }).catch(() => {})
    return () => { active = false }
  }, [linking])
  useEffect(() => {
    if (initialAvailability !== undefined) return
    let active = true
    getProviders().then(p => { if (active) setDiscoveredAvailability(Boolean(p?.google)) }).catch(() => {})
    return () => { active = false }
  }, [initialAvailability])
  if (!enabled) return null
  if (linking && linked) return <p className="text-sm text-muted-foreground" role="status">Google account connected. You can sign in with Google.</p>
  return <div className="space-y-3 mb-5">
    <button type="button" className={`${googleSans.className} relative flex h-11 w-full cursor-pointer items-center justify-center rounded-[4px] border border-[#747775] bg-white px-3 text-sm font-medium tracking-[0.25px] text-[#1f1f1f] transition-colors hover:bg-[#f8faff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4285f4] disabled:cursor-not-allowed disabled:opacity-60`} disabled={disabled || busy} onClick={async () => {
      setBusy(true); setError('')
      try { await signIn('google', { callbackUrl }) }
      catch { setBusy(false); setError('Unable to open Google sign-in. Please try again.') }
    }}>
      <img src="/google-g-logo.png" alt="" width={20} height={20} className="absolute left-3 size-5 object-contain" />
      {busy ? 'Opening Google…' : linking ? 'Connect Google account' : 'Continue with Google'}
    </button>
    {!linking && <p className="text-xs text-center text-muted-foreground">By continuing, you agree to our <a href="/terms-of-service" className="underline">Terms</a> and <a href="/privacy-policy" className="underline">Privacy Policy</a>.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!linking && <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>or continue with email</span><span className="h-px flex-1 bg-border" /></div>}
  </div>
}
