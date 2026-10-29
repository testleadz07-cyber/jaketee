'use client'

import { PushSessionSync } from '@/components/admin/push-session-sync'
import { SessionProvider } from 'next-auth/react'
import { CartSync } from '@/components/cart-sync'
import { ThemeProvider } from '@/components/theme-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={300} refetchOnWindowFocus={true} refetchWhenOffline={false}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <CartSync />
        <PushSessionSync />
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
