import type { FaqCategory, FaqItem } from '@/lib/faq-page-data'

export function normalizeFaqSearch(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

export function faqQuestionId(question: string) {
  let hash = 2166136261
  for (const character of question) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  return `faq-${normalizeFaqSearch(question).replace(/\s+/g, '-').slice(0, 56)}-${(hash >>> 0).toString(36)}`
}

function searchText(item: FaqItem, category: string) {
  return normalizeFaqSearch([category, item.question, ...(Array.isArray(item.answer) ? item.answer : [item.answer]), ...(item.bullets || []), ...(item.ordered || []), ...(item.aliases || [])].join(' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'))
}

export function filterFaqCategories(categories: FaqCategory[], query: string, selected = 'all'): FaqCategory[] {
  const words = normalizeFaqSearch(query).split(' ').filter(Boolean)
  return categories.filter(category => selected === 'all' || category.title === selected).map(category => ({ ...category, items: category.items.filter(item => { const text = searchText(item, category.title); return words.every(word => text.includes(word)) }) })).filter(category => category.items.length > 0)
}
