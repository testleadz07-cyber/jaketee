'use client'

import { createContext, useContext } from 'react'

const GoogleAuthAvailability = createContext<boolean | undefined>(undefined)

export function GoogleAuthAvailabilityProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  return <GoogleAuthAvailability.Provider value={enabled}>{children}</GoogleAuthAvailability.Provider>
}

export function useGoogleAuthAvailability() {
  return useContext(GoogleAuthAvailability)
}
