import cloudflareNode from '@opennextjs/aws/overrides/wrappers/cloudflare-node.js'
import type { Wrapper } from '@opennextjs/aws/types/overrides.js'
import { scopedWorkerFetch } from '../lib/scoped-worker-fetch'

// Delegate conversion/streaming to OpenNext; only add the database scope.
export default {
  ...cloudflareNode,
  name: 'cloudflare-node-request-scoped',
  wrapper: async (handler, converter) => scopedWorkerFetch(await cloudflareNode.wrapper(handler, converter)),
} satisfies Wrapper
