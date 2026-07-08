'use client'

import { SessionProvider } from 'next-auth/react'
import { CartSync } from '@/components/cart-sync'
import { ThemeProvider } from '@/components/theme-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <CartSync />
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}