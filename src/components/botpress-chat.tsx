'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export function BotpressChat() {
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const { data: session, status } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role || 'guest'
  const [permission, setPermission] = useState<{ role: string; enabled: boolean } | null>(null)
  useEffect(() => {
    if (status === 'loading') return
    const controller = new AbortController()
    fetch('/api/chat-visibility', { cache: 'no-store', signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => setPermission({ role, enabled: data?.enabled === true }))
      .catch(() => { if (!controller.signal.aborted) setPermission({ role, enabled: false }) })
    return () => controller.abort()
  }, [role, status])
  const allowed = status !== 'loading' && permission?.role === role && permission.enabled
  const isPrivatePage = /^\/(admin|checkout|profile|login|register|forgot-password|reset-password|order-confirmation)(\/|$)/.test(pathname)

  // Webchat injects its UI outside React, so hide it on private routes even
  // when the visitor navigates there after loading a public page.
  if (!allowed || isPrivatePage) return <style>{'.bpChatContainer, .bpFab, .bpWebchat, .bpProactiveMessage { display: none !important; }'}</style>

  return (
    <>
      <Script
        id="botpress-webchat"
        src="https://cdn.botpress.cloud/webchat/v3.7/inject.js"
        strategy="lazyOnload"
        onReady={() => setReady(true)}
      />
      {ready && (
        <Script
          id="jacketee-botpress-config"
          src="https://files.bpcontent.cloud/2026/10/26/11/20261026112257-PBNERD3F.js"
          strategy="lazyOnload"
        />
      )}
    </>
  )
}
