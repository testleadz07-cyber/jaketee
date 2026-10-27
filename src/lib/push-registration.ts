export type PushProgress = (message: string) => void

export async function withPushTimeout<T>(operation: Promise<T>, message: string, milliseconds = 20_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), milliseconds) }),
    ])
  } finally { clearTimeout(timer) }
}

// Wait for THIS registration, not navigator.serviceWorker.ready, which can
// remain pending forever or resolve to a different registration for this page.
export function waitForPushWorker(registration: ServiceWorkerRegistration, milliseconds = 20_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const workers = new Set<ServiceWorker>()
    let timer: ReturnType<typeof setTimeout>
    const cleanup = () => {
      clearTimeout(timer)
      registration.removeEventListener('updatefound', check)
      workers.forEach(worker => worker.removeEventListener('statechange', check))
    }
    const check = () => {
      if (registration.active?.state === 'activated') { cleanup(); resolve(); return }
      for (const worker of [registration.installing, registration.waiting, registration.active]) {
        if (worker && !workers.has(worker)) { workers.add(worker); worker.addEventListener('statechange', check) }
      }
      if (workers.size && [...workers].every(worker => worker.state === 'redundant')) {
        cleanup(); reject(new Error('The notification worker could not start. Reload this page and try again.'))
      }
    }
    timer = setTimeout(() => { cleanup(); reject(new Error('Starting the notification worker took too long. Reload this page and try again.')) }, milliseconds)
    registration.addEventListener('updatefound', check)
    check()
  })
}

export async function pushRequest(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', token?: string, signal?: AbortSignal) {
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  // Next dev may compile this route on first access. Keep production bounded,
  // while allowing that one-time local compile to finish instead of aborting it.
  const milliseconds = process.env.NODE_ENV === 'development' ? 60_000 : method === 'GET' ? 20_000 : method === 'PATCH' ? 45_000 : 30_000
  const timer = setTimeout(abort, milliseconds)
  try {
    const response = await fetch('/api/admin/push', {
      method, signal: controller.signal, cache: 'no-store',
      ...(method !== 'GET' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) } : {}),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || (method === 'PATCH' ? 'The test could not be delivered. Refresh registration and try again.' : 'Unable to save notification settings.'))
    return data
  } catch (error) {
    if (controller.signal.aborted) {
      const action = method === 'GET' ? 'Loading notification settings' : method === 'POST' ? 'Saving this device' : method === 'PATCH' ? 'Sending the test notification' : 'Disabling notifications'
      throw new Error(`${action} took too long. ${process.env.NODE_ENV === 'development' ? 'If the local server is compiling, wait for it to finish, then try again.' : 'Check your connection and try again.'}`)
    }
    throw error
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort) }
}

export function createPushRegistration(register: (progress: PushProgress) => Promise<string>) {
  let current: { promise: Promise<string>; listeners: Set<PushProgress>; message: string } | null = null
  return (progress?: PushProgress): Promise<string> => {
    if (!current) {
      const flight = { promise: null as unknown as Promise<string>, listeners: new Set<PushProgress>(), message: 'Preparing notifications…' }
      current = flight
      if (progress) flight.listeners.add(progress)
      flight.promise = Promise.resolve().then(() => register(message => {
        flight.message = message
        flight.listeners.forEach(listener => listener(message))
      })).finally(() => { if (current === flight) current = null })
    } else if (progress) current.listeners.add(progress)
    const flight = current
    progress?.(flight.message)
    return flight.promise.finally(() => { if (progress) flight.listeners.delete(progress) })
  }
}
