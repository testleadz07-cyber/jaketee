const ROUTE_LIMITS: Record<string, { windowMs: number; max: number }> = {
  // Login (NextAuth credentials callback) - brute force protection
  '/api/auth/callback/credentials': { windowMs: 15 * 60 * 1000, max: 8 },
  // Registration - prevent mass account creation
  '/api/auth/register': { windowMs: 60 * 60 * 1000, max: 5 },
  '/api/auth/forgot-password': { windowMs: 60 * 60 * 1000, max: 5 },
  '/api/auth/reset-password': { windowMs: 15 * 60 * 1000, max: 10 },
  // Promo / coupon code guessing
  '/api/discounts/validate': { windowMs: 60 * 1000, max: 10 },
  '/api/discounts/check': { windowMs: 60 * 1000, max: 10 },
  // Contact form spam
  '/api/contact': { windowMs: 60 * 60 * 1000, max: 5 },
  // Newsletter signup spam
  '/api/newsletter/subscribe': { windowMs: 60 * 60 * 1000, max: 5 },
  // Enforced once at the Worker perimeter, using the existing durable counter.
  '/api/returns': { windowMs: 60 * 60 * 1000, max: 3 },
  // Checkout / payment abuse
  '/api/orders': { windowMs: 60 * 1000, max: 10 },
  '/api/orders/confirmation': { windowMs: 60 * 1000, max: 10 },
  '/api/orders/claim': { windowMs: 15 * 60 * 1000, max: 5 },
  '/api/payments/create-order': { windowMs: 60 * 1000, max: 10 },
  '/api/payments/capture': { windowMs: 60 * 1000, max: 10 },
  '/api/payments/stripe/checkout': { windowMs: 60 * 1000, max: 10 },
  '/api/payments/stripe/verify': { windowMs: 60 * 1000, max: 15 },
  // Reviews / uploads - spam and storage abuse
  '/api/reviews': { windowMs: 60 * 1000, max: 8 },
  '/api/upload': { windowMs: 60 * 1000, max: 10 },
  '/api/upload-snapshot': { windowMs: 60 * 60 * 1000, max: 20 },
  '/api/customizations/artwork': { windowMs: 60 * 60 * 1000, max: 10 },
}

// NextAuth polls these frequently on every page load; don't throttle them.
const RATE_LIMIT_EXEMPT = new Set([
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/signout',
  '/api/auth/signin',
])

// Generic ceiling for any other /api route not explicitly listed above.
const DEFAULT_API_LIMIT = { windowMs: 60 * 1000, max: 60 }

export function getRateLimitConfig(pathname: string) {
  if (RATE_LIMIT_EXEMPT.has(pathname)) return null
  if (ROUTE_LIMITS[pathname]) return ROUTE_LIMITS[pathname]
  if (pathname.startsWith('/api/')) return DEFAULT_API_LIMIT
  return null
}
