'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const SupportChatWidget = dynamic(() => import('./support-chat-widget').then((mod) => mod.SupportChatWidget), { ssr: false })

export function DeferredWidgets() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 4000)
    return () => window.clearTimeout(timer)
  }, [])
  return ready ? <SupportChatWidget /> : null
}
