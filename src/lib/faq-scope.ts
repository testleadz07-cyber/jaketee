export interface ScopedFaq {
  question?: string
  answer?: string[] | string
  bullets?: string[]
  ordered?: string[]
  displayPages?: string[]
  category?: string
  status?: string
  mergedInto?: unknown
  order?: number
}

export interface FaqScope {
  targets: string[]
  fallbackCategories?: string[]
  allowUnscoped?: boolean
}

export function normalizeFaqTarget(value: string) {
  return value.trim().split(/[?#]/, 1)[0].replace(/^\/+|\/+$/g, '').toLowerCase()
}

/** Explicit page scopes take precedence over category-based legacy defaults. */
export function faqMatchesScope(faq: ScopedFaq, scope: FaqScope) {
  const targets = new Set(scope.targets.map(normalizeFaqTarget))
  const pages = (faq.displayPages || []).map(normalizeFaqTarget).filter(Boolean)
  if (pages.length) return pages.some(page => targets.has(page))
  return Boolean(scope.allowUnscoped || scope.fallbackCategories?.some(
    category => category.trim().toLowerCase() === faq.category?.trim().toLowerCase()
  ))
}

export function selectScopedFaqs<T extends ScopedFaq>(faqs: T[], scope: FaqScope): T[] {
  const targets = scope.targets.map(normalizeFaqTarget)
  const rank = (faq: T) => {
    const matches = (faq.displayPages || []).map(page => targets.indexOf(normalizeFaqTarget(page))).filter(index => index >= 0)
    return matches.length ? Math.min(...matches) : Number.MAX_SAFE_INTEGER
  }
  const seen = new Set<string>()
  return faqs.filter(faq => faq.status !== 'draft' && !faq.mergedInto && faq.question?.trim()
    && [...(Array.isArray(faq.answer) ? faq.answer : [faq.answer]), ...(faq.bullets || []), ...(faq.ordered || [])].some(text => text?.trim())
    && faqMatchesScope(faq, scope))
    .sort((a, b) => rank(a) - rank(b) || Number(a.order || 0) - Number(b.order || 0))
    .filter(faq => {
      const key = faq.question!.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}
