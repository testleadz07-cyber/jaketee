export class RequestBodyTooLarge extends Error {}

function boundedBody(request: Request, maxBytes: number): ReadableStream<Uint8Array> | null {
  if (Number(request.headers.get('content-length')) > maxBytes) throw new RequestBodyTooLarge()
  if (!request.body) return null
  const reader = request.body.getReader()
  let size = 0
  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read()
        if (done) { controller.close(); return }
        size += value.byteLength
        if (size > maxBytes) {
          await reader.cancel().catch(() => {})
          controller.error(new RequestBodyTooLarge())
          return
        }
        controller.enqueue(value)
      } catch (error) { controller.error(error) }
    },
    cancel(reason) { return reader.cancel(reason) },
  })
}

/** Cap bytes while reading, before multipart/JSON can allocate an oversized body. */
export async function boundedFormData(request: Request, maxBytes: number) {
  return new Response(boundedBody(request, maxBytes), { headers: { 'content-type': request.headers.get('content-type') || '' } }).formData()
}

export async function boundedText(request: Request, maxBytes: number) {
  return new Response(boundedBody(request, maxBytes)).text()
}
