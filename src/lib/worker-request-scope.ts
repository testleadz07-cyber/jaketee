import { AsyncLocalStorage } from 'node:async_hooks'

export interface WorkerRequestScope {
  values: Map<string, unknown>
  cleanup: Array<() => Promise<void>>
  closed?: boolean
}

// Share one store between the custom entry and Next's compiled server.
const key = Symbol.for('jacketee.worker-request-scope')
const shared = globalThis as typeof globalThis & { [key]?: AsyncLocalStorage<WorkerRequestScope> }
const storage = shared[key] ??= new AsyncLocalStorage<WorkerRequestScope>()
export const getWorkerRequestScope = () => storage.getStore()
export const runInWorkerRequest = <T>(scope: WorkerRequestScope, fn: () => T): T => storage.run(scope, fn)

export async function closeWorkerRequest(scope: WorkerRequestScope) {
  if (scope.closed) return
  scope.closed = true
  await Promise.allSettled(scope.cleanup.map(close => close()))
  scope.values.clear()
}
