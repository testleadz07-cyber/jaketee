'use client'

import Script from 'next/script'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { TurnstileAction } from '@/lib/turnstile'

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string
  execute(id: string): void
  remove(id: string): void
}
declare global { interface Window { turnstile?: TurnstileApi } }

function Challenge({ action, complete }: { action: TurnstileAction; complete: (token: string | Error) => void }) {
  const container = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const siteKey = process.env.NODE_ENV === 'development'
    ? '1x00000000000000000000AA' : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!scriptReady || !container.current || !window.turnstile || !siteKey) return
    try {
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: siteKey, action, theme: 'auto', size: 'compact',
        execution: 'execute', appearance: 'interaction-only',
        callback: (token: string) => complete(token),
        'error-callback': () => { complete(new Error('Security verification failed. Please try again.')); return true },
        'expired-callback': () => complete(new Error('Verification expired. Please try again.')),
        'timeout-callback': () => complete(new Error('Verification timed out. Please try again.')),
      })
      window.turnstile.execute(widgetId.current)
    } catch { complete(new Error('Security verification could not start. Please try again.')) }
    return () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current)
      widgetId.current = null
    }
  }, [action, complete, scriptReady, siteKey])

  return <div className="w-full min-w-0" aria-label="Security verification">
    <Script id="cloudflare-turnstile" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="afterInteractive" onReady={() => setScriptReady(true)}
      onError={() => complete(new Error('Security verification could not load. Check your connection and try again.'))} />
    <div ref={container} className="flex justify-start" />
    <p role="status" className="mt-2 text-xs text-muted-foreground">Checking your browser securely…</p>
  </div>
}

/** Mount only on submission: no third-party script on passive homepage visits. */
export function useTurnstile(action: TurnstileAction) {
  const [requestId, setRequestId] = useState<number | null>(null)
  const sequence = useRef(0)
  const pending = useRef<{ promise: Promise<string>; resolve: (token: string) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> } | null>(null)
  const complete = useCallback((result: string | Error) => {
    const current = pending.current
    if (!current) return
    clearTimeout(current.timer)
    pending.current = null
    setRequestId(null)
    if (result instanceof Error) current.reject(result)
    else current.resolve(result)
  }, [])
  useEffect(() => () => {
    if (pending.current) {
      clearTimeout(pending.current.timer)
      pending.current.reject(new Error('Verification cancelled. Please try again.'))
      pending.current = null
    }
  }, [])
  const getToken = useCallback(() => {
    if (pending.current) return pending.current.promise
    if (process.env.NODE_ENV !== 'development' && !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      return Promise.reject(new Error('Security verification is temporarily unavailable. Please contact support.'))
    }
    let resolve!: (value: string) => void
    let reject!: (reason: Error) => void
    const promise = new Promise<string>((yes, no) => { resolve = yes; reject = no })
    const timer = setTimeout(() => complete(new Error('Verification timed out. Please try again.')), 120000)
    pending.current = { promise, resolve, reject, timer }
    setRequestId(++sequence.current)
    return promise
  }, [complete])
  return { getToken, widget: requestId === null ? null : <Challenge key={requestId} action={action} complete={complete} /> }
}
