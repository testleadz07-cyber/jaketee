'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

/** Keep the server and first hydration render consistent without an extra effect. */
export function useHasMounted() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot)
}
