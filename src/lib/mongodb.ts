import mongoose, { type Connection, type Model } from 'mongoose'
import { getWorkerRequestScope } from './worker-request-scope'

const options = {
  maxPoolSize: 5, minPoolSize: 0,
  serverSelectionTimeoutMS: 5000, socketTimeoutMS: 15000,
  bufferCommands: false,
}
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}
declare global { var mongoose: MongooseCache | undefined }
const cached = globalThis.mongoose ??= { conn: null, promise: null } as MongooseCache
interface RequestDatabase { connection: Connection; promise: Promise<Connection> }

function requestDatabase(): RequestDatabase | undefined {
  const scope = getWorkerRequestScope()
  if (!scope) return undefined
  if (scope.closed) throw new Error('Database accessed after request cleanup')
  let db = scope.values.get('mongodb') as RequestDatabase | undefined
  if (!db && process.env.MONGODB_URI) {
    // Calling mongoose.connect() again would still reuse its default connection.
    // Workers need a real request connection; existing schemas are rebound below.
    const connection = mongoose.createConnection(process.env.MONGODB_URI, {
      ...options, maxPoolSize: 1, autoIndex: false, autoCreate: false,
    })
    db = { connection, promise: connection.asPromise() }
    void db.promise.catch(() => {})
    scope.values.set('mongodb', db)
    scope.cleanup.push(async () => { await connection.close().catch(() => {}) })
  }
  return db
}

/** Preserve existing model exports and schemas, with invocation-local I/O. */
export function requestScopedModel<T extends Model<any>>(base: T): T {
  function resolve(): T {
    const db = requestDatabase()
    if (!db) return base
    // Populate's string refs must use models on this same connection.
    for (const model of Object.values(mongoose.models)) {
      if (!db.connection.models[model.modelName]) {
        db.connection.model(model.modelName, model.schema, model.collection.name)
      }
    }
    return db.connection.models[base.modelName] as T
  }
  return new Proxy(base, {
    get(_target, property) {
      const model = resolve()
      const value = Reflect.get(model, property, model)
      return typeof value === 'function' && property !== 'prototype' ? value.bind(model) : value
    },
    construct(_target, args) { return Reflect.construct(resolve(), args) },
    apply(_target, _this, args) { return Reflect.apply(resolve(), undefined, args) },
  })
}

export async function connectDB() {
  if (!process.env.MONGODB_URI) return null
  const scoped = requestDatabase()
  if (scoped) {
    try { return await scoped.promise } catch {
      console.error('Request MongoDB connection unavailable')
      return null
    }
  }
  // Fail closed: skipping a cache is not isolation without the Worker scope.
  if (process.env.MONGO_PER_REQUEST === 'true') {
    throw new Error('MONGO_PER_REQUEST requires the custom Workers request scope')
  }
  if (cached.conn) return cached.conn
  cached.promise ??= mongoose.connect(process.env.MONGODB_URI, options)
  try { return cached.conn = await cached.promise } catch {
    cached.promise = null
    console.error('MongoDB connection unavailable')
    return null
  }
}

export function isDbConnected(): boolean {
  return (requestDatabase()?.connection ?? mongoose.connection).readyState === 1
}
