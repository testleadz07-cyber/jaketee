export function productImageAlt(productName: string, url: string, index: number) {
  const filename = decodeURIComponent(url.split('/').pop()?.split('?')[0] || '').toLowerCase()
  const detailNumber = filename.match(/(?:^|[-_])detail[-_]?(\d+)/)?.[1]
  const label = /(?:^|[-_])back(?:[-_.]|$)/.test(filename) ? 'back view'
    : /(?:^|[-_])side(?:[-_.]|$)/.test(filename) ? 'side view'
    : /(?:^|[-_])front(?:[-_.]|$)/.test(filename) ? 'front view'
    : /(?:^|[-_])sleeve(?:[-_.]|$)/.test(filename) ? 'sleeve detail'
    : /(?:^|[-_])lining(?:[-_.]|$)/.test(filename) ? 'lining detail'
    : /(?:^|[-_])collar(?:[-_.]|$)/.test(filename) ? 'collar detail'
    : /(?:^|[-_])pocket(?:[-_.]|$)/.test(filename) ? 'pocket detail'
    : /(?:^|[-_])patch(?:[-_.]|$)/.test(filename) ? 'patch detail'
    : /(?:^|[-_])detail(?:[-_.]|$)/.test(filename) || detailNumber ? `detail view${detailNumber ? ` ${detailNumber}` : ''}`
    : /(?:^|[-_])main(?:[-_.]|$)/.test(filename) || index === 0 ? 'primary product view'
    : `additional product view ${index + 1}`
  return `${productName} - ${label}`
}
