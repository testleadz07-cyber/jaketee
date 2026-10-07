'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const config = {
    attribute: props.attribute ?? 'data-theme',
    storageKey: props.storageKey ?? 'theme',
    defaultTheme: props.defaultTheme ?? (props.enableSystem === false ? 'light' : 'system'),
    forcedTheme: props.forcedTheme,
    themes: props.themes ?? ['light', 'dark'],
    value: props.value,
    enableSystem: props.enableSystem !== false,
    enableColorScheme: props.enableColorScheme !== false,
  }

  // React executes external async scripts on client mounts; inline scripts are inert.
  const src = `/theme-init.js?config=${encodeURIComponent(JSON.stringify(config))}`

  return (
    <NextThemesProvider {...props} scriptProps={{ ...props.scriptProps, src, async: true }}>
      {children}
    </NextThemesProvider>
  )
}
