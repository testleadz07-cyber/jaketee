import { closeWorkerRequest, runInWorkerRequest, type WorkerRequestScope } from './worker-request-scope'

interface RequestContext { waitUntil(promise: Promise<unknown>): void }
type FetchHandler = (request: Request, env: Record<string, unknown>, ctx: RequestContext, ...args: any[]) => Promise<Response>

/** Keep database I/O inside one invocation, including streaming and background work. */
export function scopedWorkerFetch(fetch: FetchHandler): FetchHandler {
  return async (request, env, ctx, ...args) => {
    const scope: WorkerRequestScope = { values: new Map(), cleanup: [] }
    scope.values.set('request-headers', request.headers)
    const pending = new Set<Promise<unknown>>()
    const context = new Proxy(ctx, {
      get(target, property) {
        if (property === 'waitUntil') return (promise: Promise<unknown>) => {
          pending.add(promise)
          void promise.then(() => pending.delete(promise), () => pending.delete(promise))
          target.waitUntil(promise)
        }
        const value = Reflect.get(target, property, target)
        return typeof value === 'function' ? value.bind(target) : value
      },
    })
    let finish!: () => void
    const bodyDone = new Promise<void>(resolve => { finish = resolve })
    ctx.waitUntil((async () => {
      await bodyDone
      while (pending.size) await Promise.allSettled([...pending])
      await closeWorkerRequest(scope)
    })())
    try {
      return await runInWorkerRequest(scope, async () => {
        const response = await fetch(request, env, context, ...args)
        if (!response.body) { finish(); return response }
        const reader = response.body.getReader()
        const body = new ReadableStream({
          async pull(controller) {
            try {
              const { done, value } = await reader.read()
              if (done) { controller.close(); finish() } else controller.enqueue(value)
            } catch (error) { controller.error(error); finish() }
          },
          async cancel(reason) { try { await reader.cancel(reason) } finally { finish() } },
        })
        return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers })
      })
    } catch (error) { finish(); throw error }
  }
}
