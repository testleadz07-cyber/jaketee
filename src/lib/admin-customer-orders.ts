// Admin reporting only. Matching an email never grants customer ownership.
export function guestOrderEmail(email: unknown): RegExp | null {
  if (typeof email !== 'string' || !email.trim()) return null
  const escaped = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped}$`, 'i')
}

export function adminCustomerOrderQuery(userId: unknown, email: unknown) {
  const match = guestOrderEmail(email)
  return match ? { $or: [{ userId }, { userId: null, userEmail: match }] } : { userId }
}

export function adminCustomerOrderStats(users: Array<{ _id: unknown; email?: unknown }>, rows: any[]) {
  return new Map(users.map(user => {
    const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : ''
    const matching = rows.filter(row => row._id.userId != null
      ? String(row._id.userId) === String(user._id)
      : email && row._id.email === email)
    return [String(user._id), matching.reduce((sum, row) => ({
      orderCount: sum.orderCount + row.orderCount, totalSpent: sum.totalSpent + row.totalSpent,
      guestOrderCount: sum.guestOrderCount + (row._id.userId == null ? row.orderCount : 0),
    }), { orderCount: 0, totalSpent: 0, guestOrderCount: 0 })]
  }))
}
